/**
 * Gera PDF de fechamento de vendas (Relatório Ktech).
 * Usa jspdf + jspdf-autotable; cores sóbrias (#1B4332 e cinza).
 */

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/react-app/utils/format";

const GREEN = [27, 67, 50] as [number, number, number]; // #1B4332
const DARK_GRAY = [55, 65, 81] as [number, number, number]; // slate-700
const LIGHT_GRAY = [248, 250, 252] as [number, number, number]; // slate-50

const STORE_NAME = "NATFOODS";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  approved: "Aprovado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  rejected: "Recusado",
};

function getStatusLabel(status: string | null | undefined): string {
  const key = (status ?? "pending").toLowerCase();
  return STATUS_LABELS[key] ?? STATUS_LABELS.pending;
}

export interface OrderForPdf {
  createdAt: string;
  customerName?: string | null;
  deliveryAddress?: string | null;
  total: number;
  paymentStatus?: string | null;
  status?: string | null;
}

export interface ExportClosingPdfOptions {
  orders: OrderForPdf[];
  periodLabel: string;
  storeName?: string;
}

export function exportClosingPdf({ orders, periodLabel, storeName = STORE_NAME }: ExportClosingPdfOptions): void {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  const margin = 14;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...GREEN);
  doc.text(storeName, margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(...DARK_GRAY);
  doc.text("Relatório de Fechamento de Vendas", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Período: ${periodLabel}`, margin, y);
  y += 14;

  const totalFaturado = orders.reduce((acc, o) => acc + (o.total ?? 0), 0);
  const totalPedidos = orders.length;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(margin, y - 4, contentWidth, 18, "F");
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 4, contentWidth, 18, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.text(`Total Faturado: ${formatCurrency(totalFaturado)}`, margin + 4, y + 4);
  doc.text(`Total de Pedidos: ${totalPedidos}`, margin + 4, y + 10);
  y += 24;

  const head = [["Data/Hora", "Cliente", "Endereço", "Valor", "Status"]];
  const body = orders.map((o) => [
    formatDate(o.createdAt),
    (o.customerName ?? "").trim() || "—",
    (o.deliveryAddress ?? "").trim() || "—",
    formatCurrency(o.total ?? 0),
    getStatusLabel(o.paymentStatus ?? o.status),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: y,
    margin: { left: margin, right: margin },
    theme: "plain",
    headStyles: {
      fillColor: GREEN,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      textColor: DARK_GRAY,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 35 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 26 },
      4: { cellWidth: 22 },
    },
    tableLineColor: [203, 213, 225],
    tableLineWidth: 0.1,
    showHead: "everyPage",
    pageBreak: "auto",
  });

  doc.save(`fechamento-vendas-${periodLabel.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`);
}
