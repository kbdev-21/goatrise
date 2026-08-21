import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.tsx";

// thumbnail ảnh dùng chung cho các form có ảnh (product, item).
// truyền onRemove để hiện nút X khi hover.
// truyền onMoveLeft/onMoveRight để hiện nút < > swap thứ tự khi hover.
export function ImageThumbnail({
  url,
  onRemove,
  onMoveLeft,
  onMoveRight,
  alt = "",
  className,
}: {
  url: string;
  onRemove?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  alt?: string;
  className?: string;
}) {
  // lưu url lỗi thay vì boolean: đổi url là tự động thử lại, không cần effect reset
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const broken = !url || failedUrl === url;

  return (
    <div className={cn("group relative size-20 shrink-0", className)}>
      {broken ? (
        <div className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-md border">
          <ImageOff className="size-5" />
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          title={url}
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
          className="size-full rounded-md border object-cover"
        />
      )}

      {onRemove && (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label="Remove image"
          className="absolute -top-1.5 -right-1.5 hidden rounded-full border shadow-sm group-hover:flex focus-visible:flex"
          onClick={onRemove}
        >
          <X className="size-3" />
        </Button>
      )}

      {onMoveLeft && (
        <button
          type="button"
          aria-label="Move image left"
          className="absolute top-1/2 left-1 hidden size-5 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white group-hover:flex hover:bg-black/60 focus-visible:flex"
          onClick={onMoveLeft}
        >
          <ChevronLeft className="size-3" />
        </button>
      )}

      {onMoveRight && (
        <button
          type="button"
          aria-label="Move image right"
          className="absolute top-1/2 right-1 hidden size-5 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white group-hover:flex hover:bg-black/60 focus-visible:flex"
          onClick={onMoveRight}
        >
          <ChevronRight className="size-3" />
        </button>
      )}
    </div>
  );
}
