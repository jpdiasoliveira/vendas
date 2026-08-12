import { useRef } from "react";
import { Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { AdminModalShell } from "@/react-app/components/admin/AdminModalShell";

type ProductQRModalProps = {
  isOpen: boolean;
  productName: string;
  productId: string;
  editUrl: string;
  onClose: () => void;
};

export function ProductQRModal({
  isOpen,
  productName,
  productId,
  editUrl,
  onClose,
}: ProductQRModalProps) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handlePrint = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) return;
    const safeName = productName.replace(/</g, "&lt;");
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta - ${safeName}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
            .label { text-align: center; }
            .label img { display: block; margin: 0 auto 0.5rem; }
            .label .name { font-weight: 600; font-size: 1rem; word-break: break-word; max-width: 200px; }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${dataUrl}" alt="QR Code" width="160" height="160" />
            <span class="name">${safeName}</span>
          </div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 250);
  };

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code para prateleira"
      description={productName}
      maxWidthClass="max-w-md"
    >
      <div data-product-id={productId} className="flex flex-col items-center">
        <div className="mb-4 flex justify-center rounded-xl border border-brand-primary/10 bg-surface-muted p-4">
          <QRCodeCanvas
            ref={qrRef}
            value={editUrl}
            size={200}
            level="M"
            includeMargin={false}
            aria-label={`QR Code para editar ${productName}`}
          />
        </div>
        <p className="mb-4 text-center text-xs text-content-muted">
          Ao escanear, abre a edição deste produto na página de produtos.
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <Printer className="h-4 w-4" />
          Imprimir etiqueta
        </button>
      </div>
    </AdminModalShell>
  );
}
