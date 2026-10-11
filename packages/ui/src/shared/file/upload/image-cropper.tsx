"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hono-commerce/ui/components/dialog";
import { Slider } from "@hono-commerce/ui/components/slider";
import { useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

export interface ImageCropperProps {
  file: File | null;
  aspect?: number;
  outputWidth?: number;
  outputHeight?: number;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export function ImageCropper({
  file,
  aspect = 1,
  outputWidth = 800,
  outputHeight = 800,
  onConfirm,
  onCancel,
}: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setImageUrl(nextUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const confirm = async () => {
    if (!file || !imageUrl || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await createCroppedBlob(
        imageUrl,
        croppedAreaPixels,
        outputWidth,
        outputHeight,
      );
      const name = file.name.replace(/\.[^/.]+$/, "") || "cropped-image";
      onConfirm(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="data-open:zoom-in-0 data-closed:zoom-out-0 max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>
            Adjust the crop before uploading this image.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-72 overflow-hidden rounded-md bg-black">
          {imageUrl ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              showGrid
            />
          ) : null}
        </div>
        <Slider
          aria-label="Zoom"
          min={1}
          max={3}
          step={0.1}
          value={[zoom]}
          onValueChange={(value) => {
            const nextZoom = Array.isArray(value) ? value[0] : value;
            if (typeof nextZoom === "number") setZoom(nextZoom);
          }}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void confirm()}
            disabled={!croppedAreaPixels || isProcessing}
          >
            {isProcessing ? "Preparing…" : "Use cropped image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function createCroppedBlob(
  imageUrl: string,
  crop: Area,
  outputWidth: number,
  outputHeight: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Image crop is unavailable"));
        return;
      }
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outputWidth,
        outputHeight,
      );
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Unable to prepare cropped image"));
        },
        "image/jpeg",
        0.82,
      );
    };
    image.onerror = () => reject(new Error("Unable to read image"));
    image.src = imageUrl;
  });
}
