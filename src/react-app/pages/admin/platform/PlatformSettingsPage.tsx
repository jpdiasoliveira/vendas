import { PlatformGraceSettingsPanel } from "@/react-app/components/admin/PlatformGraceSettingsPanel";

const PlatformSettingsPage = () => (
  <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 className="font-playfair text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Configurações</h1>
    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
      Parâmetros que valem para todas as lojas. O que cada plano oferece está em{" "}
      <strong className="text-[#1B4332]">Planos e Regras</strong>.
    </p>
    <div className="mt-8">
      <PlatformGraceSettingsPanel />
    </div>
  </div>
);

export default PlatformSettingsPage;
