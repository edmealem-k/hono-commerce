"use client";

import { useSyncExternalStore } from "react";

export interface ModalConfig {
  view: React.ReactNode;
  customSize?: string;
}

interface ModalState {
  isOpen: boolean;
  view: React.ReactNode | null;
  customSize?: string;
}

let state: ModalState = {
  isOpen: false,
  view: null,
  customSize: undefined,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const modalStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  openModal: (config: ModalConfig) => {
    state = {
      isOpen: true,
      view: config.view,
      customSize: config.customSize,
    };
    notify();
  },
  closeModal: () => {
    state = {
      ...state,
      isOpen: false,
    };
    notify();
  },
};

export function useModal() {
  const current = useSyncExternalStore(
    modalStore.subscribe,
    modalStore.getSnapshot,
    () => ({
      isOpen: false,
      view: null,
    }),
  );

  return {
    isOpen: current.isOpen,
    view: current.view,
    customSize: current.customSize,
    openModal: modalStore.openModal,
    closeModal: modalStore.closeModal,
  };
}
