type AdminProductToggleProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
  activeClassName?: string;
};

export function AdminProductToggle({
  checked,
  disabled,
  onChange,
  label,
  activeClassName = "bg-brand-primary",
}: AdminProductToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? activeClassName : "bg-surface-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-surface-elevated shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-sm text-content-muted">{label}</span>
    </div>
  );
}
