import os
import json
from openai import AsyncOpenAI
from pathlib import Path

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Define paths relative to the current file / project
BASE_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = BASE_DIR / "prompts"

_system_prompt_site = ""
_system_prompt_whatsapp = ""
_output_schema = {}

def load_prompts():
    global _system_prompt_site, _system_prompt_whatsapp, _output_schema
    try:
        with open(PROMPTS_DIR / "system_prompt_site.md", "r", encoding="utf-8") as f:
            _system_prompt_site = f.read()
        with open(PROMPTS_DIR / "system_prompt_whatsapp.md", "r", encoding="utf-8") as f:
            _system_prompt_whatsapp = f.read()
            
        with open(PROMPTS_DIR / "axis_output_schema.json", "r", encoding="utf-8") as f:
            _output_schema = json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load prompts from {PROMPTS_DIR}: {e}")
        _system_prompt_site = "Você é o Axis do site."
        _system_prompt_whatsapp = "Você é o Axis do WhatsApp."
        _output_schema = {
            "name": "axis_turn_output",
            "schema": {
                "type": "object",
                "properties": {
                    "message_to_user": {"type": "string"},
                    "handoff_recomendado": {"type": "boolean"},
                    "setor_destino": {"type": "string"},
                    "proxima_acao": {"type": "string"},
                    "resumo_do_caso": {"type": "string"},
                    "exibir_fotos_galeria": {"type": "boolean"}
                },
                "required": ["message_to_user", "exibir_fotos_galeria"]
            }
        }

load_prompts()

