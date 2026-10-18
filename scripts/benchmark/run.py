"""Local Windows process-cold / HTTP benchmark; never stores uploaded media."""
import argparse
import ctypes
from ctypes import wintypes
import hashlib
import io
import json
import math
import os
from pathlib import Path
import platform
import socket
import subprocess
import sys
import threading
import time

import httpx
import jsonschema
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def percentile(values, fraction):
    if not values:
        return None
    ordered = sorted(values)
    return ordered[max(0, math.ceil(len(ordered) * fraction) - 1)]


def summary(rows):
    good = [r['latency_ms'] for r in rows if r['ok']]
    return {'attempts': len(rows), 'successes': len(good),
            'error_rate': sum(not r['ok'] for r in rows) / len(rows) if rows else None,
            'p50_ms': percentile(good, .5), 'p95_ms': percentile(good, .95)}


def wait_ready(client, url, process, timeout=60, clock=time.perf_counter, sleep=time.sleep):
    started = clock()
    while clock() - started < timeout:
        if process.poll() is not None:
            raise RuntimeError('server exited before readiness')
        try:
            if client.get(url).status_code == 200:
                return (clock() - started) * 1000
        except httpx.TransportError:
            pass
        sleep(.1)
    raise TimeoutError('readiness timeout')


def working_set(pid):
    class Counters(ctypes.Structure):
        _fields_ = [('cb', wintypes.DWORD), ('faults', wintypes.DWORD)] + [
            (name, ctypes.c_size_t) for name in ('peak', 'working', 'pool_peak', 'pool',
                                               'nonpool_peak', 'nonpool', 'pagefile', 'pagefile_peak')]
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    query = ctypes.WinDLL('psapi').GetProcessMemoryInfo
    query.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
    handle = kernel.OpenProcess(0x410, False, pid)
    if not handle:
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        counters = Counters()
        counters.cb = ctypes.sizeof(counters)
        if not query(handle, ctypes.byref(counters), counters.cb):
            raise ctypes.WinError(ctypes.get_last_error())
        return {'working_set_bytes': counters.working, 'peak_working_set_bytes': counters.peak}
    finally:
        kernel.CloseHandle(handle)


