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
from economic_service import EconomicService
from security import check_rate_limit, check_contracts_rate_limit, sanitize_id, sanitize_text_input
from whatsapp_service import WhatsAppService, WhatsAppConfig, verify_webhook_signature, normalize_phone
from financing_service import (
    FinancingPayload,
    FinancingValidationError,
    simulate_financing,
    compare_financing_scenarios,
)
from fastapi import Request
import re

app = FastAPI(title="Axis Backend", version="1.0.1")


# ── CORS Middleware ─────────────────────────────────────────────────────────────
# Tenta pegar CORS_ORIGIN do ambiente, senão aceita a URL atual do Netlify e localhost
cors_origin = os.getenv("CORS_ORIGIN")
if cors_origin:
    allowed_origins = [cors_origin]
else:
    allowed_origins = [
        "https://astonishing-cobbler-78d913.netlify.app",
        "https://teal-wolverine-555626.hostingersite.com",
        "http://localhost:5173",
        "http://localhost:8000",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite tudo para evitar erro de CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security Headers Middleware ─────────────────────────────────────────────
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store"
        return response

app.add_middleware(SecurityHeadersMiddleware)

@app.get("/")
def read_root():
    return {"message": "Axis Backend API is running", "endpoints": ["/health", "/axis/turn"]}

@app.get("/health")
def health_check():
    return {"status": "up", "api": "Axis Backend", "version": "1.0.0"}

class TurnPayload(BaseModel):
    channel: str = Field(default="website", max_length=50)
    browser_user_id: str = Field(..., min_length=1, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=30)
    name: Optional[str] = Field(default=None, max_length=120)
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = Field(default=None, max_length=128)
    optional_context: Optional[Dict[str, Any]] = Field(default=None)
    property_code: Optional[str] = Field(default=None, max_length=100)

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
    exibir_fotos_galeria: bool = Field(default=False)

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

    m = re.search(r"\b(meu nome (é|eh|e)|me chamo|sou)\s+([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'\- ]{1,30})\b", text, re.IGNORECASE)
    if m:
        name = re.sub(r"\s{2,}", " ", m.group(3).strip())
        return name[:1].upper() + name[1:]

    if re.fullmatch(r"[A-Za-zÀ-ÖØ-öø-ÿ]{2,20}(\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,20})?", text):
        parts = text.split()
        # EXCLUSION LIST: Never infer these as names
        exclusions = {
            "comprar", "compra", "venda", "locação", "locacao", "alugar", "visita",
            "agendar", "proposta", "interesse", "fotos", "foto", "imagens", "imagem",
            "quero", "gostaria", "preciso", "tenho", "sim", "não", "nao", "ok", "certo",
            "sou", "meu", "minha", "seu", "sua", "este", "esse", "aquele", "ver",
            "nome", "obrigado", "obrigada", "ótimo", "otimo", "tudo", "bem",
            "boa", "bom", "tarde", "noite", "manhã", "manha", "financiar", "financiamento",
            "comprei", "aluguei", "urgente", "boleto", "contrato", "documentação",
            "rescisão", "rescisao", "segunda", "repasse", "extrato"
        }
        if any(p.lower() in exclusions for p in parts):
            return None
        return " ".join([p[:1].upper() + p[1:].lower() for p in parts])

    return None

def _detect_photo_intent(message: str) -> bool:
    if not message:
        return False
    m = message.lower()
    return any(k in m for k in [
        "foto", "imagem", "imagens", "ver o imóvel", "ver esse imóvel",
        "ver este imóvel", "mostrar as fotos"
    ])

def _route_department_from_message(message: str) -> Optional[str]:
    m = (message or "").lower()
    financeiro = [
        "boleto", "2ª via", "2a via", "segunda via", "comprovante", "pagamento",
        "vencimento", "multa", "juros", "cobran", "atraso", "repasse", "extrato",
        "imposto de renda", "ir ", "i.r.", "prestação de contas", "prestacao de contas"
    ]
    administrativo = [
        "documenta", "contrato", "análise cadastral", "analise cadastral", "assinatura",
        "vistoria", "manuten", "vazamento", "renova", "rescind", "rescis", "seguro",
        "fiança", "fianca", "fechamento de locação", "fechamento de locacao",
        "quando vence", "prazo do contrato", "renovar contrato", "aditivo",
        "urgente", "sem luz", "curto", "inund"
    ]
    comercial = [
        "comprar", "compra", "alugar", "loca", "visita", "agendar", "proposta",
        "financ", "simula", "vender", "anunciar", "avali", "interesse"
    ]

    if any(k in m for k in financeiro):
        return "financeiro"
    if any(k in m for k in administrativo):
        return "administrativo"
    if any(k in m for k in comercial):
        return "comercial"
    return None

class ClientContractsSearchPayload(BaseModel):
    document: str = Field(..., min_length=11, max_length=18, description="CPF ou CNPJ do cliente (com ou sem máscara).")

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
async def client_area_contracts_search(payload: ClientContractsSearchPayload, request: Request):
    try:
        # ── Rate Limiting estrito: previne enumeração em massa de CPF/CNPJ ──────
        client_ip = request.client.host if request.client else "unknown"
        is_limited, limit_msg, retry_after = check_contracts_rate_limit(client_ip)
        if is_limited:
            raise HTTPException(
                status_code=429,
                detail=f"{limit_msg} Tente novamente em {retry_after} segundos.",
                headers={"Retry-After": str(retry_after)}
            )

        contracts = SupabaseService.search_contracts_by_document(payload.document, limit=10)
        sanitized = []
        for c in contracts:
            if not c.get("id") or not c.get("contract_number"):
                continue
            # SECURITY: nunca retornar pdf_path (caminho interno de storage)
            sanitized.append({
                "id": c["id"],
                "contract_number": c["contract_number"],
                "pdf_url": c.get("pdf_url"),
                "pdf_path": None,
                "created_at": c.get("created_at"),
            })
        return ClientContractsSearchResponse(status="ok", contracts=sanitized)
    except HTTPException:
        raise
    except Exception as e:
        import sys
        print(f"ERROR in client_area_contracts_search: type={type(e).__name__}", file=sys.stderr)
        return ClientContractsSearchResponse(status="error", contracts=[])
    
@app.post("/axis/turn", response_model=TurnResponse)
async def handle_turn(payload: TurnPayload, request: Request):
    try:
        # ── 0. Rate Limiting + Input Sanitization ────────────────────────────────
        client_ip = request.client.host if request.client else "unknown"
        # Sanitiza browser_user_id antes de usar para rate limit e para repassar ao Supabase
        browser_user_id_safe = sanitize_id(payload.browser_user_id)
        if not browser_user_id_safe:
            raise HTTPException(status_code=400, detail="browser_user_id inválido.")
        is_limited, limit_msg, retry_after = check_rate_limit(client_ip, browser_user_id_safe)
        
        if is_limited:
            return TurnResponse(
                status="rate_limited",
                session_id=sanitize_id(payload.session_id or "") or "limited",
                reply=f"{limit_msg} Por favor, tente novamente em {retry_after} segundos para evitar gastos excessivos da API.",
                current_state="recepcao",
                handoff_triggered=False,
                setor_destino=None,
                prioridade="normal",
                property_id=payload.property_code
            )

        # ── 1. Get or Create Customer ────────────────────────────────────────────
        customer = SupabaseService.get_or_create_customer(
            browser_user_id=browser_user_id_safe,
            channel=payload.channel
        )
        customer_id = customer.get("id", payload.browser_user_id)

        # ── 2. Get or Create Session ─────────────────────────────────────────────
        session = SupabaseService.get_or_create_session(
            session_id=sanitize_id(payload.session_id or "") or None,
            customer_id=customer_id,
            property_code=sanitize_id(payload.property_code or "") or None
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
        # SECURITY: log sem dados identificadores do usuário (nome/conteúdo da mensagem)
        print(f"[AXIS] session={session_id[:8]}... state={current_state} property={property_id} msg_len={len(payload.message)}")
        ai_result = await OpenAIService.process_turn(payload.message, history, context)

        # ── 10. Process output ────────────────────────────────────────────────────
        reply         = ai_result.get("message_to_user", "Desculpe, não consegui processar.")
        new_state     = ai_result.get("etapa_da_conversa", current_state)
        handed_off    = ai_result.get("handoff_recomendado", False)
        setor_destino = ai_result.get("setor_destino")
        prioridade    = ai_result.get("prioridade", "normal")
        sugestoes_cta = ai_result.get("sugestoes_de_cta") or []

        # OVERRIDE FORÇADO PARA INTENÇÕES CRÍTICAS (FOTOS E SETOR)
        if _detect_photo_intent(payload.message):
            ai_result["exibir_fotos_galeria"] = True
            # Transforma a resposta da IA na confirmação visual de abertura da galeria
            contexto_imovel_tit = contexto_imovel.get("property_title", "este imóvel")
            reply = f"Claro! Aqui estão as imagens de {contexto_imovel_tit} para você avaliar."
            
        routed_force = _route_department_from_message(payload.message)
        if routed_force:
            setor_destino = routed_force
            ai_result["setor_destino"] = routed_force
            # Identificação de urgência se for administrativo
            if routed_force == "administrativo" and any(k in (payload.message or "").lower() for k in ["urgente", "vazamento", "sem luz", "curto", "inund"]):
                ai_result["prioridade"] = "alta"
                prioridade = "alta"
            
            # Se a IA não gerou CTAs relevantes ou estamos forçando o setor
            if routed_force == "financeiro" and ("Consultar repasse" not in sugestoes_cta and "Solicitar segunda via" not in sugestoes_cta):
                sugestoes_cta = ["Solicitar segunda via", "Enviar comprovante", "Consultar repasse", "Falar com financeiro"]
            elif routed_force == "administrativo" and ("Acompanhar manutenção" not in sugestoes_cta and "Enviar documentos" not in sugestoes_cta):
                sugestoes_cta = ["Enviar documentos", "Descrever problema", "Acompanhar manutenção", "Falar com administrativo"]
            elif routed_force == "comercial" and ("Agendar visita" not in sugestoes_cta and "Fazer simulação" not in sugestoes_cta):
                sugestoes_cta = ["Agendar visita", "Fazer simulação", "Falar com especialista", "Fazer proposta"]
            
            ai_result["sugestoes_de_cta"] = sugestoes_cta

        # Anti-loop guard: if name is known but state regressed to 'recepcao', advance it
        nome_final = ai_result.get("nome_cliente") or dados_coletados.get("name")
        if nome_final and new_state == "recepcao":
            new_state = "qualificacao"
            ai_result["etapa_da_conversa"] = "qualificacao"

        if dados_coletados.get("name") and not ai_result.get("nome_cliente"):
            ai_result["nome_cliente"] = dados_coletados["name"]

        # Atualizar accumulated_state com os novos resultados da AI para preservar a memória inteira!
        if ai_result.get("nome_cliente"): accumulated_state["nome_cliente"] = ai_result["nome_cliente"]
        if ai_result.get("setor_destino"): accumulated_state["setor_provavel"] = ai_result["setor_destino"]
        if ai_result.get("imovel_ou_contrato_relacionado"): accumulated_state["imovel_ref"] = ai_result["imovel_ou_contrato_relacionado"]
        if ai_result.get("intencao_principal"): accumulated_state["objetivo_atual"] = ai_result["intencao_principal"]
        if ai_result.get("proxima_acao"): accumulated_state["proxima_acao"] = ai_result["proxima_acao"]
        if ai_result.get("estagio_da_jornada") and ai_result["estagio_da_jornada"] != "nao_identificado":
            accumulated_state["estagio_jornada"] = ai_result["estagio_da_jornada"]
        
        # Coloca o accumulated inteiro no ai_result param pra enviar pro Supabase
        ai_result["_accumulated_merge"] = accumulated_state


        
        # ── 11. Save outgoing assistant message ───────────────────────────────────
        SupabaseService.save_message(session_id, "assistant", reply, metadata=ai_result)

        # ── 12. Persist full session state ────────────────────────────────────────
        SupabaseService.update_session_full_state(session_id, ai_result, current_state)

        # ── 13. Create handoff ticket if needed ───────────────────────────────────
        if handed_off:
            SupabaseService.create_handoff_ticket(session_id, ai_result)

        # Normalize internal manutencao_prioritaria => administrativo externally
        setor_externo = setor_destino
        if setor_externo == "manutencao_prioritaria":
            setor_externo = "administrativo"

        return TurnResponse(
            status="ok",
            session_id=session_id,
            reply=reply,
            current_state=new_state,
            handoff_triggered=handed_off,
            setor_destino=setor_externo,
            prioridade=prioridade,
            property_id=property_id,
            sugestoes_de_cta=sugestoes_cta,
            nome_cliente=nome_final,
            exibir_fotos_galeria=ai_result.get("exibir_fotos_galeria", False)
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

# ═══════════════════════════════════════════════════════════════
# ECONOMIC INDICATORS — /indicators
# ═══════════════════════════════════════════════════════════════

@app.get("/indicators")
async def get_indicators():
    """
    Retorna indicadores econômicos em tempo real.
    Fontes: AwesomeAPI (câmbio) + Banco Central SGS (Selic, IPCA, TR, CDI).
    Cache de 5 minutos. Fallback estático em caso de falha.
    """
    try:
        data = await EconomicService.get_indicators()
        return {"status": "ok", "data": data}
    except Exception as e:
        print(f"[/indicators] error: {e}")
        return {
            "status": "fallback",
            "data": {
                "usd": {"value": "R$ 5,79", "change": "--", "up": True, "isLive": False},
                "eur": {"value": "R$ 6,32", "change": "--", "up": True, "isLive": False},
                "selic": {"value": "14,75%", "change": "0,0%", "up": False, "isLive": False},
                "ipca": {"value": "5,48%", "change": "+0,1%", "up": True, "isLive": False},
                "tr": {"value": "0,09%", "change": "0,0%", "up": False, "isLive": False},
                "cdi": {"value": "14,65%", "change": "0,0%", "up": False, "isLive": False},
                "fetched_at": None,
            }
        }


# ═══════════════════════════════════════════════════════════════
# FINANCING — /financing/banks
# ═══════════════════════════════════════════════════════════════

@app.get("/financing/banks")
async def get_financing_banks():
    """
    Retorna lista de bancos com taxas atualizadas.
    Tenta enriquecer com dados do Ranking BCB.
    Cache de 5 minutos. Fallback para dados internos.
    """
    try:
        data = await EconomicService.get_bank_rates()
        return {"status": "ok", **data}
    except Exception as e:
        print(f"[/financing/banks] error: {e}")
        from economic_service import BANKS_BASE
        import time
        return {
            "status": "fallback",
            "banks": BANKS_BASE,
            "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }


# ═══════════════════════════════════════════════════════════════
# FINANCING — /financing/simulate
# ═══════════════════════════════════════════════════════════════

class SimulationPayload(BaseModel):
    property_value: float = Field(..., gt=0)
    down_payment: float = Field(..., ge=0)
    years: int = Field(..., gt=0, le=35)
    annual_rate: float = Field(..., ge=0)
    amortization: str = Field(default="SAC", pattern="^(SAC|PRICE)$")

@app.post("/financing/simulate")
async def simulate_financing(payload: SimulationPayload):
    """
    Calcula simulação de financiamento pelo backend.
    Suporta SAC e PRICE. Retorna parcelas, total pago e juros.
    """
    result = EconomicService.calculate(
        property_value=payload.property_value,
        down_payment=payload.down_payment,
        years=payload.years,
        annual_rate=payload.annual_rate,
        amortization=payload.amortization,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"status": "ok", "result": result}


# ═════════════════════════════════════════════════════════════
# FINANCIAMENTO — /api/financing/simulate  (novo endpoint padronizado)
# ═════════════════════════════════════════════════════════════

class ApiFinancingSimulatePayload(BaseModel):
    property_value:         float = Field(..., gt=0, description="Valor total do imóvel")
    down_payment:           float = Field(..., ge=0, description="Valor de entrada")
    term_months:            int   = Field(..., gt=0, le=420, description="Prazo em meses (máx 420 = 35 anos)")
    amortization_system:    str   = Field(..., pattern="^(SAC|PRICE)$", description="SAC ou PRICE")
    interest_rate_annual:   float = Field(..., ge=0, le=100, description="Taxa de juros anual em %")


@app.post("/api/financing/simulate")
async def api_financing_simulate(payload: ApiFinancingSimulatePayload):
    """
    Simula um único cenário de financiamento imobiliário.
    Suporta SAC e PRICE. Totalmente isolado de fontes externas.

    Entrada:
      property_value, down_payment, term_months,
      amortization_system (SAC|PRICE), interest_rate_annual

    Saída padronizada:
      input (dados normalizados), result (parcelas, totais), meta
    """
    try:
        fp = FinancingPayload(
            property_value=payload.property_value,
            down_payment=payload.down_payment,
            term_months=payload.term_months,
            amortization_system=payload.amortization_system,
            interest_rate_annual=payload.interest_rate_annual,
        )
        result = simulate_financing(fp)
        return result
    except FinancingValidationError as e:
        raise HTTPException(status_code=422, detail={"error": "validation_error", "message": str(e)})
    except Exception as e:
        print(f"[/api/financing/simulate] erro inesperado: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail={"error": "internal_error", "message": "Erro interno no cálculo de simulação."})


# ═════════════════════════════════════════════════════════════
# FINANCIAMENTO — /api/financing/compare   (comparação de cenários)
# ═════════════════════════════════════════════════════════════

class ApiFinancingScenarioItem(BaseModel):
    name:                   str   = Field(default="", max_length=100)
    property_value:         float = Field(..., gt=0)
    down_payment:           float = Field(..., ge=0)
    term_months:            int   = Field(..., gt=0, le=420)
    amortization_system:    str   = Field(..., pattern="^(SAC|PRICE)$")
    interest_rate_annual:   float = Field(..., ge=0, le=100)

class ApiFinancingComparePayload(BaseModel):
    scenarios: List[ApiFinancingScenarioItem] = Field(..., min_length=1, max_length=10)


@app.post("/api/financing/compare")
async def api_financing_compare(payload: ApiFinancingComparePayload):
    """
    Compara múltiplos cenários de financiamento lado a lado.
    Falhas individuais de cenários não derrubam os demais.
    Máximo de 10 cenários por requisição.

    Entrada:
      {"scenarios": [{name, property_value, down_payment,
                      term_months, amortization_system, interest_rate_annual}, ...]}

    Saída:
      {"scenarios": [...], "meta": {success, partial_failure, errors, generated_at}}
    """
    try:
        fps = [
            FinancingPayload(
                property_value=s.property_value,
                down_payment=s.down_payment,
                term_months=s.term_months,
                amortization_system=s.amortization_system,
                interest_rate_annual=s.interest_rate_annual,
                name=s.name or None,
            )
            for s in payload.scenarios
        ]
        result = compare_financing_scenarios(fps)
        return result
    except FinancingValidationError as e:
        raise HTTPException(status_code=422, detail={"error": "validation_error", "message": str(e)})
    except Exception as e:
        print(f"[/api/financing/compare] erro inesperado: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail={"error": "internal_error", "message": "Erro interno na comparação de cenários."})


# ═════════════════════════════════════════════════════════════
# WHATSAPP — /webhooks/whatsapp/incoming
# Recebe mensagens do WhatsApp via Uazapi
# ═════════════════════════════════════════════════════════════

# Mensagem padrão de handoff humano
_HANDOFF_MESSAGE = (
    "Ótimo! Vou transferir você para um especialista da nossa equipe. "
    "Ele terá acesso ao contexto da nossa conversa e entrará em contato em breve. "
    "👌 Aguarde!"
)


def _normalize_uazapi_payload(raw: dict) -> dict:
    """
    Normaliza payload bruto da Uazapi para formato interno padrão.
    Suporta tanto o formato aninhado (Baileys/Uazapi v2) quanto o formato plano (Agente LA).
    """
    # 1. Tentar extrair Telefone (Prioridade para o formato plano visto no log)
    remote_jid = (
        raw.get("phone")
        or raw.get("wa_chatId")
        or (raw.get("data") or {}).get("remoteJid")
        or raw.get("remoteJid")
        or ""
    )
    telefone_raw = remote_jid.split("@")[0] if "@" in remote_jid else remote_jid
    telefone = normalize_phone(telefone_raw)

    # 2. Tentar extrair Nome
    nome = (
        raw.get("wa_name")
        or raw.get("name")
        or (raw.get("data") or {}).get("pushName")
        or ""
    )

    # 3. Tentar extrair Mensagem e Tipo
    tipo = "text"
    mensagem = (
        raw.get("wa_lastMessageTextVote")
        or raw.get("wa_lastMessageText")
        or raw.get("body")
        or ""
    )
    media_url = None
    media_filename = None

    # Fallback para o formato aninhado (Uazapi v2 / Baileys)
    if not mensagem:
        data = raw.get("data") or raw.get("message") or {}
        message_obj = data.get("message") or data
        
        # Procura texto em campos padrões
        body = data.get("body") or message_obj.get("body") or ""
        if body:
            mensagem = str(body)
        else:
            # Varredura profunda em data["message"]
            msg_root = data.get("message") if isinstance(data.get("message"), dict) else {}
            for msg_content in [msg_root, message_obj if isinstance(message_obj, dict) else {}]:
                if not isinstance(msg_content, dict) or mensagem: continue
                if "conversation" in msg_content:
                    mensagem = msg_content["conversation"]
                elif "extendedTextMessage" in msg_content:
                    mensagem = msg_content["extendedTextMessage"].get("text", "")
                elif "imageMessage" in msg_content:
                    tipo = "image"
                    media_url = msg_content["imageMessage"].get("url")
                    mensagem = msg_content["imageMessage"].get("caption", "[imagem]")
                elif "documentMessage" in msg_content:
                    tipo = "document"
                    media_url = msg_content["documentMessage"].get("url")
                    mensagem = msg_content["documentMessage"].get("caption", "[documento]")
                elif "audioMessage" in msg_content:
                    tipo = "audio"
                    mensagem = "[áudio]"
                elif "buttonsResponseMessage" in msg_content:
                    tipo = "button_reply"
                    mensagem = msg_content["buttonsResponseMessage"].get("selectedDisplayText", "")

    # Message ID
    message_id = (
        raw.get("id") 
        or raw.get("wa_lastMessageId")
        or (raw.get("data") or {}).get("id")
    )

    # Direction: fromMe indica mensagem enviada pelo número comercial
    from_me = raw.get("fromMe", False)
    if not from_me and isinstance(raw.get("data"), dict):
        from_me = raw["data"].get("key", {}).get("fromMe", False)
    
    direction = "outbound" if from_me else "inbound"

    return {
        "telefone": telefone,
        "nome": str(nome).strip() if nome else "",
        "mensagem": str(mensagem).strip(),
        "tipo": tipo,
        "timestamp": str(raw.get("timestamp") or raw.get("wa_lastMsgTimestamp") or ""),
        "message_id": str(message_id) if message_id else None,
        "direction": direction,
        "media_url": media_url,
        "media_filename": media_filename,
    }


@app.post("/webhooks/whatsapp/incoming", status_code=200)
async def whatsapp_incoming_webhook(request: Request):
    """
    Endpoint de webhook para recebimento de mensagens WhatsApp via Uazapi.

    SEGURANÇA:
    - Valida assinatura HMAC-SHA256 quando UAZAPI_WEBHOOK_SECRET está configurado.
    - Não exibe credentials em logs.
    - Retorna 200 mesmo em erros não-críticos para evitar reenvio loop do provedor.

    FLUXO:
    1. Valida assinatura do webhook
    2. Normaliza payload
    3. Ignora mensagens outbound (da própria Axis)
    4. Localiza ou cria contato WhatsApp
    5. Persiste mensagem recebida
    6. Localiza ou cria sessão Axis
    7. Salva mensagem no histórico da sessão (formato padrão Axis)
    8. Chama OpenAI (Axis) para processar
    9. Persiste resposta
    10. Dispara handoff se necessário
    11. Responde via WhatsApp send_text
    """
    # ── Leitura e validação da assinatura ────────────────────────────────────
    try:
        body_bytes = await request.body()
    except Exception:
        return {"status": "error", "detail": "body_read_error"}

    # Valida assinatura se secret estiver configurado
    signature_header = (
        request.headers.get("x-hub-signature-256")
        or request.headers.get("x-uazapi-signature")
        or request.headers.get("x-signature")
        or ""
    )
    if WhatsAppConfig.webhook_secret() and signature_header:
        if not verify_webhook_signature(body_bytes, signature_header):
            print("[WHATSAPP-SECURITY] Webhook: assinatura inválida — request rejeitada.", file=__import__('sys').stderr)
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=403, content={"status": "forbidden", "detail": "invalid_signature"})
    elif WhatsAppConfig.webhook_secret() and not signature_header:
        # Secret configurado mas sem assinatura no header — aceita com warning (pode ser ping de setup)
        print("[WHATSAPP-SECURITY] Webhook recebido sem assinatura. Verifique configuração Uazapi.", file=__import__('sys').stderr)

    # ── Parsea payload JSON ────────────────────────────────────────────────────
    try:
        import json as _json
        raw_payload = _json.loads(body_bytes)
    except Exception as e:
        print(f"[WHATSAPP-DEBUG] Falha ao parsear JSON: {e}", file=__import__('sys').stderr)
        return {"status": "ok", "detail": "invalid_json"}

    print(f"[WHATSAPP-DEBUG] FULL RAW PAYLOAD: {_json.dumps(raw_payload, ensure_ascii=False)}", file=__import__('sys').stderr)

    # ── Normaliza payload para formato interno ────────────────────────────────
    try:
        normalized = _normalize_uazapi_payload(raw_payload)
        print(f"[WHATSAPP-DEBUG] NORMALIZADO: tipo={normalized.get('tipo')} msg_len={len(str(normalized.get('mensagem', '')))} phone='{normalized.get('telefone')}' direction={normalized.get('direction')}", file=__import__('sys').stderr)
    except Exception as e:
        print(f"[WHATSAPP-DEBUG] Erro ao normalizar payload: {type(e).__name__} - {e}", file=__import__('sys').stderr)
        return {"status": "ok", "detail": "normalization_error"}

    telefone = normalized["telefone"]
    nome     = normalized["nome"]
    mensagem = normalized["mensagem"]
    tipo     = normalized["tipo"]
    direction = normalized["direction"]
    message_id = normalized["message_id"]

    # ── Ignora mensagens enviadas pela própria Axis (fromMe) ─────────────────
    if direction == "outbound":
        print("[WHATSAPP-DEBUG] REJEITADO: direction=outbound", file=__import__('sys').stderr)
        return {"status": "ok", "detail": "outbound_ignored"}

    # ── Ignora payloads sem telefone ou mensagem ──────────────────────────────
    if not telefone or not mensagem:
        # Pano de fundo: loga exatamente o que estava vazio
        print(f"[WHATSAPP-DEBUG] REJEITADO (empty_payload): telefone='{telefone}' mensagem='{mensagem}'", file=__import__('sys').stderr)
        return {"status": "ok", "detail": "empty_payload_ignored"}

    # ── Log sem dados pessoais identificadores ────────────────────────────────
    print(f"[WHATSAPP-WH] tipo={tipo} msg_len={len(mensagem)} has_phone={bool(telefone)} direction={direction}")
    # DEBUG: loga estrutura do raw_payload para diagnóstico (remover após confirmar funcionamento)
    import json as _dbg_json
    print(f"[WHATSAPP-DBG] raw_keys={list(raw_payload.keys())} data_keys={list((raw_payload.get('data') or {}).keys())}")

    try:
        # ── 1. Localiza ou cria contato WhatsApp ─────────────────────────────
        contact = SupabaseService.get_or_create_whatsapp_contact(
            telefone=telefone,
            nome=nome or None
        )
        contact_id = contact.get("id")

        # ── 2. Persiste mensagem recebida ─────────────────────────────────────
        SupabaseService.save_whatsapp_message(
            contact_id=contact_id,
            session_id=contact.get("session_id"),
            direction="inbound",
            tipo=tipo,
            conteudo=mensagem,
            message_id=message_id,
            media_url=normalized.get("media_url"),
            media_filename=normalized.get("media_filename"),
            timestamp_origem=normalized.get("timestamp"),
            raw_payload={k: v for k, v in raw_payload.items() if k not in ("token", "secret", "auth")},
        )

        # ── 3. Localiza ou cria sessão Axis ──────────────────────────────────
        # Para WhatsApp, browser_user_id = telefone normalizado
        customer = SupabaseService.get_or_create_customer(
            browser_user_id=f"wa_{telefone}",
            channel="whatsapp"
        )
        customer_id = customer.get("id", f"wa_{telefone}")

        session = SupabaseService.get_or_create_session(
            session_id=contact.get("session_id"),
            customer_id=customer_id,
        )
        session_id = session.get("id")
        current_state = session.get("current_state", "recepcao")

        # Vincula session_id ao contato WA se ainda não vinculado
        if not contact.get("session_id"):
            SupabaseService.update_whatsapp_contact_context(
                telefone=telefone,
                session_id=session_id
            )

        # ── 4. Recupera histórico da sessão para contexto ────────────────────
        history_records = SupabaseService.get_messages(session_id, limit=15)
        history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in history_records
            if msg["role"] in ("user", "assistant")
        ]

        # ── 5. Monta dados coletados / contexto ───────────────────────────────
        session_meta = session.get("metadata") or {}
        if isinstance(session_meta, str):
            try: session_meta = _json.loads(session_meta)
            except: session_meta = {}

        accumulated_state = {
            "nome_cliente":    session.get("nome_cliente") or session_meta.get("nome_cliente") or nome or None,
            "objetivo_atual":  session.get("objetivo_atual") or session_meta.get("objetivo_atual"),
            "setor_provavel":  contact.get("setor") or session.get("setor_provavel") or session_meta.get("setor_provavel"),
            "imovel_ref":      session.get("imovel_ref") or session_meta.get("imovel_ref"),
            "estagio_jornada": session.get("estagio_jornada") or session_meta.get("estagio_jornada"),
            "proxima_acao":    session.get("proxima_acao") or session_meta.get("proxima_acao"),
        }

        dados_coletados = {}
        if accumulated_state.get("nome_cliente"):
            dados_coletados["name"] = accumulated_state["nome_cliente"]
        if telefone:
            dados_coletados["phone"] = telefone
        if not dados_coletados.get("name"):
            inferred = _infer_name_from_message(mensagem)
            if inferred:
                dados_coletados["name"] = inferred

        context = {
            "current_state":    current_state,
            "contexto_imovel":  {},
            "dados_coletados":  dados_coletados,
            "estado_anterior":  {},
            "sessao_acumulada": accumulated_state,
            "canal":            "whatsapp",
        }

        # ── 6. Salva mensagem do usuário na sessão Axis ───────────────────────
        SupabaseService.save_message(session_id, "user", mensagem)

        # Só processa texto com a Axis (ignora áudio/outros sem transcrição)
        if tipo not in ("text", "button_reply"):
            fallback_reply = "Recebi sua mensagem! Por enquanto, consigo responder apenas textos. 😊"
            SupabaseService.save_message(session_id, "assistant", fallback_reply)
            SupabaseService.save_whatsapp_message(
                contact_id=contact_id, session_id=session_id,
                direction="outbound", tipo="text", conteudo=fallback_reply
            )
            WhatsAppService.send_text(telefone, fallback_reply)
            return {"status": "ok", "detail": "non_text_replied"}

        # ── 7. Chama OpenAI (Axis) ────────────────────────────────────────────
        print(f"[WHATSAPP-AXIS] session={str(session_id)[:8]}... state={current_state} msg_len={len(mensagem)}")
        ai_result = await OpenAIService.process_turn(mensagem, history, context)

        # ── 8. Processa output da Axis ────────────────────────────────────────
        reply         = ai_result.get("message_to_user", "Olá! Seja bem-vindo. Como posso ajudar?")
        new_state     = ai_result.get("etapa_da_conversa", current_state)
        handed_off    = ai_result.get("handoff_recomendado", False)
        setor_destino = ai_result.get("setor_destino")
        prioridade    = ai_result.get("prioridade", "normal")

        # Override de intenção de fotos (adaptação WA: WA não abre galeria, texto alternativo)
        if _detect_photo_intent(mensagem):
            reply = "Para ver as fotos do imóvel, entre em contato com nossa equipe comercial! 🏡 Eles enviam o link do tour virtual pelo WhatsApp."

        # Override de setor por palavras-chave
        routed_force = _route_department_from_message(mensagem)
        if routed_force:
            setor_destino = routed_force
            ai_result["setor_destino"] = routed_force
            if routed_force == "administrativo" and any(k in mensagem.lower() for k in ["urgente", "vazamento", "sem luz"]):
                prioridade = "alta"

        # Anti-loop
        nome_final = ai_result.get("nome_cliente") or dados_coletados.get("name")
        if nome_final and new_state == "recepcao":
            new_state = "qualificacao"
            ai_result["etapa_da_conversa"] = "qualificacao"

        # Atualiza accumulated_state
        if ai_result.get("nome_cliente"): accumulated_state["nome_cliente"] = ai_result["nome_cliente"]
        if ai_result.get("setor_destino"): accumulated_state["setor_provavel"] = ai_result["setor_destino"]
        ai_result["_accumulated_merge"] = accumulated_state

        # ── 9. Persiste resposta no histórico Axis ───────────────────────────
        SupabaseService.save_message(session_id, "assistant", reply, metadata=ai_result)
        SupabaseService.update_session_full_state(session_id, ai_result, current_state)

        # ── 10. Atualiza contexto do contato WA ───────────────────────────────
        resumo_para_salvar = ai_result.get("resumo_do_caso") or ai_result.get("intencao_principal")
        SupabaseService.update_whatsapp_contact_context(
            telefone=telefone,
            session_id=session_id,
            setor=setor_destino,
            prioridade=prioridade,
            status_lead="ativo" if new_state not in ("recepcao",) else "novo",
            resumo_contexto=resumo_para_salvar,
        )

        # ── 11. Persiste mensagem de saída do bot ─────────────────────────────
        SupabaseService.save_whatsapp_message(
            contact_id=contact_id,
            session_id=session_id,
            direction="outbound",
            tipo="text",
            conteudo=reply,
        )

        # ── 12. Handoff humano ────────────────────────────────────────────────
        if handed_off and setor_destino:
            SupabaseService.create_handoff_ticket(session_id, ai_result)
            SupabaseService.trigger_whatsapp_handoff(
                telefone=telefone,
                setor_destino=setor_destino,
                motivo=ai_result.get("resumo_do_caso") or "Handoff solicitado pela Axis",
            )
            # Envia mensagem de transição ANTES da resposta da Axis
            WhatsAppService.send_text(telefone, _HANDOFF_MESSAGE)
            SupabaseService.save_whatsapp_message(
                contact_id=contact_id, session_id=session_id,
                direction="outbound", tipo="text", conteudo=_HANDOFF_MESSAGE
            )

        # ── 13. Envia resposta via WhatsApp ───────────────────────────────────
        send_result = WhatsAppService.send_text(telefone, reply)
        if not send_result.get("ok"):
            print(f"[WHATSAPP] Falha ao enviar resposta: {send_result.get('error', 'unknown')} — credenciais preenchidas?")

        return {"status": "ok", "session_id": str(session_id)[:8] + "..."}

    except Exception as e:
        print(f"[WHATSAPP] ERRO CRÍTICO no webhook: {type(e).__name__}: {str(e)[:100]}")
        # Tenta entregar resposta de fallback ao usuário mesmo em caso de erro
        try:
            WhatsAppService.send_text(
                telefone,
                "Desculpe, tive um problema técnico. Por favor, tente novamente em instantes! 🙏"
            )
        except Exception:
            pass
        return {"status": "ok", "detail": "internal_error_handled"}


# ═════════════════════════════════════════════════════════════
# WHATSAPP — /whatsapp/send
# Endpoint interno de envio de mensagens WhatsApp
# USO: backend-to-backend ou painel administrativo interno
# NUNCA expor diretamente ao frontend sem autenticação
# ═════════════════════════════════════════════════════════════

class WhatsAppSendPayload(BaseModel):
    to:          str  = Field(..., min_length=8, max_length=30, description="Número destino (será normalizado).")
    type:        str  = Field(default="text", pattern="^(text|image|document)$")
    text:        Optional[str]  = Field(default=None, max_length=4096)
    image_url:   Optional[str]  = Field(default=None, max_length=2048)
    caption:     Optional[str]  = Field(default=None, max_length=1024)
    file_url:    Optional[str]  = Field(default=None, max_length=2048)
    filename:    Optional[str]  = Field(default=None, max_length=255)


@app.post("/whatsapp/send")
async def whatsapp_send(payload: WhatsAppSendPayload, request: Request):
    """
    Endpoint interno para envio de mensagens WhatsApp.

    SEGURANÇA:
    - Este endpoint não deve ser exposto publicamente sem autenticação adicional.
    - O token Uazapi nunca é retornado na resposta.
    - Logs sem conteudo da mensagem para proteger dados do usuário.

    Suporta:
    - text:     Texto simples
    - image:    Imagem via URL pública
    - document: Documento via URL pública
    """
    if not WhatsAppService.is_enabled():
        cfg_errors = WhatsAppConfig.validation_errors()
        raise HTTPException(
            status_code=503,
            detail={
                "error": "whatsapp_channel_unavailable",
                "message": "Canal WhatsApp desabilitado ou credenciais não configuradas.",
                "config_errors": cfg_errors,
            }
        )

    msg_type = payload.type
    to = payload.to

    print(f"[WHATSAPP-SEND] type={msg_type} to_len={len(to)}")

    if msg_type == "text":
        if not payload.text:
            raise HTTPException(status_code=400, detail="Campo 'text' obrigatório para type=text.")
        result = WhatsAppService.send_text(to, payload.text)

    elif msg_type == "image":
        if not payload.image_url:
            raise HTTPException(status_code=400, detail="Campo 'image_url' obrigatório para type=image.")
        result = WhatsAppService.send_image(to, payload.image_url, caption=payload.caption)

    elif msg_type == "document":
        if not payload.file_url:
            raise HTTPException(status_code=400, detail="Campo 'file_url' obrigatório para type=document.")
        result = WhatsAppService.send_document(
            to, payload.file_url,
            filename=payload.filename,
            caption=payload.caption
        )
    else:
        raise HTTPException(status_code=400, detail="type inválido.")

    if not result.get("ok"):
        raise HTTPException(
            status_code=502,
            detail={"error": result.get("error", "send_failed"), "message": "Falha ao enviar via WhatsApp."}
        )

    return {"status": "ok", "type": msg_type, "provider": WhatsAppConfig.provider()}


# ═════════════════════════════════════════════════════════════
# WHATSAPP — /whatsapp/status
# Health check interno do canal WhatsApp (sem credentials)
# ═════════════════════════════════════════════════════════════

@app.get("/whatsapp/status")
async def whatsapp_status():
    """
    Retorna diagnóstico do canal WhatsApp.
    NÃO retorna valores das credenciais — apenas presença/ausência.
    Seguro para health checks e dashboards internos.
    """
    config = WhatsAppService.validate_config()
    return {
        "status": "ok" if config["ready"] else "not_ready",
        "channel": "whatsapp",
        **config,
    }


# End of API
