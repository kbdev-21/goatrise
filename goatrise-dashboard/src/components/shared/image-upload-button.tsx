import { useState } from "react";
import { ImagePlus } from "lucide-react";
import imageCompression from "browser-image-compression";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner.tsx";
import { storage } from "@/core/storage.ts";

const BUCKET = "images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_WIDTH = 1920;

// đọc kích thước gốc của ảnh (px) để tính resize theo width, không theo cạnh dài
function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    img.src = url;
  });
}

// nút thêm ảnh dùng chung cho các form có danh sách ảnh.
// user chọn file -> upload lên Supabase Storage -> onUpload nhận public URL.
// dùng <label> bọc <input file> nên UI y hệt 1 button vuông nét đứt.
export function ImageUploadButton({
  onUpload,
  className,
}: {
  onUpload: (url: string) => void;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelect = async (selected: File | null) => {
    setError(null);

    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Selected file is not an image.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("Image must be 10MB or smaller.");
      return;
    }

    setIsUploading(true);

    // resize WIDTH về tối đa 1920 (giữ ratio, chỉ thu nhỏ) + convert sang WebP.
    // lib chỉ có maxWidthOrHeight (cạnh dài), nên quy đổi width -> cạnh dài:
    // scale = targetWidth / width; cạnh dài đích = max(w,h) * scale.
    // ảnh dọc: cạnh dài là height nên vẫn ép được đúng width.
    let compressed: File;
    try {
      const { width, height } = await getImageSize(selected);
      const targetWidth = Math.min(width, MAX_WIDTH);
      const maxSide = Math.round((Math.max(width, height) * targetWidth) / width);

      compressed = await imageCompression(selected, {
        maxWidthOrHeight: maxSide,
        fileType: "image/webp",
        initialQuality: 0.8,
        useWebWorker: true,
      });
    } catch {
      setIsUploading(false);
      setError("Failed to process image.");
      return;
    }

    const path = `${crypto.randomUUID()}.webp`;

    const { error: uploadError } = await storage
      .from(BUCKET)
      .upload(path, compressed, { contentType: compressed.type });

    if (uploadError) {
      setIsUploading(false);
      setError(uploadError.message || "Failed to upload image.");
      return;
    }

    const { data } = storage.from(BUCKET).getPublicUrl(path);

    setIsUploading(false);
    onUpload(data.publicUrl);
  };

  return (
    <label
      aria-label="Add image"
      className={cn(
        "text-muted-foreground hover:border-foreground/30 hover:text-foreground relative flex size-20 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed",
        isUploading && "pointer-events-none",
        className,
      )}
    >
      {isUploading ? <Spinner className="size-5" /> : <ImagePlus className="size-5" />}
      <input
        type="file"
        accept="image/*"
        disabled={isUploading}
        // phủ kín ô + opacity-0 (không dùng hidden) để nhận cả click lẫn kéo-thả file
        className="absolute inset-0 cursor-pointer opacity-0"
        // reset value để chọn lại đúng file vừa lỗi vẫn kích hoạt onChange
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null;
          e.target.value = "";
          void handleSelect(selected);
        }}
      />
      {error && (
        <span className="text-destructive absolute top-full left-0 mt-1 text-xs whitespace-nowrap">
          {error}
        </span>
      )}
    </label>
  );
}
