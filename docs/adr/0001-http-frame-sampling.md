# ADR 0001: HTTP frame sampling for video and webcam

## Status

Accepted for MVP.

## Decision

The browser samples frames and sends at most one in-flight request to `POST /api/v1/detect`. The full video is not uploaded. WebSocket/WebRTC are out of scope until measurement proves HTTP cannot satisfy the agreed demo budget.

## Consequences

The API remains stateless and testable, privacy exposure is reduced, and inference hosting can change without changing the frontend contract. The visible processed FPS will be lower than camera FPS and must be measured.

