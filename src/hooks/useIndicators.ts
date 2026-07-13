/**
 * ============================================================
 * HOOK — useIndicators
 * ============================================================
 *
 * Hook para buscar e atualizar indicadores econômicos em tempo real.
 * Requisito: Agora utiliza EXCLUSIVAMENTE o backend para buscar os dados.
 */

import { useState, useEffect, useCallback } from "react";
import { getInitialIndicators, type IndicatorData } from "@/data/indicators";

const REFRESH_INTERVAL = 300_000; // 5 minutos

export function useIndicators() {
  const [indicators, setIndicators] = useState<IndicatorData[]>(getInitialIndicators());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchIndicators = useCallback(async () => {
    try {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const backendUrl = isLocal ? "http://localhost:8000" : "https://design-beacon.onrender.com";

      const res = await fetch(`${backendUrl}/indicators`);
      if (!res.ok) throw new Error("Falha ao buscar indicadores do backend");

      const json = await res.json();

      if (json.status === "ok" || json.status === "fallback") {
        const backendData = json.data;
        const updated = getInitialIndicators().map((ind) => {
          const backendInd = backendData[ind.id];
          if (backendInd) {
            return {
              ...ind,
              value: backendInd.value,
              change: backendInd.change,
              up: backendInd.up,
              isLive: backendInd.isLive,
              dataSource: backendInd.isLive ? "REAL-TIME API" : "FALLBACK",
            };
          }
          return ind;
        });

        setIndicators(updated);
        setLastUpdate(new Date(backendData.fetched_at || Date.now()));
      }
    } catch (error) {
      console.error("[Indicadores] Erro ao consumir API do backend:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndicators();
    const interval = setInterval(fetchIndicators, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchIndicators]);

  return { indicators, loading, lastUpdate, refetch: fetchIndicators };
}
