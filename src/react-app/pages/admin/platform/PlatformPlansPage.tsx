import { PlatformPlansRulesEditor } from "@/react-app/components/platform/plans/PlatformPlansRulesEditor";

const PlatformPlansPage = () => (
  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 border-b border-brand-primary/10 pb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-content sm:text-3xl">Planos e Regras</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-content-muted">
        Define o que cada plano (Simples, Pro, VIP) inclui para as lojas. Prazo de tolerância após falha de pagamento:
        menu <strong className="text-content">Configurações</strong>.
      </p>
    </div>
    <PlatformPlansRulesEditor />
  </div>
);

export default PlatformPlansPage;
