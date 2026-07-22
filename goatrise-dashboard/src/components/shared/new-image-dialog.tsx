import { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { storage } from "@/core/storage.ts";

const BUCKET = "images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// dialog thêm 1 ảnh, dùng chung cho các form có danh sách ảnh.
// user chọn file -> upload lên Supabase Storage -> onConfirm nhận public URL.
export function NewImageDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (url: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (isUploading) return;
    if (!next) {
      setFile(null);
      setError(null);
    }
    onOpenChange(next);
  };

  const handleSelect = (selected: File | null) => {
    setError(null);

    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.type.startsWith("image/")) {
      setFile(null);
      setError("Selected file is not an image.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Image must be 10MB or smaller.");
      return;
    }

    setFile(selected);
  };

  const handleConfirm = async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setError(null);

    const extension = file.name.includes(".") ? file.name.split(".").pop() : null;
    const path = extension ? `${crypto.randomUUID()}.${extension}` : crypto.randomUUID();

    const { error: uploadError } = await storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setIsUploading(false);
      setError(uploadError.message || "Failed to upload image.");
      return;
    }

    const { data } = storage.from(BUCKET).getPublicUrl(path);

    setIsUploading(false);
    onConfirm(data.publicUrl);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
          />
          {error && <span className="text-destructive text-xs">{error}</span>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!file || isUploading}>
            {isUploading && <Spinner />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
