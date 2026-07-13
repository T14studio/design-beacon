import os
import asyncio
import logging
from datetime import datetime, timezone
import httpx
from typing import Dict, Any

# Configuração de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finance_integration")


class BrapiClient:
    """Cliente HTTP robusto para a BRAPI fonte principal de dados."""
    def __init__(self, token: str = None, timeout: float = 8.0, retries: int = 2):
        # A API Key da BRAPI deve ser fornecida (por env var ou instanciamento direto)
        self.token = token or os.getenv("BRAPI_TOKEN")
        self.base_url = "https://brapi.dev/api/v2"
        self.timeout = timeout
        self.retries = retries

    async def _fetch(self, client: httpx.AsyncClient, endpoint: str, params: dict = None) -> dict:
        request_params = params or {}
        if self.token:
            request_params["token"] = self.token

        url = f"{self.base_url}/{endpoint}"
        last_exception = None
        
        for attempt in range(self.retries):
            try:
                response = await client.get(url, params=request_params, timeout=self.timeout)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.warning(f"[BRAPI] Tentativa {attempt+1}/{self.retries} falhou para {url}: {e}")
                last_exception = e
                await asyncio.sleep(1.0 * (attempt + 1))
        
        logger.error(f"[BRAPI] Endpoint {url} falhou após {self.retries} tentativas.")
        raise last_exception


class AwesomeAPIFallbackClient:
    """Cliente HTTP de fallback usando AwesomeAPI para resiliência de cache com timeout otimizado."""
    def __init__(self, timeout: float = 5.0):
        self.base_url = "https://economia.awesomeapi.com.br/json"
        self.timeout = timeout

    async def fetch_currencies(self, client: httpx.AsyncClient, coins: str) -> dict:
        url = f"{self.base_url}/last/{coins}"
        try:
            response = await client.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"[AwesomeAPI Fallback] Falha ao consultar moedas: {e}")
            raise


