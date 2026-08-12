import { ReactNode } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { BackButton } from './BackButton';
import { LucideIcon } from 'lucide-react';

interface ModuleHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function ModuleHeader({ title, description, icon: Icon, actions }: ModuleHeaderProps) {
  return (
    <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex flex-col gap-2">
        <Breadcrumbs />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <BackButton />
            </div>
            
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-xl bg-primary/10 text-primary hidden sm:flex">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-border/50 via-border to-transparent" />
    </div>
  );
}
