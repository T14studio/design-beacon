# Axis - Relatório de Homologação Severa (QA Conversacional)

**Status Final:** **REPROVADO (COM RESSALVAS CRÍTICAS)**

## 1. Resumo Executivo
Os testes demonstraram que a arquitetura do backend (FastAPI, integrações com Supabase e OpenAI) está totalmente funcional, apresentando extrema estabilidade, respostas coerentes de API e persistência no banco. No entanto, o agente falhou repetidas vezes em testes críticos de preservação de contexto persistente e condução progressiva de diálogos prolongados, apresentando "amnésia" na continuidade de fluxos de qualificação, notadamente no fornecimento posterior do nome e reinícios da conversa.

## 2. Resultado por Cenário Obrigatório

| Cenário | Mensagem | Status | Observações Finais |
|---------|----------|--------|--------------------|
| 1. Saudação Genérica | "Oi, preciso de ajuda" | ✅ Aprovado | Acolhimento claro e introdução eficiente. |
| 2. Compra | "Quero comprar um imóvel" | ✅ Aprovado | Trilha setada para `comercial`. Questionou o tipo de imóvel (após ajuste). |
| 3. Aluguel | "Quero alugar uma casa" | ✅ Aprovado | Conduziu para coleta de mais detalhes, vinculando setor `comercial`. |
| 4. Imóvel Específico | "Tenho interesse no REF334" | ✅ Aprovado | Usou a referência no atendimento, solicitou o nome com naturalidade. |
| 5. Visita | "Quero visitar esse imóvel amanhã" | ✅ Aprovado | Identificou o CTA quente e prosseguiu qualificando. |
| 5.1. Informar Nome | "Meu nome é Ricardo" | ❌ Falha Severa | Assistente perdeu o contexto do imóvel que Ricardo queria visitar e voltou para saudação genérica. |
| 6. Locatário Urgência | "Estou com um vazamento urgente" | ✅ Aprovado | Handoff disparou corretamente para `manutencao_prioritaria`. Sensibilidade de urgência ótima. |
| 7. Proprietário Fin. | "Quero saber do meu repasse" | ✅ Aprovado | Roteamento correto para `financeiro`, com coleta do imóvel. |
| 8. Contrato/Doc | "Preciso de ajuda com contrato e locação..." | ✅ Aprovado | Departamento roteado imediatamente para `administrativo`. |
| 9. Cobrança | "Preciso da segunda via do boleto" | ✅ Aprovado | Vinculado corretamente ao `financeiro`. |
| 10. Pedido Humano | "Quero falar com um atendente agora" | ✅ Aprovado | Acolhimento da frustração sem forçar a barra, setor designado `atendimento_humano`. |
| 11. Persistência de Sessão | "Pode me ajudar agora?" | ❌ Falha Severa | Assistente ignorou completamente o histórico prévio de Ricardo e perguntou as informações do zero (Amnésia). |

## 3. Avaliação Qualitativa Específica

1. **Captura de Nome:** *Funcional, mas inconsistente.* Na maioria das interações novas, Axis pediu o nome com graça e educação, de forma amigável. Porém, em cenários avançados onde o cliente soltou o nome no meio da jornada, Axis se perdeu entre capturar o dado e seguir os próximos passos.
2. **Uso do Nome:** *Excelente, quando não esquece o contexto.* Axis adotou o nome Ricardo perfeitamente ("Olá, Ricardo! Como posso ajudar...").
3. **Persuasão:** *Melhorada.* O tom da IA (com base na Temperature aumentada de 0.3 para 0.7 e ajustes de prompt) esteve mais solto, persuasivo, atuando de fato de forma orientada a ações sem a lentidão robótica. 
4. **Condução Comercial:** *Mediana (sujeita a Contexto).* A IA consegue manter engajamento primário excelente e extrair as dores. Entretanto, quando a cadeia ("quero isso" -> "meu nome é X" -> "então marque...") aumenta, ela retrocede o stage pra `recepcao`.
5. **Roteamento por Departamento:** *Soberbo após correção.* Identificou precisamente o financeiro para repasses, administrativo para minutas e manutenção para vazamentos com handoffs instantâneos.
6. **Naturalidade:** *Boa.* Responde diretamente sem formalidade plástica irrealista, embora às vezes pergunte "Como posso ajudá-lo hoje?" no decurso da conversa.

