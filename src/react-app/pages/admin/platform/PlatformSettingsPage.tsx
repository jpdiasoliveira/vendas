import { PlatformGraceSettingsPanel } from "@/react-app/components/platform/settings/PlatformGraceSettingsPanel";

const PlatformSettingsPage = () => (
  <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 border-b border-brand-primary/10 pb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-content sm:text-3xl">Configurações</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-content-muted">
        Parâmetros que valem para todas as lojas. O que cada plano oferece está em{" "}
        <strong className="text-content">Planos e Regras</strong>.
      </p>
    </div>
    <PlatformGraceSettingsPanel />
  </div>
);

export default PlatformSettingsPage;
