import { z } from "zod";

/** Slugs de plano alinhados a `platform_plan_definitions.slug` (Base, Pro, Enterprise). */
export const PLATFORM_PLAN_SLUGS = ["tier_base", "tier_standard", "tier_unlimited"] as const;
export type PlatformPlanSlug = (typeof PLATFORM_PLAN_SLUGS)[number];

export const PLATFORM_PLAN_LABELS: Record<PlatformPlanSlug, string> = {
  tier_base: "Base",
  tier_standard: "Pro",
  tier_unlimited: "Enterprise",
};

/** Mesma regra que `normalizeStoreSlug` no worker (acentos → ASCII, só `a-z0-9-`). */
export const normalizeStoreSlugInput = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** Corpo JSON de `POST /api/platform/stores` (camelCase). */
export const platformCreateStoreBodySchema = z
  .object({
    slug: z.string(),
    displayName: z.string(),
    customDomains: z.array(z.string()).optional().default([]),
    ownerAdminName: z.string(),
    ownerAdminEmail: z.string(),
    sendPasswordSetupLink: z.boolean().default(false),
    initialPassword: z.string().optional(),
    planSlug: z.enum(PLATFORM_PLAN_SLUGS),
  })
  .superRefine((val, ctx) => {
    const displayName = val.displayName.trim();
    if (displayName.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["displayName"], message: "Nome da loja muito curto." });
    }
    if (displayName.length > 120) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["displayName"], message: "Nome da loja demasiado longo." });
    }

    const ownerName = val.ownerAdminName.trim();
    if (ownerName.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ownerAdminName"], message: "Indique o nome do administrador." });
    }
    if (ownerName.length > 120) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ownerAdminName"], message: "Nome do administrador demasiado longo." });
    }

    const email = val.ownerAdminEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ownerAdminEmail"], message: "E-mail do administrador inválido." });
    }

    const slug = normalizeStoreSlugInput(val.slug);
    if (slug.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slug"], message: "Endereço da loja demasiado curto (mínimo 2 caracteres)." });
    }
    if (slug.length > 64) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slug"], message: "Endereço da loja demasiado longo." });
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slug"],
        message: "Use apenas letras minúsculas, números e hífens, sem espaços nem caracteres especiais.",
      });
    }

    const pwd = (val.initialPassword ?? "").trim();
    if (val.sendPasswordSetupLink) {
      if (pwd.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["initialPassword"],
          message: "Desative a senha inicial ou desmarque o envio do link por e-mail.",
        });
      }
    } else {
      if (pwd.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["initialPassword"],
          message: "Senha inicial com pelo menos 8 caracteres, ou marque o envio do link por e-mail.",
        });
      }
      if (pwd.length > 72) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["initialPassword"], message: "Senha demasiado longa." });
      }
    }
  });

export type PlatformCreateStoreBody = z.infer<typeof platformCreateStoreBodySchema>;

/** Corpo JSON de `POST /api/platform/stores` com suporte a camelCase e snake_case. */
export const platformCreateStoreRequestSchema = z
  .object({
    slug: z.string().optional(),
    displayName: z.string().optional(),
    display_name: z.string().optional(),
    customDomains: z.array(z.string()).optional(),
    custom_domains: z.array(z.string()).optional(),
    ownerAdminName: z.string().optional(),
    ownerAdminEmail: z.string().optional(),
    sendPasswordSetupLink: z.boolean().optional(),
    initialPassword: z.string().optional(),
    planSlug: z.string().optional(),
    plan_definition_slug: z.string().optional(),
  })
  .transform((body) => ({
    slug: body.slug ?? "",
    displayName: body.displayName ?? body.display_name ?? "",
    customDomains: body.customDomains ?? body.custom_domains ?? [],
    ownerAdminName: body.ownerAdminName ?? "",
    ownerAdminEmail: body.ownerAdminEmail ?? "",
    sendPasswordSetupLink: body.sendPasswordSetupLink ?? false,
    initialPassword: body.initialPassword ?? "",
    planSlug: body.planSlug ?? body.plan_definition_slug ?? "tier_base",
  }))
  .pipe(platformCreateStoreBodySchema);

/** Campos do formulário (RHF) antes da transformação para o corpo da API. */
export const platformCreateStoreFormBaseSchema = z.object({
  displayName: z.string(),
  slug: z.string(),
  customDomainInput: z.string(),
  ownerAdminName: z.string(),
  ownerAdminEmail: z.string(),
  sendPasswordSetupLink: z.boolean(),
  initialPassword: z.string(),
  planSlug: z.enum(PLATFORM_PLAN_SLUGS),
});

export const platformCreateStoreFormSchema = platformCreateStoreFormBaseSchema
  .transform((val) => ({
    slug: val.slug || normalizeStoreSlugInput(val.displayName),
    displayName: val.displayName.trim(),
    customDomains: val.customDomainInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
    ownerAdminName: val.ownerAdminName.trim(),
    ownerAdminEmail: val.ownerAdminEmail.trim(),
    sendPasswordSetupLink: val.sendPasswordSetupLink,
    initialPassword: val.sendPasswordSetupLink ? "" : val.initialPassword,
    planSlug: val.planSlug,
  }))
  .pipe(platformCreateStoreBodySchema);

export type PlatformCreateStoreFormValues = z.infer<typeof platformCreateStoreFormBaseSchema>;

export const defaultPlatformCreateStoreFormValues: PlatformCreateStoreFormValues = {
  displayName: "",
  slug: "",
  customDomainInput: "",
  ownerAdminName: "",
  ownerAdminEmail: "",
  sendPasswordSetupLink: false,
  initialPassword: "",
  planSlug: "tier_base",
};