## 4. Falhas Críticas Encontradas

* **Inconsistência Massiva da Ordem Histórica do Banco:** Inicialmente o Supabase coletava as mensagens em format `.asc` limitando na *primeira dezena histórica*, fazendo a IA descartar todas as mensagens cruciais mais recentes em diálogos maiores.
* **Duplicação de Input Contextual (Race Conditions de Estado):** O script `main.py` enviava o contexto "atual" e adicionava a mensagem recém-salva na DB em duplicidade, o que "baralhava" os tokens no OpenAI.
* **Amnésia de Sessão e Override (`Não Informado`):** Passar o hardcode `Não Informado` nos metadados suprimia o LLM de ler os nomes em texto livre nos turnos de diálogo contínuo se fossem apenas texto. Além disso, a premissa de `current_state = recepcao`, sem amarra protetiva, faz com que uma simples retomada seja vista pelo LLM como o reinício absoluto da conversa comercial.

## 5. Ajustes Mínimos Aplicados para Correção e Estabilização

Durante a homologação, intervimos tecnicamente nos seguintes pilares (sem desviar de arquiteturas):
1. **`supabase_service.py`:** Alterada a engine de `get_messages` para `created_at.desc`, garantindo que apenas as mensagens *mais recentes* fossem puxadas ao limiar de 10 mensagens e formatando-as no sentido inverso para leitura serial da OpenAI.
2. **`openai_service.py`:** Elevada a propensão criativa (`temperature = 0.7`) conferindo um discurso mais eloquente para uma atuação comercial convincente, superando a casca burocrática e "seca" avaliada com 0.3.
3. **`main.py (Backend Flow)`:** Corrigida severamente a orquestração do array de mensagens do usuário. Agora o bot busca a persistência *antes* de injetar e salvar no Supabase, removendo duplicidades contextuais causadoras de desfoque. Reescrito o schema sem null overrides coercitivos (remoção de overrides nulos que destruíam estado das varíaveis coletadas).
4. **`system_prompt.md`:** Regras restritivas adicionais foram injetadas ordenando o assinalamento *imediato* de `setor_destino` logo que inferido (permitindo roteamento dinâmico instantâneo na Compra/Aluguel sem esperar Handoff total).

## 6. Evidências Técnicas e Operacionais (Auditoria Integrada)

* **Supabase Records:** Persistência impecável (`200 OK` rastreados para session_tables, message logs e customers logados em tempo real na saída do uvicorn FastAPI durante o teste server-side). A inversão de ordem sanou a amnésia primária.
* **Handoff Disparado:** O sistema comprovou emissão do campo `setor_destino: manutencao_prioritaria` via status JSON Handoff = TRUE no momento do "vazamento".

## 7. Parecer Final (Gatekeeper Review)
A infraestrutura Python e as chaves estão magistrais para a fundação. As premissas básicas de captura e classificação departamental hoje são **altamente precisas, operacionais e muito melhores do que heurísticas cruas do Twilio**. 
Apesar dos ajustes sanarem os absurdos de roteamento e tom, o projeto está **Reprovado por Falha Crítica de Condução (Contexto)** nas fases maduras da jornada de venda (Caminhadas 5.1 e 11).

Para a homologação definitiva da sua assistente número 1, é exigido um ajuste fundamental que não pôde ser mitigado apenas alterando a infra via "Ajustes mínimos": **Você precisará injetar uma dependência de Tracking de Estados** (fazer o state ser iterativo e não dependente da falha do LLM enxergar "recepção") ou forçar o banco e front-end a passar o state `qualificacao/conducao` como variável de sessão dura que não permite o LLM regredir o atendimento à vontade. 
Enquanto isso não for blindado, a Axis tenderá a rodar em loop como se apresentasse amnésia em leads longos (que são valiosos em Imóveis). Tratar o contexto no array resolvendo o State Tracking tornará a Axis apta e revolucionária no atendimento imobiliário.
