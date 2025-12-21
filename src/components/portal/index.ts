// =====================================================
// PORTAL COMPONENTS - BARREL EXPORT
// my-place Portal do Colaborador
// Atualizado: 2025-12-21
// =====================================================

// ============ CORE COMPONENTS ============
export { default as DataTable, type Column, type DataTableProps } from './DataTable';
export { default as LoadMore, useInfiniteScroll, useLoadMore, LoadMoreList, PullToRefresh } from './LoadMore';
export { default as Breadcrumbs, useBreadcrumbs, PageHeader, type BreadcrumbItem } from './Breadcrumbs';
export { default as ThemeSwitcher, useTheme } from './ThemeSwitcher';

// ============ FEEDBACK COMPONENTS ============
export { default as Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonList, SkeletonDashboard, SkeletonProfile } from './Skeleton';
export { default as AlertCard, InfoAlert, SuccessAlert, WarningAlert, ErrorAlert } from './AlertCard';
export { default as StatCard, StatCardsGrid } from './StatCard';
export { default as EmptyState } from './EmptyState';

// ============ FORM COMPONENTS ============
export { default as SearchInput, useSearchHistory, useDebouncedSearch } from './SearchInput';
export { default as DateRangePicker, DatePicker, useDateRange } from './DateRangePicker';
export { default as ExportButton, useExport } from './ExportButton';

// ============ DIALOG COMPONENTS ============
export { default as ConfirmDialog, useConfirmDialog, DeleteConfirmDialog, SaveConfirmDialog, LogoutConfirmDialog } from './ConfirmDialog';

// ============ ERROR HANDLING ============
export { default as PageErrorBoundary, ErrorFallback, withErrorBoundary, useErrorReporter } from './PageErrorBoundary';

// ============ LAYOUT COMPONENTS ============
export { default as PageLayout } from './PageLayout';
export { default as Header } from './Header';
export { default as BottomNav } from './BottomNav';
export { default as FilterBar } from './FilterBar';

// ============ FEATURE COMPONENTS ============
export { default as GlobalSearch } from './GlobalSearch';
export { default as NotificationsPanel } from './NotificationsPanel';
export { default as OfflineIndicator } from './OfflineIndicator';
export { default as PushNotificationSettings } from './PushNotificationSettings';
export { default as AssistenteVirtual } from './AssistenteVirtual';
export { default as AvatarUpload } from './AvatarUpload';

// ============ PONTO COMPONENTS ============
export { default as RegistroPonto } from './RegistroPonto';
export { default as HistoricoPonto } from './HistoricoPonto';
export { default as JustificativaPontoModal } from './JustificativaPontoModal';

// ============ DASHBOARD COMPONENTS ============
export { default as DashboardCharts } from './DashboardCharts';
export { default as AniversariantesCard } from './AniversariantesCard';
export { default as FeedbackDashboard } from './FeedbackDashboard';

// ============ SKELETONS PRESETS ============
export { 
  HoleriteSkeleton,
  PontoSkeleton,
  DashboardSkeleton,
  ListaSkeleton,
} from './Skeletons';
