import { z } from "zod";
import type { Product } from "@/contracts/schema";
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from "@/schemas/product";

export const adminProductFormSchema = z
  .object({
    title: z.string().min(1, "Nome do produto é obrigatório."),
    price: z.number({ invalid_type_error: "Informe um preço válido." }).positive("O preço deve ser positivo."),
    description: z.string().optional(),
    categoryId: z.union([z.string().uuid(), z.literal("")]).optional(),
    stock: z.coerce.number().int().nonnegative(),
    status: z.enum(["active", "inactive"]),
    wholesaleEnabled: z.boolean(),
    priceWholesale: z.number().positive().nullable().optional(),
    minQuantityWholesale: z.number().int().positive().nullable().optional(),
    imageUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.wholesaleEnabled) return;
    if (data.priceWholesale == null || data.priceWholesale <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o preço de atacado.", path: ["priceWholesale"] });
    }
    if (data.minQuantityWholesale == null || data.minQuantityWholesale < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a quantidade mínima de atacado.",
        path: ["minQuantityWholesale"],
      });
    }
  });

export type AdminProductFormValues = z.infer<typeof adminProductFormSchema>;

export const defaultAdminProductFormValues: AdminProductFormValues = {
  title: "",
  price: 0,
  description: "",
  categoryId: "",
  stock: 0,
  status: "active",
  wholesaleEnabled: false,
  priceWholesale: null,
  minQuantityWholesale: null,
  imageUrl: "",
};

export function productToFormValues(product: Product): AdminProductFormValues {
  const hasWholesale =
    product.priceWholesale != null && product.minQuantityWholesale != null && product.minQuantityWholesale > 0;
  return {
    title: product.name ?? "",
    price: Number(product.price) || 0,
    description: product.description ?? "",
    categoryId: product.categoryId ?? "",
    stock: product.stock ?? 0,
    status: (product.status ?? "active") === "inactive" ? "inactive" : "active",
    wholesaleEnabled: hasWholesale,
    priceWholesale: product.priceWholesale ?? null,
    minQuantityWholesale: product.minQuantityWholesale ?? null,
    imageUrl: product.imageUrl ?? "",
  };
}

export function formValuesToCreatePayload(values: AdminProductFormValues, imageUrl: string): ProductCreateInput {
  const draft = {
    title: values.title.trim(),
    price: values.price,
    stock: values.stock,
    status: values.status,
    image_url: imageUrl,
    ...(values.description?.trim() ? { description: values.description.trim() } : {}),
    ...(values.categoryId ? { category_id: values.categoryId } : {}),
    ...(values.wholesaleEnabled
      ? {
          priceWholesale: values.priceWholesale ?? null,
          minQuantityWholesale: values.minQuantityWholesale ?? null,
        }
      : {}),
  };
  return productCreateSchema.parse(draft);
}

export function formValuesToUpdatePayload(values: AdminProductFormValues, imageUrl: string): ProductUpdateInput {
  const draft: ProductUpdateInput = {
    title: values.title.trim(),
    price: values.price,
    stock: values.stock,
    description: values.description?.trim() ?? "",
    image_url: imageUrl,
    ...(values.wholesaleEnabled
      ? {
          priceWholesale: values.priceWholesale ?? null,
          minQuantityWholesale: values.minQuantityWholesale ?? null,
        }
      : { priceWholesale: null, minQuantityWholesale: null }),
  };
  return productUpdateSchema.parse(draft);
}
