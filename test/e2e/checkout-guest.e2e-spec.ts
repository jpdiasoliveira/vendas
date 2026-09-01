import { expect, test } from "@playwright/test";
import {
  E2E_CHECKOUT,
  E2E_DEFAULT_CEP,
  E2E_SKIP_REASON,
  isE2eStoreReady,
  uniqueE2eEmail,
} from "../support/e2eFixtures";

/**
 * Checkout guest ponta a ponta (vitrine → pedido pending).
 *
 * Pré-requisitos:
 * - `.dev.vars` com Supabase + loja `demo-store` ativa (ver docs/supabase-setup-admin-demo-store.sql)
 * - Faixa de frete cobrindo o CEP de teste (admin ou seed demo)
 * - `publicProfile.requireLoginToCheckout = false` na loja demo
 * - Pelo menos um produto ativo com estoque na vitrine
 */
test.describe("Checkout guest", () => {
  test.beforeEach(async ({ request }) => {
    const ready = await isE2eStoreReady(request);
    test.skip(!ready, E2E_SKIP_REASON);
  });

  test("cria pedido pending após identidade e exibe tela de pagamento", async ({ page }) => {
    const guestEmail = uniqueE2eEmail();

    await page.goto("/");

    const addButton = page.getByRole("button", { name: "Adicionar ao carrinho" }).first();
    await expect(addButton).toBeVisible({ timeout: 30_000 });
    await addButton.click();

    await page.getByRole("button", { name: "Abrir carrinho" }).click();
    await expect(page.getByRole("heading", { name: "Seu carrinho" })).toBeVisible();

    await page.getByRole("button", { name: "Continuar" }).click();

    await page.locator("#checkout-name").fill(E2E_CHECKOUT.customerName);
    await page.locator("#checkout-phone").fill(E2E_CHECKOUT.customerPhone);
    await page.locator("#checkout-address").fill(E2E_CHECKOUT.deliveryAddress);
    await page.locator("#checkout-cep").fill(E2E_DEFAULT_CEP);
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText(/Frete:/i)).toBeVisible({ timeout: 20_000 });

    const guestEmailField = page.locator("#checkout-guest-email");
    if (await guestEmailField.isVisible()) {
      await guestEmailField.fill(guestEmail);
    }

    await page.getByRole("button", { name: "Ir para pagamento" }).click();

    await expect(page.getByText(/Pedido/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Pix" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cartão de crédito" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pagar agora" })).toBeVisible();
  });
});
