import type { ReactNode } from "react";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";
import { cn } from "@/react-app/design-system/cn";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer";
};

export function Container({ children, className, as: Tag = "div" }: ContainerProps) {
  return <Tag className={cn(storefrontShellClass, className)}>{children}</Tag>;
}