class OpenAIService:
    @staticmethod
    async def process_turn(user_message: str, history: list, context: dict) -> dict:
        # ── Escolha o System Prompt pelo canal ─────────────────────────────────
        canal = context.get("canal", "site").lower()
        if "whatsapp" in canal:
            prompt = _system_prompt_whatsapp
        else:
            prompt = _system_prompt_site
            
        prompt = prompt.replace("{{NOME_DA_IMOBILIARIA}}", context.get("nome_imobiliaria", "Ética"))
        prompt = prompt.replace("{{ESTADO_ATUAL}}", context.get("current_state", "recepcao"))
        prompt = prompt.replace("{{DADOS_COLETADOS}}", json.dumps(context.get("dados_coletados", {}), ensure_ascii=False))
        prompt = prompt.replace("{{CONTEXTO_IMOVEL}}", json.dumps(context.get("contexto_imovel", {}), ensure_ascii=False))
        prompt = prompt.replace("{{ESTADO_ANTERIOR}}", json.dumps(context.get("estado_anterior", {}), ensure_ascii=False))

        # ── Inject accumulated session state (the state tracking anchor) ───────
        sessao = context.get("sessao_acumulada", {})
        dados = context.get("dados_coletados", {})
        imovel_ctx = context.get("contexto_imovel", {}) or {}
        session_summary_parts = []

        # Nome: try sessao first, then dados_coletados (from history scan), then payload
        nome_efetivo = sessao.get("nome_cliente") or dados.get("name")
        if nome_efetivo:
            session_summary_parts.append(
                f"✅ NOME DO CLIENTE JÁ CONHECIDO: {nome_efetivo} — É PROIBIDO PERGUNTAR O NOME NOVAMENTE. Vá direto para a próxima etapa (descobrir o problema, agendar horário, etc)."
            )

        if sessao.get("objetivo_atual"):
            session_summary_parts.append(f"Objetivo identificado: {sessao['objetivo_atual']}")
        if sessao.get("setor_provavel"):
            session_summary_parts.append(f"Setor provável: {sessao['setor_provavel']}")

        # Imóvel: build rich context line
        imovel_id = sessao.get("imovel_ref") or imovel_ctx.get("property_id")
        imovel_title = imovel_ctx.get("property_title")
        imovel_mode = imovel_ctx.get("property_mode")
        imovel_type = imovel_ctx.get("property_type") or imovel_ctx.get("tipo")
        imovel_price = imovel_ctx.get("price")
        imovel_address = imovel_ctx.get("address")

        if imovel_id or imovel_title:
            imovel_line_parts = []
            if imovel_title:
                imovel_line_parts.append(f'Título: "{imovel_title}"')
            if imovel_id and imovel_id != imovel_title:
                imovel_line_parts.append(f"Ref/Código: {imovel_id}")
            if imovel_mode:
                imovel_line_parts.append(f"Finalidade: {imovel_mode}")
            if imovel_type:
                imovel_line_parts.append(f"Tipo: {imovel_type}")
            if imovel_price:
                imovel_line_parts.append(f"Preço: {imovel_price}")
            if imovel_address:
                imovel_line_parts.append(f"Endereço: {imovel_address}")
            session_summary_parts.append(
                "✅ IMÓVEL EM CONTEXTO (use o título na resposta de forma natural, não diga 'este imóvel' anonimamente): "
                + " | ".join(imovel_line_parts)
            )
            
            m_norm = str(imovel_mode or "").lower()
            if "vend" in m_norm:
                session_summary_parts.append(
                    "⚠️ ATENÇÃO: Este imóvel é SOMENTE PARA VENDA. É totalmente PROIBIDO perguntar se o cliente busca 'compra ou locação'. Vá direto ao ponto (ex: agendar visita, tirar dúvida da compra)."
                )
            elif "loca" in m_norm or "alug" in m_norm:
                session_summary_parts.append(
                    "⚠️ ATENÇÃO: Este imóvel é SOMENTE PARA LOCAÇÃO. É totalmente PROIBIDO perguntar se o cliente busca 'compra ou locação'. Vá direto ao ponto (ex: agendar visita, garantias)."
                )
            
            # Ajustando fala contextual para foto de acordo com o canal
            if "whatsapp" in canal:
                session_summary_parts.append(
                    "📸 FOTOS: Não é possível navegar visualmente por aqui. Responda orientando acionar um de nossos corretores para ver mais fotos do imóvel."
                )
            else:
                session_summary_parts.append(
                    "📸 FOTOS DISPONÍVEIS: Se o cliente pedir para 'ver opções', 'ver fotos', 'mostrar imagens', você DEVE setar 'exibir_fotos_galeria': true e responder: 'Claro, estou abrindo a galeria de fotos do imóvel para você analisar!'. NUNCA diga que não consegue mostrar."
                )

        if sessao.get("estagio_jornada"):
            session_summary_parts.append(f"Estágio da jornada: {sessao['estagio_jornada']}")
        if sessao.get("proxima_acao"):
            session_summary_parts.append(f"Próxima ação esperada: {sessao['proxima_acao']}")

        if session_summary_parts:
            session_memory_block = (
                "\n\n## MEMÓRIA DE SESSÃO PERSISTIDA (PRIORIDADE MÁXIMA — LEIA ANTES DE RESPONDER)\n"
                "As informações abaixo foram coletadas nesta sessão. "
                "CONTINUE a conversa de onde parou. "
                "NÃO reinicie. NÃO repita saudação. "
                "NÃO pergunte o que já está listado aqui. "
                "FALE de forma natural e direto ao ponto.\n\n"
                + "\n".join(f"- {p}" for p in session_summary_parts)
            )
            prompt += session_memory_block

        # ── Injection: is_first_turn + setor atual ─────────────────────────────
        is_first_turn = context.get("is_first_turn", True)
        turn_block = "\n\n## CONTEXTO DO TURNO ATUAL\n"
        if is_first_turn:
            turn_block += (
                "- PRIMEIRO CONTATO: Esta é a primeira mensagem do cliente nesta sessão.\n"
                "- USE a abertura oficial da Axis: curta, acolhedora, voltada para WhatsApp.\n"
                "- Não faça perguntas longas neste momento. Acolha e pergunte o assunto em uma linha.\n"
            )
        else:
            turn_block += (
                "- SESSÃO EM ANDAMENTO: Esta NÃO é a primeira mensagem.\n"
                "- PROIBIDO repetir a saudação de primeiro contato ('Olá! Eu sou a Axis...').\n"
                "- Continue o contexto da conversa diretamente. Seja breve e direto.\n"
                "- Se o cliente mandar 'oi' ou 'olá' novamente, responda de forma curta e siga o contexto.\n"
            )

        # Setor identificado no acumulado
        setor_atual = sessao.get("setor_provavel")
        if setor_atual:
            setor_label = {"comercial": "Comercial", "administrativo": "Administração", "financeiro": "Financeiro"}.get(setor_atual, setor_atual)
            turn_block += (
                f"- SETOR JÁ IDENTIFICADO: {setor_label}. Não reclassifique sem motivo.\n"
                f"  Inclua no campo 'sugestoes_de_cta' o label '{setor_label}' como primeiro CTA.\n"
            )

        prompt += turn_block
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
            
            # Anti-loop state override
            if result.get("etapa_da_conversa") == "recepcao" and nome_efetivo:
                result["etapa_da_conversa"] = "qualificacao"
            
            print(f"[OpenAI] canal={canal} etapa={result.get('etapa_da_conversa')} setor={result.get('setor_destino')} nome={result.get('nome_cliente')} handoff={result.get('handoff_recomendado')}")
            return result
        except Exception as e:
            print(f"OpenAI Error: {e}")

            def _detect(msg: str) -> dict:
                m = (msg or "").lower()
                if any(k in m for k in ["repasse", "extrato", "prestação de contas", "prestacao de contas", "imposto de renda", "ir ", "i.r."]):
                    return {"setor": "financeiro", "intencao": "repasse", "sub": "extrato" if "extrato" in m else None, "repasse_flag": True}
                if any(k in m for k in ["segunda via", "2a via", "2ª via", "boleto", "comprovante", "pagamento", "vencimento", "multa", "juros", "cobran", "atraso"]):
                    return {"setor": "financeiro", "intencao": "boleto", "sub": "segunda_via" if ("via" in m or "boleto" in m) else None}

                if any(k in m for k in ["vazamento", "sem luz", "curto", "inund", "urgente", "manuten", "quebrou", "vazando"]):
                    urgente = any(k in m for k in ["urgente", "inund", "curto", "sem luz", "vazamento"])
                    return {"setor": "administrativo", "intencao": "manutencao", "sub": "urgente" if urgente else None, "urgente": urgente}
                if any(k in m for k in ["documenta", "contrato", "análise cadastral", "analise cadastral", "assinatura", "vistoria", "renova", "rescind", "rescisao", "rescisão", "seguro", "fiança", "fianca", "quando vence", "prazo do contrato", "aditivo"]):
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

                saud = ""  # Removido prefixo repetitivo "Perfeito, {nome}!"
                
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
                            f"{imovel_line}Entendi. Para eu direcionar corretamente: você é proprietário (recebe repasse) ou locatário (paga boleto)? Me diga também o mês/período que você quer consultar.",
                            ["Consultar repasse", "Solicitar extrato", "Falar com financeiro"],
                            "qualificacao",
                            "financeiro",
                        )
                    return (
                        f"{imovel_line}Entendi. Você precisa de boleto/2ª via ou enviar comprovante? Me informe o mês de referência e, se tiver, o número do contrato/imóvel para eu encaminhar ao financeiro.",
                        ["Solicitar segunda via", "Enviar comprovante", "Falar com financeiro"],
                        "qualificacao",
                        "financeiro",
                    )

                if intent.get("setor") == "administrativo":
                    if intent.get("intencao") == "manutencao":
                        if intent.get("urgente"):
                            return (
                                f"{imovel_line}Entendi que é URGENTE. Há risco imediato (inundação, curto-circuito, choque) e qual o imóvel/contrato? Me descreva em 1 frase o que está acontecendo agora.",
                                ["Descrever Urgência", "Acompanhar manutenção", "Falar com administrativo"],
                                "encaminhamento",
                                "manutencao_prioritaria",
                            )
                        return (
                            f"{imovel_line}Certo. Para eu acionar o administrativo/manutenção: qual o imóvel/contrato e qual o problema? Se tiver fotos, me diga que você tem que eu te oriento.",
                            ["Descrever problema", "Acompanhar manutenção", "Falar com administrativo"],
                            "qualificacao",
                            "administrativo",
                        )
                    return (
                        f"{imovel_line}Entendi. Para eu encaminhar ao administrativo com precisão, me diga qual contrato/imóvel está relacionado e se é documentação, assinatura, renovação ou rescisão.",
                        ["Informar contrato", "Enviar documentos", "Falar com administrativo"],
                        "qualificacao",
                        "administrativo",
                    )

                if intent.get("setor") == "comercial":
                    if intent.get("intencao") == "financiamento":
                        return (
                            f"{imovel_line}Ótimo — financiar é um caminho comum. Você prefere fazer uma simulação agora ou falar com um especialista para planejar as melhores condições?" + (
                                f" Como este imóvel é para {modo.lower()}, já sigo por esse caminho." if modo in ("Venda", "Locação") else ""
                            ),
                            ["Fazer simulação", "Falar com especialista", "Agendar visita"],
                            "conducao",
                            "comercial",
                        )
                    if intent.get("intencao") == "agendar_visita":
                        return (
                            f"{imovel_line}Perfeito. Qual dia e horário você prefere para a visita? Se quiser, me diga também seu WhatsApp para confirmação.",
                            ["Agendar agora", "Ver outros horários", "Especialista comercial"],
                            "qualificacao",
                            "comercial",
                        )
                    if intent.get("intencao") in ("comprar_imovel", "alugar_imovel", "imovel_especifico"):
                        # Normalize mode for safer comparison (handles encoding issues)
                        m_norm = (str(modo or "")).lower()
                        if "vend" in m_norm:
                            suffix = "Como este imóvel é para venda, posso te ajudar a agendar visita ou preparar uma proposta."
                        elif "loca" in m_norm:
                            suffix = "Como este imóvel é para locação, posso te ajudar com visita e documentação para fechamento."
                        else:
                            suffix = "Você busca compra ou locação?"
                        return (
                            f"{imovel_line}{suffix} Qual é seu objetivo agora: agendar visita, receber mais detalhes ou fazer proposta?",
                            ["Agendar visita", "Mais detalhes", "Fazer proposta", "Ver fotos extras"],
                            "conducao",
                            "comercial",
                        )
                    if intent.get("intencao") == "anunciar_imovel":
                        return (
                            f"Perfeito. Para começarmos uma avaliação: qual o tipo do imóvel, bairro/endereço e o valor que você tem em mente? Se tiver fotos, isso ajuda bastante.",
                            ["Avaliação profissional", "Especialista de captação"],
                            "qualificacao",
                            "comercial",
                        )

                # Resposta caso nenhuma intent seja acionada
                if nome and context.get("current_state") == "recepcao":
                    msg = f"Olá, {nome}! Eu sou a Axis, assistente virtual da Ética. Me conte: você precisa de ajuda com imóveis (comprar/alugar) ou assuntos administrativos/financeiros (boletos/contratos)?"
                else:
                    msg = "Eu sou a Axis, assistente virtual da Ética. Como posso te ajudar hoje? Você pode falar sobre imóveis, boletos, contratos ou manutenção."

                return (
                    msg,
                    ["Comprar", "Locação", "Boletos", "Repasses", "Documentação"],
                    "qualificacao" if nome else context.get("current_state", "recepcao"),
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
                "exibir_fotos_galeria": any(k in (user_message or "").lower() for k in ["foto", "imagem", "imagens", "ver o imóvel", "ver esse imóvel"]),
                "sugestoes_de_cta": ctas
            }
