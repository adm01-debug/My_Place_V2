import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function StatCardSkeleton() {
  return (
    <Card className="p-4 border-0 shadow-card bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </Card>
  );
}

export function AlertCardSkeleton() {
  return (
    <Card className="p-4 border-0 shadow-card bg-card/80 backdrop-blur-sm">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </Card>
  );
}

export function MenuItemSkeleton() {
  return (
    <Card className="p-4 border-0 shadow-card bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-11 h-11 rounded-2xl" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="w-5 h-5 rounded" />
      </div>
    </Card>
  );
}

export function ListItemSkeleton() {
  return (
    <Card className="p-4 border-0 shadow-card bg-card/80 backdrop-blur-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Card>
  );
}

export function ProfileSkeleton() {
  return (
    <Card className="p-6 border-0 shadow-card bg-card/80 backdrop-blur-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <AlertCardSkeleton />
        <AlertCardSkeleton />
      </div>
    </div>
  );
}
