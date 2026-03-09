"use client";

import { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  isLoading: boolean;
}

export default function ImageUpload({ onImageSelect, isLoading }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      // 갤러리 원본(수십MB)을 그대로 base64하지 않고
      // 800px 압축 프리뷰를 생성해서 메모리/localStorage 부담을 줄임
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const preview = canvas.toDataURL("image/jpeg", 0.82);
        onImageSelect(file, preview);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        // 캔버스 실패 시 FileReader로 폴백
        const reader = new FileReader();
        reader.onload = (e) => onImageSelect(file, e.target?.result as string);
        reader.readAsDataURL(file);
      };
      img.src = url;
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* 드래그 앤 드롭 / 파일 선택 영역 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
          ${isDragging ? "border-orange-400 bg-orange-50" : "border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50"}
          ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">🍱</div>
          <p className="text-lg font-semibold text-gray-700">
            음식 사진을 업로드하세요
          </p>
          <p className="text-sm text-gray-500">
            드래그 앤 드롭 또는 클릭하여 선택
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP 지원</p>
        </div>
      </div>

      {/* 카메라 촬영 버튼 */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() => cameraInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-orange-200 text-orange-500 font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-xl">📷</span>
        카메라로 촬영하기
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        disabled={isLoading}
      />
    </div>
  );
}
