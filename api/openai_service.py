import os
import json
from openai import AsyncOpenAI
from pathlib import Path

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

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
            if client is None:
                raise RuntimeError("OPENAI_API_KEY not configured")
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

            def _detect(msg: str) -> dict:
                m = (msg or "").lower()
                if any(k in m for k in ["repasse", "extrato", "prestação de contas", "prestacao de contas"]):
                    return {"setor": "financeiro", "intencao": "repasse", "sub": "extrato" if "extrato" in m else None, "repasse_flag": True}
                if any(k in m for k in ["segunda via", "2a via", "2ª via", "boleto", "comprovante", "pagamento", "vencimento", "multa", "juros", "cobran", "atraso"]):
                    return {"setor": "financeiro", "intencao": "boleto", "sub": "segunda_via" if ("via" in m or "boleto" in m) else None}

                if any(k in m for k in ["vazamento", "sem luz", "curto", "inund", "urgente", "manuten", "quebrou", "vazando"]):
                    urgente = any(k in m for k in ["urgente", "inund", "curto", "sem luz", "vazamento"])
                    return {"setor": "administrativo", "intencao": "manutencao", "sub": "urgente" if urgente else None, "urgente": urgente}
                if any(k in m for k in ["documenta", "contrato", "análise cadastral", "analise cadastral", "assinatura", "vistoria", "renova", "rescind", "rescisao", "rescisão", "seguro", "fiança", "fianca"]):
                    return {"setor": "administrativo", "intencao": "contrato", "sub": "documentacao" if "document" in m else None}

                if any(k in m for k in ["comprar", "compra", "alugar", "locaç", "locacao", "visita", "agendar", "proposta", "financ", "simula", "vender", "anunciar", "avali", "interesse"]):
                    if "financ" in m or "simula" in m:
                        return {"setor": "comercial", "intencao": "financiamento", "sub": "simulacao"}
                    if "visita" in m or "agendar" in m:
                        return {"setor": "comercial", "intencao": "agendar_visita", "sub": None}
                    if "vender" in m or "anunciar" in m or "avali" in m:
                        return {"setor": "comercial", "intencao": "anunciar_imovel", "sub": "avaliacao"}
                    if "alugar" in m or "loca" in m:
                        return {"setor": "comercial", "intencao": "alugar_imovel", "sub": None}
                    if "comprar" in m or "compra" in m:
                        return {"setor": "comercial", "intencao": "comprar_imovel", "sub": None}
                    return {"setor": "comercial", "intencao": "imovel_especifico", "sub": None}

                return {"setor": None, "intencao": None, "sub": None}

            def _build(intent: dict) -> tuple[str, list[str], str, str | None]:
                nome = (context.get("dados_coletados") or {}).get("name") or (context.get("sessao_acumulada") or {}).get("nome_cliente")
                imovel = context.get("contexto_imovel") or {}
                titulo = imovel.get("property_title")
                pid = imovel.get("property_id")
                modo = imovel.get("property_mode")
                tipo = imovel.get("property_type") or imovel.get("tipo")

                saud = f"Perfeito, {nome}! " if nome else ""
                imovel_line = ""
                if titulo or pid:
                    imovel_line = f'Vi que você está na página do imóvel "{titulo}"' if titulo else f"Vi que você está na página do imóvel de referência {pid}"
                    if pid and titulo:
                        imovel_line += f" (ref. {pid})"
                    if tipo:
                        imovel_line += f" — {tipo}"
                    imovel_line += ". "

                if intent.get("setor") == "financeiro":
                    if intent.get("intencao") == "repasse":
                        return (
                            f"{saud}Entendi. Para eu direcionar corretamente: você é proprietário (recebe repasse) ou locatário (paga boleto)? Me diga também o mês/período que você quer consultar.",
                            ["Consultar repasse", "Solicitar extrato", "Falar com financeiro"],
                            "qualificacao",
                            "financeiro",
                        )
                    return (
                        f"{saud}Entendi. Você precisa de boleto/2ª via ou enviar comprovante? Me informe o mês de referência e, se tiver, o número do contrato/imóvel para eu encaminhar ao financeiro.",
                        ["Solicitar segunda via", "Enviar comprovante", "Falar com financeiro"],
                        "qualificacao",
                        "financeiro",
                    )

                if intent.get("setor") == "administrativo":
                    if intent.get("intencao") == "manutencao":
                        if intent.get("urgente"):
                            return (
                                f"{saud}Entendi que é URGENTE. Há risco imediato (inundação, curto-circuito, choque) e qual o imóvel/contrato? Me descreva em 1 frase o que está acontecendo agora.",
                                ["Descrever Urgência", "Acompanhar manutenção", "Falar com administrativo"],
                                "encaminhamento",
                                "manutencao_prioritaria",
                            )
                        return (
                            f"{saud}Certo. Para eu acionar o administrativo/manutenção: qual o imóvel/contrato e qual o problema? Se tiver fotos, me diga que você tem que eu te oriento.",
                            ["Descrever problema", "Acompanhar manutenção", "Falar com administrativo"],
                            "qualificacao",
                            "administrativo",
                        )
                    return (
                        f"{saud}Entendi. Para eu encaminhar ao administrativo com precisão, me diga qual contrato/imóvel está relacionado e se é documentação, assinatura, renovação ou rescisão.",
                        ["Informar contrato", "Enviar documentos", "Falar com administrativo"],
                        "qualificacao",
                        "administrativo",
                    )

                if intent.get("setor") == "comercial":
                    if intent.get("intencao") == "financiamento":
                        return (
                            f"{saud}{imovel_line}Ótimo — financiar é um caminho comum. Você prefere fazer uma simulação agora ou falar com um especialista para planejar as melhores condições?" + (
                                f" Como este imóvel é para {modo.lower()}, já sigo por esse caminho." if modo in ("Venda", "Locação") else ""
                            ),
                            ["Fazer simulação", "Falar com especialista", "Agendar visita"],
                            "conducao",
                            "comercial",
                        )
                    if intent.get("intencao") == "agendar_visita":
                        return (
                            f"{saud}{imovel_line}Perfeito. Qual dia e horário você prefere para a visita? Se quiser, me diga também seu WhatsApp para confirmação.",
                            ["Agendar agora", "Ver outros horários", "Especialista comercial"],
                            "qualificacao",
                            "comercial",
                        )
                    if intent.get("intencao") in ("comprar_imovel", "alugar_imovel", "imovel_especifico"):
                        if modo == "Venda":
                            suffix = "Como este imóvel é para venda, posso te ajudar a agendar visita ou preparar uma proposta."
                        elif modo == "Locação":
                            suffix = "Como este imóvel é para locação, posso te ajudar com visita e documentação para fechamento."
                        else:
                            suffix = "Você busca compra ou locação?"
                        return (
                            f"{saud}{imovel_line}{suffix} Qual é seu objetivo agora: agendar visita, receber mais detalhes ou fazer proposta?",
                            ["Agendar visita", "Mais detalhes", "Fazer proposta", "Ver fotos extras"],
                            "conducao",
                            "comercial",
                        )
                    if intent.get("intencao") == "anunciar_imovel":
                        return (
                            f"{saud}Perfeito. Para começarmos uma avaliação: qual o tipo do imóvel, bairro/endereço e o valor que você tem em mente? Se tiver fotos, isso ajuda bastante.",
                            ["Avaliação profissional", "Especialista de captação"],
                            "qualificacao",
                            "comercial",
                        )

                return (
                    f"{saud}Me conte em poucas palavras o que você precisa (compra/locação, contrato/documentos/manutenção, ou boletos/repasses).",
                    ["Comprar", "Locação", "Boletos", "Repasses", "Documentação"],
                    context.get("current_state", "recepcao"),
                    None,
                )

            intent = _detect(user_message)
            reply, ctas, etapa, setor = _build(intent)

            return {
                "message_to_user": reply,
                "handoff_recomendado": True if setor in ("financeiro", "administrativo", "manutencao_prioritaria") else False,
                "setor_destino": setor,
                "prioridade": "alta" if intent.get("urgente") else ("comercial_alta" if intent.get("intencao") == "agendar_visita" else "normal"),
                "etapa_da_conversa": etapa,
                "nome_cliente": (context.get("dados_coletados", {}) or {}).get("name"),
                "intencao_principal": intent.get("intencao"),
                "subintencao": intent.get("sub"),
                "estagio_da_jornada": "nao_identificado",
                "nivel_de_confianca": 0.55,
                "perfil_cliente": "nao_identificado",
                "tipo_de_publico": None,
                "imovel_ou_contrato_relacionado": (context.get("contexto_imovel") or {}).get("property_id"),
                "resumo_do_caso": None,
                "proxima_acao": intent.get("intencao"),
                "motivo_do_handoff": "falha_compreensao",
                "dados_minimos_coletados": ["nome"] if (context.get("dados_coletados") or {}).get("name") else [],
                "dados_ainda_faltantes": [],
                "urgencia_detectada": bool(intent.get("urgente")),
                "frustracao_detectada": False,
                "alta_intencao_comercial": intent.get("setor") == "comercial",
                "necessidade_operacional": None,
                "checklist_pendente": None,
                "manutencao_requer_chamado": True if intent.get("intencao") == "manutencao" else None,
                "documento_pendente": None,
                "anuncio_apto_ou_nao": None,
                "repasse_ou_extrato_solicitado": bool(intent.get("repasse_flag")),
                "necessidade_de_feedback_ou_finalizacao": False,
                "origem_do_contexto_do_imovel": "site_pagina_imovel" if (context.get("contexto_imovel") or {}).get("property_id") else None,
                "contexto_do_site_identificado": bool((context.get("contexto_imovel") or {}).get("property_id")),
                "sugestoes_de_cta": ctas
            }
