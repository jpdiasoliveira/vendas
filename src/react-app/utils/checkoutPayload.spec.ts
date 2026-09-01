import { describe, expect, it } from "vitest";
import type { CartItem } from "@/react-app/contexts/CartContext";
import { buildCheckoutApiLines } from "./checkoutPayload";

describe("buildCheckoutApiLines", () => {
  it("mapeia itens com preço unitário calculado", () => {
    const items: CartItem[] = [
      { id: "p1", name: "Camiseta", price: 50, quantity: 2 },
    ];
    const lines = buildCheckoutApiLines(items, (item, qty) =>
      qty >= 10 ? item.price * 0.9 : item.price,
    );
    expect(lines).toEqual([
      { id: "p1", name: "Camiseta", quantity: 2, price: 50 },
    ]);
  });

  it("inclui image e imageUrl quando há imagem", () => {
    const items: CartItem[] = [
      {
        id: "p2",
        name: "Quadro",
        price: 120,
        quantity: 1,
        imageUrl: "/quadro.jpg",
      },
    ];
    const lines = buildCheckoutApiLines(items, (item) => item.price);
    expect(lines[0]).toMatchObject({
      image: "/quadro.jpg",
      imageUrl: "/quadro.jpg",
    });
  });

  it("omite campos de imagem quando não há URL", () => {
    const items: CartItem[] = [
      { id: "p3", name: "Item sem foto", price: 10, quantity: 1 },
    ];
    const lines = buildCheckoutApiLines(items, (item) => item.price);
    expect(lines[0]).not.toHaveProperty("image");
    expect(lines[0]).not.toHaveProperty("imageUrl");
  });
});
