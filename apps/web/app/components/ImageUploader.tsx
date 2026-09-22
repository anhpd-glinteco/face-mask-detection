import type { ChangeEvent, RefObject } from "react";

interface ImageUploaderProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string | null;
}

export function ImageUploader({ inputRef, onChange, disabled, error }: ImageUploaderProps) {
  return (
    <div className="uploader-control">
      <div>
        <label className="control-label" htmlFor="image-input">Ảnh đầu vào</label>
        <p className="helper-text" id="image-input-help">JPEG, PNG hoặc WebP · tối đa 10 MB</p>
      </div>
      <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>Chọn ảnh</button>
      <input
        ref={inputRef}
        id="image-input"
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={error ? "image-input-help image-input-error" : "image-input-help"}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <p className="inline-error" id="image-input-error" role="alert">{error}</p>}
    </div>
  );
}
