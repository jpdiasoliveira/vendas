import { z } from "zod";

export const flattenZodErrors = (error: z.ZodError): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
};

export const extractPixFromPaymentResponse = (data: {
  qrCodeBase64?: string;
  qr_code_base64?: string;
  copyPaste?: string;
  pixCode?: string;
  qr_code?: string;
}) => ({
  qrCodeBase64: data.qrCodeBase64 ?? data.qr_code_base64 ?? "",
  copyPaste: data.copyPaste ?? data.pixCode ?? data.qr_code ?? "",
});
