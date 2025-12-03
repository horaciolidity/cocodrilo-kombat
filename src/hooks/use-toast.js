// src/hooks/use-toast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({
    title,
    description,
    duration = 3000,
    variant = 'default'
  }) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      title,
      description,
      variant,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    // Return dismiss function
    return () => {
      setToasts(prev => prev.filter(t => t.id !== id));
    };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    toast,
    dismiss,
    dismissAll
  };
}