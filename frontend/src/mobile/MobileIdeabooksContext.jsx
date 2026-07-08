import React, { createContext, useContext } from "react";
import { useIdeabooks } from "./hooks/useIdeabooks";

const IdeabooksContext = createContext(null);

export function MobileIdeabooksProvider({ children }) {
  const value = useIdeabooks();
  return <IdeabooksContext.Provider value={value}>{children}</IdeabooksContext.Provider>;
}

export function useMobileIdeabooks() {
  const ctx = useContext(IdeabooksContext);
  if (!ctx) throw new Error("useMobileIdeabooks must be used within MobileIdeabooksProvider");
  return ctx;
}
