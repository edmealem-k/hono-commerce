"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@hono-commerce/ui/components/dialog";

import { useModal } from "./use-modal";

export function GlobalModal() {
  const { isOpen, view, customSize, closeModal } = useModal();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        className="max-w-[90vw] overflow-hidden p-0"
        style={{ width: customSize ?? "520px" }}
      >
        <DialogTitle className="sr-only">Modal Window</DialogTitle>
        {view}
      </DialogContent>
    </Dialog>
  );
}
