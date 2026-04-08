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
import { INDICATORS_CONFIG, getInitialIndicators, type IndicatorData } from "@/data/indicators";

const REFRESH_INTERVAL = 300_000; // 5 minutos

export function useIndicators() {
  const [indicators, setIndicators] = useState<IndicatorData[]>(getInitialIndicators());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchIndicators = useCallback(async () => {
    try {
      const updated = [...getInitialIndicators()];

      // --- Moedas via AwesomeAPI ---
      try {
        const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL");
        const data = await res.json();

        if (data.USDBRL) {
          const usdIdx = updated.findIndex((i) => i.id === "usd");
          if (usdIdx !== -1) {
            const pct = parseFloat(data.USDBRL.pctChange);
            updated[usdIdx] = {
              ...updated[usdIdx],
              value: `R$ ${parseFloat(data.USDBRL.bid).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              change: `${pct > 0 ? "+" : ""}${data.USDBRL.pctChange}%`,
              up: pct > 0,
              isLive: true,
            };
          }
        }

        if (data.EURBRL) {
          const eurIdx = updated.findIndex((i) => i.id === "eur");
          if (eurIdx !== -1) {
            const pct = parseFloat(data.EURBRL.pctChange);
            updated[eurIdx] = {
              ...updated[eurIdx],
              value: `R$ ${parseFloat(data.EURBRL.bid).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              change: `${pct > 0 ? "+" : ""}${data.EURBRL.pctChange}%`,
              up: pct > 0,
              isLive: true,
            };
          }
        }
      } catch (err) {
        console.warn("[Indicadores] AwesomeAPI indisponível, usando fallback para câmbio:", err);
      }

      // --- BCB APIs (Selic, IPCA, TR, CDI) ---
      const bcbIndicators = [
        { id: "selic", suffix: "%" },
        { id: "ipca", suffix: "%" },
        { id: "tr", suffix: "%" },
        { id: "cdi", suffix: "%" },
      ];

      for (const bcb of bcbIndicators) {
        const cfg = INDICATORS_CONFIG.find((c) => c.id === bcb.id);
        if (!cfg?.apiEndpoint) continue;

        try {
          const res = await fetch(cfg.apiEndpoint);
          const data = await res.json();

          if (Array.isArray(data) && data.length > 0) {
            const latest = data[data.length - 1];
            const val = parseFloat(latest.valor);
            const idx = updated.findIndex((i) => i.id === bcb.id);

            if (idx !== -1 && !isNaN(val)) {
              updated[idx] = {
                ...updated[idx],
                value: `${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
                isLive: true,
              };
            }
          }
        } catch (err) {
          console.warn(`[Indicadores] BCB API indisponível para ${bcb.id}, usando fallback:`, err);
        }
      }

      setIndicators(updated);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("[Indicadores] Erro geral ao buscar indicadores:", error);
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
