import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@/react-app/types";
import {
  adminProductFormSchema,
  defaultAdminProductFormValues,
  productToFormValues,
  type AdminProductFormValues,
} from "@/schemas/adminProductForm";

type UseAdminProductFormArgs = {
  mode: "create" | "edit";
  product: Product | null;
  isOpen: boolean;
};

export function useAdminProductForm({ mode, product, isOpen }: UseAdminProductFormArgs) {
  const form = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductFormSchema),
    defaultValues: defaultAdminProductFormValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && product) {
      form.reset(productToFormValues(product));
    } else {
      form.reset(defaultAdminProductFormValues);
    }
  }, [isOpen, mode, product, form]);

  return form;
}
