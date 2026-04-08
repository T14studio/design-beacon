# Axis Python Backend (FastAPI)

Este é o backend direto da Axis focado no Website, substituindo n8n/Twilio por uma arquitetura nativa em Python conectada ao Supabase e OpenAI.

## Arquitetura
Site -> FastAPI -> OpenAI -> Supabase -> Site

## 1. Instalação

Certifique-se de ter Python 3.10 ou superior.

```bash
# Na pasta api:
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## 2. Configuração

Crie um arquivo `.env` na mesma pasta (`api/`) copiando do `.env.example`:

```env
OPENAI_API_KEY=sk-suachave
SUPABASE_URL=https://sualogica.supabase.co
SUPABASE_KEY=suachave_anon_ou_service
CORS_ORIGIN=*
```

## 3. Rodar Localmente

```bash
uvicorn main:app --reload --port 8000
```
O servidor estará rodando em: `http://localhost:8000`

Seu endpoint principal será: `POST http://localhost:8000/axis/turn`

## 4. Teste Rápido no site local

Para conectar o `design-beacon-main` localmente a esse backend:
1. Abra o arquivo `.env` no `design-beacon-main`
2. Adicione ou edite a variável `VITE_AXIS_WEBHOOK_URL`:
```env
VITE_AXIS_WEBHOOK_URL=http://localhost:8000/axis/turn
```
3. Rode seu React/Vite com `npm run dev` e teste o chat.
