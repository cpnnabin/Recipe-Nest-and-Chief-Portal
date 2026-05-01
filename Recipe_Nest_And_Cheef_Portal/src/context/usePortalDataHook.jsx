import { useContext } from "react";
import { PortalDataContext } from "./PortalDataContextDefinition";

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error("usePortalData must be used within PortalDataProvider");
  }
  return context;
}

