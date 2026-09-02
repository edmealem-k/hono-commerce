"use client";

import { Button } from "@hono-commerce/ui/components/button";
import { AlertTriangleIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { useModal } from "./use-modal";

export interface ConfirmDialogProps {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  title = "Are you sure?",
  description = "This action cannot be undone and will permanently modify the record.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { closeModal } = useModal();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    closeModal();
  };

  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            destructive
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {destructive ? (
            <Trash2Icon className="size-5" />
          ) : (
            <AlertTriangleIcon className="size-5" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-foreground text-base font-semibold">{title}</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={submitting}
        >
          {cancelText}
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          size="sm"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Processing..." : confirmText}
        </Button>
      </div>
    </div>
  );
}
