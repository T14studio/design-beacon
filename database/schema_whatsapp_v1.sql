-- ==========================================
-- AXIS — WhatsApp Channel Migration (v1)
-- Execução: idempotente (IF NOT EXISTS / DO $$ ... END $$)
-- Não destrói dados existentes.
-- ==========================================

-- Garante que o enum de canal inclui 'whatsapp'
-- (já deve existir no schema base — protegido contra duplicação)
DO $$ BEGIN
    ALTER TYPE canal_origem ADD VALUE IF NOT EXISTS 'whatsapp';
EXCEPTION
    WHEN others THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABELA: whatsapp_contacts
--    Persiste todos os contatos que interagiram via WhatsApp.
--    Chave única: telefone normalizado (formato internacional sem +).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identificação do contato
    telefone          VARCHAR(30)  NOT NULL,              -- Ex: 5511999999999
    nome              VARCHAR(255),                       -- Nome extraído do perfil/conversa
    canal             VARCHAR(20)  NOT NULL DEFAULT 'whatsapp',

    -- Vínculo com o sistema de sessões
    session_id        UUID,                               -- Referência à sessão Axis ativa
    customer_id       UUID,                               -- Referência ao customers (se existir)

    -- Classificação comercial
    setor             VARCHAR(50),                        -- comercial | administrativo | financeiro
    prioridade        VARCHAR(30)  DEFAULT 'normal',      -- normal | alta | urgente
    status_lead       VARCHAR(50)  DEFAULT 'novo',        -- novo | ativo | qualificado | convertido | inativo
    origem            VARCHAR(100) DEFAULT 'whatsapp_inbound',

    -- Contexto conversacional resumido (evita reprocessar histórico longo)
    resumo_contexto   TEXT,

    -- Handoff humano
    handoff_humano    BOOLEAN      DEFAULT false NOT NULL,
    handoff_setor     VARCHAR(50),                        -- Setor destino do handoff
    handoff_motivo    TEXT,                               -- Motivo registrado do handoff
    handoff_em        TIMESTAMPTZ,                        -- Timestamp do handoff

    -- Rastreio
    ultimo_contato    TIMESTAMPTZ  DEFAULT NOW(),
    created_at        TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
    updated_at        TIMESTAMPTZ  DEFAULT NOW() NOT NULL,

    -- Garante unicidade por telefone
    CONSTRAINT uq_whatsapp_telefone UNIQUE (telefone)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABELA: whatsapp_messages
--    Histórico bruto de mensagens do canal WhatsApp.
--    Separado de `messages` para não misturar payloads de canais diferentes.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Vínculos
    contact_id        UUID         REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    session_id        UUID,                               -- Sessão Axis associada

    -- Identificação da mensagem no provedor
    message_id        VARCHAR(255),                       -- ID da mensagem na Uazapi/WhatsApp
    direction         VARCHAR(10)  NOT NULL DEFAULT 'inbound', -- inbound | outbound

    -- Conteúdo normalizado
    tipo              VARCHAR(30)  NOT NULL DEFAULT 'text', -- text | image | document | audio | video | button_reply
    conteudo          TEXT,                               -- Texto da mensagem
    media_url         VARCHAR(1024),                      -- URL de mídia quando aplicável
    media_filename    VARCHAR(255),                       -- Nome do arquivo (documentos)

    -- Metadados do provedor (payload bruto normalizado)
    raw_payload       JSONB        DEFAULT '{}'::jsonb,   -- Payload original do webhook (sem credenciais)

    -- Timestamps
    timestamp_origem  TIMESTAMPTZ,                        -- Timestamp da mensagem no WhatsApp
    created_at        TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wa_contacts_telefone    ON whatsapp_contacts(telefone);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_session     ON whatsapp_contacts(session_id);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_handoff     ON whatsapp_contacts(handoff_humano) WHERE handoff_humano = true;
CREATE INDEX IF NOT EXISTS idx_wa_messages_contact     ON whatsapp_messages(contact_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_session     ON whatsapp_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_msg_id      ON whatsapp_messages(message_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGER: auto-atualiza updated_at em whatsapp_contacts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wa_contacts_updated_at ON whatsapp_contacts;
CREATE TRIGGER trigger_wa_contacts_updated_at
BEFORE UPDATE ON whatsapp_contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. EXTENSÃO EM customers (se existir): adiciona coluna whatsapp_phone
--    Permite correlacionar contato WA com customer do site.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(30);
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_contact_id UUID;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;
