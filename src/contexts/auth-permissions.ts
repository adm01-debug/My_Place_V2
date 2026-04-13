// ============================================================================
// TIPOS E PERMISSÕES EXTRAÍDAS DO AuthContext
// ============================================================================

export type UserRole = 'colaborador' | 'gestor' | 'rh' | 'admin' | 'diretor';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';
export type ResourceType =
  | 'dashboard' | 'ponto' | 'ferias' | 'holerites' | 'beneficios'
  | 'treinamentos' | 'documentos' | 'comunicados' | 'emprestimos'
  | 'metas' | 'feedback' | 'pesquisas' | 'organograma' | 'calendario'
  | 'solicitacoes' | 'admin' | 'gestao' | 'relatorios' | 'usuarios' | 'configuracoes';

interface Permission {
  resource: ResourceType;
  actions: PermissionAction[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  colaborador: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create'] },
    { resource: 'ferias', actions: ['view', 'create'] },
    { resource: 'holerites', actions: ['view', 'export'] },
    { resource: 'beneficios', actions: ['view'] },
    { resource: 'treinamentos', actions: ['view'] },
    { resource: 'documentos', actions: ['view'] },
    { resource: 'comunicados', actions: ['view'] },
    { resource: 'emprestimos', actions: ['view', 'create'] },
    { resource: 'metas', actions: ['view'] },
    { resource: 'feedback', actions: ['view', 'create'] },
    { resource: 'pesquisas', actions: ['view', 'create'] },
    { resource: 'organograma', actions: ['view'] },
    { resource: 'calendario', actions: ['view'] },
    { resource: 'solicitacoes', actions: ['view', 'create'] },
  ],
  gestor: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create', 'approve'] },
    { resource: 'ferias', actions: ['view', 'create', 'approve'] },
    { resource: 'holerites', actions: ['view', 'export'] },
    { resource: 'beneficios', actions: ['view'] },
    { resource: 'treinamentos', actions: ['view', 'create'] },
    { resource: 'documentos', actions: ['view'] },
    { resource: 'comunicados', actions: ['view', 'create'] },
    { resource: 'emprestimos', actions: ['view', 'create', 'approve'] },
    { resource: 'metas', actions: ['view', 'create', 'edit'] },
    { resource: 'feedback', actions: ['view', 'create'] },
    { resource: 'pesquisas', actions: ['view', 'create'] },
    { resource: 'organograma', actions: ['view'] },
    { resource: 'calendario', actions: ['view', 'create'] },
    { resource: 'solicitacoes', actions: ['view', 'create', 'approve'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
  ],
  rh: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create', 'edit', 'approve', 'export'] },
    { resource: 'ferias', actions: ['view', 'create', 'edit', 'approve', 'export'] },
    { resource: 'holerites', actions: ['view', 'create', 'edit', 'export'] },
    { resource: 'beneficios', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'treinamentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'documentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'comunicados', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'emprestimos', actions: ['view', 'create', 'edit', 'approve', 'export'] },
    { resource: 'metas', actions: ['view', 'create', 'edit'] },
    { resource: 'feedback', actions: ['view', 'create', 'edit'] },
    { resource: 'pesquisas', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'organograma', actions: ['view', 'edit'] },
    { resource: 'calendario', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'solicitacoes', actions: ['view', 'create', 'edit', 'approve'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
    { resource: 'usuarios', actions: ['view', 'edit'] },
  ],
  admin: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { resource: 'ferias', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { resource: 'holerites', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { resource: 'beneficios', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'treinamentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'documentos', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'comunicados', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'emprestimos', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { resource: 'metas', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'feedback', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'pesquisas', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'organograma', actions: ['view', 'edit'] },
    { resource: 'calendario', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'solicitacoes', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
    { resource: 'admin', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
    { resource: 'usuarios', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'configuracoes', actions: ['view', 'edit'] },
  ],
  diretor: [
    { resource: 'dashboard', actions: ['view'] },
    { resource: 'ponto', actions: ['view', 'approve', 'export'] },
    { resource: 'ferias', actions: ['view', 'approve', 'export'] },
    { resource: 'holerites', actions: ['view', 'export'] },
    { resource: 'beneficios', actions: ['view'] },
    { resource: 'treinamentos', actions: ['view'] },
    { resource: 'documentos', actions: ['view'] },
    { resource: 'comunicados', actions: ['view', 'create'] },
    { resource: 'emprestimos', actions: ['view', 'approve', 'export'] },
    { resource: 'metas', actions: ['view', 'create', 'edit', 'approve'] },
    { resource: 'feedback', actions: ['view'] },
    { resource: 'pesquisas', actions: ['view'] },
    { resource: 'organograma', actions: ['view'] },
    { resource: 'calendario', actions: ['view'] },
    { resource: 'solicitacoes', actions: ['view', 'approve'] },
    { resource: 'admin', actions: ['view'] },
    { resource: 'gestao', actions: ['view'] },
    { resource: 'relatorios', actions: ['view', 'export'] },
    { resource: 'usuarios', actions: ['view'] },
    { resource: 'configuracoes', actions: ['view'] },
  ],
};

export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/admin': ['admin', 'rh'],
  '/gestao': ['gestor', 'rh', 'admin', 'diretor'],
  '/relatorios': ['gestor', 'rh', 'admin', 'diretor'],
  '/configuracoes': ['admin'],
  '/usuarios': ['rh', 'admin'],
};
