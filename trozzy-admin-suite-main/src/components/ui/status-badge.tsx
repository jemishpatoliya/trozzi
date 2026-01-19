import { cn } from '@/lib/utils';

type StatusType = 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error' | 'draft' | 'new' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

interface StatusBadgeProps {
  status?: StatusType | string | null;
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-muted',
  pending: 'bg-warning/10 text-warning border-warning/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted text-muted-foreground border-muted',
  new: 'bg-info/10 text-info border-info/20',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-accent/10 text-accent border-accent/20',
  delivered: 'bg-success/10 text-success border-success/20',
  returned: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const raw = typeof status === 'string' ? status : status == null ? '' : String(status);
  const normalizedStatus = raw.trim().toLowerCase();
  const effectiveKey = normalizedStatus || 'pending';
  const styles = statusStyles[effectiveKey] || statusStyles.pending;
  const label = raw.trim() || 'pending';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
