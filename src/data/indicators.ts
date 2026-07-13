/**
 * ============================================================
 * CAMADA DE DADOS — INDICADORES ECONÔMICOS
 * ============================================================
 *
 * Configuração centralizada de indicadores econômicos
 * exibidos no painel do simulador.
 *
 * CLASSIFICAÇÃO DE FONTES:
 *   OFICIAL   — Dados obtidos via API oficial (BCB, Receita, etc.)
 *   PÚBLICA   — Dados obtidos via APIs públicas consolidadas (AwesomeAPI, etc.)
 *   FALLBACK  — Dados estáticos como último recurso quando APIs falham
 *
 * Última atualização dos fallbacks: Março/2026
 */

import { DollarSign, Euro, Percent, BarChart3, TrendingUp, Activity } from "lucide-react";
import type { DataSource } from "./banks";

export interface IndicatorConfig {
  /** Identificador único */
  id: string;
  /** Rótulo para exibição */
  label: string;
  /** Símbolo ou unidade */
  symbol: string;
  /** Valor fallback (quando APIs falham) */
  fallbackValue: string;
  /** Variação fallback */
  fallbackChange: string;
  /** Tendência fallback */
  fallbackUp: boolean;
  /** Ícone Lucide correspondente */
  icon: any;
  /** Classificação da fonte de dados */
  dataSource: DataSource;
  /** Detalhes da fonte */
  sourceDetail: string;
  /** URL da API que alimenta este indicador (se aplicável) */
  apiEndpoint?: string;
  /** Descrição curta para tooltip */
  description: string;
}

/**
 * Configuração base dos indicadores.
 * Os valores reais são carregados via API em runtime.
 */
export const INDICATORS_CONFIG: IndicatorConfig[] = [
  {
    id: "usd",
    label: "Dólar",
    symbol: "USD",
    fallbackValue: "R$ 5,03",
    fallbackChange: "...",
    fallbackUp: true,
    icon: DollarSign,
    dataSource: "PÚBLICA",
    sourceDetail: "BRAPI — brapi.dev (dados de mercado, atualização em tempo real)",
    apiEndpoint: "https://brapi.dev/api/v2/currency?currency=USD-BRL",
    description: "Cotação do dólar comercial",
  },
  {
    id: "eur",
    label: "Euro",
    symbol: "EUR",
    fallbackValue: "R$ 5,90",
    fallbackChange: "...",
    fallbackUp: true,
    icon: Euro,
    dataSource: "PÚBLICA",
    sourceDetail: "BRAPI — brapi.dev (dados de mercado, atualização em tempo real)",
    apiEndpoint: "https://brapi.dev/api/v2/currency?currency=EUR-BRL",
    description: "Cotação do euro comercial",
  },
  {
    id: "selic",
    label: "Selic",
    symbol: "%",
    fallbackValue: "14,25%",
    fallbackChange: "...",
    fallbackUp: false,
    icon: Percent,
    dataSource: "OFICIAL",
    sourceDetail: "BRAPI / Banco Central do Brasil — API SGS série 432",
    apiEndpoint: "https://brapi.dev/api/v2/prime-rate?country=brazil",
    description: "Taxa básica de juros da economia brasileira",
  },
  {
    id: "ipca",
    label: "IPCA",
    symbol: "%",
    fallbackValue: "4,87%",
    fallbackChange: "...",
    fallbackUp: true,
    icon: BarChart3,
    dataSource: "OFICIAL",
    sourceDetail: "BRAPI / Banco Central do Brasil — API SGS série 13522",
    apiEndpoint: "https://brapi.dev/api/v2/inflation?country=brazil",
    description: "Índice de Preços ao Consumidor Amplo (inflação oficial)",
  },
  {
    id: "tr",
    label: "TR",
    symbol: "%",
    fallbackValue: "0,09%",
    fallbackChange: "...",
    fallbackUp: false,
    icon: Activity,
    dataSource: "OFICIAL",
    sourceDetail: "BRAPI / Banco Central do Brasil — API SGS série 226",
    apiEndpoint: "https://brapi.dev/api/v2/inflation?country=brazil",
    description: "Taxa Referencial — usada em financiamentos",
  },
  {
    id: "cdi",
    label: "CDI",
    symbol: "%",
    fallbackValue: "14,15%",
    fallbackChange: "...",
    fallbackUp: false,
    icon: TrendingUp,
    dataSource: "OFICIAL",
    sourceDetail: "BRAPI / Banco Central do Brasil — API SGS série 4389",
    apiEndpoint: "https://brapi.dev/api/v2/prime-rate?country=brazil",
    description: "Certificado de Depósito Interbancário",
  },
];

/**
 * Dados em runtime para exibição.
 * Preenchido pelo hook useIndicators.
 */
export interface IndicatorData {
  id: string;
  label: string;
  symbol: string;
  value: string;
  change: string;
  up: boolean;
  icon: any;
  dataSource: DataSource;
  sourceDetail: string;
  description: string;
  /** Se o dado veio da API ou do fallback */
  isLive: boolean;
}

/**
 * Converte configuração para dados iniciais (usando fallbacks).
 */
export function getInitialIndicators(): IndicatorData[] {
  return INDICATORS_CONFIG.map((cfg) => ({
    id: cfg.id,
    label: cfg.label,
    symbol: cfg.symbol,
    value: cfg.fallbackValue,
    change: cfg.fallbackChange,
    up: cfg.fallbackUp,
    icon: cfg.icon,
    dataSource: cfg.dataSource,
    sourceDetail: cfg.sourceDetail,
    description: cfg.description,
    isLive: false,
  }));
}
