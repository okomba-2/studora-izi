/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type ToastType = 'info' | 'success' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toast: ToastMessage) => void;

const listeners = new Set<ToastListener>();

export const toast = {
  subscribe(listener: ToastListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  show(message: string, type: ToastType = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    listeners.forEach((listener) => listener({ id, message, type }));
  }
};
