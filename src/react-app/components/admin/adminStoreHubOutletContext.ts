import type { ReactNode } from "react";

export type AdminStoreHubOutletContext = {
  setStoreHubToolbar: (node: ReactNode | null) => void;
};
