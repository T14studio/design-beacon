# AXIS — Especificação Operacional
**Versão:** 2.0 — Endurecimento Técnico e Formalização Operacional
**Status:** Pronto para Modelagem Arquitetural (Supabase / n8n / Integrações)
**Classificação:** Documentação Técnica Normativa

---

## 1. RESUMO EXECUTIVO
Este documento define a arquitetura lógica e o modelo operacional da assistente virtual Axis. A especificação formaliza a Assistente como uma **Máquina de Estados Finita (FSM)** acoplada a um **Motor de Decisão Cíclica**. O sistema visa interceptar, qualificar e normalizar entradas não estruturadas de usuários, convertendo-as em um payload estruturado (Handoff Output) para consumo de sistemas backend (CRMs, ERPs) e filas de atendimento humano, operando sob políticas estritas de transição, qualificação e priorização.

---

## 2. MODELO OPERACIONAL DO AGENTE
A Axis atua como camada de middleware conversacional (routing e extração de dados).

**Diretrizes Operacionais de Runtime:**
- **Recepção Assíncrona:** Processar payloads de entrada oriundos de múltiplos canais (ex.: WhatsApp, Web Chat).
- **Extração Semântica Cíclica:** A cada requisição, executar Natural Language Understanding (NLU/LLM) para extrair `intent`, `entities`, `confidence_score` e `behavioral_flags`.
- **Validação de Estado:** Confrontar as entidades extraídas com as políticas de qualificação da intenção detectada.
- **Roteamento Dinâmico:** Definir a próxima ação do sistema (solicitar dado faltante `request_entity`, confirmar contexto `confirm_context`, ou executar transbordo `execute_handoff`).

---

## 3. MÁQUINA CONVERSACIONAL (FSM)

A arquitetura conversacional opera fundamentalmente em um pipeline linear restrito, suscetível a modificadores de interrupção (overrides).

### 3.1 Estados Padrão

#### **Estado 1: `recepcao`**
- **Definição:** Ponto de entrada da sessão de interação.
- **Objetivo Escopo:** Apresentar a assistente e obter a declaração inicial do usuário.
- **Critério de Entrada:** Início de sessão (`session_start` evento ou janela expiada).
- **Critério de Saída:** Recepção de input textual não nulo pelo usuário.
- **Transição Permitida:** → `diagnostico`

#### **Estado 2: `diagnostico`**
- **Definição:** Fase de classificação semântica.
- **Objetivo:** Estabelecer a `intencao_principal` baseada no `intent_map`.
- **Critério de Entrada:** Payload de usuário pendente de classificação.
- **Critério de Saída:** Classificação atinge `confidence_score` mínimo predefinido.
- **Transições Permitidas:** → `qualificacao` | → `fallback_reconhecimento`

#### **Estado 3: `qualificacao`**
- **Definição:** Fase iterativa de coleta de parâmetros (slot filling).
- **Objetivo:** Preencher as entidades obrigatórias (`dados_minimos`) da intenção mapeada.
- **Critério de Entrada:** Intenção identificada e transicionada de `diagnostico`.
- **Critério de Saída:** Array `dados_minimos` satisfeito, limite de repetições atingido ou override acionado.
- **Transições Permitidas:** → `conducao` | → `encaminhamento`

#### **Estado 4: `conducao`**
- **Definição:** Refinamento do contexto antes do handoff estruturado.
- **Objetivo:** Desambiguar referências múltiplas e sumarizar a requisição.
- **Critério de Entrada:** `dados_minimos` validados.
- **Critério de Saída:** Confirmação explícita ou tácita gerada pelo LLM/usuário.
- **Transições Permitidas:** → `encaminhamento`

#### **Estado 5: `encaminhamento`**
- **Definição:** Estado final do pipeline lógico de sessão da assistente.
- **Objetivo:** Compilar o JSON `HandoffOutput`, despachar para o sistema destino e acionar SLA inicial ao usuário.
- **Critério de Entrada:** Condições de Handoff satisfeitas (Suficiência de dados ou Override Comportamental).
- **Critério de Saída:** Resposta ao webhook submetida; notificação enviada.
- **Transições Permitidas:** → `acompanhamento` (opcional) | Fim de Sessão.

---

### 3.2 Estados de Exceção (Exceptions & Overrides)

Esses estados suplantam o fluxo padrão ao serem ativados pelas avaliações do Motor de Decisão.

- **`urgencia_priorizada`**: Pula o pipeline imediatamente para `encaminhamento` ao detectar flag booleana de urgência do tipo ameaça física ou operacional severa (ex: vazamentos). Transição forçada `bypass_to_handoff`.
- **`atendimento_humano_direto`**: Ocorre na detecção explícita da obrigatoriedade do operador humano. Exige coleta de `assunto_base` (1 turno max) e transiciona para `encaminhamento`.
- **`fallback_loop`**: Excedidos `max_retries` (padrão 3 tentativas) no mesmo estado buscando um input válido. Destino: `encaminhamento` com prioridade técnica.

