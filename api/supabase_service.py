import os
import requests
import uuid
import re
from typing import List, Dict, Any, Optional

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


def _safe_param(value: str) -> str:
    """
    Sanitiza valores controlados pelo cliente antes de inseri-los em
    parâmetros de URL da API REST do Supabase.
    Mantém apenas caracteres alfanuméricos, hífens e underscores.
    Isto previne injeção de parâmetros (ex: browser_user_id=eq.X&select=*).
    """
    return re.sub(r"[^a-zA-Z0-9\-_]", "", str(value or ""))[:256]


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
            safe_uid = _safe_param(browser_user_id)
            url = f"{SUPABASE_URL}/rest/v1/customers?browser_user_id=eq.{safe_uid}"
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
                safe_sid = _safe_param(session_id)
                safe_cid = _safe_param(customer_id)
                # SECURITY: Always filter by customer_id to prevent session hijacking
                url = f"{SUPABASE_URL}/rest/v1/sessions?id=eq.{safe_sid}&customer_id=eq.{safe_cid}"
                res = requests.get(url, headers=get_headers())
                data = res.json()
                if data and len(data) > 0:
                    existing = data[0]
                    if property_code and existing.get("property_id") != property_code:
                        safe_sid2 = _safe_param(session_id)
                        patch_url = f"{SUPABASE_URL}/rest/v1/sessions?id=eq.{safe_sid2}"
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

            # Use accumulated state sent from main.py via _accumulated_merge to preserve memory entirely
            accumulated = ai_result.get("_accumulated_merge") or {}
            
            if not accumulated:
                # Fallback backward-compatibility just in case
                if ai_result.get("nome_cliente"): accumulated["nome_cliente"] = ai_result["nome_cliente"]
                if ai_result.get("setor_destino"): accumulated["setor_provavel"] = ai_result["setor_destino"]
                if ai_result.get("imovel_ou_contrato_relacionado"): accumulated["imovel_ref"] = ai_result["imovel_ou_contrato_relacionado"]
                if ai_result.get("intencao_principal"): accumulated["objetivo_atual"] = ai_result["intencao_principal"]
                if ai_result.get("proxima_acao"): accumulated["proxima_acao"] = ai_result["proxima_acao"]
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
            safe_pid = _safe_param(property_id)
            # Try by code/ref first (slug or ref field), then by id
            url = f"{SUPABASE_URL}/rest/v1/properties?code=eq.{safe_pid}"
            res = requests.get(url, headers=get_headers())
            data = res.json()
            if data and len(data) > 0: return data[0]
            # fallback by id
            url2 = f"{SUPABASE_URL}/rest/v1/properties?id=eq.{safe_pid}"
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
        Esperado: tabela `contracts` com algum dos campos: cpf, cnpj, cpf_cnpj, documento.
        Campos de PDF: pdf_url e/ou pdf_path.
        """
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        if not document:
            return []

        doc = "".join([c for c in document if c.isdigit()])
        if len(doc) not in (11, 14):
            return []

        try:
            # SECURITY: doc já é sanitizado (apenas dígitos), seguro para URL
            url = (
                f"{SUPABASE_URL}/rest/v1/contracts"
                f"?select=*"
                f"&or=(cpf.eq.{doc},cnpj.eq.{doc},cpf_cnpj.eq.{doc},documento.eq.{doc})"
                f"&order=created_at.desc"
                f"&limit={min(int(limit), 10)}"
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
                normalized.append({
                    "id": row.get("id"),
                    "contract_number": contract_number,
                    "pdf_url": row.get("pdf_url"),
                    "pdf_path": row.get("pdf_path"),
                    "created_at": row.get("created_at"),
                })
            return normalized
        except Exception as e:
            print(f"Error search_contracts_by_document: {e}")
            return []

    # ═══════════════════════════════════════════════════════════════
    # WHATSAPP CHANNEL — Persistência de Contatos e Mensagens
    # ═══════════════════════════════════════════════════════════════

    @staticmethod
    def get_or_create_whatsapp_contact(telefone: str, nome: Optional[str] = None) -> dict:
        """
        Localiza ou cria um contato WhatsApp pelo telefone normalizado.
        Atualiza nome se fornecido e diferente do armazenado.
        Retorna o registro completo do contato.
        """
        if not SUPABASE_URL or not SUPABASE_KEY:
            import uuid as _uuid
            return {"id": str(_uuid.uuid4()), "telefone": telefone, "nome": nome, "canal": "whatsapp"}
        try:
            safe_tel = _safe_param(telefone)
            url = f"{SUPABASE_URL}/rest/v1/whatsapp_contacts?telefone=eq.{safe_tel}&limit=1"
            res = requests.get(url, headers=get_headers())
            if res.status_code == 200:
                data = res.json()
                if data and len(data) > 0:
                    contact = data[0]
                    # Atualiza nome se novo e diferente
                    if nome and contact.get("nome") != nome:
                        patch_url = f"{SUPABASE_URL}/rest/v1/whatsapp_contacts?telefone=eq.{safe_tel}"
                        requests.patch(patch_url, headers=get_headers(), json={"nome": nome, "ultimo_contato": "now()"})
                        contact["nome"] = nome
                    else:
                        # Atualiza timestamp de último contato
                        patch_url = f"{SUPABASE_URL}/rest/v1/whatsapp_contacts?telefone=eq.{safe_tel}"
                        requests.patch(patch_url, headers=get_headers(), json={"ultimo_contato": "now()"})
                    return contact

            # Criar novo contato
            new_contact = {
                "telefone": telefone,
                "nome": nome or "",
                "canal": "whatsapp",
                "status_lead": "novo",
                "origem": "whatsapp_inbound",
                "prioridade": "normal",
                "handoff_humano": False,
            }
            post_url = f"{SUPABASE_URL}/rest/v1/whatsapp_contacts"
            res2 = requests.post(post_url, headers=get_headers(), json=new_contact)
            if res2.status_code in (200, 201):
                created = res2.json()
                return created[0] if isinstance(created, list) and created else new_contact
            return new_contact
        except Exception as e:
            print(f"[WA] Error get_or_create_whatsapp_contact: {type(e).__name__}")
            return {"telefone": telefone, "nome": nome, "canal": "whatsapp"}

    @staticmethod
    def save_whatsapp_message(
        contact_id: Optional[str],
        session_id: Optional[str],
        direction: str,
        tipo: str,
        conteudo: str,
        message_id: Optional[str] = None,
        media_url: Optional[str] = None,
        media_filename: Optional[str] = None,
        timestamp_origem: Optional[str] = None,
        raw_payload: Optional[dict] = None,
    ) -> Optional[dict]:
        """
        Persiste uma mensagem do canal WhatsApp na tabela whatsapp_messages.
        raw_payload é armazenado sem credenciais — apenas dados da mensagem.
        """
        if not SUPABASE_URL or not SUPABASE_KEY:
            return None
        try:
            msg = {
                "contact_id": contact_id,
                "session_id": session_id,
                "direction": direction,  # inbound | outbound
                "tipo": tipo,
                "conteudo": conteudo or "",
                "message_id": message_id,
                "media_url": media_url,
                "media_filename": media_filename,
                "timestamp_origem": timestamp_origem,
                "raw_payload": raw_payload or {},
            }
            url = f"{SUPABASE_URL}/rest/v1/whatsapp_messages"
            res = requests.post(url, headers=get_headers(), json=msg)
            if res.status_code in (200, 201):
                data = res.json()
                return data[0] if isinstance(data, list) and data else msg
            return msg
        except Exception as e:
            print(f"[WA] Error save_whatsapp_message: {type(e).__name__}")
            return None

    @staticmethod
    def update_whatsapp_contact_context(
        telefone: str,
        session_id: Optional[str] = None,
        setor: Optional[str] = None,
        prioridade: Optional[str] = None,
        status_lead: Optional[str] = None,
        resumo_contexto: Optional[str] = None,
    ):
        """
        Atualiza campos de contexto do contato WhatsApp após processamento da Axis.
        """
        if not SUPABASE_URL or not SUPABASE_KEY:
            return
        try:
            patch = {}
            if session_id:       patch["session_id"] = session_id
            if setor:            patch["setor"] = setor
            if prioridade:       patch["prioridade"] = prioridade
            if status_lead:      patch["status_lead"] = status_lead
            if resumo_contexto:  patch["resumo_contexto"] = resumo_contexto
            if not patch:
                return
            safe_tel = _safe_param(telefone)
            url = f"{SUPABASE_URL}/rest/v1/whatsapp_contacts?telefone=eq.{safe_tel}"
            requests.patch(url, headers=get_headers(), json=patch)
        except Exception as e:
            print(f"[WA] Error update_whatsapp_contact_context: {type(e).__name__}")

    @staticmethod
    def trigger_whatsapp_handoff(
        telefone: str,
        setor_destino: str,
        motivo: Optional[str] = None,
    ):
        """
        Marca o contato WhatsApp como em handoff humano.
        Registra setor destino, motivo e timestamp.
        """
        if not SUPABASE_URL or not SUPABASE_KEY:
            return
        try:
            import datetime
            safe_tel = _safe_param(telefone)
            patch = {
                "handoff_humano": True,
                "handoff_setor": setor_destino,
                "handoff_motivo": motivo or "Solicitado pela Axis",
                "handoff_em": datetime.datetime.utcnow().isoformat() + "Z",
            }
            url = f"{SUPABASE_URL}/rest/v1/whatsapp_contacts?telefone=eq.{safe_tel}"
            requests.patch(url, headers=get_headers(), json=patch)
        except Exception as e:
            print(f"[WA] Error trigger_whatsapp_handoff: {type(e).__name__}")

    @staticmethod
    def get_whatsapp_history(telefone: str, limit: int = 15) -> List[dict]:
        """
        Retorna histórico recente de mensagens WhatsApp de um contato, em ordem cronológica.
        Usado para alimentar contexto da Axis.
        """
        if not SUPABASE_URL or not SUPABASE_KEY:
            return []
        try:
            safe_tel = _safe_param(telefone)
            # Primeiro localiza o contact_id
            contact_url = f"{SUPABASE_URL}/rest/v1/whatsapp_contacts?telefone=eq.{safe_tel}&select=id&limit=1"
            res = requests.get(contact_url, headers=get_headers())
            if res.status_code != 200:
                return []
            contacts = res.json()
            if not contacts:
                return []
            contact_id = contacts[0].get("id")
            if not contact_id:
                return []

            # Busca mensagens do contato em ordem cronológica
            safe_cid = _safe_param(contact_id)
            msg_url = (
                f"{SUPABASE_URL}/rest/v1/whatsapp_messages"
                f"?contact_id=eq.{safe_cid}"
                f"&order=created_at.desc"
                f"&limit={min(int(limit), 30)}"
            )
            res2 = requests.get(msg_url, headers=get_headers())
            if res2.status_code == 200:
                messages = res2.json()
                return messages[::-1]  # Retorna em ordem cronológica crescente
            return []
        except Exception as e:
            print(f"[WA] Error get_whatsapp_history: {type(e).__name__}")
            return []
