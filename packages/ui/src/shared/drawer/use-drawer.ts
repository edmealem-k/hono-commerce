"use client";

import { useSyncExternalStore } from "react";

export type DrawerPlacement = "left" | "right" | "top" | "bottom";
export type DrawerSizePreset = "sm" | "md" | "lg" | "xl" | "full";

export interface DrawerConfig {
  id?: string;
  view: React.ReactNode;
  title?: string;
  description?: string;
  placement?: DrawerPlacement;
  size?: DrawerSizePreset;
  customSize?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  resizable?: boolean;
  resizeStorageKey?: string;
  naked?: boolean;
  className?: string;
}

interface DrawerState {
  stack: DrawerConfig[];
}

let state: DrawerState = { stack: [] };
let idCounter = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const drawerStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  openDrawer: (config: DrawerConfig) => {
    idCounter += 1;
    const nextDrawer: DrawerConfig = {
      ...config,
      id: config.id ?? `drawer-${idCounter}-${Date.now()}`,
      placement: config.placement ?? "right",
      resizable:
        config.resizable ??
        (config.placement === "left" || config.placement === "right"),
    };
    state = { stack: [...state.stack, nextDrawer] };
    notify();
  },
  closeDrawer: () => {
    if (state.stack.length === 0) return;
    state = { stack: state.stack.slice(0, -1) };
    notify();
  },
  forceCloseDrawer: () => {
    state = { stack: [] };
    notify();
  },
  updateDrawer: (patch: Partial<DrawerConfig>) => {
    if (state.stack.length === 0) return;
    const nextStack = [...state.stack];
    const topIdx = nextStack.length - 1;
    const current = nextStack[topIdx];
    if (!current) return;
    nextStack[topIdx] = { ...current, ...patch };
    state = { stack: nextStack };
    notify();
  },
};

export function useDrawer() {
  const current = useSyncExternalStore(
    drawerStore.subscribe,
    drawerStore.getSnapshot,
    () => ({ stack: [] }),
  );
  const topDrawer = current.stack[current.stack.length - 1];

  return {
    stack: current.stack,
    drawerCount: current.stack.length,
    isOpen: current.stack.length > 0,
    top: topDrawer,
    openDrawer: drawerStore.openDrawer,
    closeDrawer: drawerStore.closeDrawer,
    forceCloseDrawer: drawerStore.forceCloseDrawer,
    updateDrawer: drawerStore.updateDrawer,
  };
}
