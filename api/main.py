import sys
import os
from pathlib import Path

# Adiciona o diretório atual ao sys.path para garantir que imports locais funcionem no Render
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv
load_dotenv()

from supabase_service import SupabaseService
from openai_service import OpenAIService
from security import check_rate_limit 
from fastapi import Request 
import re

app = FastAPI(title="Axis Backend", version="1.0.1")

cors_origins_raw = os.getenv("CORS_ORIGIN", "*")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Axis Backend API is running", "endpoints": ["/health", "/axis/turn"]}

@app.get("/health")
def health_check():
    return {"status": "up", "api": "Axis Backend", "version": "1.0.0"}

class TurnPayload(BaseModel):
    channel: str = Field(default="website")
    browser_user_id: str = Field(...)
    phone: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    message: str = Field(...)
    session_id: Optional[str] = Field(default=None)
    optional_context: Optional[Dict[str, Any]] = Field(default=None)
    property_code: Optional[str] = Field(default=None)

class TurnResponse(BaseModel):
    status: str = Field(...)
    session_id: str = Field(...)
    reply: str = Field(...)
    current_state: str = Field(...)
    handoff_triggered: bool = Field(...)
    setor_destino: Optional[str] = Field(default=None)
    prioridade: Optional[str] = Field(default=None)
    property_id: Optional[str] = Field(default=None)
    sugestoes_de_cta: Optional[List[str]] = Field(default=None)
    nome_cliente: Optional[str] = Field(default=None)

def _infer_name_from_message(message: str) -> Optional[str]:
    if not message:
        return None
    text = message.strip()
    if len(text) < 2 or len(text) > 40:
        return None

    lowered = re.sub(r"\s+", " ", text.lower())
    if lowered in {
        "oi", "olá", "ola", "bom dia", "boa tarde", "boa noite",
        "eai", "e aí", "opa", "tudo bem", "tudo bem?", "oii", "oiii"
    }:
        return None

    m = re.search(r"\b(meu nome (é|eh)|me chamo|sou)\s+([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'\- ]{1,30})\b", text, re.IGNORECASE)
    if m:
        name = re.sub(r"\s{2,}", " ", m.group(3).strip())
        return name[:1].upper() + name[1:]

    if re.fullmatch(r"[A-Za-zÀ-ÖØ-öø-ÿ]{2,20}(\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,20})?", text):
        parts = text.split()
        return " ".join([p[:1].upper() + p[1:].lower() for p in parts])

    return None

def _route_department_from_message(message: str) -> Optional[str]:
    m = (message or "").lower()
    financeiro = ["boleto", "2ª via", "2a via", "segunda via", "comprovante", "pagamento", "vencimento", "multa", "juros", "cobran", "atraso", "repasse", "extrato"]
    administrativo = ["documenta", "contrato", "análise cadastral", "analise cadastral", "assinatura", "vistoria", "manuten", "vazamento", "renova", "rescind", "rescis", "seguro", "fiança", "fianca", "fechamento de locação", "fechamento de locacao"]
    comercial = ["comprar", "compra", "alugar", "loca", "visita", "agendar", "proposta", "financ", "simula", "vender", "anunciar", "avali", "interesse"]

    if any(k in m for k in financeiro):
        return "financeiro"
    if any(k in m for k in administrativo):
        return "administrativo"
    if any(k in m for k in comercial):
        return "comercial"
    return None

class ClientContractsSearchPayload(BaseModel):
    document: str = Field(..., description="CPF ou CNPJ do cliente (com ou sem máscara).")

class ClientContract(BaseModel):
    id: str = Field(...)
    contract_number: str = Field(...)
    pdf_url: Optional[str] = Field(default=None)
    pdf_path: Optional[str] = Field(default=None)
    created_at: Optional[str] = Field(default=None)

class ClientContractsSearchResponse(BaseModel):
    status: str = Field(...)
    contracts: List[ClientContract] = Field(default_factory=list)

@app.post("/client-area/contracts/search", response_model=ClientContractsSearchResponse)
async def client_area_contracts_search(payload: ClientContractsSearchPayload):
    try:
        contracts = SupabaseService.search_contracts_by_document(payload.document, limit=20)
        sanitized = []
        for c in contracts:
            if not c.get("id") or not c.get("contract_number"):
                continue
            sanitized.append(c)
        return ClientContractsSearchResponse(status="ok", contracts=sanitized)
    except Exception as e:
        print(f"CRITICAL ERROR in client_area_contracts_search: {e}")
        return ClientContractsSearchResponse(status="error", contracts=[])
    
