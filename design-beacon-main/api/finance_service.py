from datetime import datetime
from typing import Dict, Any, List, Optional

import requests


BCB_ODATA_BASE = "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v1/odata"


class FinanceService:
    _INSTITUTION_ALIASES = {
        "caixa": ["CAIXA ECONOMICA FEDERAL", "CAIXA ECONÔMICA FEDERAL"],
        "itau": ["ITAU", "ITAU UNIBANCO", "BANCO ITAU"],
        "bb": ["BANCO DO BRASIL"],
        "bradesco": ["BRADESCO"],
        "santander": ["SANTANDER"],
        "inter": ["BANCO INTER"],
        "nubank": ["NU PAGAMENTOS", "NUBANK"],
        "btg": ["BTG"],
        "sicredi": ["SICREDI"],
        "sicoob": ["SICOOB"],
    }

    _BANK_VISUAL_RULES = {
        "caixa": {"name": "Caixa Econômica Federal", "short_name": "Caixa", "logo": None, "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "itau": {"name": "Itaú Unibanco", "short_name": "Itaú", "logo": None, "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "bb": {"name": "Banco do Brasil", "short_name": "BB", "logo": None, "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "bradesco": {"name": "Bradesco", "short_name": "Bradesco", "logo": None, "max_years": 30, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "santander": {"name": "Santander", "short_name": "Santander", "logo": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg", "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "inter": {"name": "Banco Inter", "short_name": "Inter", "logo": None, "max_years": 35, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "nubank": {"name": "Nubank", "short_name": "Nubank", "logo": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg", "max_years": 35, "max_financing_percent": 75.0, "min_down_payment_percent": 25.0, "amortization_systems": ["SAC"], "indexers": ["TR"], "financing_type": "SFI"},
        "btg": {"name": "BTG Pactual", "short_name": "BTG", "logo": None, "max_years": 30, "max_financing_percent": 70.0, "min_down_payment_percent": 30.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFI"},
        "sicredi": {"name": "Sicredi", "short_name": "Sicredi", "logo": None, "max_years": 30, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
        "sicoob": {"name": "Sicoob", "short_name": "Sicoob", "logo": "https://upload.wikimedia.org/wikipedia/commons/8/80/Sicoob_logo_novo.svg", "max_years": 30, "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "amortization_systems": ["SAC", "PRICE"], "indexers": ["TR"], "financing_type": "SFH / SFI"},
    }

    _PROGRAMS = [
        {"id": "convencional", "name": "Convencional", "description": "Financiamento imobiliário padrão de mercado.", "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "max_years": 35, "rate_discount_annual": 0.0, "applicable_modalities": ["aquisicao_imovel_novo", "aquisicao_imovel_usado", "balcao"]},
        {"id": "mcmv_faixa_1", "name": "Minha Casa Minha Vida - Faixa 1", "description": "Programa habitacional com subsídio e regras de renda específicas.", "max_financing_percent": 90.0, "min_down_payment_percent": 10.0, "max_years": 35, "rate_discount_annual": 1.5, "applicable_modalities": ["aquisicao_imovel_novo", "balcao"]},
        {"id": "mcmv_faixa_2", "name": "Minha Casa Minha Vida - Faixa 2", "description": "Programa habitacional com condições reduzidas para renda intermediária.", "max_financing_percent": 85.0, "min_down_payment_percent": 15.0, "max_years": 35, "rate_discount_annual": 1.0, "applicable_modalities": ["aquisicao_imovel_novo", "aquisicao_imovel_usado", "balcao"]},
        {"id": "mcmv_faixa_3", "name": "Minha Casa Minha Vida - Faixa 3", "description": "Programa com condições próximas ao mercado para renda superior elegível.", "max_financing_percent": 80.0, "min_down_payment_percent": 20.0, "max_years": 35, "rate_discount_annual": 0.5, "applicable_modalities": ["aquisicao_imovel_novo", "aquisicao_imovel_usado", "balcao"]},
    ]
    _BANK_RATE_ADJUSTMENT = {
        "caixa": -0.7,
        "bb": -0.4,
        "itau": 0.2,
        "bradesco": 0.4,
        "santander": 0.3,
        "inter": 0.1,
        "nubank": 0.8,
        "btg": 0.9,
        "sicredi": -0.2,
        "sicoob": -0.1,
    }

    @staticmethod
    def _to_mmddyyyy(date_iso: str) -> str:
        dt = datetime.strptime(date_iso, "%Y-%m-%d")
        return dt.strftime("%m-%d-%Y")

    @classmethod
    def _fetch_latest_period(cls) -> Dict[str, str]:
        url = f"{BCB_ODATA_BASE}/PeriodosDisponiveis?$top=1&$orderby=inicioPeriodo%20desc"
        res = requests.get(url, timeout=20)
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
        res = requests.get(url, params=params, timeout=30)
        res.raise_for_status()
        return res.json().get("value", [])

    @classmethod
    def _extract_bank_rate(cls, bank_id: str, rows: List[Dict[str, Any]]) -> Optional[float]:
        aliases = cls._INSTITUTION_ALIASES.get(bank_id, [])
        filtered: List[float] = []
        for row in rows:
            instituicao = str(row.get("InstituicaoFinanceira", "")).upper()
            segmento = str(row.get("Segmento", "")).upper()
            modalidade = str(row.get("Modalidade", "")).lower()
            taxa_ano = row.get("TaxaJurosAoAno")
            if segmento != "PESSOA FÍSICA":
                continue
            if not isinstance(taxa_ano, (int, float)):
                continue
            if any(alias in instituicao for alias in aliases):
                taxa = float(taxa_ano)
                # Faixa de crédito imobiliário praticável para evitar modalidades não aderentes
                if 4.0 <= taxa <= 25.0 and any(k in modalidade for k in ["aquisição", "aquisicao", "habit", "imobili", "outros bens"]):
                    filtered.append(taxa)
        if not filtered:
            return None
        # Usa o menor valor elegível da instituição para aproximar linha imobiliária de menor risco
        normalized = min(filtered)
        # Normalização para faixa praticável de crédito imobiliário.
        normalized = max(7.0, min(normalized, 16.0))
        return round(normalized, 2)

    @classmethod
    def get_finance_catalog(cls) -> Dict[str, Any]:
        period = cls._fetch_latest_period()
        rows = cls._fetch_rates_by_period(period["inicioPeriodo"])

        banks: List[Dict[str, Any]] = []
        for bank_id, meta in cls._BANK_VISUAL_RULES.items():
            annual_rate = cls._extract_bank_rate(bank_id, rows)
            if annual_rate is None:
                continue
            adjusted_rate = annual_rate + cls._BANK_RATE_ADJUSTMENT.get(bank_id, 0.0)
            adjusted_rate = round(max(7.0, min(adjusted_rate, 16.0)), 2)
            bank = {
                "id": bank_id,
                "name": meta["name"],
                "short_name": meta["short_name"],
                "logo": meta["logo"],
                "annual_rate": adjusted_rate,
                "rate_display": f"{adjusted_rate:.2f}% a.a.",
                "max_years": meta["max_years"],
                "max_financing_percent": meta["max_financing_percent"],
                "min_down_payment_percent": meta["min_down_payment_percent"],
                "amortization_systems": meta["amortization_systems"],
                "indexers": meta["indexers"],
                "financing_type": meta["financing_type"],
                "external_source": "Banco Central do Brasil - Olinda taxaJuros OData",
                "external_period_start": period["inicioPeriodo"],
                "external_period_end": period["fimPeriodo"],
            }
            banks.append(bank)

        return {
            "status": "ok",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "external_source": "Banco Central do Brasil - Olinda taxaJuros OData",
            "period_start": period["inicioPeriodo"],
            "period_end": period["fimPeriodo"],
            "programs": cls._PROGRAMS,
            "banks": banks,
        }

    @staticmethod
    def _calculate_price(principal: float, annual_rate: float, years: int) -> Dict[str, float]:
        n = years * 12
        i = annual_rate / 100 / 12
        if i == 0:
            pmt = principal / n
            return {"monthly_payment": pmt, "last_payment": pmt, "total_paid": principal, "total_interest": 0.0}
        factor = (1 + i) ** n
        pmt = principal * (i * factor) / (factor - 1)
        total_paid = pmt * n
        return {"monthly_payment": pmt, "last_payment": pmt, "total_paid": total_paid, "total_interest": total_paid - principal}

    @staticmethod
    def _calculate_sac(principal: float, annual_rate: float, years: int) -> Dict[str, float]:
        n = years * 12
        i = annual_rate / 100 / 12
        amort = principal / n
        first = amort + principal * i
        last = amort + amort * i
        total_interest = i * principal * (n + 1) / 2
        total_paid = principal + total_interest
        return {"monthly_payment": first, "last_payment": last, "total_paid": total_paid, "total_interest": total_interest}

    @classmethod
    def simulate(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        catalog = cls.get_finance_catalog()
        banks = catalog["banks"]
        programs = catalog["programs"]

        bank = next((b for b in banks if b["id"] == payload["bank_id"]), None)
        if not bank:
            raise ValueError("Banco inválido ou indisponível no catálogo atual.")
        program = next((p for p in programs if p["id"] == payload["program_id"]), None)
        if not program:
            raise ValueError("Programa/modalidade inválido.")

        property_value = float(payload["property_value"])
        down_payment = float(payload["down_payment"])
        years = int(payload["years"])
        amortization = payload["amortization_system"]

        max_years = min(int(bank["max_years"]), int(program["max_years"]))
        max_financing_percent = min(float(bank["max_financing_percent"]), float(program["max_financing_percent"]))
        min_down_percent = max(float(bank["min_down_payment_percent"]), float(program["min_down_payment_percent"]))
        min_down = property_value * (min_down_percent / 100)
        financed = property_value - down_payment
        max_financed = property_value * (max_financing_percent / 100)

        if years > max_years:
            raise ValueError(f"Prazo excede o máximo permitido ({max_years} anos).")
        if down_payment < min_down:
            raise ValueError(f"Entrada mínima para esta combinação é {min_down_percent:.0f}% do imóvel.")
        if financed <= 0:
            raise ValueError("Valor financiado deve ser maior que zero.")
        if financed > max_financed:
            raise ValueError(f"Valor financiado excede o máximo permitido ({max_financing_percent:.0f}% do imóvel).")
        if amortization not in bank["amortization_systems"]:
            raise ValueError("Sistema de amortização não suportado para este banco.")

        effective_rate = max(bank["annual_rate"] - float(program["rate_discount_annual"]), 0.01)
        if amortization == "SAC":
            calc = cls._calculate_sac(financed, effective_rate, years)
        else:
            calc = cls._calculate_price(financed, effective_rate, years)

        return {
            "status": "ok",
            "bank_id": bank["id"],
            "program_id": program["id"],
            "amortization_system": amortization,
            "indexer": bank["indexers"][0] if bank["indexers"] else "TR",
            "property_value": property_value,
            "down_payment": down_payment,
            "financed_value": financed,
            "max_financing_percent": max_financing_percent,
            "min_down_payment_percent": min_down_percent,
            "years": years,
            "months": years * 12,
            "annual_rate": effective_rate,
            "monthly_payment": round(calc["monthly_payment"], 2),
            "last_payment": round(calc["last_payment"], 2),
            "total_paid": round(calc["total_paid"], 2),
            "total_interest": round(calc["total_interest"], 2),
            "catalog_period_start": catalog["period_start"],
            "catalog_period_end": catalog["period_end"],
            "external_source": catalog["external_source"],
            "internal_rules_applied": {
                "program_discount_annual": float(program["rate_discount_annual"]),
                "max_years": max_years,
                "max_financing_percent": max_financing_percent,
                "min_down_payment_percent": min_down_percent,
            },
        }
