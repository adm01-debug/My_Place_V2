export type UserRole = 'admin' | 'gestor' | 'colaborador' | 'rh' | 'diretor';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';
export type ResourceType = 'profile' | 'user' | 'settings';

interface Permission {
  resource: ResourceType;
  actions: PermissionAction[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'profile', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'user', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
    { resource: 'settings', actions: ['view', 'edit'] },
  ],
  gestor: [
    { resource: 'profile', actions: ['view', 'edit'] },
    { resource: 'user', actions: ['view'] },
  ],
  colaborador: [
    { resource: 'profile', actions: ['view', 'edit'] },
  ],
  rh: [
    { resource: 'profile', actions: ['view', 'edit'] },
    { resource: 'user', actions: ['view', 'create', 'edit'] },
  ],
  diretor: [
    { resource: 'profile', actions: ['view', 'edit'] },
    { resource: 'user', actions: ['view', 'approve'] },
  ],
};

export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/': ['admin', 'gestor', 'colaborador', 'rh', 'diretor'],
  '/perfil': ['admin', 'gestor', 'colaborador', 'rh', 'diretor'],
};
