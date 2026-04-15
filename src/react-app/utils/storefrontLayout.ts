/**
 * Largura máxima e recuo horizontal compartilhados: Navbar, seções da home e rodapé.
 * Ligeiramente mais largo que max-w-7xl (1280px) para caber 4 cards em telas amplas.
 */
export const STOREFRONT_MAX_CLASS = "max-w-[90rem]";

export const STOREFRONT_EDGE_PADDING_CLASS = "px-4 sm:px-5 md:px-6 lg:px-8";

/** Container central da vitrine (alinhado às bordas do menu). */
export const storefrontShellClass = `${STOREFRONT_MAX_CLASS} mx-auto w-full ${STOREFRONT_EDGE_PADDING_CLASS} box-border`;
