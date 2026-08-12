import { CheckCircle, Clock, Package, PackageCheck, XCircle } from "lucide-react";
import { getOrderStatusBadgeClass, getOrderStatusLabel } from "@/react-app/utils/orderDisplay";

const icons: Record<string, typeof CheckCircle> = {
  pending: Clock,
  paid: CheckCircle,
  approved: CheckCircle,
  shipped: Package,
  delivered: PackageCheck,
  cancelled: XCircle,
  canceled: XCircle,
  rejected: XCircle,
};

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = (status || "pending").toLowerCase();
  const label = getOrderStatusLabel(key);
  const className = getOrderStatusBadgeClass(key);
  const Icon = icons[key] ?? Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
