"""
financing_service.py
════════════════════════════════════════════════════════════════════════════════
Motor de cálculo de simulação de financiamento imobiliário.

Totalmente isolado de fontes externas.
Não depende de BRAPI, AwesomeAPI ou qualquer API.
Puras regras de matemática financeira aplicadas no backend.

Sistemas suportados:
  - SAC  : Sistema de Amortização Constante
  - PRICE: Tabela Price (parcelas fixas)

Funções públicas:
  simulate_financing(payload)       → SimulationResult
  compare_financing_scenarios(list) → list[ScenarioResult]
  simulate_sac(payload)             → dict
  simulate_price(payload)           → dict
"""

import math
from datetime import datetime, timezone
from typing import List, Optional
from dataclasses import dataclass, field, asdict


# ── Tipos de dados internos ──────────────────────────────────────────────────

@dataclass
class FinancingPayload:
    property_value: float
    down_payment: float
    term_months: int
    amortization_system: str        # "SAC" | "PRICE"
    interest_rate_annual: float
    name: Optional[str] = None      # usado em cenários de comparação


@dataclass
class SimulationResult:
    financed_amount: float
    interest_rate_monthly: float
    first_installment: float
    last_installment: float
    total_paid: float
    total_interest: float
    amortization_system: str
    term_months: int
    interest_rate_annual: float


# ── Validação de payload ──────────────────────────────────────────────────────

class FinancingValidationError(ValueError):
    pass


def _validate_payload(p: FinancingPayload) -> None:
    """Valida regras de negócio antes de qualquer cálculo."""
    if p.property_value <= 0:
        raise FinancingValidationError("property_value deve ser maior que zero.")
    if p.down_payment < 0:
        raise FinancingValidationError("down_payment não pode ser negativo.")
    if p.down_payment >= p.property_value:
        raise FinancingValidationError("down_payment deve ser menor que property_value.")
    if p.term_months <= 0 or p.term_months > 420:     # máx 35 anos
        raise FinancingValidationError("term_months deve estar entre 1 e 420 meses.")
    if p.interest_rate_annual < 0 or p.interest_rate_annual > 100:
        raise FinancingValidationError("interest_rate_annual deve estar entre 0 e 100.")
    system = (p.amortization_system or "").upper()
    if system not in ("SAC", "PRICE"):
        raise FinancingValidationError(
            f"amortization_system '{p.amortization_system}' inválido. Use 'SAC' ou 'PRICE'."
        )


# ── Motor SAC ─────────────────────────────────────────────────────────────────

def simulate_sac(payload: FinancingPayload) -> SimulationResult:
    """
    Sistema de Amortização Constante (SAC).

    Amortização mensal constante = Principal / n
    Juros decrescentes sobre o saldo devedor.
    Primeira parcela maior, última parcela menor.
    """
    _validate_payload(payload)

    principal = payload.property_value - payload.down_payment
    n = payload.term_months
    monthly_rate = payload.interest_rate_annual / 100 / 12

    monthly_amort = principal / n
    first_interest = principal * monthly_rate
    first_installment = monthly_amort + first_interest

    # Última parcela: saldo restante = 1 amortização
    last_balance = monthly_amort  # saldo residual antes da última parcela
    last_interest = last_balance * monthly_rate
    last_installment = monthly_amort + last_interest

    # Total pago: soma de (amort + juros sobre saldo decrescente)
    # Saldo inicial = P, saldo após k parcelas = P - k*(P/n)
    # Total juros = sum_{k=0}^{n-1} (P - k*(P/n)) * r
    #             = P*r * sum_{k=0}^{n-1} (1 - k/n)
    #             = P*r * (n - (n-1)/2)
    #             = P*r * (n+1)/2
    total_interest = principal * monthly_rate * (n + 1) / 2
    total_paid = principal + total_interest

    return SimulationResult(
        financed_amount=round(principal, 2),
        interest_rate_monthly=round(monthly_rate * 100, 6),
        first_installment=round(first_installment, 2),
        last_installment=round(last_installment, 2),
        total_paid=round(total_paid, 2),
        total_interest=round(total_interest, 2),
        amortization_system="SAC",
        term_months=n,
        interest_rate_annual=payload.interest_rate_annual,
    )


# ── Motor PRICE ───────────────────────────────────────────────────────────────

