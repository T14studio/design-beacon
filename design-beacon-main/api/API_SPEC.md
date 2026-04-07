# AXIS Middleware API - Especificação
**Versão:** 1.0

A camada de API serve como intermediária (n8n ou Backend em Node/Python) que recebe os dados do canal, processa a lógica corporativa e grava no Supabase. O n8n é perfeito para rotear essas rotas graficamente.

## Variáveis Globais (Headers Required)
- `Authorization: Bearer <TOKEN>` (Camada JWT Base)

---

## 1. Recepção de Canais (Webhook Inbound)

### `POST /v1/webhooks/{channel}/incoming`
Endpoint público (ou protegido por signature) que WhatsApp/Site chamam.
**Parameters:** `{channel}`: `whatsapp` | `site`
**Request Payload (Exemplo WhatsApp API):**
```json
{
  "from": "5511999999999",
  "text": "Preciso cancelar meu contrato agora!",
  "timestamp": "1775424930"
}
```
**Ação Interna:** O Controller de Webhook busca no Supabase se existe uma `session` ativa para este ID. Se sim, roteia para `/v1/engine/respond`. Se não, cria a sessão e roteia.

---

## 2. Motor de Decisão (Core Axis)

### `POST /v1/engine/turn`
Executa o fluxo da Tabela Verdade descrita na Etapa 2.
**Request Payload:**
```json
{
  "session_id": "uuid-aqui",
  "message": "Preciso cancelar meu contrato agora!"
}
```
**Resumo do Processo no n8n / Backend:**
1. Insere mensagem na tabela `messages` (role: user).
2. Recupera `session` (current_state, collected_data).
3. Envia contexto + input atual para LLM (Extraction).
4. Aplica Overrides.
5. Emite Request textual ("Entendi. Qual seu contrato?") ou Handoff ("Entendi, transferindo...").
6. Atualiza Supabase `sessions`.
7. Insere mensagem `messages` (role: assistant).

**Response Payload:**
```json
{
  "action": "reply",
  "message_out": "Você quer rescindir, correto? Pode me informar qual o imóvel?",
  "new_state": "qualificacao"
}
```

---

## 3. Emissão de Handoff

### `POST /v1/engine/handoff`
Acionado internamente pela API quando a Axis detecta `handoff_ready = true`.

**Request Payload:**
```json
{
  "session_id": "uuid-aqui",
  "payload": { /* Conteúdo baseado no output_schema.json */ }
}
```
**Ações Internas:**
1. Insere na tabela `handoff_tickets`.
2. Faz UPDATE na `sessions` (`is_active = false`).
3. Dispara notificação para CRM / Socket do Corretor / Zenvia / Chatwoot.

---

## 4. Consulta de Sessão e Estado

### `GET /v1/sessions/{session_id}`
Retorna a fotografia atual da conversa e dados colhidos.
**Response:**
```json
{
  "id": "uuid-aqui",
  "channel_user_id": "5511999999999",
  "current_state": "qualificacao",
  "collected_data": {
    "intent_principal": "rescisao",
    "urgency": true
  }
}
```
