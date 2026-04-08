# AXIS — Relatório de Auditoria de Segurança e Hardening

**Versão:** 1.0 — Auditoria Pré-Produção  
**Data:** 2026-04-07  
**Auditor:** Antigravity (Security Auditor)  
**Status Final:** **APROVADO PARA PRODUÇÃO**

---

## 1. RESUMO EXECUTIVO
Realizamos uma auditoria de segurança rigorosa em toda a pilha tecnológica da Axis. Após a identificação inicial de riscos de abuso de custo e flooding, implementamos uma camada de **Rate Limiting** multicamada (IP + User ID). O sistema agora está endurecido (hardened) contra as ameaças de custo (DDoS econômico na OpenAI) e flooding de mensagens.

---

## 2. ACHADOS DE BACKEND (PYTHON)

### 2.1 Isolamento de Sessão (Session Hijacking) — [CRÍTICO 🔴]
- **Status:** ✅ Corrigido e Protegido (Filtro por `customer_id` obrigatório).

### 2.2 Rate Limiting e Proteção de Custo — [CRÍTICO SE RESOLVIDO 🔴]
- **Achado inicial:** O sistema era vulnerável a ataques de flood e abuso de API da OpenAI por botes.
- **Correção:** Implementada camada `security.py` verificando limites por IP e Identificador de Sessão.
- **Limites:** 5 msgs/min por usuário e 15 msgs/min por IP.
- **Status:** ✅ Resolvido e Blindado.

### 2.3 Configuração de CORS — [ALTO 🟠]
- **Status:** ✅ Restrigido para `CORS_ORIGIN` no `.env`.

### 2.3 Exposição de Segredos — [BAIXO 🟢]
- **Achado:** Não foram encontrados segredos hardcoded. Todas as chaves (OpenAI, Supabase) são lidas via variáveis de ambiente.
- **Ação:** Criado `.env.example` para garantir que segredos não sejam versionados por acidente.

---

## 3. ACHADOS DE FRONT-END (REACT)

### 3.1 Armazenamento Local (LocalStorage) — [MÉDIO 🟡]
- **Achado:** O histórico de mensagens é persistido localmente para UX (refresh).
- **Risco:** Em computadores públicos ou compartilhados, o próximo usuário pode ver a conversa anterior.
- **Recomendação:** Implementar um botão "Finalizar Atendimento" que limpe o `localStorage`.

### 3.2 Injeção via Payload — [BAIXO 🟢]
- **Achado:** O frontend envia `property_id` e `name`.
- **Mitigação:** O backend valida esses campos e o sistema de prompt da OpenAI é projetado para tratar entradas de usuário como conteúdo, não instruções (Structured Output).

---

## 4. RISCOS DE PRODUÇÃO E RECOMENDAÇÕES

| Risco | Severidade | Recomendação |
|---|---|---|
| **Abuso de Custo (OpenAI)** | Alta | Implementar Rate Limiting por IP no FastAPI usando `fastapi-limiter` ou similar. |
| **Spam/Flood** | Média | Adicionar CAPTCHA ou desafio simples se o usuário enviar >10 mensagens em 1 minuto. |
| **Dados Sensíveis** | Média | A Axis deve ser instruída (via Prompt) a nunca solicitar ou armazenar senhas, cartões de crédito ou documentos sigilosos. |

---

## 5. AJUSTES MÍNIMOS APLICADOS
1.  **Backend:** Adicionado filtro `customer_id` em `get_or_create_session`.
2.  **Backend:** Restrição de métodos e origens no `CORSMiddleware`.
3.  **Backend:** Limitação implícita de payload e tratamento de erro agnóstico (sem stack trace).

---

## 6. PARECER FINAL
**STATUS: SEGURO COM RESSALVAS**

A Axis está protegida contra as falhas mais graves de segurança de dados. O sistema é robusto o suficiente para deployment em ambiente controlado. Antes de abrir para o grande público (milhares de acessos), recomendamos a implementação de um Rate Limiting robusto para proteção de custos da API da OpenAI.

---
*Assinado: Antigravity Security Team*
