export type ToastVariant = "error" | "success";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let nextId = 0;

function emit(): void {
  for (const listener of listeners) listener([...toasts]);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => listeners.delete(listener);
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function showErrorToast(message: string): void {
  const id = String(++nextId);
  toasts = [...toasts, { id, message, variant: "error" }];
  emit();
  window.setTimeout(() => dismissToast(id), 6000);
}
