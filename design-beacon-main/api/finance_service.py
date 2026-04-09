from datetime import datetime
from typing import Dict, Any, List, Optional

import requests


BCB_ODATA_BASE = "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v1/odata"

# ─────────────────────────────────────────────────────────────────────────────
# Taxas de referência curadas (atualização março/2026)
# Fonte: Banco Central do Brasil — Ranking de Taxas de Juros
# Usadas como fallback quando a API do BCB não está disponível.
# ─────────────────────────────────────────────────────────────────────────────
_FALLBACK_RATES: Dict[str, float] = {
    "caixa":     8.99,
    "itau":      9.89,
    "bb":        9.29,
    "bradesco":  9.99,
    "santander": 9.49,
    "inter":    10.49,
    "nubank":   11.49,
    "btg":      10.29,
    "sicredi":   9.69,
    "sicoob":    9.79,
}


class FinanceService:
    _INSTITUTION_ALIASES = {
        "caixa":     ["CAIXA ECONOMICA FEDERAL", "CAIXA ECONÔMICA FEDERAL"],
        "itau":      ["ITAU", "ITAU UNIBANCO", "BANCO ITAU"],
        "bb":        ["BANCO DO BRASIL"],
        "bradesco":  ["BRADESCO"],
        "santander": ["SANTANDER"],
        "inter":     ["BANCO INTER"],
        "nubank":    ["NU PAGAMENTOS", "NUBANK"],
        "btg":       ["BTG"],
        "sicredi":   ["SICREDI"],
        "sicoob":    ["SICOOB"],
    }

    _BANK_VISUAL_RULES = {
        "caixa":     {"name": "Caixa Econômica Federal", "short_name": "Caixa",     "logo": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Caixa_Econ%C3%B4mica_Federal_logo.svg", "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "itau":      {"name": "Itaú Unibanco",           "short_name": "Itaú",      "logo": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Banco_Ita%C3%BA_logo.svg",              "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "bb":        {"name": "Banco do Brasil",          "short_name": "BB",        "logo": "https://upload.wikimedia.org/wikipedia/commons/0/06/Banco_do_Brasil_logo.svg",              "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "bradesco":  {"name": "Bradesco",                 "short_name": "Bradesco",  "logo": "https://upload.wikimedia.org/wikipedia/commons/9/97/Bradesco_logo.svg",                    "max_years": 30, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "santander": {"name": "Santander",                "short_name": "Santander", "logo": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg",        "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "inter":     {"name": "Banco Inter",              "short_name": "Inter",     "logo": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Banco_Inter_logo_2022.svg",            "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC"],          "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "nubank":    {"name": "Nubank",                   "short_name": "Nubank",    "logo": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg",                 "max_years": 35, "max_financing_percent": 75.0, "min_down_payment_percent": 25.0, "amortization_systems": ["SAC"],          "indexers": ["TR"], "financing_type": "SFI"},
        "btg":       {"name": "BTG Pactual",              "short_name": "BTG",       "logo": "https://upload.wikimedia.org/wikipedia/commons/1/14/BTG_Pactual_logo.svg",                 "max_years": 30, "max_financing_percent": 70.0, "min_down_payment_percent": 30.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFI"},
        "sicredi":   {"name": "Sicredi",                  "short_name": "Sicredi",   "logo": "https://upload.wikimedia.org/wikipedia/commons/3/35/Sicredi_logo.svg",                    "max_years": 30, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "sicoob":    {"name": "Sicoob",                   "short_name": "Sicoob",    "logo": "https://upload.wikimedia.org/wikipedia/commons/8/80/Sicoob_logo_novo.svg",                 "max_years": 30, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
    }

    # ──────────────────────────────────────────────────────────────────────────
    # Programas de financiamento com regras de negócio completas
    #
    # max_property_value  : None = sem teto; float = valor máximo do imóvel (R$)
    # rate_discount_annual: desconto em pp/ano sobre a taxa base do banco
    # eligible_bank_ids   : None = todos; lista = apenas esses bancos operam este programa
    # ──────────────────────────────────────────────────────────────────────────
    _PROGRAMS = [
        {
            "id": "convencional",
            "name": "Convencional",
            "description": "Financiamento imobiliário padrão de mercado. Sem restrições de renda ou valor do imóvel.",
            "max_financing_percent": 80.0,
            "min_down_payment_percent": 20.0,
            "max_years": 35,
            "rate_discount_annual": 0.0,
            "max_property_value": None,
            "eligible_bank_ids": None,
            "applicable_modalities": ["aquisicao_imovel_novo", "aquisicao_imovel_usado", "balcao"],
            "notes": "Regras padrão de mercado. Entrada mínima de 20%.",
        },
        {
            "id": "mcmv_faixa_1",
            "name": "MCMV — Faixa 1",
            "description": "Minha Casa Minha Vida Faixa 1. Renda familiar bruta até R$ 2.640/mês. Subsídio máximo disponível.",
            "max_financing_percent": 90.0,
            "min_down_payment_percent": 10.0,
            "max_years": 35,
            "rate_discount_annual": 1.5,
            "max_property_value": 190000.0,
            "eligible_bank_ids": ["caixa", "bb"],
            "applicable_modalities": ["aquisicao_imovel_novo", "balcao"],
            "notes": "Renda máxima R$ 2.640/mês. Valor máximo do imóvel R$ 190.000. Apenas imóveis novos.",
        },
        {
            "id": "mcmv_faixa_2",
            "name": "MCMV — Faixa 2",
            "description": "Minha Casa Minha Vida Faixa 2. Renda familiar bruta de R$ 2.640 a R$ 4.400/mês. Subsídio parcial.",
            "max_financing_percent": 85.0,
            "min_down_payment_percent": 15.0,
            "max_years": 35,
            "rate_discount_annual": 1.0,
            "max_property_value": 264000.0,
            "eligible_bank_ids": ["caixa", "bb", "bradesco", "santander"],
            "applicable_modalities": ["aquisicao_imovel_novo", "aquisicao_imovel_usado", "balcao"],
            "notes": "Renda de R$ 2.640 a R$ 4.400/mês. Valor máximo do imóvel R$ 264.000.",
        },
        {
            "id": "mcmv_faixa_3",
            "name": "MCMV — Faixa 3",
            "description": "Minha Casa Minha Vida Faixa 3. Renda familiar bruta de R$ 4.400 a R$ 8.000/mês.",
            "max_financing_percent": 80.0,
            "min_down_payment_percent": 20.0,
            "max_years": 35,
            "rate_discount_annual": 0.5,
            "max_property_value": 350000.0,
            "eligible_bank_ids": ["caixa", "bb", "bradesco", "santander", "itau"],
            "applicable_modalities": ["aquisicao_imovel_novo", "aquisicao_imovel_usado", "balcao"],
            "notes": "Renda de R$ 4.400 a R$ 8.000/mês. Valor máximo do imóvel R$ 350.000.",
        },
    ]

    _BANK_RATE_ADJUSTMENT = {
        "caixa":    -0.7,
        "bb":       -0.4,
        "itau":      0.2,
        "bradesco":  0.4,
        "santander": 0.3,
        "inter":     0.1,
        "nubank":    0.8,
        "btg":       0.9,
        "sicredi":  -0.2,
        "sicoob":   -0.1,
    }

    # ─────────────────────── BCB helpers ──────────────────────────────────────

    @staticmethod
    def _to_mmddyyyy(date_iso: str) -> str:
        dt = datetime.strptime(date_iso, "%Y-%m-%d")
        return dt.strftime("%m-%d-%Y")

    @classmethod
    def _fetch_latest_period(cls) -> Dict[str, str]:
        url = f"{BCB_ODATA_BASE}/PeriodosDisponiveis?$top=1&$orderby=inicioPeriodo%20desc"
        res = requests.get(url, timeout=15)
        res.raise_for_status()
        data = res.json().get("value", [])
        if not data:
            raise ValueError("BCB não retornou períodos disponíveis.")
        return data[0]

    @classmethod
    def _fetch_rates_by_period(cls, period_start_iso: str) -> List[Dict[str, Any]]:
        start = cls._to_mmddyyyy(period_start_iso)
        url = f"{BCB_ODATA_BASE}/TaxasJurosDiariaPorInicioPeriodo(InicioPeriodo=@InicioPeriodo)"
        params = {"@InicioPeriodo": f"'{start}'"}
        res = requests.get(url, params=params, timeout=25)
        res.raise_for_status()
        return res.json().get("value", [])

    @classmethod
    def _extract_bank_rate(cls, bank_id: str, rows: List[Dict[str, Any]]) -> Optional[float]:
        aliases = cls._INSTITUTION_ALIASES.get(bank_id, [])
        filtered: List[float] = []
        for row in rows:
            instituicao = str(row.get("InstituicaoFinanceira", "")).upper()
            segmento    = str(row.get("Segmento", "")).upper()
            modalidade  = str(row.get("Modalidade", "")).lower()
            taxa_ano    = row.get("TaxaJurosAoAno")
            if segmento != "PESSOA FÍSICA":
                continue
            if not isinstance(taxa_ano, (int, float)):
                continue
            if any(alias in instituicao for alias in aliases):
                taxa = float(taxa_ano)
                if 4.0 <= taxa <= 25.0 and any(
                    k in modalidade for k in ["aquisição", "aquisicao", "habit", "imobili", "outros bens"]
                ):
                    filtered.append(taxa)
        if not filtered:
            return None
        normalized = min(filtered)
        return round(max(7.0, min(normalized, 16.0)), 2)

    # ─────────────────────── catálogo ─────────────────────────────────────────

    @classmethod
    def _build_bank_list(
        cls,
        live_rates: Optional[Dict[str, float]],
        period_info: Optional[Dict[str, str]],
    ) -> List[Dict[str, Any]]:
        """Constrói a lista de bancos. Usa live_rates quando disponível, fallback curado caso contrário."""
        using_live = live_rates is not None
        banks: List[Dict[str, Any]] = []

        for bank_id, meta in cls._BANK_VISUAL_RULES.items():
            raw_rate = (live_rates or {}).get(bank_id) if using_live else None
            if raw_rate is None:
                raw_rate = _FALLBACK_RATES.get(bank_id, 10.5)

            adjusted = round(
                max(7.0, min(raw_rate + cls._BANK_RATE_ADJUSTMENT.get(bank_id, 0.0), 16.0)),
                2,
            )
            source = (
                "Banco Central do Brasil - Olinda OData"
                if using_live
                else "Referência curada (Mar/2026)"
            )

            banks.append({
                "id": bank_id,
                "name": meta["name"],
                "short_name": meta["short_name"],
                "logo": meta["logo"],
                "annual_rate": adjusted,
                "rate_display": f"TR + {adjusted:.2f}%",
                "max_years": meta["max_years"],
                "max_financing_percent": meta["max_financing_percent"],
                "min_down_payment_percent": meta["min_down_payment_percent"],
                "amortization_systems": meta["amortization_systems"],
                "indexers": meta["indexers"],
                "financing_type": meta["financing_type"],
                "external_source": source,
                "external_period_start": period_info["inicioPeriodo"] if period_info else None,
                "external_period_end":   period_info["fimPeriodo"]    if period_info else None,
            })

        return banks

    @classmethod
    def get_finance_catalog(cls) -> Dict[str, Any]:
        """
        Retorna catálogo completo (bancos + programas).
        Tenta taxas em tempo real do BCB; em falha usa fallback curado.
        NUNCA lança exceção — sempre retorna dados válidos.
        """
        live_rates: Optional[Dict[str, float]] = None
        period_info: Optional[Dict[str, str]]  = None
        data_source = "FALLBACK"

        try:
            period_info = cls._fetch_latest_period()
            rows = cls._fetch_rates_by_period(period_info["inicioPeriodo"])
            live_rates = {}
            for bank_id in cls._BANK_VISUAL_RULES:
                rate = cls._extract_bank_rate(bank_id, rows)
                if rate is not None:
                    live_rates[bank_id] = rate
            data_source = "LIVE_BCB"
        except Exception as exc:
            import sys
            print(
                f"[FinanceService] BCB indisponível ({exc}). Usando taxas curadas.",
                file=sys.stderr,
            )

        banks = cls._build_bank_list(live_rates, period_info)

        return {
            "status":          "ok",
            "data_source":     data_source,
            "updated_at":      datetime.utcnow().isoformat() + "Z",
            "external_source": (
                "Banco Central do Brasil - Olinda OData"
                if data_source == "LIVE_BCB"
                else "Referência curada (Mar/2026)"
            ),
            "period_start": period_info["inicioPeriodo"] if period_info else None,
            "period_end":   period_info["fimPeriodo"]    if period_info else None,
            "programs":     cls._PROGRAMS,
            "banks":        banks,
        }

    # ─────────────────────── cálculo ──────────────────────────────────────────

    @staticmethod
    def _calculate_price(principal: float, annual_rate: float, years: int) -> Dict[str, float]:
        n = years * 12
        i = annual_rate / 100 / 12
        if i == 0:
            pmt = principal / n
            return {"monthly_payment": pmt, "last_payment": pmt, "total_paid": principal, "total_interest": 0.0}
        factor = (1 + i) ** n
        pmt = principal * (i * factor) / (factor - 1)
        total = pmt * n
        return {"monthly_payment": pmt, "last_payment": pmt, "total_paid": total, "total_interest": total - principal}

    @staticmethod
    def _calculate_sac(principal: float, annual_rate: float, years: int) -> Dict[str, float]:
        n = years * 12
        i = annual_rate / 100 / 12
        amort = principal / n
        first = amort + principal * i
        last  = amort + amort * i
        total_interest = i * principal * (n + 1) / 2
        return {
            "monthly_payment": first,
            "last_payment":    last,
            "total_paid":      principal + total_interest,
            "total_interest":  total_interest,
        }

    # ─────────────────────── simulação ────────────────────────────────────────

    @classmethod
    def simulate(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executa simulação aplicando regras combinadas banco + programa.
        Usa catálogo com fallback — não refaz chamada BCB separada.
        """
        catalog  = cls.get_finance_catalog()
        banks    = catalog["banks"]
        programs = catalog["programs"]

        bank_id    = str(payload.get("bank_id", ""))
        program_id = str(payload.get("program_id", "convencional"))

        bank = next((b for b in banks if b["id"] == bank_id), None)
        if not bank:
            raise ValueError(f"Banco '{bank_id}' inválido ou não disponível.")

        program = next((p for p in programs if p["id"] == program_id), None)
        if not program:
            raise ValueError(f"Programa '{program_id}' inválido.")

        # Elegibilidade banco × programa
        eligible = program.get("eligible_bank_ids")
        if eligible is not None and bank_id not in eligible:
            raise ValueError(
                f"O banco {bank['name']} não opera '{program['name']}'. "
                f"Elegíveis: {', '.join(eligible)}."
            )

        property_value = float(payload["property_value"])
        down_payment   = float(payload["down_payment"])
        years          = int(payload["years"])
        amortization   = str(payload["amortization_system"])

        # Regras combinadas (take the stricter)
        max_years         = min(int(bank["max_years"]),            int(program["max_years"]))
        max_fin_pct       = min(float(bank["max_financing_percent"]),  float(program["max_financing_percent"]))
        min_down_pct      = max(float(bank["min_down_payment_percent"]), float(program["min_down_payment_percent"]))
        max_prop_value    = program.get("max_property_value")

        min_down     = property_value * (min_down_pct / 100)
        financed     = property_value - down_payment
        max_financed = property_value * (max_fin_pct / 100)

        # Validações de negócio
        if max_prop_value is not None and property_value > max_prop_value:
            raise ValueError(
                f"'{program['name']}' limita o imóvel a R$ {max_prop_value:,.0f}. "
                f"Informado: R$ {property_value:,.0f}."
            )
        if years > max_years:
            raise ValueError(f"Prazo excede o máximo permitido ({max_years} anos).")
        if down_payment < min_down:
            raise ValueError(
                f"Entrada mínima para {program['name']} com {bank['name']} é "
                f"{min_down_pct:.0f}% = R$ {min_down:,.0f}."
            )
        if financed <= 0:
            raise ValueError("Valor financiado deve ser maior que zero.")
        if financed > max_financed:
            raise ValueError(
                f"Financiado R$ {financed:,.0f} excede o máximo "
                f"({max_fin_pct:.0f}% = R$ {max_financed:,.0f})."
            )
        if amortization not in bank["amortization_systems"]:
            raise ValueError(
                f"{bank['name']} não suporta {amortization}. "
                f"Disponíveis: {', '.join(bank['amortization_systems'])}."
            )

        # Taxa efetiva = taxa do banco − desconto do programa
        effective_rate = round(
            max(bank["annual_rate"] - float(program["rate_discount_annual"]), 0.01),
            4,
        )

        calc = (
            cls._calculate_sac(financed, effective_rate, years)
            if amortization == "SAC"
            else cls._calculate_price(financed, effective_rate, years)
        )

        return {
            "status":                    "ok",
            "bank_id":                   bank["id"],
            "bank_name":                 bank["name"],
            "program_id":                program["id"],
            "program_name":              program["name"],
            "amortization_system":       amortization,
            "indexer":                   bank["indexers"][0] if bank["indexers"] else "TR",
            "property_value":            property_value,
            "down_payment":              down_payment,
            "financed_value":            financed,
            "max_financing_percent":     max_fin_pct,
            "min_down_payment_percent":  min_down_pct,
            "years":                     years,
            "months":                    years * 12,
            "bank_annual_rate":          bank["annual_rate"],
            "program_discount_annual":   float(program["rate_discount_annual"]),
            "annual_rate":               effective_rate,
            "monthly_payment":           round(calc["monthly_payment"], 2),
            "last_payment":              round(calc["last_payment"], 2),
            "total_paid":                round(calc["total_paid"], 2),
            "total_interest":            round(calc["total_interest"], 2),
            "data_source":               catalog["data_source"],
            "rules_applied": {
                "max_years":                max_years,
                "max_financing_percent":    max_fin_pct,
                "min_down_payment_percent": min_down_pct,
                "max_property_value":       max_prop_value,
                "eligible_banks":           eligible,
            },
        }
