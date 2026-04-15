import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  [key: string]: unknown;
}

function toast(options: ToastOptions) {
  const { title, description, variant } = options;

  if (variant === "destructive") {
    sonnerToast.error(title, { description });
  } else {
    sonnerToast(title, { description });
  }

  return {
    id: String(Date.now()),
    dismiss: () => sonnerToast.dismiss(),
    update: () => {},
  };
}

function useToast() {
  return {
    toast,
    dismiss: () => sonnerToast.dismiss(),
    toasts: [] as never[],
  };
}

export { useToast, toast };
