/** Textos do bloco atacado alinhados à unidade de medida do produto. */
export function wholesaleCopy(unitValue: string): {
  pricePer: string;
  minQtyLabel: string;
  minQtyHint: string;
} {
  const v = unitValue.trim();
  if (!v) {
    return {
      pricePer: "unidade de venda",
      minQtyLabel: "Quantidade mínima no pedido",
      minQtyHint:
        "Escolha primeiro a «Unidade de medida» acima (Un, Kg, Pacote ou Fardo). O número aqui será nessa mesma base — ex.: com «Un», 20 = 20 peças; com «Pacote», 20 = 20 pacotes.",
    };
  }
  if (v === "Un") {
    return {
      pricePer: "unidade (cada peça/item)",
      minQtyLabel: "Mínimo de unidades no pedido",
      minQtyHint:
        "Conta em unidades: cada 1 = uma peça vendida. Ex.: 20 = o preço atacado vale quando o cliente leva 20 ou mais unidades.",
    };
  }
  if (v === "Kg") {
    return {
      pricePer: "quilograma",
      minQtyLabel: "Mínimo de quilogramas no pedido",
      minQtyHint: "Conta em kg totais do produto no pedido. Ex.: 20 = preço atacado a partir de 20 kg.",
    };
  }
  if (v === "Pacote") {
    return {
      pricePer: "pacote",
      minQtyLabel: "Mínimo de pacotes no pedido",
      minQtyHint: "Conta em pacotes. Ex.: 20 = preço atacado a partir de 20 pacotes.",
    };
  }
  if (v === "Fardo") {
    return {
      pricePer: "fardo",
      minQtyLabel: "Mínimo de fardos no pedido",
      minQtyHint: "Conta em fardos. Ex.: 20 = preço atacado a partir de 20 fardos.",
    };
  }
  return {
    pricePer: "unidade de venda",
    minQtyLabel: "Quantidade mínima no pedido",
    minQtyHint: "Use o mesmo critério da unidade de medida selecionada para o produto.",
  };
}
