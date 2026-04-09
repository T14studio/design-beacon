/**
 * ============================================================
 * CAMADA DE DADOS — BANCOS
 * ============================================================
 *
 * Configuração centralizada de todas as instituições financeiras
 * suportadas pelo simulador de financiamento imobiliário.
 *
 * CLASSIFICAÇÃO DE FONTES:
 *   OFICIAL   — Dados obtidos diretamente do site institucional do banco
 *   PÚBLICA   — Dados obtidos de comparadores públicos (ex: Banco Central, MelhorTaxa, etc.)
 *   FALLBACK  — Dados estimados com base em médias de mercado; não confirmados oficialmente
 *
 * IMPORTANTE: As taxas são referenciais e podem variar conforme
 * análise de crédito, relacionamento bancário e condições de mercado.
 *
 * Última atualização: Março/2026
 */

export type DataSource = "OFICIAL" | "PÚBLICA" | "FALLBACK";

export type AmortizationSystem = "PRICE" | "SAC";

export interface BankConfig {
  /** Identificador único do banco */
  id: string;
  /** Nome completo da instituição */
  name: string;
  /** Nome curto para exibição em espaços reduzidos */
  shortName: string;
  /** Taxa anual efetiva (%) — referencial */
  annualRate: number;
  /** Descrição formatada da taxa para exibição */
  rateDisplay: string;
  /** Prazo máximo em anos */
  maxYears: number;
  /** Entrada mínima (% do valor do imóvel) */
  minDownPaymentPercent: number;
  /** Sistemas de amortização suportados */
  amortizationSystems: AmortizationSystem[];
  /** Tipo de financiamento */
  financingType: string;
  /** Observações relevantes */
  notes: string;
  /** Classificação da fonte dos dados */
  dataSource: DataSource;
  /** Detalhes da fonte */
  sourceDetail: string;
  /** URL opcional para logo (SVG/PNG) */
  logo?: string;
  /** Cores para UI — gradiente */
  ui: {
    gradientFrom: string;
    gradientTo: string;
    borderColor: string;
    textColor: string;
    accentColor: string;
  };
  /** Percentual máximo financiável */
  maxFinancingPercent?: number;
  /** Indexadores suportados */
  indexers?: string[];
  /** Fonte externa efetiva da taxa */
  externalSource?: string;
  /** Período externo de referência */
  externalPeriodStart?: string;
  externalPeriodEnd?: string;
}

export interface FinancingProgram {
  id: string;
  name: string;
  description: string;
  max_financing_percent: number;
  min_down_payment_percent: number;
  max_years: number;
  rate_discount_annual: number;
  applicable_modalities: string[];
}