class FinancialDashboardService:
    """Serviço agregador que normaliza e consolida as métricas financeiras usando BRAPI e Fallbacks."""
    
    def __init__(self):
        self.brapi_client = BrapiClient()
        self.awesome_client = AwesomeAPIFallbackClient()

    def _normalize_brapi_currencies(self, data: dict) -> dict:
        normalized = {}
        currencies = data.get("currency", [])
        for item in currencies:
            from_c = item.get("fromCurrency", "")
            to_c = item.get("toCurrency", "")
            key = f"{from_c}_{to_c}".lower()
            
            # Tenta pegar valor corrente (bid ou ask no modelo original)
            val = item.get("bidPrice")
            if val is None:
               val = item.get("askPrice")
               
            updated_at = item.get("updatedAtDate", "")
            
            if val is not None:
                try:
                    normalized[key] = {
                        "value": float(val),
                        "updated_at": str(updated_at)
                    }
                except (ValueError, TypeError):
                    continue
        return normalized

    def _normalize_awesome_currencies(self, data: dict) -> dict:
        normalized = {}
        for code, item in data.items():
            if code == "USDBRL":
                key = "usd_brl"
            elif code == "EURBRL":
                key = "eur_brl"
            else:
                key = code.lower()
                
            val = item.get("bid")
            updated_at = item.get("create_date", "")
            if val is not None:
                try:
                    normalized[key] = {
                        "value": float(val),
                        "updated_at": str(updated_at)
                    }
                except (ValueError, TypeError):
                    continue
        return normalized

    def _normalize_indicators(self, data: dict, root_key: str) -> dict:
        normalized = {}
        items = data.get(root_key, [])
        for item in items:
            name = str(item.get("name", "")).lower()
            val = item.get("value")
            
            # A data pode vir em date, referenceDate, atualizacao_em
            date = item.get("date") or item.get("referenceDate") or ""
            
            if val is not None and name:
                # Tratamento explícito robusto dos campos requeridos
                key_mapped = None
                if "selic" in name: key_mapped = "selic"
                elif "cdi" in name: key_mapped = "cdi"
                elif "ipca" in name: key_mapped = "ipca"
                elif "tr" in name or "referencial" in name: key_mapped = "tr"
                
                if key_mapped:
                    try:
                        normalized[key_mapped] = {
                            "value": float(val),
                            "date": str(date)
                        }
                    except (ValueError, TypeError):
                        continue
        return normalized

    async def get_dashboard_data(self) -> Dict[str, Any]:
        """Consulta as referências de forma simultânea e consolida o pacote final formatado."""
        
        # Modelo do Payload Padronizado de Saída
        payload = {
            "currencies": {
                "usd_brl": {"value": 0.0, "updated_at": ""},
                "eur_brl": {"value": 0.0, "updated_at": ""}
            },
            "indicators": {
                "selic": {"value": 0.0, "date": ""},
                "cdi": {"value": 0.0, "date": ""},
                "ipca": {"value": 0.0, "date": ""},
                "tr": {"value": 0.0, "date": ""}
            },
            "meta": {
                "source": "brapi",
                "fallback_used": False,
                "success": True,
                "partial_failure": False,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "errors": []
            }
        }

        async with httpx.AsyncClient() as client:
            # 1. Requisições em paralelo (Concorrência Isolada)
            task_currencies = self.brapi_client._fetch(client, "currency", {"currency": "USD-BRL,EUR-BRL"})
            task_prime = self.brapi_client._fetch(client, "prime-rate", {"country": "brazil"})
            task_infl = self.brapi_client._fetch(client, "inflation", {"country": "brazil"})
            
            res_curr, res_prime, res_infl = await asyncio.gather(
                task_currencies, task_prime, task_infl, return_exceptions=True
            )

            # 2. Tratamento Moedas (BRAPI -> Fallback se necessário)
            if isinstance(res_curr, Exception):
                logger.warning(f"BRAPI(currencies) falhou: {res_curr}. Disparando fallback AwesomeAPI...")
                try:
                    awesome_data = await self.awesome_client.fetch_currencies(client, "USD-BRL,EUR-BRL")
                    parsed_currencies = self._normalize_awesome_currencies(awesome_data)
                    
                    for k, v in parsed_currencies.items():
                        if k in payload["currencies"]:
                            payload["currencies"][k] = v
                            
                    payload["meta"]["fallback_used"] = True
                except Exception as eval_err:
                    payload["meta"]["partial_failure"] = True
                    payload["meta"]["errors"].append(f"Moedas (BRAPI + Fallback) falharam: {str(eval_err)}")
            else:
                # Retorno primário processado 
                parsed_currencies = self._normalize_brapi_currencies(res_curr)
                for k in payload["currencies"].keys():
                     if k in parsed_currencies:
                         payload["currencies"][k] = parsed_currencies[k]


            # 3. Tratamento Prime Rate (Selic/CDI)
            if isinstance(res_prime, Exception):
                 payload["meta"]["partial_failure"] = True
                 payload["meta"]["errors"].append(f"Indicadores (Prime Rate) falharam: {str(res_prime)}")
            else:
                 parsed_prime = self._normalize_indicators(res_prime, "prime-rate")
                 for k in ["selic", "cdi"]:
                     if k in parsed_prime:
                         payload["indicators"][k] = parsed_prime[k]


            # 4. Tratamento Inflation (IPCA/TR)
            if isinstance(res_infl, Exception):
                 payload["meta"]["partial_failure"] = True
                 payload["meta"]["errors"].append(f"Indicadores (Inflation) falharam: {str(res_infl)}")
            else:
                 parsed_infl = self._normalize_indicators(res_infl, "inflation")
                 for k in ["ipca", "tr"]:
                     if k in parsed_infl:
                         payload["indicators"][k] = parsed_infl[k]


        # Consolidação de falhas e metadados
        if len(payload["meta"]["errors"]) > 0:
            if len(payload["meta"]["errors"]) == 3: # Falharam todos os blocos do dashboard
                payload["meta"]["success"] = False
                payload["meta"]["partial_failure"] = False

        return payload


# =========================================================================
# INTEGRAÇÃO DE ENDPOINT BACKEND (EXEMPLO DE USO NO FASTAPI/WEB)
# =========================================================================
from fastapi import APIRouter, HTTPException

router = APIRouter()
finance_service = FinancialDashboardService()

@router.get("/api/finance/dashboard/integration")
async def get_financial_dashboard():
    """
    Endpoint Backend de agregador financeiro em tempo real.
    Garante o payload validado ou lança erros corretos.
    """
    try:
        data = await finance_service.get_dashboard_data()
        
        # Um serviço tolerante a falhas pode retornar 200 até quando possui
        # partial_failure=True, permitindo ao frontend renderizar o que deu certo.
        # Nós cortamos 503 apenas quando a falha é estrutural e total:
        if not data["meta"]["success"]:
            raise HTTPException(
                status_code=503, 
                detail={"message": "Indisponibilidade global na esteira de serviços primários", "meta": data["meta"]}
            )
            
        return data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao agregar dashboard: {e}")
        raise HTTPException(status_code=500, detail="Erro interno em integração ao dashboard")