@app.post("/axis/turn", response_model=TurnResponse)
async def handle_turn(payload: TurnPayload, request: Request):
    try:
        # ── 0. Rate Limiting Security Check ──────────────────────────────────────
        # Proteção contra abuse/spam via IP e Browser User ID
        client_ip = request.client.host if request.client else "unknown"
        is_limited, limit_msg, retry_after = check_rate_limit(client_ip, payload.browser_user_id)
        
        if is_limited:
            return TurnResponse(
                status="rate_limited",
                session_id=payload.session_id or "limited",
                reply=f"{limit_msg} Por favor, tente novamente em {retry_after} segundos para evitar gastos excessivos da API.",
                current_state="recepcao",
                handoff_triggered=False,
                setor_destino=None,
                prioridade="normal",
                property_id=payload.property_code
            )

        # ── 1. Get or Create Customer ────────────────────────────────────────────
        customer = SupabaseService.get_or_create_customer(
            browser_user_id=payload.browser_user_id,
            channel=payload.channel
        )
        customer_id = customer.get("id", payload.browser_user_id)

        # ── 2. Get or Create Session ─────────────────────────────────────────────
        session = SupabaseService.get_or_create_session(
            session_id=payload.session_id,
            customer_id=customer_id,
            property_code=payload.property_code
        )
        session_id = session.get("id")
        current_state = session.get("current_state", "recepcao")

        # ── 3. Build Accumulated Session State (full state tracking) ─────────────
        session_meta = session.get("metadata") or {}
        if isinstance(session_meta, str):
            import json as _json
            try: session_meta = _json.loads(session_meta)
            except: session_meta = {}

        accumulated_state = {
            "nome_cliente":    session.get("nome_cliente")   or session_meta.get("nome_cliente"),
            "objetivo_atual":  session.get("objetivo_atual") or session_meta.get("objetivo_atual"),
            "setor_provavel":  session.get("setor_provavel") or session_meta.get("setor_provavel"),
            "imovel_ref":      session.get("imovel_ref")     or session_meta.get("imovel_ref") or session.get("property_id"),
            "estagio_jornada": session.get("estagio_jornada") or session_meta.get("estagio_jornada"),
            "proxima_acao":    session.get("proxima_acao")   or session_meta.get("proxima_acao"),
        }

        # ── 4. Handle Property Context ───────────────────────────────────────────
        property_id = payload.property_code or accumulated_state["imovel_ref"]
        contexto_imovel = dict(payload.optional_context or {})
        
        if property_id and not contexto_imovel.get("property_title"):
            db_prop = SupabaseService.get_property(property_id)
            if db_prop:
                contexto_imovel.update({
                    "property_id":    property_id,
                    "property_title": db_prop.get("title") or db_prop.get("titulo"),
                    "address":        db_prop.get("address") or db_prop.get("endereco"),
                    "price":          db_prop.get("price") or db_prop.get("preco"),
                    "tipo":           db_prop.get("type") or db_prop.get("tipo"),
                })
            elif property_id:
                contexto_imovel["property_id"] = property_id

        # ── 5. Fetch Recent History ──────────────────────────────────────────────
        history_records = SupabaseService.get_messages(session_id, limit=15)
        history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in history_records
            if msg["role"] in ("user", "assistant")
        ]

        # ── 6. Build dados_coletados ─────────────────────────────────────────────
        last_assistant_meta = {}
        nome_from_history = None
        imovel_from_history = None

        for msg in reversed(history_records):
            if msg["role"] == "assistant" and msg.get("metadata"):
                meta = msg["metadata"]
                if not last_assistant_meta:
                    last_assistant_meta = meta
                if meta.get("nome_cliente") and not nome_from_history:
                    nome_from_history = meta["nome_cliente"]
                if meta.get("imovel_ou_contrato_relacionado") and not imovel_from_history:
                    imovel_from_history = meta["imovel_ou_contrato_relacionado"]

        dados_coletados = {}
        if nome_from_history:
            dados_coletados["name"] = nome_from_history
        if imovel_from_history and not accumulated_state.get("imovel_ref"):
            accumulated_state["imovel_ref"] = imovel_from_history
        if accumulated_state.get("nome_cliente"):
            dados_coletados["name"] = accumulated_state["nome_cliente"]
        if payload.name:
            dados_coletados["name"] = payload.name
        if payload.phone:
            dados_coletados["phone"] = payload.phone
        if not dados_coletados.get("name"):
            inferred_name = _infer_name_from_message(payload.message)
            if inferred_name:
                dados_coletados["name"] = inferred_name

        # ── 7. Save incoming user message ───────────────────────────────────────
        SupabaseService.save_message(session_id, "user", payload.message)

        # ── 8. Build full context object for OpenAI ──────────────────────────────
        context = {
            "current_state":    current_state,
            "contexto_imovel":  contexto_imovel,
            "dados_coletados":  dados_coletados,
            "estado_anterior":  last_assistant_meta,
            "sessao_acumulada": accumulated_state,
        }
        
        # ── 9. Call OpenAI ────────────────────────────────────────────────────────
        print(f"[AXIS] session={session_id} state={current_state} property={property_id} nome={dados_coletados.get('name')} msg={payload.message[:60]}")
        ai_result = await OpenAIService.process_turn(payload.message, history, context)

        # ── 10. Process output ────────────────────────────────────────────────────
        reply         = ai_result.get("message_to_user", "Desculpe, não consegui processar.")
        new_state     = ai_result.get("etapa_da_conversa", current_state)
        handed_off    = ai_result.get("handoff_recomendado", False)
        setor_destino = ai_result.get("setor_destino")
        prioridade    = ai_result.get("prioridade", "normal")
        sugestoes_cta = ai_result.get("sugestoes_de_cta") or []

        # Hard guarantee: se estiver em página de imóvel, materializar título/ref no texto
        try:
            ptitle = (contexto_imovel or {}).get("property_title")
            pref = (contexto_imovel or {}).get("property_id") or property_id
            if ptitle and ptitle not in reply:
                prefix = f'Vi que você está olhando o imóvel "{ptitle}"'
                if pref and pref != ptitle:
                    prefix += f" (ref. {pref})"
                prefix += ". "
                reply = prefix + reply
        except Exception:
            pass

        if dados_coletados.get("name") and not ai_result.get("nome_cliente"):
            ai_result["nome_cliente"] = dados_coletados["name"]

        if not setor_destino:
            routed = _route_department_from_message(payload.message)
            if routed:
                setor_destino = routed
                ai_result["setor_destino"] = routed
                if routed == "administrativo" and any(k in (payload.message or "").lower() for k in ["urgente", "vazamento", "sem luz", "curto", "inund"]):
                    ai_result["prioridade"] = "alta"
                    prioridade = "alta"
                if not sugestoes_cta:
                    if routed == "financeiro":
                        sugestoes_cta = ["Solicitar segunda via", "Enviar comprovante", "Consultar repasse", "Falar com financeiro"]
                    elif routed == "administrativo":
                        sugestoes_cta = ["Enviar documentos", "Descrever problema", "Acompanhar manutenção", "Falar com administrativo"]
                    elif routed == "comercial":
                        sugestoes_cta = ["Agendar visita", "Fazer simulação", "Falar com especialista"]
                    ai_result["sugestoes_de_cta"] = sugestoes_cta
        
        # ── 11. Save outgoing assistant message ───────────────────────────────────
        SupabaseService.save_message(session_id, "assistant", reply, metadata=ai_result)

        # ── 12. Persist full session state ────────────────────────────────────────
        SupabaseService.update_session_full_state(session_id, ai_result, current_state)

        # ── 13. Create handoff ticket if needed ───────────────────────────────────
        if handed_off:
            SupabaseService.create_handoff_ticket(session_id, ai_result)

        return TurnResponse(
            status="ok",
            session_id=session_id,
            reply=reply,
            current_state=new_state,
            handoff_triggered=handed_off,
            setor_destino=setor_destino,
            prioridade=prioridade,
            property_id=property_id,
            sugestoes_de_cta=sugestoes_cta,
            nome_cliente=ai_result.get("nome_cliente")
        )
    except Exception as e:
        print(f"CRITICAL ERROR in handle_turn: {e}")
        return TurnResponse(
            status="error",
            session_id=payload.session_id or "error-session",
            reply="Desculpe, tive um problema técnico agora e não consegui processar sua mensagem. Pode tentar novamente em alguns instantes?",
            current_state="recepcao",
            handoff_triggered=False,
            setor_destino=None,
            prioridade="normal",
            property_id=payload.property_code,
            sugestoes_de_cta=None,
            nome_cliente=None
        )

# End of API
