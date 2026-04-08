import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

from dotenv import load_dotenv
load_dotenv()

from supabase_service import SupabaseService
from openai_service import OpenAIService
from security import check_rate_limit # NEW: Security layer
from fastapi import Request # NEW: For IP tracking

app = FastAPI(title="Axis Backend", version="1.0.0")

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
    channel: str = "website"
    browser_user_id: str
    phone: Optional[str] = None
    name: Optional[str] = None
    message: str # No Pydantic length here to keep it simple, but we'll prune in service if needed
    session_id: Optional[str] = None
    optional_context: Optional[Dict[str, Any]] = None
    property_code: Optional[str] = None

class TurnResponse(BaseModel):
    status: str
    session_id: str
    reply: str
    current_state: str
    handoff_triggered: bool
    setor_destino: Optional[str]
    prioridade: Optional[str]
    property_id: Optional[str]
    
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
            property_id=property_id
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
            property_id=payload.property_code
        )

# End of API
