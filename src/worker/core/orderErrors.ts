/** Erro de regra de negócio no checkout/pedido — a rota deve responder 400 ao cliente. */
export class OrderBusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderBusinessError";
  }
}
