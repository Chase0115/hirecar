"use client";

import { useRef, useState } from "react";
import { validateFileUpload } from "@/lib/validation";
import BigButton from "@/components/BigButton";
import type { Dictionary } from "@/lib/i18n";

interface LicenseUploaderProps {
  dict: Dictionary;
  onUploadSuccess: (url: string) => void;
}

export default function LicenseUploader({ dict, onUploadSuccess }: LicenseUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        // If compression fails, use the original file
        resolve(file);
      };
      img.src = objectUrl;
    });
  }

  async function handleFile(file: File) {
    const validation = validateFileUpload({ type: file.type, size: file.size });
    if (!validation.valid) {
      setError(validation.errors.file ?? dict.step2.invalidFileType);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const compressed = await compressImage(file);

      const formData = new FormData();
      formData.append("file", compressed);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? dict.step2.uploadFailed);
        setUploading(false);
        return;
      }

      // Navigate immediately — don't set uploading to false since we're leaving the page
      onUploadSuccess(data.url);
    } catch {
      setError(dict.step2.uploadFailed);
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleRetry() {
    setError(null);
  }

  return (
    <div className="license-uploader">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        hidden
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleInputChange}
        hidden
        aria-hidden="true"
      />

      {uploading && (
        <div className="license-uploader__loading">
          <div className="license-uploader__spinner" aria-hidden="true" />
          <p className="license-uploader__status" role="status" aria-live="polite">
            Uploading…
          </p>
        </div>
      )}

      {error && (
        <div className="license-uploader__error" role="alert">
          <p className="error-text">{error}</p>
          <BigButton variant="secondary" onClick={handleRetry}>
            {dict.step2.retryUpload}
          </BigButton>
        </div>
      )}

      {!uploading && !error && (
        <div className="license-uploader__buttons">
          <BigButton onClick={() => cameraInputRef.current?.click()}>
            {dict.step2.takePhoto}
          </BigButton>
          <BigButton variant="secondary" onClick={() => galleryInputRef.current?.click()}>
            {dict.step2.uploadImage}
          </BigButton>
        </div>
      )}
    </div>
  );
}
