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
    fallbackValue: "R$ 5,00",
    fallbackChange: "...",
    fallbackUp: true,
    icon: DollarSign,
    dataSource: "PÚBLICA",
    sourceDetail: "AwesomeAPI — economia.awesomeapi.com.br (dados públicos, atualização em tempo real)",
    apiEndpoint: "/market/indicators",
    description: "Cotação do dólar comercial (compra)",
  },
  {
    id: "eur",
    label: "Euro",
    symbol: "EUR",
    fallbackValue: "R$ 5,45",
    fallbackChange: "...",
    fallbackUp: true,
    icon: Euro,
    dataSource: "PÚBLICA",
    sourceDetail: "AwesomeAPI — economia.awesomeapi.com.br (dados públicos, atualização em tempo real)",
    apiEndpoint: "/market/indicators",
    description: "Cotação do euro comercial (compra)",
  },
  {
    id: "selic",
    label: "Selic",
    symbol: "%",
    fallbackValue: "14,25%",
    fallbackChange: "0,0%",
    fallbackUp: false,
    icon: Percent,
    dataSource: "OFICIAL",
    sourceDetail: "Banco Central do Brasil — API SGS série 432 (taxa Selic meta)",
    apiEndpoint: "/market/indicators",
    description: "Taxa básica de juros da economia brasileira (meta definida pelo Copom)",
  },
  {
    id: "ipca",
    label: "IPCA",
    symbol: "%",
    fallbackValue: "4,87%",
    fallbackChange: "+0,1%",
    fallbackUp: true,
    icon: BarChart3,
    dataSource: "OFICIAL",
    sourceDetail: "Banco Central do Brasil — API SGS série 13522 (IPCA acumulado 12 meses)",
    apiEndpoint: "/market/indicators",
    description: "Índice de Preços ao Consumidor Amplo — inflação oficial do Brasil (acum. 12 meses)",
  },
  {
    id: "tr",
    label: "TR",
    symbol: "%",
    fallbackValue: "0,09%",
    fallbackChange: "0,0%",
    fallbackUp: false,
    icon: Activity,
    dataSource: "OFICIAL",
    sourceDetail: "Banco Central do Brasil — API SGS série 226 (Taxa Referencial mensal)",
    apiEndpoint: "/market/indicators",
    description: "Taxa Referencial — usada como indexador em financiamentos imobiliários",
  },
  {
    id: "cdi",
    label: "CDI",
    symbol: "%",
    fallbackValue: "14,15%",
    fallbackChange: "0,0%",
    fallbackUp: false,
    icon: TrendingUp,
    dataSource: "OFICIAL",
    sourceDetail: "Banco Central do Brasil — API SGS série 4389 (CDI acumulado anualizado)",
    apiEndpoint: "/market/indicators",
    description: "Certificado de Depósito Interbancário — taxa de referência para investimentos",
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
