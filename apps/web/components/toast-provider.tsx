"use client";

import { useEffect, useState } from "react";
import { dismissToast, subscribeToasts, type Toast } from "../lib/toast";
import styles from "./toast.module.css";

function ToastItem({ toast }: { toast: Toast }) {
  return (
    <div
      className={`${styles.toast} ${toast.variant === "error" ? styles.toastError : ""}`}
      role={toast.variant === "error" ? "alert" : "status"}
    >
      <p className={styles.message}>{toast.message}</p>
      <button
        aria-label="Dismiss notification"
        className={styles.dismiss}
        type="button"
        onClick={() => dismissToast(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div aria-live="polite" className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
