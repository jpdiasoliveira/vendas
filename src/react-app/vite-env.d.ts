/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Opcional: mesmo valor que PLATFORM_CREATE_STORE_SECRET no Worker (header na criação de loja). */
  readonly VITE_PLATFORM_CREATE_STORE_SECRET?: string;
  /** E-mails (vírgula) que veem o menu Plataforma — alinhar a PLATFORM_OPERATOR_EMAILS no Worker. */
  readonly VITE_PLATFORM_OPERATOR_EMAILS?: string;
  /** Em localhost: slug da loja quando não há subdomínio nem override (ex.: natfoods). */
  readonly VITE_DEFAULT_STORE_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
