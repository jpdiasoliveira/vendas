/**
 * Códigos das linhas em `platform_features` (Bloco 2).
 * Use estes valores em comparações e RPC — evita typos em strings soltas.
 */
export const PlatformFeatureCodes = {
  maxProducts: "max_products",
  customDomain: "custom_domain",
  advancedAnalytics: "advanced_analytics",
  staffMembersLimit: "staff_members_limit",
} as const;

export type PlatformFeatureCode =
  (typeof PlatformFeatureCodes)[keyof typeof PlatformFeatureCodes];