def main():
    parser = argparse.ArgumentParser(__doc__)
    parser.add_argument('--checkpoint', type=Path, required=True)
    parser.add_argument('--sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if os.name != 'nt':
        parser.error('memory collection currently requires Windows')
    if hashlib.sha256(args.checkpoint.read_bytes()).hexdigest() != args.sha256:
        parser.error('checkpoint checksum mismatch')
    args.output.mkdir(parents=True, exist_ok=True)
    if list(args.output.iterdir()):
        parser.error('output must be empty; preserve earlier runs')
    for port in (8000, 3110):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', port))
    def save(name, value):
        (args.output / name).write_text(json.dumps(value, indent=2), encoding='utf-8')
    env = dict(os.environ, MODEL_PATH=str(args.checkpoint.resolve()), MODEL_SHA256=args.sha256,
               ALLOWED_ORIGINS='http://localhost:3110', NEXT_PUBLIC_INFERENCE_API_URL='http://localhost:8000')
    save('environment.json', {'command': sys.argv, 'platform': platform.platform(),
         'processor': platform.processor(), 'cpu_count': os.cpu_count(), 'python': sys.version,
         'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
         'diff': subprocess.check_output(['git', 'diff', '--stat'], cwd=ROOT, text=True),
         'checkpoint_sha256': args.sha256, 'threads': 2, 'ports': [8000, 3110],
         'memory_method': 'Windows process working set; 1 second samples; no child-process aggregation',
         'cold_method': 'new process, includes imports/model load; OS file cache not cleared'})
    with (args.output / 'packages.txt').open('w') as log:
        subprocess.run([sys.executable, '-m', 'pip', 'freeze'], stdout=log, check=True)
    cold, warm, memory = [], [], []
    processes, logs = [], []
    stop = threading.Event()
    def sample():
        while not stop.is_set():
            for name, proc in list(processes):
                if proc.poll() is None:
                    try:
                        memory.append({'time': time.time(), 'process': name, 'pid': proc.pid, **working_set(proc.pid)})
                    except OSError as error:
                        memory.append({'time': time.time(), 'process': name, 'error': str(error)})
            stop.wait(1)
    sampler = threading.Thread(target=sample)
    sampler.start()
    def launch(name, command, cwd):
        log = (args.output / (name + '.log')).open('w')
        logs.append(log)
        proc = subprocess.Popen(command, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT)
        processes.append((name, proc))
        return proc
    try:
        with httpx.Client(timeout=2, trust_env=False) as client:
            for index in range(5):
                started = time.perf_counter()
                proc = launch(f'api-{index}', [sys.executable, '-m', 'uvicorn', 'app.main:app',
                              '--host', '127.0.0.1', '--port', '8000'], ROOT / 'services/inference')
                row = {'index': index, 'ok': False}
                try:
                    wait_ready(client, 'http://localhost:8000/api/v1/ready', proc)
                    row.update(ok=True, latency_ms=(time.perf_counter() - started) * 1000)
                except Exception as error:
                    row.update(error=str(error), latency_ms=(time.perf_counter() - started) * 1000)
                    raise
                finally:
                    cold.append(row)
                    save('cold.json', cold)
                if index < 4:
                    proc.terminate()
                    proc.wait(timeout=20)
            image = io.BytesIO()
            Image.new('RGB', (320, 240), '#338855').save(image, format='PNG')
            validator = jsonschema.Draft202012Validator(json.loads((ROOT / 'packages/contracts/detection.schema.json').read_text()))
            started_all = time.perf_counter()
            with httpx.Client(timeout=30, trust_env=False) as warm_client:
                for index in range(100):
                    started = time.perf_counter()
                    row = {'index': index, 'ok': False}
                    try:
                        response = warm_client.post('http://localhost:8000/api/v1/detect',
                            files={'image': ('synthetic.png', image.getvalue(), 'image/png')})
                        row['status'] = response.status_code
                        response.raise_for_status()
                        body = response.json()
                        validator.validate(body)
                        if body['model']['version'] != args.sha256 or body['image'] != {'width': 320, 'height': 240}:
                            raise ValueError('model identity or dimensions mismatch')
                        row.update(ok=True, timing_ms=body['timing_ms'], detections=len(body['detections']))
                    except Exception as error:
                        row['error'] = str(error)
                    row['latency_ms'] = (time.perf_counter() - started) * 1000
                    warm.append(row)
                    save('warm.json', warm)
            elapsed = time.perf_counter() - started_all
            save('api-summary.json', {'cold': summary(cold), 'warm': summary(warm),
                 'warm_elapsed_s': elapsed, 'warm_successes_per_s': sum(r['ok'] for r in warm) / elapsed})
            if any(not r['ok'] for r in warm):
                raise RuntimeError('warm requests failed; see raw data')
            with (args.output / 'web-build.log').open('w') as log:
                subprocess.run(['cmd', '/c', 'npm', 'run', 'build'], cwd=ROOT / 'apps/web', env=env,
                               stdout=log, stderr=subprocess.STDOUT, check=True)
            web = launch('web', ['node', 'node_modules/next/dist/bin/next', 'start', '--port', '3110'], ROOT / 'apps/web')
            wait_ready(client, 'http://localhost:3110', web, timeout=60)
            with (args.output / 'browser.log').open('w') as log:
                subprocess.run(['node', 'benchmark.mjs', str(args.output.resolve()), args.sha256],
                               cwd=ROOT / 'apps/web', env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
            # Validate every browser response with the shared schema too.
            browser = json.loads((args.output / 'browser.json').read_text())
            for row in browser['requests']:
                if row.get('body'):
                    validator.validate(row['body'])
                    if row['body']['model']['version'] != args.sha256:
                        raise ValueError('browser model identity mismatch')
            browser_summary = {}
            for phase in ('image', 'video', 'webcam'):
                rows = [r for r in browser['requests'] if r['phase'] == phase]
                completed = [r for r in rows if 'ERR_ABORTED' not in str(r.get('failure', ''))]
                entry = summary(completed)
                entry['stop_aborts'] = len(rows) - len(completed)
                phase_data = next((p for p in browser['phases'] if p['phase'] == phase), None)
                if phase_data:
                    values = [r['capture_to_display_ms'] for r in phase_data['display']]
                    skipped, previous = 0, 0
                    for sample in browser['samples']:
                        if sample['phase'] == phase and sample['statistics']:
                            current = int(sample['statistics'][1])
                            skipped += current - previous if current >= previous else current
                            previous = current
                    entry.update(duration_s=phase_data['duration_s'], final_statistics=phase_data['final_statistics'],
                                 sampled_skipped_lower_bound=skipped,
                                 http_successes_per_s=entry['successes'] / phase_data['duration_s'],
                                 displayed_frames_per_s=len(values) / phase_data['duration_s'],
                                 display_samples=len(values), display_p50_ms=percentile(values, .5),
                                 display_p95_ms=percentile(values, .95))
                browser_summary[phase] = entry
            save('browser-summary.json', browser_summary)
            save('result.json', {'complete': True, 'deployment_gate': 'CLOSED'})
    except Exception as error:
        save('result.json', {'complete': False, 'error': str(error), 'deployment_gate': 'CLOSED'})
        raise
    finally:
        stop.set()
        sampler.join()
        save('memory.json', memory)
        for _, proc in reversed(processes):
            if proc.poll() is None:
                proc.terminate()
                proc.wait(timeout=20)
        for log in logs:
            log.close()


if __name__ == '__main__':
    main()
