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
export { AlertCard } from './AlertCard';
export { StatCard } from './StatCard';
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
export { PageLayout } from './PageLayout';
export { Header } from './Header';
export { BottomNav } from './BottomNav';
export { FilterBar } from './FilterBar';

// ============ FEATURE COMPONENTS ============
export { GlobalSearch } from './GlobalSearch';
export { NotificationsPanel } from './NotificationsPanel';
export { OfflineIndicator } from './OfflineIndicator';
export { PushNotificationSettings } from './PushNotificationSettings';
export { AssistenteVirtual } from './AssistenteVirtual';
export { AvatarUpload } from './AvatarUpload';

// ============ PONTO COMPONENTS ============
export { RegistroPonto } from './RegistroPonto';
export { HistoricoPonto } from './HistoricoPonto';
export { JustificativaPontoModal } from './JustificativaPontoModal';

// ============ DASHBOARD COMPONENTS ============
export { SalaryEvolutionChart, HoursDistributionChart, GoalProgressChart } from './DashboardCharts';
export { AniversariantesCard } from './AniversariantesCard';
export { FeedbackDashboard } from './FeedbackDashboard';

// ============ SKELETONS PRESETS ============
export { 
  StatCardSkeleton,
  AlertCardSkeleton,
  MenuItemSkeleton,
  ListItemSkeleton,
  ProfileSkeleton,
  TableSkeleton,
  DashboardSkeleton,
} from './Skeletons';

// ============ KUDOS COMPONENTS ============
export { default as KudosCard, type KudoData } from './KudosCard';
export { default as BadgeDisplay, BadgeGrid, type BadgeData, type BadgeConquistado } from './BadgeDisplay';

// ============ TRILHAS COMPONENTS ============
export { default as TrilhaProgress, type TrilhaEtapaData } from './TrilhaProgress';
export { default as CertificadoCard, type CertificadoData } from './CertificadoCard';

// ============ DASHBOARD WIDGETS ============
export { default as KudosWidget } from './KudosWidget';
export { default as TrilhasWidget } from './TrilhasWidget';

// ============ UX ENHANCEMENT COMPONENTS ============
export { SmartGreeting } from './SmartGreeting';
export { StatCardWithTrend } from './StatCardWithTrend';
export { SectionHeader } from './SectionHeader';
