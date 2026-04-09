/**
 * ============================================================
 * HOOK — useIndicators
 * ============================================================
 *
 * Hook para buscar e atualizar indicadores econômicos em tempo real.
 * Busca dados de APIs oficiais (BCB) e públicas (AwesomeAPI).
 * Cai para fallbacks estáticos em caso de erro.
 */

import { useState, useEffect, useCallback } from "react";
import { getInitialIndicators, type IndicatorData } from "@/data/indicators";
import { getBackendBaseUrl } from "@/lib/api";

const REFRESH_INTERVAL = 300_000; // 5 minutos

export function useIndicators() {
  const [indicators, setIndicators] = useState<IndicatorData[]>(getInitialIndicators());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchIndicators = useCallback(async () => {
    try {
      const updated = [...getInitialIndicators()];
      const backendBase = getBackendBaseUrl();
      const response = await fetch(`${backendBase}/market/indicators`);
      if (!response.ok) {
        throw new Error(`Falha no backend de indicadores (${response.status})`);
      }
      const payload = await response.json();
      const live = Array.isArray(payload?.indicators) ? payload.indicators : [];

      for (const item of live) {
        const idx = updated.findIndex((x) => x.id === item.id);
        if (idx === -1) continue;
        updated[idx] = {
          ...updated[idx],
          value: String(item.value ?? updated[idx].value),
          change: String(item.change ?? updated[idx].change),
          up: Boolean(item.up),
          isLive: Boolean(item.is_live ?? true),
          sourceDetail: String(item.data_source ?? updated[idx].sourceDetail),
          description: String(item.description ?? updated[idx].description),
        };
      }

      setIndicators(updated);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("[Indicadores] Erro ao buscar via backend:", error);
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
