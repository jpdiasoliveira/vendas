import { useState, useCallback } from "react";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function parseBRLToFloat(s: string): number {
  const cleaned = s.replace(/\s/g, "").replace(/R\$/g, "").trim();
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isNaN(n) ? 0 : n;
}

/** Máscara BRL: estado em "R$ X,XX" a partir de dígitos digitados. */
export function useCurrencyMask(initial = "R$ 0,00") {
  const [display, setDisplay] = useState(initial);
  const setFromDigits = useCallback((digits: string) => {
    const stripped = digits.replace(/^0+/, "");
    if (stripped === "") {
      setDisplay("R$ 0,00");
      return;
    }
    const padded = stripped.padStart(3, "0");
    const cents = padded.slice(-2);
    const intPart = padded.slice(0, -2);
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setDisplay(`R$ ${formatted},${cents}`);
  }, []);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const d = digitsOnly(raw);
      if (d.length > 14) return;
      setFromDigits(d);
    },
    [setFromDigits]
  );
  const setValue = useCallback((value: number) => {
    if (value <= 0) {
      setDisplay("R$ 0,00");
      return;
    }
    const fixed = value.toFixed(2);
    const [intPart, decPart] = fixed.split(".");
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setDisplay(`R$ ${formatted},${decPart}`);
  }, []);
  const parse = useCallback(() => parseBRLToFloat(display), [display]);
  return { display, handleChange, setValue, parse };
}