---

## 4. MOTOR DE DECISÃO POR TURNO

Cada requisição recebida (Turno) submete-se ao seguinte Pipeline de Decisão Cíclico:

1. **Hydration (Recuperação de Contexto)**
   - Carregar log da sessão: `current_state`, `collected_data` armazenados, e limites (`loop_counters`).
2. **Extraction Engine (Processamento NLU)**
   - Processa o `input` para extrair:
     - `var_intent`: (slug do intent_map ou nulo)
     - `arr_entities`: Entidades nomeadas (nome, contrato, tipologia, valor)
     - `flags_comportamentais`: `bol_urgency`, `bol_frustration`, `bol_commercial_heat`, `bol_human_request`.
3. **Override Evaluation (Modificadores Comportamentais)**
   - Avalia flags Críticas.
   - SE verdadeiro, aborta regras em esteira e altera a respectiva prioridade, roteando diretamente para `conducao` -> `encaminhamento`.
4. **Validation (Conciliação vs Regras de Domínio)**
   - Caso `is_critical` falso:
     - Avalia `current_state`.
     - Verifica a lista de `required_entities` do domínio identificado vs `arr_entities` + `collected_data`.
     - Determina lista `missing_entities`.
5. **Resolution Action (Determinação do Output)**
   - SE `missing_entities` vazio OU `loop_counter > limit`: `Action = Execute_Handoff`
   - SENÃO: `Action = Request_Missing_Entity(target)`
6. **Persistence**
   - Grava novo estado e dados atualizados no DB e emite a resposta ao usuário.

---

## 5. POLÍTICA DE QUALIFICAÇÃO E SUFICIÊNCIA

A coleta de dados é orientada a eficiência. Respostas prolongadas (fricção) geram quebra operacional.

- **Dado Obrigatório (`dados_minimos`)**: Requerimento estrito do fluxo. A sessão paralisa a progressão da FSM para exigi-lo. Limite: Pode ser cobrado no máximo **2 vezes**.
- **Dado Complementar (`dados_desejaveis`)**: Cores, vagas de garagem ou detalhes finos. Coletados caso o usuário proativamente declare no turno do `dados_minimos`. Nunca gerar interrupção de fluxo para extraí-los primariamente.
- **Suficiência para Handoff (`handoff_ready`)**: Estado atingido quando `dados_minimos` possuem valores (mesmo que esses valores resolvam explicitamente como `null` ou `not_provided` após estouro do `loop_counter`).
- **Política de Incompletude Acceptável**: Se após 2 turnos solicitando "O número do contrato", o usuário não fornecer, a FSM preenche a variável com "não informado_timeout" e aprova a Suficiência para o transbordo. O backend acatará o handoff.

---

## 6. FLUXOS OPERACIONAIS POR DOMÍNIO

### 6.1 Domínio Comercial e Captação
- **Gatilhos (`intents`)**: `compra_imovel`, `locacao_imovel`, `agendar_visita`, `interesse_anuncio`, `anunciar_imovel`, `avaliacao_de_imovel`, `simulacao_financiamento`.
- **Ambiguidade Principal Tratada**: Ausência de destinação (Locação vs Venda).
- **Dados Obrigatórios (Interessado)**: `nome_cliente`, `tipo_interesse` (compra/aluguel), `referencia_imovel` (ID, região).
- **Protocolo de Alta Conversão (Venda):**
    - **Materialização do Imóvel:** Obrigatoriedade de citar o nome do imóvel (ex: "Vi que você está olhando o Flat Prime").
    - **Subfluxo de Financiamento:** Se detectado interesse em crédito/parcelas, a Axis deve ofertar `Fazer simulação` ou `Falar com Especialista`. Marcar `subintencao: simulacao_financiamento`.
    - **Sugestão de CTAs:** Injetar botões contextuais no campo `sugestoes_de_cta`: `['Agendar visita', 'Simular financiamento', 'Falar com especialista']`.
- **Fluxo de Captação/Anúncio (Interessado em Vender/Anunciar):**
    - **Dados Obrigatórios:** `nome`, `tipo_de_imovel`, `endereco`, `valor_pretendido`, `possui_fotos`.
    - **Regra:** Sugerir **Avaliação Profissional** como primeiro passo de valor.
    - **Resultado:** Alimentar `anuncio_apto_ou_nao` (true se endereço, tipo e valor estiverem claros).
- **Contextualização com o Site**: Caso Request.Origin = ImovelView, ignorar coleta de `referencia_imovel` e assumir interesse explícito. Marcar `contexto_do_site_identificado: true`.
- **Critério de Handoff**: `dados_obrigatorios` validados, checklist preliminar aprovado OU flag `commercial_heat` detectada. Handoff imediato se o cliente confirmar intenção de visita ou proposta.
- **Destino Operacional**: Fila Comercial (`comercial`).

