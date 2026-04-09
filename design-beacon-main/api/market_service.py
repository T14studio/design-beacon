from datetime import datetime
from typing import Dict, Any, List

import requests


class MarketService:
    _BCB_SERIES = {
        "selic": {"code": "432", "label": "Selic", "symbol": "%", "description": "Taxa básica de juros (meta Selic)."},
        "ipca": {"code": "13522", "label": "IPCA", "symbol": "%", "description": "Inflação acumulada em 12 meses (IPCA)."},
        "tr": {"code": "226", "label": "TR", "symbol": "%", "description": "Taxa Referencial (indexador imobiliário)."},
        "cdi": {"code": "4389", "label": "CDI", "symbol": "%", "description": "Taxa CDI anualizada."},
    }

    @staticmethod
    def _fetch_fx() -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        url = "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL"
        res = requests.get(url, timeout=20)
        res.raise_for_status()
        data = res.json()

        for pair, label, symbol in [("USDBRL", "Dólar", "USD"), ("EURBRL", "Euro", "EUR")]:
            item = data.get(pair)
            if not item:
                continue
            bid = float(item["bid"])
            pct = float(item["pctChange"])
            out.append({
                "id": "usd" if pair == "USDBRL" else "eur",
                "label": label,
                "symbol": symbol,
                "value": f"R$ {bid:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                "numeric_value": bid,
                "change": f"{pct:+.2f}%",
                "up": pct >= 0,
                "data_source": "AwesomeAPI",
                "external_timestamp": item.get("create_date"),
                "description": f"Cotação de {label.lower()} comercial (compra).",
                "is_live": True,
            })
        return out

    @classmethod
    def _fetch_bcb(cls) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for indicator_id, meta in cls._BCB_SERIES.items():
            url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{meta['code']}/dados/ultimos/1?formato=json"
            res = requests.get(url, timeout=20)
            res.raise_for_status()
            data = res.json()
            if not isinstance(data, list) or not data:
                continue
            row = data[-1]
            value = float(str(row.get("valor", "0")).replace(",", "."))
            out.append({
                "id": indicator_id,
                "label": meta["label"],
                "symbol": meta["symbol"],
                "value": f"{value:.2f}%",
                "numeric_value": value,
                "change": "0,00%",
                "up": True,
                "data_source": "Banco Central do Brasil (SGS)",
                "external_timestamp": row.get("data"),
                "description": meta["description"],
                "is_live": True,
            })
        return out

    @classmethod
    def get_indicators(cls) -> Dict[str, Any]:
        fx = cls._fetch_fx()
        bcb = cls._fetch_bcb()
        merged = fx + bcb
        return {
            "status": "ok",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "indicators": merged,
            "sources": [
                "AwesomeAPI (câmbio)",
                "Banco Central do Brasil - SGS (Selic, IPCA, TR, CDI)",
            ],
        }
