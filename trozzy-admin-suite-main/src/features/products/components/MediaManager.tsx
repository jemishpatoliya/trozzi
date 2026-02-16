import { useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { uploadImageQueued } from "@/lib/uploadQueue";
import { cn } from "@/lib/utils";
import { ImagePlus, Move, Star, Trash2, Upload } from "lucide-react";

import type { ProductImage } from "../types";

type Props = {
  images: ProductImage[];
  thumbnailId: string | null;
  onChange: (next: { images: ProductImage[]; thumbnailId: string | null }) => void;
  className?: string;
};

export function MediaManager({ images, thumbnailId, onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [preview, setPreview] = useState<ProductImage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resolvedThumbId = useMemo(() => {
    if (thumbnailId && images.some((i) => i.id === thumbnailId)) return thumbnailId;
    return images[0]?.id ?? null;
  }, [images, thumbnailId]);

  const setImages = (nextImages: ProductImage[], nextThumb?: string | null) => {
    const nextThumbnailId = nextThumb === undefined ? resolvedThumbId : nextThumb;
    onChange({ images: nextImages, thumbnailId: nextThumbnailId });
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    const next: ProductImage = { id: `img-${Date.now()}`, url };
    setImages([...images, next], resolvedThumbId ?? next.id);
    setUrlDraft("");
  };

  const upload = async (files: FileList | null) => {
    if (!files) return;
    const slice = Array.from(files).slice(0, Math.max(0, 12 - images.length));
    if (!slice.length) return;

    setUploading(true);
    try {
      const nextUrls = await Promise.all(slice.map((f) => uploadImageQueued(f, { maxRetries: 3 })));
      const appended = nextUrls.map((url) => ({ id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`, url }));
      const next = [...images, ...appended];
      setImages(next, resolvedThumbId ?? appended[0]?.id ?? null);
    } catch (e: any) {
      // Keep it minimal: surface the error without adding UI components.
      const msg = e?.message ?? "Failed to upload image";
      window.alert(msg);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setUploading(false);
    }
  };

  const remove = (id: string) => {
    const next = images.filter((i) => i.id !== id);
    const nextThumb = resolvedThumbId === id ? next[0]?.id ?? null : resolvedThumbId;
    setImages(next, nextThumb);
  };

  const setThumb = (id: string) => {
    onChange({ images, thumbnailId: id });
  };

  const reorder = (overId: string) => {
    if (!dragId || dragId === overId) return;
    const srcIdx = images.findIndex((i) => i.id === dragId);
    const dstIdx = images.findIndex((i) => i.id === overId);
    if (srcIdx < 0 || dstIdx < 0) return;
    const next = [...images];
    const [moved] = next.splice(srcIdx, 1);
    next.splice(dstIdx, 0, moved);
    setImages(next);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.ico,.tif,.tiff"
        multiple
        className="hidden"
        onChange={(e) => {
          void upload(e.target.files);
        }}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div
            className={cn(
              "rounded-xl border-2 border-dashed bg-muted/10",
              "p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
            )}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              void upload(files);
            }}
          >
            <div className="min-w-0">
              <p className="font-medium">Upload product images</p>
              <p className="text-sm text-muted-foreground">Drag & drop images here or upload. Max 12 images.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="Paste image URL" />
            <Button type="button" variant="outline" onClick={addUrl} disabled={!urlDraft.trim()}>
              Add
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => {
              const isThumb = resolvedThumbId === img.id;
              return (
                <div
                  key={img.id}
                  className={cn(
                    "group relative rounded-xl border overflow-hidden bg-muted/20",
                    isThumb && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                  draggable
                  onDragStart={() => setDragId(img.id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    reorder(img.id);
                  }}
                >
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => setPreview(img)}
                  >
                    <img src={img.url} alt={img.alt ?? "Product image"} className="h-28 w-full object-cover" />
                  </button>

                  <div className="absolute left-2 top-2 flex gap-1">
                    <Badge variant={isThumb ? "default" : "secondary"} className="gap-1">
                      <ImagePlus className="h-3 w-3" />
                      {isThumb ? "Thumbnail" : "Image"}
                    </Badge>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button type="button" size="icon" variant="secondary" onClick={() => setThumb(img.id)}>
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="secondary" onClick={() => setPreview(img)}>
                        <Move className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => remove(img.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {images.length === 0 ? (
              <div className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-xl border bg-muted/20 p-8 text-center text-muted-foreground">
                <p className="font-medium">No images yet</p>
                <p className="text-sm mt-1">Upload or add a URL to build your product gallery.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="font-medium">Thumbnail</p>
            <p className="text-sm text-muted-foreground">Used in catalog listings and preview.</p>
            <div className="mt-3 rounded-lg overflow-hidden border bg-background">
              {resolvedThumbId ? (
                <img
                  src={images.find((i) => i.id === resolvedThumbId)?.url}
                  alt="Thumbnail"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 w-full flex items-center justify-center text-muted-foreground">
                  <span>No thumbnail</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="font-medium">Reorder</p>
            <p className="text-sm text-muted-foreground">Drag an image over another to reorder the grid.</p>
          </div>
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border bg-muted/10">
                <img src={preview.url} alt={preview.alt ?? "Preview"} className="w-full max-h-[60vh] object-contain" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => setThumb(preview.id)} className="gap-2">
                  <Star className="h-4 w-4" />
                  Set as thumbnail
                </Button>
                <Button type="button" variant="destructive" onClick={() => remove(preview.id)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
