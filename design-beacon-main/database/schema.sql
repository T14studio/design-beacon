-- ==========================================
-- AXIS - SUPABASE SCHEMA VALIDADO (Etapa 3.1)
-- ==========================================

-- Extensão obrigatória para IDs únicos nativos (Padrão Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ESTRUTURAS DE TIPO (ENUMS)
-- Dropados antes de criar para garantir idempotência do script
-- ==========================================
DROP TYPE IF EXISTS estado_conversa CASCADE;
DROP TYPE IF EXISTS canal_origem CASCADE;
DROP TYPE IF EXISTS setor_destino CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;

CREATE TYPE estado_conversa AS ENUM (
  'recepcao', 'diagnostico', 'qualificacao', 'conducao', 'encaminhamento', 'acompanhamento'
);

CREATE TYPE canal_origem AS ENUM ('whatsapp', 'site');

CREATE TYPE setor_destino AS ENUM (
  'comercial', 'administrativo', 'financeiro', 'atendimento_humano', 'prioridade_alta', 'manutencao_prioritaria'
);

CREATE TYPE ticket_status AS ENUM ('aberto', 'em_atendimento', 'resolvido');

-- ==========================================
-- 2. FUNÇÕES BASE (TRIGGERS UTILS)
-- ==========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. CRIAÇÃO DE TABELAS (COM DROP PREVENTIVO)
-- ==========================================
DROP TABLE IF EXISTS handoff_tickets CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Tabela: sessions (Coração da Máquina Finita)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel canal_origem NOT NULL,
  channel_user_id VARCHAR(255) NOT NULL,
  
  -- Controle de FSM
  current_state estado_conversa DEFAULT 'recepcao'::estado_conversa NOT NULL,
  
  -- Variáveis NLU
  intent_principal VARCHAR(100),
  intent_categoria VARCHAR(50),
  
  -- Array Físico em JSON (Sustentação p/ Queries Flexíveis)
  collected_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  detected_signals JSONB DEFAULT '{"urgency": false, "frustration": false, "commercial_heat": false}'::jsonb NOT NULL,
  
  -- Controles Rígidos do Workflow
  loop_counter INT DEFAULT 0 NOT NULL,
  handoff_ready BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Trilha de Auditoria Padrão
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger de Update na tabela sessions
CREATE TRIGGER trigger_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Tabela: messages (Transcrição bruta e Metadata do Turno)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Guarda as inferências do LLM utilizadas neste momento específico 
  nlu_metadata JSONB DEFAULT '{}'::jsonb, 
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela: handoff_tickets (Estamparia final de integração)
CREATE TABLE handoff_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  
  setor_destino setor_destino NOT NULL,
  prioridade VARCHAR(50) NOT NULL,
  
  -- Output Oficial do Handoff Schema
  payload JSONB NOT NULL, 
  
  status ticket_status DEFAULT 'aberto'::ticket_status NOT NULL,
  owner_id UUID, -- UUID humano (nulo no momento da inserção pelo Bot)
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- Trigger opcional dependendo do update no Ticket
CREATE TRIGGER trigger_handoff_tickets_updated_at
BEFORE UPDATE ON handoff_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================================
-- 4. ÍNDICES DE ALTA PERFORMANCE (QUERY OPTIMIZATION)
-- ==========================================
-- Ajudam orquestrações de Webhook a achar a sessão ativa do usuário muito rápido
CREATE INDEX idx_sessions_active_user ON sessions(channel_user_id) WHERE is_active = true;

-- Ajuda carregamento da memória das conversas no ORM / API
CREATE INDEX idx_messages_session_asc ON messages(session_id, created_at ASC);

-- Fila de atendimento padrão para CRMs extraírem do Supabase
CREATE INDEX idx_tickets_fila ON handoff_tickets(setor_destino, status);
