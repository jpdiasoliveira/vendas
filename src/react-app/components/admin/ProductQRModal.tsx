import { useRef } from "react";
import { X, Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface ProductQRModalProps {
  isOpen: boolean;
  productName: string;
  productId: string;
  editUrl: string;
  onClose: () => void;
}

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
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta - ${productName.replace(/</g, "&lt;")}</title>
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
            <span class="name">${productName.replace(/</g, "&lt;")}</span>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6"
        data-product-id={productId}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">QR Code para prateleira</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4 break-all">{productName}</p>
        <div className="flex justify-center bg-slate-50 rounded-xl p-4 mb-4">
          <QRCodeCanvas
            ref={qrRef}
            value={editUrl}
            size={200}
            level="M"
            includeMargin={false}
            aria-label={`QR Code para editar ${productName}`}
          />
        </div>
        <p className="text-xs text-slate-500 mb-4 text-center">
          Ao escanear, abre a edição deste produto na página de produtos.
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-medium transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir Etiqueta
        </button>
      </div>
    </div>
  );
}
