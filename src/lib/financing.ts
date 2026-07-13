/**
 * ============================================================
 * CAMADA DE CÁLCULO — SIMULAÇÃO DE FINANCIAMENTO
 * ============================================================
 *
 * Lógica de cálculo isolada da interface.
 * Suporta dois sistemas de amortização:
 *   - PRICE (parcelas fixas)
 *   - SAC (amortização constante, parcelas decrescentes)
 */

import type { AmortizationSystem } from "@/data/banks";

export interface SimulationInput {
  /** Valor total do imóvel em R$ */
  propertyValue: number;
  /** Valor da entrada em R$ */
  downPayment: number;
  /** Prazo em anos */
  years: number;
  /** Taxa de juros anual efetiva (%) */
  annualRate: number;
  /** Sistema de amortização */
  amortizationSystem: AmortizationSystem;
}

export interface SimulationResult {
  /** Valor financiado (imóvel - entrada) */
  financed: number;
  /** Primeira parcela mensal (PRICE: constante; SAC: a primeira, maior) */
  monthlyPayment: number;
  /** Última parcela mensal (PRICE: igual à primeira; SAC: a menor) */
  lastPayment: number;
  /** Total pago ao longo de todo o financiamento */
  totalPaid: number;
  /** Total de juros pagos */
  totalInterest: number;
  /** Número total de parcelas */
  totalInstallments: number;
  /** Sistema de amortização utilizado */
  system: AmortizationSystem;
}

/**
 * Calcula o financiamento pelo sistema PRICE (parcelas fixas).
 *
 * Fórmula:
 *   PMT = PV × [ i × (1+i)^n ] / [ (1+i)^n - 1 ]
 *
 * Onde:
 *   PV = valor financiado (principal)
 *   i  = taxa mensal (taxa anual / 12 / 100)
 *   n  = número de parcelas (anos × 12)
 */
function calculatePrice(input: SimulationInput): SimulationResult | null {
  const principal = input.propertyValue - input.downPayment;
  if (principal <= 0) return null;

  const monthlyRate = input.annualRate / 100 / 12;
  const n = input.years * 12;

  if (monthlyRate === 0) {
    const payment = principal / n;
    return {
      financed: principal,
      monthlyPayment: payment,
      lastPayment: payment,
      totalPaid: principal,
      totalInterest: 0,
      totalInstallments: n,
      system: "PRICE",
    };
  }

  const factor = Math.pow(1 + monthlyRate, n);
  const payment = principal * (monthlyRate * factor) / (factor - 1);
  const totalPaid = payment * n;

  return {
    financed: principal,
    monthlyPayment: payment,
    lastPayment: payment,
    totalPaid,
    totalInterest: totalPaid - principal,
    totalInstallments: n,
    system: "PRICE",
  };
}

/**
 * Calcula o financiamento pelo sistema SAC (amortização constante).
 *
 * Fórmula:
 *   Amortização mensal = PV / n
 *   Juros do mês k     = saldo_devedor_k × i
 *   Parcela do mês k   = amortização + juros_k
 *
 * Primeira parcela é a maior, última é a menor.
 */
function calculateSAC(input: SimulationInput): SimulationResult | null {
  const principal = input.propertyValue - input.downPayment;
  if (principal <= 0) return null;

  const monthlyRate = input.annualRate / 100 / 12;
  const n = input.years * 12;
  const monthlyAmortization = principal / n;

  // Primeira parcela (saldo devedor = principal)
  const firstPayment = monthlyAmortization + principal * monthlyRate;

  // Última parcela (saldo devedor = amortização mensal)
  const lastPayment = monthlyAmortization + monthlyAmortization * monthlyRate;

  // Total pago = soma de todas as parcelas
  // Soma dos juros = i × Σ(saldo_k) onde saldo_k = PV - (k-1) × amortização
  // Σ(saldo_k) para k=1..n = n×PV - amortização × n×(n-1)/2
  //                        = n × PV - (PV/n) × n×(n-1)/2
  //                        = PV × (n+1) / 2
  const totalInterest = monthlyRate * principal * (n + 1) / 2;
  const totalPaid = principal + totalInterest;

  return {
    financed: principal,
    monthlyPayment: firstPayment,
    lastPayment,
    totalPaid,
    totalInterest,
    totalInstallments: n,
    system: "SAC",
  };
}

/**
 * Ponto de entrada principal para cálculo de simulação.
 * Despacha para o sistema de amortização correto.
 */
export function calculateFinancing(input: SimulationInput): SimulationResult | null {
  if (input.propertyValue <= 0 || input.downPayment < 0 || input.years <= 0 || input.annualRate < 0) {
    return null;
  }

  switch (input.amortizationSystem) {
    case "SAC":
      return calculateSAC(input);
    case "PRICE":
    default:
      return calculatePrice(input);
  }
}

/**
 * Formata valor em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
