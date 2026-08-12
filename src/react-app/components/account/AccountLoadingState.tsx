import { Loader2 } from "lucide-react";

type AccountLoadingStateProps = {
  message: string;
};

export function AccountLoadingState({ message }: AccountLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-primary/15 bg-surface-elevated py-16">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand-primary" aria-hidden />
      <p className="font-body text-sm text-content-muted">{message}</p>
    </div>
  );
}
