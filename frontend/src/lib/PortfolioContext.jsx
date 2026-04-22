import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getPortfolio, updatePortfolio } from "./api";

const KEY_ID = "hm_portfolio_id";

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const portfolioId = useMemo(() => {
    try {
      return localStorage.getItem(KEY_ID);
    } catch (_) {
      return null;
    }
  }, [portfolio?.id]);

  const storeId = useCallback((id) => {
    try {
      localStorage.setItem(KEY_ID, id);
    } catch (_) {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    const id = localStorage.getItem(KEY_ID);
    if (!id) {
      setPortfolio(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await getPortfolio(id);
      setPortfolio(data);
      return data;
    } catch (_) {
      // Invalid id — clear
      localStorage.removeItem(KEY_ID);
      setPortfolio(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const patch = useCallback(async (fields) => {
    const id = localStorage.getItem(KEY_ID);
    if (!id) return null;
    const data = await updatePortfolio(id, fields);
    setPortfolio(data);
    return data;
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY_ID);
    } catch (_) {
      /* ignore */
    }
    setPortfolio(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      portfolio,
      setPortfolio,
      portfolioId,
      storeId,
      refresh,
      patch,
      reset,
      loading,
    }),
    [portfolio, portfolioId, storeId, refresh, patch, reset, loading]
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
