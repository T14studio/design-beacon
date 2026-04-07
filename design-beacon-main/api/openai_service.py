import os
import json
from openai import AsyncOpenAI
from pathlib import Path

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Define paths relative to the current file / project
BASE_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = BASE_DIR / "prompts"

_system_prompt = ""
_output_schema = {}

def load_prompts():
    global _system_prompt, _output_schema
    try:
        with open(PROMPTS_DIR / "system_prompt.md", "r", encoding="utf-8") as f:
            _system_prompt = f.read()
        with open(PROMPTS_DIR / "axis_output_schema.json", "r", encoding="utf-8") as f:
            _output_schema = json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load prompts from {PROMPTS_DIR}: {e}")
        _system_prompt = "Você é o Axis."
        _output_schema = {
            "name": "axis_turn_output",
            "schema": {
                "type": "object",
                "properties": {
                    "message_to_user": {"type": "string"},
                    "handoff_recomendado": {"type": "boolean"},
                    "setor_destino": {"type": "string"},
                    "proxima_acao": {"type": "string"},
                    "resumo_do_caso": {"type": "string"}
                },
                "required": ["message_to_user"]
            }
        }

load_prompts()

class OpenAIService:
    @staticmethod
    async def process_turn(user_message: str, history: list, context: dict) -> dict:
        # ── Prepare system prompt ──────────────────────────────────────────────
        prompt = _system_prompt
        prompt = prompt.replace("{{NOME_DA_IMOBILIARIA}}", context.get("nome_imobiliaria", "Ética"))
        prompt = prompt.replace("{{ESTADO_ATUAL}}", context.get("current_state", "recepcao"))
        prompt = prompt.replace("{{DADOS_COLETADOS}}", json.dumps(context.get("dados_coletados", {}), ensure_ascii=False))
        prompt = prompt.replace("{{CONTEXTO_IMOVEL}}", json.dumps(context.get("contexto_imovel", {}), ensure_ascii=False))
        prompt = prompt.replace("{{ESTADO_ANTERIOR}}", json.dumps(context.get("estado_anterior", {}), ensure_ascii=False))

        # ── Inject accumulated session state (the state tracking anchor) ───────
        sessao = context.get("sessao_acumulada", {})
        dados = context.get("dados_coletados", {})
        session_summary_parts = []

        # Nome: try sessao first, then dados_coletados (from history scan)
        nome_efetivo = sessao.get("nome_cliente") or dados.get("name")
        if nome_efetivo:
            session_summary_parts.append(f"Nome do cliente: {nome_efetivo}")
        if sessao.get("objetivo_atual"):
            session_summary_parts.append(f"Objetivo identificado: {sessao['objetivo_atual']}")
        if sessao.get("setor_provavel"):
            session_summary_parts.append(f"Setor provável: {sessao['setor_provavel']}")
        # Imóvel: try sessao first, then contexto_imovel
        imovel_efetivo = sessao.get("imovel_ref") or context.get("contexto_imovel", {}).get("property_id")
        imovel_title = context.get("contexto_imovel", {}).get("property_title")
        if imovel_efetivo:
            session_summary_parts.append(f"Imóvel em contexto (Código/Ref): {imovel_efetivo}")
        if imovel_title:
            session_summary_parts.append(f"Título do Imóvel: {imovel_title}")
        if sessao.get("estagio_jornada"):
            session_summary_parts.append(f"Estágio da jornada: {sessao['estagio_jornada']}")
        if sessao.get("proxima_acao"):
            session_summary_parts.append(f"Próxima ação esperada: {sessao['proxima_acao']}")

        if session_summary_parts:
            session_memory_block = (
                "\n\n## MEMÓRIA DE SESSÃO PERSISTIDA (PRIORIDADE MÁXIMA)\n"
                "As informações abaixo foram coletadas e gravadas em turnos anteriores desta sessão. "
                "Você DEVE usá-las para continuar a conversa de onde parou. "
                "NUNCA reinicie do zero se esta seção estiver preenchida. "
                f"Se o nome do cliente estiver disponível, USE-O na sua resposta agora.\n"
                + "\n".join(f"- {p}" for p in session_summary_parts)
            )
            prompt += session_memory_block

        prompt = prompt.replace("{{HISTORICO_MENSAGENS}}", "Carregado via histórico de chat abaixo.")

        # ── Build messages array ───────────────────────────────────────────────
        messages = [{"role": "system", "content": prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # The current user message is appended LAST (history already excludes it)
        messages.append({"role": "user", "content": user_message})

        try:
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": _output_schema
                },
                temperature=0.7
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            print(f"[OpenAI] etapa={result.get('etapa_da_conversa')} setor={result.get('setor_destino')} nome={result.get('nome_cliente')} handoff={result.get('handoff_recomendado')}")
            return result
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return {
                "message_to_user": "Desculpe, enfrentei um problema técnico instantes atrás. Pode repetir?",
                "handoff_recomendado": False,
                "setor_destino": None,
                "prioridade": "normal",
                "etapa_da_conversa": context.get("current_state", "recepcao"),
                "nome_cliente": context.get("dados_coletados", {}).get("name"),
                "intencao_principal": None,
                "subintencao": None,
                "estagio_da_jornada": "nao_identificado",
                "nivel_de_confianca": 0.0,
                "perfil_cliente": "nao_identificado",
                "tipo_de_publico": None,
                "imovel_ou_contrato_relacionado": None,
                "resumo_do_caso": None,
                "proxima_acao": None,
                "motivo_do_handoff": None,
                "dados_minimos_coletados": [],
                "dados_ainda_faltantes": [],
                "urgencia_detectada": False,
                "frustracao_detectada": False,
                "alta_intencao_comercial": False,
                "necessidade_operacional": None,
                "checklist_pendente": None,
                "manutencao_requer_chamado": None,
                "documento_pendente": None,
                "anuncio_apto_ou_nao": None,
                "repasse_ou_extrato_solicitado": None,
                "necessidade_de_feedback_ou_finalizacao": False,
                "origem_do_contexto_do_imovel": None,
                "contexto_do_site_identificado": False,
                "sugestoes_de_cta": []
            }