export const BANKS: BankConfig[] = [
  {
    id: "caixa",
    name: "Caixa Econômica Federal",
    shortName: "Caixa",
    annualRate: 8.99,
    rateDisplay: "TR + 8,99%",
    maxYears: 35,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFH / SFI",
    notes: "Maior participação no mercado imobiliário brasileiro. Condições especiais para clientes com relacionamento.",
    dataSource: "PÚBLICA",
    sourceDetail: "Banco Central do Brasil — Ranking de Taxas de Juros (financiamento imobiliário PF)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Caixa_Econ%C3%B4mica_Federal_logo.svg",
    ui: {
      gradientFrom: "from-blue-600/20",
      gradientTo: "to-blue-400/5",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-400",
      accentColor: "#3B82F6",
    },
  },
  {
    id: "itau",
    name: "Itaú Unibanco",
    shortName: "Itaú",
    annualRate: 9.89,
    rateDisplay: "TR + 9,89%",
    maxYears: 30,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFH / SFI",
    notes: "Oferece simulação digital completa. Taxas variam conforme relacionamento e renda.",
    dataSource: "PÚBLICA",
    sourceDetail: "Banco Central do Brasil — Ranking de Taxas de Juros",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Banco_Ita%C3%BA_logo.svg",
    ui: {
      gradientFrom: "from-orange-600/20",
      gradientTo: "to-orange-400/5",
      borderColor: "border-orange-500/30",
      textColor: "text-orange-400",
      accentColor: "#F97316",
    },
  },
  {
    id: "bb",
    name: "Banco do Brasil",
    shortName: "BB",
    annualRate: 9.29,
    rateDisplay: "TR + 9,29%",
    maxYears: 35,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFH / SFI",
    notes: "Condições diferenciadas para servidores públicos e correntistas.",
    dataSource: "PÚBLICA",
    sourceDetail: "Banco Central do Brasil — Ranking de Taxas de Juros",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/06/Banco_do_Brasil_logo.svg",
    ui: {
      gradientFrom: "from-yellow-600/20",
      gradientTo: "to-yellow-400/5",
      borderColor: "border-yellow-500/30",
      textColor: "text-yellow-400",
      accentColor: "#EAB308",
    },
  },
  {
    id: "bradesco",
    name: "Bradesco",
    shortName: "Bradesco",
    annualRate: 9.99,
    rateDisplay: "TR + 9,99%",
    maxYears: 30,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFH / SFI",
    notes: "Possibilidade de portabilidade com condições diferenciadas.",
    dataSource: "PÚBLICA",
    sourceDetail: "Banco Central do Brasil — Ranking de Taxas de Juros",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/97/Bradesco_logo.svg",
    ui: {
      gradientFrom: "from-rose-600/20",
      gradientTo: "to-rose-400/5",
      borderColor: "border-rose-500/30",
      textColor: "text-rose-400",
      accentColor: "#F43F5E",
    },
  },
  {
    id: "santander",
    name: "Santander",
    shortName: "Santander",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg",
    annualRate: 9.49,
    rateDisplay: "TR + 9,49%",
    maxYears: 35,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFH / SFI",
    notes: "Oferece taxa fixa e taxa referenciada. Aceita composição de renda.",
    dataSource: "PÚBLICA",
    sourceDetail: "Banco Central do Brasil — Ranking de Taxas de Juros",
    ui: {
      gradientFrom: "from-red-600/20",
      gradientTo: "to-red-400/5",
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
      accentColor: "#EF4444",
    },
  },
  {
    id: "inter",
    name: "Banco Inter",
    shortName: "Inter",
    annualRate: 10.49,
    rateDisplay: "TR + 10,49%",
    maxYears: 30,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC"],
    financingType: "SFH / SFI",
    notes: "Processo 100% digital. Entrada mínima de 20%. Sem tarifa de avaliação para clientes.",
    dataSource: "PÚBLICA",
    sourceDetail: "Comparadores públicos (MelhorTaxa, Canal do Crédito) — dados verificados em Mar/2026",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Banco_Inter_logo_2022.svg",
    ui: {
      gradientFrom: "from-orange-500/20",
      gradientTo: "to-amber-400/5",
      borderColor: "border-orange-400/30",
      textColor: "text-orange-300",
      accentColor: "#FB923C",
    },
  },
  {
    id: "nubank",
    name: "Nubank",
    shortName: "Nubank",
    annualRate: 11.49,
    rateDisplay: "TR + 11,49%",
    maxYears: 30,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC"],
    financingType: "SFI",
    notes: "Operação de crédito imobiliário em expansão. Processo digital com análise rápida.",
    dataSource: "FALLBACK",
    sourceDetail: "Estimativa baseada em médias de mercado para bancos digitais — Mar/2026. Verificar dados no site oficial.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg",
    ui: {
      gradientFrom: "from-purple-600/20",
      gradientTo: "to-violet-400/5",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
      accentColor: "#A855F7",
    },
  },
  {
    id: "btg",
    name: "BTG Pactual",
    shortName: "BTG",
    annualRate: 10.29,
    rateDisplay: "TR + 10,29%",
    maxYears: 30,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFI",
    notes: "Foco em clientes de alta renda e imóveis de maior valor. Análise personalizada.",
    dataSource: "FALLBACK",
    sourceDetail: "Estimativa baseada em ofertas públicas e press releases do BTG — Mar/2026",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/14/BTG_Pactual_logo.svg",
    ui: {
      gradientFrom: "from-sky-600/20",
      gradientTo: "to-cyan-400/5",
      borderColor: "border-sky-500/30",
      textColor: "text-sky-400",
      accentColor: "#0EA5E9",
    },
  },
  {
    id: "sicredi",
    name: "Sicredi",
    shortName: "Sicredi",
    annualRate: 9.69,
    rateDisplay: "TR + 9,69%",
    maxYears: 30,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFH / SFI",
    notes: "Cooperativa de crédito com taxas competitivas. Necessário ser associado.",
    dataSource: "PÚBLICA",
    sourceDetail: "Banco Central do Brasil — Ranking de Taxas de Juros (cooperativas de crédito)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/35/Sicredi_logo.svg",
    ui: {
      gradientFrom: "from-green-600/20",
      gradientTo: "to-emerald-400/5",
      borderColor: "border-green-500/30",
      textColor: "text-green-400",
      accentColor: "#22C55E",
    },
  },
  {
    id: "sicoob",
    name: "Sicoob",
    shortName: "Sicoob",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/80/Sicoob_logo_novo.svg",
    annualRate: 9.79,
    rateDisplay: "TR + 9,79%",
    maxYears: 30,
    minDownPaymentPercent: 20,
    amortizationSystems: ["SAC", "PRICE"],
    financingType: "SFH / SFI",
    notes: "Maior sistema cooperativo do país. Taxas competitivas para associados.",
    dataSource: "PÚBLICA",
    sourceDetail: "Banco Central do Brasil — Ranking de Taxas de Juros (cooperativas de crédito)",
    ui: {
      gradientFrom: "from-teal-600/20",
      gradientTo: "to-teal-400/5",
      borderColor: "border-teal-500/30",
      textColor: "text-teal-400",
      accentColor: "#14B8A6",
    },
  },
];

/** Retorna o banco pelo ID ou o primeiro como fallback */
export function getBankById(id: string): BankConfig {
  return BANKS.find((b) => b.id === id) || BANKS[0];
}

/** Retorna a lista de IDs dos bancos */
export function getBankIds(): string[] {
  return BANKS.map((b) => b.id);
}
