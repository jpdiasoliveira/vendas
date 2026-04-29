import { PlatformPlansRulesEditor } from "@/react-app/components/admin/PlatformPlansRulesEditor";

const PlatformPlansPage = () => (
  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 className="font-playfair text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Planos e Regras</h1>
    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
      Define o que cada plano (Simples, Pro, VIP) inclui para as lojas. Prazo de tolerância após falha de pagamento: menu{" "}
      <strong className="text-[#1B4332]">Configurações</strong>.
    </p>
    <div className="mt-8">
      <PlatformPlansRulesEditor />
    </div>
  </div>
);

export default PlatformPlansPage;
