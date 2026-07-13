# AXIS — Guia de Importação e Homologação do Workflow n8n
**Arquivo:** `n8n/axis_workflow_homologacao.json`
**Data:** 2026-04-06

---

## BLOCO A — Validação Final de Consistência com o Banco Real

### Tabelas Confirmadas (Nomes Reais no Supabase)
| Conceito                | Nome Real da Tabela    | Status |
|-------------------------|------------------------|--------|
| Leads / Usuários        | `customers`            | ✅ Confirmado |
| Estado conversacional   | `sessions`             | ✅ Confirmado (NÃO "session_state") |
| Histórico de mensagens  | `messages`             | ✅ Confirmado |
| Transbordo humano       | `handoff_tickets`      | ✅ Confirmado (NÃO "tickets") |
| Catálogo de imóveis     | `properties`           | ✅ Criado via `properties_extension.sql` |

### Colunas Críticas do Runtime Confirmadas
| Tabela              | Coluna                | Tipo          | Notas |
|---------------------|-----------------------|---------------|-------|
| `sessions`          | `current_state`       | `estado_conversa` ENUM | FSM: recepcao→encaminhamento |
| `sessions`          | `collected_data`      | `JSONB`       | Dados coletados da conversa |
| `sessions`          | `detected_signals`    | `JSONB`       | urgency, frustration, commercial_heat |
| `sessions`          | `property_id`         | `UUID` FK     | Adicionado via `properties_extension.sql` |
| `sessions`          | `customer_id`         | `UUID` FK     | Via `schema_incremental_v1.sql` |
| `sessions`          | `intent_principal`    | `VARCHAR`     | Intenção principal detectada |
| `sessions`          | `subintencao`         | `VARCHAR`     | Via `schema_incremental_v1.sql` |
| `sessions`          | `estagio_jornada`     | ENUM          | lead_novo→desligamento |
| `sessions`          | `nlu_confidence_score`| `NUMERIC`     | 0.00 a 1.00 |
| `sessions`          | `loop_counter`        | `INT`         | Contador de turnos |
| `sessions`          | `handoff_ready`       | `BOOLEAN`     | Flag de transbordo |
| `sessions`          | `is_active`           | `BOOLEAN`     | false após handoff |
| `handoff_tickets`   | `setor_destino`       | ENUM          | comercial, financeiro... |
| `handoff_tickets`   | `prioridade`          | `VARCHAR`     | normal, alta, comercial_alta |
| `handoff_tickets`   | `payload`             | `JSONB`       | Output completo da Axis |
| `handoff_tickets`   | `property_id`         | `UUID` FK     | Adicionado via `properties_extension.sql` |
| `properties`        | `property_code`       | `VARCHAR(50)` UNIQUE | Ex: REF001 |
| `properties`        | `status`              | `property_status` ENUM | disponivel, reservado... |
| `properties`        | `purpose`             | `property_purpose` ENUM | venda, locacao, ambos |

### ⚠️ Ajustes de Alinhamento Aplicados no Workflow
1. **`estagio_jornada`** (nome real na tabela) ≠ `estagio_da_jornada` (nome no output da Axis). O Node 15 converte corretamente.
2. **`property_id` nulo** → Todos os INSERTs/PATCHes usam expressão ternária (`property ? id : null`) para não quebrar a FK.
3. **`setor_destino`** no enum da tabela precisa bater exatamente com o output da Axis — garantido pelo schema strict da Responses API.

---

## BLOCO B — Instruções de Importação Passo a Passo

### 1. Executar SQLs (nesta ordem obrigatória)
```
1. database/schema.sql
2. database/schema_incremental_v1.sql
3. database/properties_extension.sql
4. database/properties_test_data.sql
```

### 2. Importar no n8n
1. Menu lateral → **Workflows → Import from file**
2. Selecione `n8n/axis_workflow_homologacao.json`
3. Workflow abre com 19 nodes conectados

### 3. Configurar Variáveis de Ambiente
Acesse: **Settings → Variables** e crie:

