import unittest
from unittest.mock import Mock

import httpx
from run import percentile, summary, wait_ready


class BenchmarkTests(unittest.TestCase):
    def test_nearest_rank_and_errors(self):
        self.assertEqual(percentile(list(range(1, 101)), .95), 95)
        self.assertEqual(percentile([10], .5), 10)
        self.assertIsNone(percentile([], .95))
        result = summary([{'ok': True, 'latency_ms': 10}, {'ok': False, 'latency_ms': 30000}])
        self.assertEqual(result['error_rate'], .5)
        self.assertEqual(result['p95_ms'], 10)

    def test_readiness_timeout_and_success(self):
        client, process = Mock(), Mock()
        process.poll.return_value = None
        client.get.return_value.status_code = 503
        with self.assertRaises(TimeoutError):
            wait_ready(client, 'local', process, 1, clock=Mock(side_effect=[0, 0, 2]), sleep=Mock())
        client.get.return_value.status_code = 200
        self.assertEqual(wait_ready(client, 'local', process, clock=Mock(side_effect=[0, 0, .5])), 500)
        client.get.side_effect = httpx.ConnectError('offline')
        with self.assertRaises(TimeoutError):
            wait_ready(client, 'local', process, 1, clock=Mock(side_effect=[0, 0, 2]), sleep=Mock())


if __name__ == '__main__':
    unittest.main()
