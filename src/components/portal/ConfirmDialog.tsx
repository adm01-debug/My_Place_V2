import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  showIcon?: boolean;
}

const variantConfig: Record<ConfirmVariant, { icon: React.ElementType; buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary'; iconColor: string }> = {
  default: { icon: Info, buttonVariant: 'default', iconColor: 'text-blue-500' },
  destructive: { icon: AlertTriangle, buttonVariant: 'destructive', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, buttonVariant: 'default', iconColor: 'text-yellow-500' },
  success: { icon: CheckCircle, buttonVariant: 'default', iconColor: 'text-green-500' },
  info: { icon: Info, buttonVariant: 'secondary', iconColor: 'text-blue-500' },
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
  showIcon = true,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {showIcon && <Icon className={`h-5 w-5 ${config.iconColor}`} />}
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {children && <div className="py-4">{children}</div>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aguarde...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook para facilitar o uso
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const resolveRef = React.useRef<(value: boolean) => void>();

  const confirm = React.useCallback((): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    setIsLoading(true);
    resolveRef.current?.(true);
    setIsLoading(false);
    setIsOpen(false);
  }, []);

  const handleCancel = React.useCallback(() => {
    resolveRef.current?.(false);
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    isLoading,
    confirm,
    handleConfirm,
    handleCancel,
    setIsOpen,
  };
}

// Componentes pré-configurados para casos comuns
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirmar exclusão"
      description={`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`}
      confirmText="Excluir"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export function SaveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onDiscard,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  onDiscard?: () => void;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Salvar alterações?"
      description="Você tem alterações não salvas. Deseja salvá-las antes de sair?"
      confirmText="Salvar"
      cancelText="Descartar"
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onDiscard}
      isLoading={isLoading}
    />
  );
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sair do sistema"
      description="Tem certeza que deseja encerrar sua sessão?"
      confirmText="Sair"
      variant="info"
      onConfirm={onConfirm}
    />
  );
}
