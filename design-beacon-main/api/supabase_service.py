import os
import requests
import uuid
from typing import List, Dict, Any, Optional

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

class SupabaseService:
    @staticmethod
    def get_or_create_customer(browser_user_id: str, channel: str = "website") -> dict:
        if not SUPABASE_URL or not SUPABASE_KEY: return {"id": "mock-customer-id"}
        try:
            url = f"{SUPABASE_URL}/rest/v1/customers?browser_user_id=eq.{browser_user_id}"
            res = requests.get(url, headers=get_headers())
            data = res.json()
            if data and len(data) > 0:
                return data[0]
            
            # create
            post_url = f"{SUPABASE_URL}/rest/v1/customers"
            new_customer = {"browser_user_id": browser_user_id, "channel": channel}
            res = requests.post(post_url, headers=get_headers(), json=new_customer)
            data = res.json()
            return data[0] if data and len(data) > 0 else {"id": browser_user_id}
        except Exception as e:
            print(f"Error customer: {e}")
            return {"id": browser_user_id}

    @staticmethod
    def get_or_create_session(session_id: Optional[str], customer_id: str, property_code: Optional[str] = None) -> dict:
        if not SUPABASE_URL: return {"id": session_id or str(uuid.uuid4()), "current_state": "recepcao"}
        try:
            if session_id:
                # SECURITY: Always filter by customer_id to prevent session hijacking
                url = f"{SUPABASE_URL}/rest/v1/sessions?id=eq.{session_id}&customer_id=eq.{customer_id}"
                res = requests.get(url, headers=get_headers())
                data = res.json()
                if data and len(data) > 0:
                    existing = data[0]
                    # If property_code is provided and different, update it
                    if property_code and existing.get("property_id") != property_code:
                        patch_url = f"{SUPABASE_URL}/rest/v1/sessions?id=eq.{session_id}"
                        requests.patch(patch_url, headers=get_headers(), json={"property_id": property_code})
                        existing["property_id"] = property_code
                    return existing
            
            new_session_id = session_id or str(uuid.uuid4())
            new_session = {
                "id": new_session_id,
                "customer_id": customer_id,
                "current_state": "recepcao",
                "property_id": property_code
            }
            post_url = f"{SUPABASE_URL}/rest/v1/sessions"
            res = requests.post(post_url, headers=get_headers(), json=new_session)
            data = res.json()
            return data[0] if data and len(data) > 0 else new_session
        except Exception as e:
            print(f"Error session: {e}")
            return {"id": session_id or str(uuid.uuid4()), "current_state": "recepcao", "property_id": property_code}

    @staticmethod
    def update_session_state(session_id: str, new_state: str):
        """Atualiza apenas o current_state (para compatibilidade legada)."""
        if not SUPABASE_URL: return
        try:
            url = f"{SUPABASE_URL}/rest/v1/sessions?id=eq.{session_id}"
            requests.patch(url, headers=get_headers(), json={"current_state": new_state})
        except:
            pass

    @staticmethod
    def update_session_full_state(session_id: str, ai_result: dict, current_state: str):
        """
        Persiste o estado completo da sessão após cada turno.
        Tenta gravar campos expandidos; se a tabela não tiver as colunas novas,
        faz fallback salvando apenas current_state + metadata JSON (sempre funciona).
        """
        if not SUPABASE_URL: return
        try:
            new_state = ai_result.get("etapa_da_conversa", current_state)

            # Build full patch (columns may or may not exist in DB)
            full_patch = {"current_state": new_state}

            # Accumulated state as JSON blob — works even without extra columns
            accumulated = {}
            if ai_result.get("nome_cliente"):
                accumulated["nome_cliente"] = ai_result["nome_cliente"]
            if ai_result.get("setor_destino"):
                accumulated["setor_provavel"] = ai_result["setor_destino"]
            if ai_result.get("imovel_ou_contrato_relacionado"):
                accumulated["imovel_ref"] = ai_result["imovel_ou_contrato_relacionado"]
            if ai_result.get("intencao_principal"):
                accumulated["objetivo_atual"] = ai_result["intencao_principal"]
            if ai_result.get("proxima_acao"):
                accumulated["proxima_acao"] = ai_result["proxima_acao"]
            if ai_result.get("estagio_da_jornada") and ai_result["estagio_da_jornada"] != "nao_identificado":
                accumulated["estagio_jornada"] = ai_result["estagio_da_jornada"]

            # Try to write extended columns + metadata
            extended_patch = dict(full_patch)
            for k, v in accumulated.items():
                extended_patch[k] = v
            # Also store in metadata blob as fallback for missing columns
            if accumulated:
                extended_patch["metadata"] = accumulated

            url = f"{SUPABASE_URL}/rest/v1/sessions?id=eq.{session_id}"
            res = requests.patch(url, headers=get_headers(), json=extended_patch)

            if res.status_code not in (200, 204):
                # Fallback: just update current_state + metadata
                fallback_patch = {"current_state": new_state}
                if accumulated:
                    fallback_patch["metadata"] = accumulated
                res2 = requests.patch(url, headers=get_headers(), json=fallback_patch)
                if res2.status_code not in (200, 204):
                    # Last resort: only current_state
                    requests.patch(url, headers=get_headers(), json={"current_state": new_state})
        except Exception as e:
            print(f"Error update_session_full_state: {e}")

    @staticmethod
    def get_messages(session_id: str, limit: int = 20) -> List[dict]:
        if not SUPABASE_URL: return []
        try:
            url = f"{SUPABASE_URL}/rest/v1/messages?session_id=eq.{session_id}&order=created_at.desc&limit={limit}"
            res = requests.get(url, headers=get_headers())
            return res.json()[::-1] if res.status_code == 200 else []
        except:
            return []

    @staticmethod
    def save_message(session_id: str, role: str, content: str, metadata: dict = None):
        if not SUPABASE_URL: return
        msg = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "metadata": metadata or {}
        }
        try:
            url = f"{SUPABASE_URL}/rest/v1/messages"
            requests.post(url, headers=get_headers(), json=msg)
        except Exception as e:
            print(f"Error save msg: {e}")

    @staticmethod
    def get_property(property_id: str) -> Optional[dict]:
        if not SUPABASE_URL or not property_id: return None
        try:
            # Try by code/ref first (slug or ref field), then by id
            url = f"{SUPABASE_URL}/rest/v1/properties?code=eq.{property_id}"
            res = requests.get(url, headers=get_headers())
            data = res.json()
            if data and len(data) > 0: return data[0]
            # fallback by id
            url2 = f"{SUPABASE_URL}/rest/v1/properties?id=eq.{property_id}"
            res2 = requests.get(url2, headers=get_headers())
            data2 = res2.json()
            if data2 and len(data2) > 0: return data2[0]
            return None
        except:
            return None

    @staticmethod
    def create_handoff_ticket(session_id: str, ticket_data: dict):
        if not SUPABASE_URL: return
        try:
            url = f"{SUPABASE_URL}/rest/v1/handoff_tickets"
            requests.post(url, headers=get_headers(), json={
                "session_id": session_id,
                "status": "aberto",
                "setor_destino": ticket_data.get("setor_destino"),
                "prioridade": ticket_data.get("prioridade", "normal"),
                "resumo_do_caso": ticket_data.get("resumo_do_caso"),
                "metadata": ticket_data
            })
        except Exception as e:
            print(f"Error handoff: {e}")

    @staticmethod
    def search_contracts_by_document(document: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Busca contratos por CPF/CNPJ para a Área do Cliente.
        Observação: o schema real pode variar; tentamos campos comuns sem quebrar.
        Esperado: tabela `contracts` com algum dos campos: cpf, cnpj, cpf_cnpj, documento.
        """
        # Modo de teste: permite validação ponta-a-ponta sem Supabase real (NUNCA usar em produção)
        if os.getenv("AXIS_ENV") == "test":
            doc = "".join([c for c in (document or "") if c.isdigit()])
            if doc in ("11111111111", "22222222222222"):
                return [{
                    "id": "test-contract-001",
                    "contract_number": "CT-TEST-001",
                    "pdf_url": "http://127.0.0.1:8020/client-area/contracts/test/test-contract-001/pdf",
                    "pdf_path": None,
                    "created_at": None,
                }]
            return []
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        if not document:
            return []

        doc = "".join([c for c in document if c.isdigit()])
        if len(doc) not in (11, 14):
            return []

        try:
            select = "id,contract_number,numero_contrato,cpf,cnpj,cpf_cnpj,documento,pdf_url,pdf_path,created_at"
            # PostgREST OR filter: https://postgrest.org/en/stable/references/api/tables_views.html#or
            url = (
                f"{SUPABASE_URL}/rest/v1/contracts"
                f"?select={select}"
                f"&or=(cpf.eq.{doc},cnpj.eq.{doc},cpf_cnpj.eq.{doc},documento.eq.{doc})"
                f"&order=created_at.desc"
                f"&limit={limit}"
            )
            res = requests.get(url, headers=get_headers())
            if res.status_code != 200:
                return []
            data = res.json()
            if not isinstance(data, list):
                return []

            normalized: List[Dict[str, Any]] = []
            for row in data:
                contract_number = row.get("contract_number") or row.get("numero_contrato") or row.get("id")
                pdf_url = row.get("pdf_url")
                pdf_path = row.get("pdf_path")
                normalized.append({
                    "id": row.get("id"),
                    "contract_number": contract_number,
                    "pdf_url": pdf_url,
                    "pdf_path": pdf_path,
                    "created_at": row.get("created_at"),
                })
            return normalized
        except Exception as e:
            print(f"Error search_contracts_by_document: {e}")
            return []
