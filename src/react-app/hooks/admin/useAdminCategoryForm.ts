import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminCategoryFormSchema,
  defaultAdminCategoryFormValues,
  type AdminCategoryFormValues,
} from "@/schemas/adminCategoryForm";

type UseAdminCategoryFormArgs = {
  defaultValues?: AdminCategoryFormValues;
  resetKey?: string | null;
};

export function useAdminCategoryForm({ defaultValues, resetKey }: UseAdminCategoryFormArgs = {}) {
  const form = useForm<AdminCategoryFormValues>({
    resolver: zodResolver(adminCategoryFormSchema),
    defaultValues: defaultValues ?? defaultAdminCategoryFormValues,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(defaultValues ?? defaultAdminCategoryFormValues);
  }, [resetKey, defaultValues, form]);

  return form;
}