| Variável               | Valor                                                    |
|------------------------|----------------------------------------------------------|
| `SUPABASE_PROJECT_URL` | `https://hocrbyevkaothhnxptem.supabase.co`               |
| `SUPABASE_ANON_KEY`    | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (chave completa) |
| `OPENAI_API_KEY`       | `sua-chave-openai-aqui`                                  |

> **Nota:** Se operações de escrita falharem com RLS ativo, substitua `SUPABASE_ANON_KEY` por `SUPABASE_SERVICE_ROLE_KEY` nos nodes 04, 07, 10, 14, 15, 17, 18.

### 4. Ativar o Workflow
- Toggle **ON** no canto superior direito
- Copiar a URL do Webhook do Node 01 (ex: `https://seu-n8n.com/webhook/axis/v1/test`)

---

## BLOCO C — Payloads de Teste Prontos

### Teste 1 — Imóvel por Código (Alta Intenção)
```json
{
  "phone": "5511999887766",
  "channel": "api_test",
  "message": "Olá! Vi o imóvel REF001 no site e quero agendar uma visita pra essa semana."
}
```
**Expectativa:** `handoff_recomendado: true`, `setor_destino: comercial`, `prioridade: comercial_alta`, `property_id` salvo na session e no ticket.

---

### Teste 2 — Genérico Sem Imóvel
```json
{
  "phone": "5511999776655",
  "channel": "api_test",
  "message": "Boa tarde, estou procurando um apartamento para alugar no centro."
}
```
**Expectativa:** `handoff_recomendado: false`, `etapa: diagnostico`, Axis faz perguntas de qualificação.

---

### Teste 3 — Urgência
```json
{
  "phone": "5511999665544",
  "channel": "api_test",
  "message": "URGENTE! Tem um vazamento de água no teto do meu apartamento, está molhando tudo!"
}
```
**Expectativa:** `urgencia_detectada: true`, `setor_destino: manutencao_prioritaria`, ticket criado, sessão fechada.

---

### Teste 4 — Reclamação / Frustração
```json
{
  "phone": "5511999554433",
  "channel": "api_test",
  "message": "Já mandei mensagem 3 vezes essa semana e ninguém me respondeu. Isso é um absurdo."
}
```
**Expectativa:** `frustracao_detectada: true`, `motivo_do_handoff: frustracao`, `prioridade: atencao`.

---

### Teste 5 — Pedido de Humano
```json
{
  "phone": "5511999443322",
  "channel": "api_test",
  "message": "Não quero falar com robô. Me passa um atendente humano, por favor."
}
```
**Expectativa:** `motivo_do_handoff: pedido_humano`, `setor_destino: atendimento_humano`.

---

## BLOCO D — Checklist de Homologação

### Infraestrutura
- [ ] 4 SQLs executados em ordem no Supabase
- [ ] Workflow importado no n8n sem erros de parse
- [ ] 3 variáveis de ambiente configuradas
- [ ] Workflow ativo (toggle ON)
- [ ] URL do webhook anotada

### Teste 1 - Validar Fluxo Completo com Imóvel
- [ ] HTTP 200 com campo `reply` preenchido
- [ ] `customers`: novo registro criado
- [ ] `sessions`: `property_id` preenchido com UUID do REF001
- [ ] `messages`: 2 registros (user + assistant)
- [ ] `handoff_tickets`: ticket criado com `property_id` e `payload` completo

### Teste 2 - Validar Continuidade de Sessão
- [ ] Enviar 2ª mensagem com mesmo `phone` do Teste 1
- [ ] Sessão reaproveitada (mesmo `session_id`)
- [ ] `loop_counter` incrementado

### Teste 3 - Validar Urgência
- [ ] Ticket com `setor_destino: manutencao_prioritaria`
- [ ] `sessions.is_active = false`

### Qualidade da Axis
- [ ] Respostas sem menu de opções
- [ ] Tom conversacional e profissional
- [ ] `resumo_do_caso` preenchido nos tickets
- [ ] `proxima_acao` preenchido nos tickets
