"use client";

import { useSyncExternalStore } from "react";

export interface SplitViewConfig {
  view: React.ReactNode;
  header?: React.ReactNode;
  title?: string;
  description?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  resizeStorageKey?: string;
  className?: string;
}

interface SplitViewState {
  isOpen: boolean;
  view: React.ReactNode | null;
  header?: React.ReactNode;
  title?: string;
  description?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  resizeStorageKey?: string;
  className?: string;
}

let state: SplitViewState = {
  isOpen: false,
  view: null,
  defaultSize: 50,
  minSize: 30,
  maxSize: 70,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const splitViewStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  openSplitView: (config: SplitViewConfig) => {
    state = {
      isOpen: true,
      ...config,
      defaultSize: config.defaultSize ?? 50,
      minSize: config.minSize ?? 30,
      maxSize: config.maxSize ?? 70,
    };
    notify();
  },
  closeSplitView: () => {
    state = {
      ...state,
      isOpen: false,
    };
    notify();
  },
};

export function useSplitView() {
  const current = useSyncExternalStore(
    splitViewStore.subscribe,
    splitViewStore.getSnapshot,
    () => ({
      isOpen: false,
      view: null,
    }),
  );

  return {
    ...current,
    openSplitView: splitViewStore.openSplitView,
    closeSplitView: splitViewStore.closeSplitView,
  };
}