def simulate_price(payload: FinancingPayload) -> SimulationResult:
    """
    Tabela Price (parcelas fixas).

    Parcela constante = P * [r(1+r)^n] / [(1+r)^n - 1]
    Juros decrescentes, amortização crescente.
    Primeira e última parcela iguais (salvo arredondamento).
    """
    _validate_payload(payload)

    principal = payload.property_value - payload.down_payment
    n = payload.term_months
    monthly_rate = payload.interest_rate_annual / 100 / 12

    if monthly_rate == 0:
        # Sem juros: parcela = principal / n
        installment = principal / n
        total_paid = principal
        total_interest = 0.0
    else:
        factor = (1 + monthly_rate) ** n
        installment = principal * (monthly_rate * factor) / (factor - 1)
        total_paid = installment * n
        total_interest = total_paid - principal

    return SimulationResult(
        financed_amount=round(principal, 2),
        interest_rate_monthly=round(monthly_rate * 100, 6),
        first_installment=round(installment, 2),
        last_installment=round(installment, 2),    # PRICE: parcelas iguais
        total_paid=round(total_paid, 2),
        total_interest=round(total_interest, 2),
        amortization_system="PRICE",
        term_months=n,
        interest_rate_annual=payload.interest_rate_annual,
    )


# ── Dispatcher principal ───────────────────────────────────────────────────────

def simulate_financing(payload: FinancingPayload) -> dict:
    """
    Orquestra a simulação com base no amortization_system do payload.
    Retorna estrutura padronizada pronta para serialização JSON.
    """
    system = (payload.amortization_system or "").upper()

    if system == "SAC":
        result = simulate_sac(payload)
    elif system == "PRICE":
        result = simulate_price(payload)
    else:
        raise FinancingValidationError(
            f"amortization_system '{payload.amortization_system}' inválido."
        )

    financed = payload.property_value - payload.down_payment

    return {
        "input": {
            "property_value": round(payload.property_value, 2),
            "down_payment": round(payload.down_payment, 2),
            "financed_amount": round(financed, 2),
            "term_months": payload.term_months,
            "amortization_system": result.amortization_system,
            "interest_rate_annual": result.interest_rate_annual,
            "interest_rate_monthly": result.interest_rate_monthly,
        },
        "result": {
            "first_installment": result.first_installment,
            "last_installment": result.last_installment,
            "total_paid": result.total_paid,
            "total_interest": result.total_interest,
        },
        "meta": {
            "success": True,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }


# ── Comparação de cenários ────────────────────────────────────────────────────

def compare_financing_scenarios(scenarios: List[FinancingPayload]) -> dict:
    """
    Recebe lista de cenários e retorna comparação lado a lado.
    Falhas individuais de cenários são capturadas e sinalizadas sem derrubar os demais.
    """
    if not scenarios:
        raise FinancingValidationError("A lista de cenários não pode estar vazia.")
    if len(scenarios) > 10:
        raise FinancingValidationError("Máximo de 10 cenários por comparação.")

    results = []
    errors = []

    for i, scenario in enumerate(scenarios):
        name = scenario.name or f"cenario_{i + 1}"
        try:
            system = (scenario.amortization_system or "").upper()
            if system == "SAC":
                r = simulate_sac(scenario)
            elif system == "PRICE":
                r = simulate_price(scenario)
            else:
                raise FinancingValidationError(
                    f"amortization_system '{scenario.amortization_system}' inválido."
                )

            financed = scenario.property_value - scenario.down_payment
            results.append({
                "name": name,
                "amortization_system": r.amortization_system,
                "financed_amount": round(financed, 2),
                "interest_rate_annual": r.interest_rate_annual,
                "interest_rate_monthly": r.interest_rate_monthly,
                "term_months": r.term_months,
                "first_installment": r.first_installment,
                "last_installment": r.last_installment,
                "total_paid": r.total_paid,
                "total_interest": r.total_interest,
            })
        except FinancingValidationError as e:
            errors.append({"name": name, "error": str(e)})
        except Exception as e:
            errors.append({"name": name, "error": f"Erro inesperado: {type(e).__name__}"})

    partial_failure = len(errors) > 0 and len(results) > 0
    success = len(results) > 0

    return {
        "scenarios": results,
        "meta": {
            "success": success,
            "partial_failure": partial_failure,
            "total_scenarios": len(scenarios),
            "successful_scenarios": len(results),
            "failed_scenarios": len(errors),
            "errors": errors,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }
