import { CheckCircle, Clock, Package, PackageCheck, XCircle } from "lucide-react";

const config: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid: { label: "Pago", className: "bg-green-100 text-green-800 border-green-200" },
  approved: { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-200" },
  shipped: { label: "Enviado", className: "bg-blue-100 text-blue-800 border-blue-200" },
  delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200" },
  canceled: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200" },
  rejected: { label: "Recusado", className: "bg-red-100 text-red-800 border-red-200" },
};

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

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const key = (status || "pending").toLowerCase();
  const { label, className } = config[key] ?? config.pending;
  const Icon = icons[key] ?? Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
};
