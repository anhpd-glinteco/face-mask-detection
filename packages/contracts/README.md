# Detection contract notes

Schema 1.0 remains unchanged: three model labels, original confidence and bbox.
The API score floor is 0.001. Web presentation uses the P4 validation-locked
operating threshold 0.15, comparing raw confidence before percentage rounding.
Below 0.15: retain the detection, show “Chưa chắc chắn”, predicted label and score,
with purple dashed boxes. At or above 0.15: retain normal class presentation.
`uncertain` is derived UI state, never a fourth label or relabelled prediction.
Counts show total / meets threshold / uncertain for the current image or analysed
frame, not unique people across a stream. Sampling FPS and latency are unchanged.
This policy does not establish accuracy or authorize deployment.