### 6.2 Domínio Administrativo (Locatários, Proprietários e Manutenção)
- **Gatilhos (`intents`)**: `contrato`, `vistoria`, `documentacao`, `rescisao`, `manutencao_regular`, `fechamento_de_locacao`.
- **Perfil Locatário**:
    - Foco em: `documentacao_pendente`, `manutencao`, `vistoria`.
    - Dados mínimos: `referencia_imovel`, `assunto_base`.
- **Perfil Proprietário**:
    - Foco em: `documentacao_imovel`, `extrato`, `repasse`.
- **Fluxo de Manutenção:** 
    - Ao identificar falha física, classificar como `manutencao_requer_chamado: true`.
    - Classificar se é urgente (vazamento, energia) para disparar `setor_destino: manutencao_prioritaria`.
- **Critério de Handoff**: Entendimento das evidências mínimas do problema ou documentos pendentes identificados.
- **Destino Operacional**: Fila Administrativa ou Base Técnica de Manutenção (`administrativo`).

### 6.3 Domínio Financeiro (Repasse e Cobrança)
- **Gatilhos (`intents`)**: `boleto`, `repasse`, `extrato_ir`, `baixa_titulos`, `cobranca`, `comprovante`, `segunda_via`.
- **Diferenciação de Perfil (Mandatório):**
    - **Locatários:** Foco em `boleto`, `segunda_via`, `vencimento` e `comprovante`.
    - **Proprietários:** Foco em `repasse`, `extrato` e `prestacao_contas`. Marcar `repasse_ou_extrato_solicitado: true`.
- **Tratamento de Cobrança e Sensibilidade:**
    - Casos de contestação ou atraso devem ser tratados com calma e objetividade.
    - **Regra:** Nunca debater regras de multa/juros no chat; encaminhar direto para análise humana se o cliente persistir na dúvida.
- **Sugestão de CTAs Financeiros:** No campo `sugestoes_de_cta`, injetar botões lógicos: `['Solicitar segunda via', 'Enviar comprovante', 'Consultar repasse', 'Solicitar extrato']`.
- **Ambiguidade Principal Tratada**: Solicitações financeiras genéricas sem identificar quem é a pessoa ou qual o mês de referência.
- **Dados Obrigatórios**: `nome_cliente`, `referencia` (imóvel/contrato), `competencia` (ex: boleto de maio).
- **Destino Operacional**: Fila Financeira (`financeiro`).

---

## 7. POLÍTICA DE PRIORIDADE E SENSIBILIDADE (OVERRIDES)

A política de Override atua como gatilho de escalonamento. Subdivide-se em 5 modificadores primários de prioridade.

1. **`urgencia_critica`**: Identificação de danos materiais iminentes ou risco à vida.
   - **Regra**: Bypass FSM -> Envio para `manutencao_prioritaria` ou `prioridade_alta`.
2. **`frustracao_escalada`**: Identificação de reclamações graves ou menção a órgãos reguladores.
   - **Regra**: Resposta com empatia normativa. Transição direta para `prioridade_alta` (atendimento_humano).
3. **`alta_intencao_comercial` (Lead Quente)**: Cliente propõe reserva ou visita rápida.
   - **Regra**: Elevar escalão para `comercial_alta`. Priorizar handoff com `origem_do_contexto_do_imovel`.
4. **`pedido_humano_explicito` (Fallback final)**: O cliente exige falar com uma pessoa.
   - **Regra**: A Axis tenta mitigar **uma única vez** ("Posso tentar agilizar por aqui primeiro?"). Se insistir, handoff imediato para `atendimento_humano` como último recurso.
5. **`comportamento_multiassunto`**:
   - **Regra**: Elege o assunto de maior impacto (Urgência > Financeiro > Administrativo) e consolida os demais no `resumo_do_caso`.

---

## 8. POLÍTICA DE FALLBACK TÉCNICO

Estruturada em níveis de mitigação:
- **Fallback Nível 1 - Reconhecimento Difuso (Low Confidence Score)**: Score NLU insatisfatório. Exige nova representação da declaração (Recalculate Intent). Tentativas max: 2.
- **Fallback Nível 2 - Referência Ambígua Cíclica**: "Eu quero do meu apartamento". 2x sem especificar bloco/condomínio. Resolvido aceitando entrada Nula e escalacionando para humano com prioridade normal e tracking da `missing_entity`.
- **Fallback Nível 3 - Filetype Compatibility (Mídia Indisponível)**: Reconhecimento de `MIME type` não suportado (Audio > 30s sem ASR habilitado, Arquivos PDF pesados pré envio). Declina a análise do arquivo nativamente, solicita contexto em texto. Força bypass para humano logo em seguida.

---

*(Fim do Documento Operacional Mestre)*
