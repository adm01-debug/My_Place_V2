// ==============================================
// HOOKS INDEX - my-place Portal do Colaborador
// ==============================================
// Este arquivo exporta todos os hooks do projeto
// Atualizado: 2026-01-12

// ====== HOOKS DE DADOS PRINCIPAIS ======
export { useBeneficios } from './useBeneficios';
export { useTreinamentos } from './useTreinamentos';
export { useDocumentos } from './useDocumentos';
export { useComunicados } from './useComunicados';
export { useRemuneracaoVariavel } from './useRemuneracaoVariavel';
export { useNotificacoes } from './useNotificacoes';
export { useDashboard } from './useDashboard';

// ====== HOOKS DE FUNCIONALIDADES ESPECÍFICAS ======
export { useFerias } from './useFerias';
export { useHolerites } from './useHolerites';
export { useRegistrosPonto } from './useRegistrosPonto';
export { useEmprestimos } from './useEmprestimos';
export { useLocaisPermitidos } from './useLocaisPermitidos';
export { useJustificativasPonto } from './useJustificativasPonto';

// ====== HOOKS ADMINISTRATIVOS ======
export { useAdminData } from './useAdminData';
export { useDashboardGestor } from './useDashboardGestor';
export { useUserRoles } from './useUserRoles';

// ====== HOOKS DE MÓDULOS EXTRAS ======
export { useFAQ } from './useFAQ';
export { useFeedback360 } from './useFeedback360';
export { useMetas } from './useMetas';
export { useOrganograma } from './useOrganograma';
export { usePesquisasClima } from './usePesquisasClima';
export { useCalendarioCorporativo } from './useCalendarioCorporativo';
export { useAniversariantes } from './useAniversariantes';
export { useSolicitacoes } from './useSolicitacoes';

// ====== HOOKS DE UI E UTILIDADES ======
export { useLoadingState } from './useLoadingState';
export { useFilters } from './useFilters';
export { useExportPDF } from './useExportPDF';
export { useCrudBase } from './useCrudBase';
export type { CrudHookOptions, CrudHookResult, PaginationOptions } from './useCrudBase';

// ====== HOOKS PWA E OFFLINE ======
export { useOffline } from './useOffline';
export { usePWAInstall } from './usePWAInstall';
export { usePushNotifications } from './usePushNotifications';
export { useBiometricAuth } from './useBiometricAuth';

// ====== HOOKS DE AUTENTICAÇÃO E SEGURANÇA ======
export { use2FA } from './use2FA';
export { useNotifications } from './useNotifications';
export type { Notification } from './useNotifications';

// ====== HOOKS ESPECIAIS ======
export { useAssistenteRH } from './useAssistenteRH';

// Re-exports úteis
export type { Holerite, HoleriteDetalhes } from './useHolerites';
export type { FAQItem, FAQCategoria } from './useFAQ';

// Kudos & Reconhecimento
export { useKudos } from './useKudos';
export type { Kudo, KudoCategoria, KudoPontos, Badge, BadgeUsuario, KudoRanking } from './useKudos';

// Trilhas de Desenvolvimento
export { useTrilhas } from './useTrilhas';
export type { Trilha, TrilhaEtapa, TrilhaProgresso, TrilhaComProgresso } from './useTrilhas';

// Download de Documentos
export { useDocumentosDownload } from './useDocumentosDownload';
