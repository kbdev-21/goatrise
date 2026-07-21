import { useState } from "react";
import { ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.tsx";

// thumbnail ảnh dùng chung cho các form có ảnh (product, item).
// truyền onRemove để hiện nút X khi hover.
export function ImageThumbnail({
  url,
  onRemove,
  alt = "",
  className,
}: {
  url: string;
  onRemove?: () => void;
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
    </div>
  );
}
