"""
economic_service.py
===================
Camada de integração com APIs externas para:
  1. Indicadores econômicos (AwesomeAPI + Banco Central SGS)
  2. Taxas de financiamento imobiliário (Banco Central ranking)
  3. Motor de cálculo de simulação (SAC e PRICE)

Fontes externas consultadas pelo backend:
  - AwesomeAPI  : https://economia.awesomeapi.com.br  (câmbio)
  - BCB/SGS     : https://api.bcb.gov.br               (Selic, IPCA, TR, CDI)
  - BCB Ranking : https://www.bcb.gov.br/api/     (taxas financiamento imobiliário)
"""

import os
import json
import time
import math
import asyncio
import httpx
from typing import Optional

# ── Cache simples em memória ─────────────────────────────────────────────────
_cache: dict = {}
CACHE_TTL = 300  # 5 minutos


def _get_cache(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None


def _set_cache(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}


# ── Parâmetros de banco (estrutura interna complementar) ─────────────────────
# Base de dados interna usada quando a API do BCB não retorna granularidade
# suficiente. Os dados de taxa vêm confirmados pelo ranking BCB (público).
BANKS_BASE = [
    {
        "id": "caixa",
        "name": "Caixa Econômica Federal",
        "shortName": "Caixa",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Caixa_Econ%C3%B4mica_Federal_logo.svg",
        "annualRate": 8.99,
        "rateDisplay": "TR + 8,99%",
        "maxYears": 35,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFH / SFI",
        "programs": ["Minha Casa Minha Vida", "SFH", "SFI"],
        "mcmvMaxValue": 350000,
        "mcmvMinDownPercent": 10,
        "notes": "Maior participação no mercado imobiliário brasileiro. MCMV faixa 1.5–3 disponível.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Banco Central do Brasil — Ranking de Taxas de Juros",
        "ui": {
            "gradientFrom": "from-blue-600/20",
            "gradientTo": "to-blue-400/5",
            "borderColor": "border-blue-500/30",
            "textColor": "text-blue-400",
            "accentColor": "#3B82F6",
        },
    },
    {
        "id": "itau",
        "name": "Itaú Unibanco",
        "shortName": "Itaú",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Banco_Ita%C3%BA_logo.svg",
        "annualRate": 9.89,
        "rateDisplay": "TR + 9,89%",
        "maxYears": 30,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFH / SFI",
        "programs": ["SFH", "SFI"],
        "notes": "Simulação digital. Taxas variam por relacionamento e renda.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Banco Central do Brasil — Ranking de Taxas de Juros",
        "ui": {
            "gradientFrom": "from-orange-600/20",
            "gradientTo": "to-orange-400/5",
            "borderColor": "border-orange-500/30",
            "textColor": "text-orange-400",
            "accentColor": "#F97316",
        },
    },
    {
        "id": "bb",
        "name": "Banco do Brasil",
        "shortName": "BB",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/0/06/Banco_do_Brasil_logo.svg",
        "annualRate": 9.29,
        "rateDisplay": "TR + 9,29%",
        "maxYears": 35,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFH / SFI",
        "programs": ["SFH", "SFI"],
        "notes": "Condições diferenciadas para servidores públicos e correntistas.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Banco Central do Brasil — Ranking de Taxas de Juros",
        "ui": {
            "gradientFrom": "from-yellow-600/20",
            "gradientTo": "to-yellow-400/5",
            "borderColor": "border-yellow-500/30",
            "textColor": "text-yellow-400",
            "accentColor": "#EAB308",
        },
    },
    {
        "id": "bradesco",
        "name": "Bradesco",
        "shortName": "Bradesco",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/9/97/Bradesco_logo.svg",
        "annualRate": 9.99,
        "rateDisplay": "TR + 9,99%",
        "maxYears": 30,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFH / SFI",
        "programs": ["SFH", "SFI"],
        "notes": "Portabilidade com condições diferenciadas.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Banco Central do Brasil — Ranking de Taxas de Juros",
        "ui": {
            "gradientFrom": "from-rose-600/20",
            "gradientTo": "to-rose-400/5",
            "borderColor": "border-rose-500/30",
            "textColor": "text-rose-400",
            "accentColor": "#F43F5E",
        },
    },
    {
        "id": "santander",
        "name": "Santander",
        "shortName": "Santander",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg",
        "annualRate": 9.49,
        "rateDisplay": "TR + 9,49%",
        "maxYears": 35,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFH / SFI",
        "programs": ["SFH", "SFI"],
        "notes": "Aceita composição de renda. Taxa fixa disponível.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Banco Central do Brasil — Ranking de Taxas de Juros",
        "ui": {
            "gradientFrom": "from-red-600/20",
            "gradientTo": "to-red-400/5",
            "borderColor": "border-red-500/30",
            "textColor": "text-red-400",
            "accentColor": "#EF4444",
        },
    },
    {
        "id": "inter",
        "name": "Banco Inter",
        "shortName": "Inter",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Banco_Inter_logo_2022.svg",
        "annualRate": 10.49,
        "rateDisplay": "TR + 10,49%",
        "maxYears": 30,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC"],
        "financingType": "SFH / SFI",
        "programs": ["SFH", "SFI"],
        "notes": "Processo 100% digital. Sem tarifa de avaliação para clientes.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Comparadores públicos (MelhorTaxa, Canal do Crédito)",
        "ui": {
            "gradientFrom": "from-orange-500/20",
            "gradientTo": "to-amber-400/5",
            "borderColor": "border-orange-400/30",
            "textColor": "text-orange-300",
            "accentColor": "#FB923C",
        },
    },
    {
        "id": "nubank",
        "name": "Nubank",
        "shortName": "Nubank",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg",
        "annualRate": 11.49,
        "rateDisplay": "TR + 11,49%",
        "maxYears": 30,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC"],
        "financingType": "SFI",
        "programs": ["SFI"],
        "notes": "Crédito imobiliário em expansão. Análise rápida 100% digital.",
        "dataSource": "FALLBACK",
        "sourceDetail": "Estimativa com base em médias de bancos digitais — Mar/2026",
        "ui": {
            "gradientFrom": "from-purple-600/20",
            "gradientTo": "to-violet-400/5",
            "borderColor": "border-purple-500/30",
            "textColor": "text-purple-400",
            "accentColor": "#A855F7",
        },
    },
    {
        "id": "btg",
        "name": "BTG Pactual",
        "shortName": "BTG",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/1/14/BTG_Pactual_logo.svg",
        "annualRate": 10.29,
        "rateDisplay": "TR + 10,29%",
        "maxYears": 30,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFI",
        "programs": ["SFI"],
        "notes": "Foco em alta renda e imóveis de maior valor.",
        "dataSource": "FALLBACK",
        "sourceDetail": "Estimativa baseada em press releases do BTG — Mar/2026",
        "ui": {
            "gradientFrom": "from-sky-600/20",
            "gradientTo": "to-cyan-400/5",
            "borderColor": "border-sky-500/30",
            "textColor": "text-sky-400",
            "accentColor": "#0EA5E9",
        },
    },
    {
        "id": "sicredi",
        "name": "Sicredi",
        "shortName": "Sicredi",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/3/35/Sicredi_logo.svg",
        "annualRate": 9.69,
        "rateDisplay": "TR + 9,69%",
        "maxYears": 30,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFH / SFI",
        "programs": ["SFH", "SFI"],
        "notes": "Cooperativa. Taxas competitivas para associados.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Banco Central do Brasil — Ranking de Taxas de Juros",
        "ui": {
            "gradientFrom": "from-green-600/20",
            "gradientTo": "to-emerald-400/5",
            "borderColor": "border-green-500/30",
            "textColor": "text-green-400",
            "accentColor": "#22C55E",
        },
    },
    {
        "id": "sicoob",
        "name": "Sicoob",
        "shortName": "Sicoob",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/8/80/Sicoob_logo_novo.svg",
        "annualRate": 9.79,
        "rateDisplay": "TR + 9,79%",
        "maxYears": 30,
        "minDownPaymentPercent": 20,
        "amortizationSystems": ["SAC", "PRICE"],
        "financingType": "SFH / SFI",
        "programs": ["SFH", "SFI"],
        "notes": "Maior cooperativa do país. Taxas competitivas para associados.",
        "dataSource": "PÚBLICA",
        "sourceDetail": "Banco Central do Brasil — Ranking de Taxas de Juros",
        "ui": {
            "gradientFrom": "from-teal-600/20",
            "gradientTo": "to-teal-400/5",
            "borderColor": "border-teal-500/30",
            "textColor": "text-teal-400",
            "accentColor": "#14B8A6",
        },
    },
]

# IDs do BCB Ranking de taxas de financiamento imobiliário PF (segmento 2001)
# Ref: https://www.bcb.gov.br/estatisticas/txjuros (Crédito imobiliário / PF)
BCB_RANKING_URL = (
    "https://www.bcb.gov.br/api/taxajuros/odata/ListaTaxaJuros?"
    "$top=200&$filter=Segmento eq '2001' and Modalidade eq '131'"
)

# Fallback: Banco Central SGS — séries relevantes para imobiliário
BCB_SGS = {
    "selic": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json",
    "ipca": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json",
    "tr": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/1?formato=json",
    "cdi": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json",
}

AWESOME_FX_URL = "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL"

HEADERS = {"User-Agent": "design-beacon/1.0 (backend economic service)", "Accept": "application/json"}
TIMEOUT = 8.0


class EconomicService:
    # ── 1. Indicadores econômicos ─────────────────────────────────────────────
    @staticmethod
    async def get_indicators() -> dict:
        cached = _get_cache("indicators")
        if cached:
            return cached

        result = {
            "usd": {"value": "R$ 5,79", "change": "...", "up": True, "isLive": False},
            "eur": {"value": "R$ 6,32", "change": "...", "up": True, "isLive": False},
            "selic": {"value": "14,75%", "change": "0,0%", "up": False, "isLive": False},
            "ipca": {"value": "5,48%", "change": "+0,1%", "up": True, "isLive": False},
            "tr": {"value": "0,09%", "change": "0,0%", "up": False, "isLive": False},
            "cdi": {"value": "14,65%", "change": "0,0%", "up": False, "isLive": False},
        }

        async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
            # Câmbio — AwesomeAPI
            try:
                r = await client.get(AWESOME_FX_URL)
                if r.status_code == 200:
                    fx = r.json()
                    if "USDBRL" in fx:
                        d = fx["USDBRL"]
                        pct = float(d.get("pctChange", 0))
                        result["usd"] = {
                            "value": f"R$ {float(d['bid']):.2f}".replace(".", ","),
                            "change": f"{'+' if pct > 0 else ''}{pct:.2f}%",
                            "up": pct > 0,
                            "isLive": True,
                        }
                    if "EURBRL" in fx:
                        d = fx["EURBRL"]
                        pct = float(d.get("pctChange", 0))
                        result["eur"] = {
                            "value": f"R$ {float(d['bid']):.2f}".replace(".", ","),
                            "change": f"{'+' if pct > 0 else ''}{pct:.2f}%",
                            "up": pct > 0,
                            "isLive": True,
                        }
            except Exception as e:
                print(f"[EconomicService] AwesomeAPI error: {e}")

            # Banco Central — séries SGS
            for key, url in BCB_SGS.items():
                try:
                    r = await client.get(url)
                    if r.status_code == 200:
                        data = r.json()
                        if isinstance(data, list) and len(data) > 0:
                            val = float(data[-1]["valor"])
                            result[key] = {
                                "value": f"{val:.2f}%".replace(".", ","),
                                "change": "BCB",
                                "up": False,
                                "isLive": True,
                            }
                except Exception as e:
                    print(f"[EconomicService] BCB SGS {key} error: {e}")

        result["fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        _set_cache("indicators", result)
        return result

    # ── 2. Taxas dos bancos — BCB Ranking ─────────────────────────────────────
    @staticmethod
    async def get_bank_rates() -> list:
        cached = _get_cache("bank_rates")
        if cached:
            return cached

        banks_out = [dict(b) for b in BANKS_BASE]  # cópia mutável

        try:
            async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
                r = await client.get(BCB_RANKING_URL)
                if r.status_code == 200:
                    data = r.json()
                    entries = data.get("value", []) if isinstance(data, dict) else []

                    # Mapeia instituição BCB → nosso banco por substring simples
                    mapping = {
                        "caixa": "caixa",
                        "itau": "itau",
                        "banco do brasil": "bb",
                        "bradesco": "bradesco",
                        "santander": "santander",
                        "inter": "inter",
                        "btg": "btg",
                        "sicredi": "sicredi",
                        "sicoob": "sicoob",
                        "nubank": "nubank",
                    }

                    for entry in entries:
                        nome = (entry.get("InstituicaoFinanceira") or "").lower()
                        taxa_str = entry.get("TaxaJurosAoAno") or entry.get("taxaJurosAoAno")
                        if not taxa_str:
                            continue
                        try:
                            taxa = float(str(taxa_str).replace(",", "."))
                        except Exception:
                            continue

                        for key, bank_id in mapping.items():
                            if key in nome:
                                for b in banks_out:
                                    if b["id"] == bank_id:
                                        b["annualRate"] = round(taxa, 2)
                                        b["rateDisplay"] = f"TR + {taxa:.2f}%".replace(".", ",")
                                        b["dataSource"] = "OFICIAL"
                                        b["sourceDetail"] = "Banco Central do Brasil — Ranking de Taxas de Juros (API)"
                                        b["rateFromBCB"] = True
                                break
        except Exception as e:
            print(f"[EconomicService] BCB Ranking error (using internal fallback): {e}")

        result = {"banks": banks_out, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        _set_cache("bank_rates", result)
        return result

    # ── 3. Motor de simulação ─────────────────────────────────────────────────
    @staticmethod
    def calculate(
        property_value: float,
        down_payment: float,
        years: int,
        annual_rate: float,
        amortization: str,
    ) -> dict:
        principal = property_value - down_payment
        if principal <= 0:
            return {"error": "Entrada maior ou igual ao valor do imóvel"}
        if years <= 0 or annual_rate < 0:
            return {"error": "Parâmetros inválidos"}

        n = years * 12
        monthly_rate = annual_rate / 100 / 12

        if amortization.upper() == "PRICE":
            if monthly_rate == 0:
                payment = principal / n
                total_paid = principal
                total_interest = 0.0
                last_payment = payment
            else:
                factor = (1 + monthly_rate) ** n
                payment = principal * (monthly_rate * factor) / (factor - 1)
                total_paid = payment * n
                total_interest = total_paid - principal
                last_payment = payment

            return {
                "system": "PRICE",
                "financed": round(principal, 2),
                "monthly_payment": round(payment, 2),
                "last_payment": round(last_payment, 2),
                "total_paid": round(total_paid, 2),
                "total_interest": round(total_interest, 2),
                "total_installments": n,
                "down_payment": round(down_payment, 2),
                "property_value": round(property_value, 2),
                "annual_rate": annual_rate,
                "years": years,
            }

        else:  # SAC
            monthly_amort = principal / n
            first_payment = monthly_amort + principal * monthly_rate
            last_pmt = monthly_amort + monthly_amort * monthly_rate
            total_interest = monthly_rate * principal * (n + 1) / 2
            total_paid = principal + total_interest

            return {
                "system": "SAC",
                "financed": round(principal, 2),
                "monthly_payment": round(first_payment, 2),
                "last_payment": round(last_pmt, 2),
                "total_paid": round(total_paid, 2),
                "total_interest": round(total_interest, 2),
                "total_installments": n,
                "down_payment": round(down_payment, 2),
                "property_value": round(property_value, 2),
                "annual_rate": annual_rate,
                "years": years,
            }
