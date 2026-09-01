# Padrões de UI

Fonte canônica do design system deste projeto. Leia **antes** de criar ou estilizar componentes.

Metodologia geral: [`padrões/04-Padroes-UI.md`](../padrões/04-Padroes-UI.md).

---

## Tipografia

| Token Tailwind | Uso |
|----------------|-----|
| `font-display` | Títulos, hero (Syne / Playfair Display) |
| `font-body` | Texto corrido (Inter) |
| `font-playfair` | Destaques editoriais |
| `font-inter` | UI densa |

Definição: `tailwind.config.js` → `theme.extend.fontFamily`.

---

## Cores — tokens CSS

Definidos em `src/react-app/index.css` (`:root`). **Não** usar hex/rgb solto em JSX novo.

### Marca da loja (dinâmico)

| Variável | Uso |
|----------|-----|
| `--brand-primary` | Cor principal (pode vir de `store_settings`) |
| `--brand-primary-hover` | Hover de botões primários |
| `--brand-primary-soft` | Fundos suaves |
| `--brand-secondary` | Secundária |
| `--brand-surface` | Superfície clara legada |
| `--brand-text` | Texto sobre superfície clara |

Classes Tailwind: `text-brand-primary`, `bg-brand-primary`, etc.

### Superfície vitrine (tema escuro)

| Variável | Classe Tailwind |
|----------|-----------------|
| `--ds-surface` | `bg-surface` |
| `--ds-surface-muted` | `bg-surface-muted` |
| `--ds-surface-elevated` | `bg-surface-elevated` |
| `--ds-content` | `text-content` |
| `--ds-content-muted` | `text-content-muted` |
| `--ds-accent` | `text-accent` / `bg-accent` |
| `--ds-accent-soft` | `bg-accent-soft` |

---

## Regras

1. Cores e espaçamento via tokens ou classes Tailwind do tema — sem `#334155` inline.
2. Admin e vitrine podem ter densidades diferentes, mas **mesma família** de tokens.
3. Lógica de negócio **fora** do arquivo de componente — hooks em `src/react-app/hooks/`.
4. Componentes reutilizáveis: preferir `components/admin/`, `components/storefront/`, `components/common/`.
5. Ícones: `lucide-react` — tamanho consistente com contexto (16–24px em listas).

---

## Checklist — tela nova

- [ ] Li este arquivo
- [ ] Usei tokens (`brand-*`, `surface-*`, `content-*`)
- [ ] Estados: loading, vazio, erro
- [ ] Responsivo (mobile-first)
- [ ] Sem regra de negócio pesada no `.tsx`

---

## Mockups

Pasta `mockups/` ainda não versionada. Quando existir, mockup aprovado **vence** texto solto em divergência visual.
