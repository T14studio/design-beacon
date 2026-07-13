-- ==========================================
-- AXIS - SQL INCREMENTAL DE CORREÇÃO (Auditoria V1)
-- Objetivo: Corrigir gargalos e normalizar relacionamentos sem destruir os dados da Etapa 3
-- Padrão: Execução Segura (Idempotente)
-- ==========================================

-- 1. Criação do Domínio/Enum faltante para Jornada (Para evitar VARCHAR solto)
DO $$ BEGIN
    CREATE TYPE estagio_jornada AS ENUM ('lead_novo', 'negociacao', 'pre_contrato', 'cliente_ativo', 'desligamento', 'nao_identificado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Separação de Entidade: CUSTOMERS (Desacoplando de Sessões)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel canal_origem NOT NULL,
    channel_user_id VARCHAR(255) UNIQUE NOT NULL, -- Impede duplicidade de telefone/cookie principal
    nome VARCHAR(255),
    telefone VARCHAR(50),
    perfil_dominante VARCHAR(50), -- ex: locatario, proprietario
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    ultimo_contato_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_channel_user ON customers(channel_user_id);

-- 3. Atualização da tabela SESSIONS para suportar os Gaps da Auditoria
-- Adicionando colunas de forma segura
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS subintencao VARCHAR(100);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS estagio_jornada estagio_jornada DEFAULT 'nao_identificado';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS nlu_confidence_score NUMERIC(3, 2) DEFAULT 0.00;

-- Populando relacionamento de sessões órfãs atuais automaticamente
-- (Caso já existam dados no banco, isso criará os customers faltantes e atrelará)
INSERT INTO customers (channel, channel_user_id)
SELECT DISTINCT channel, channel_user_id FROM sessions
ON CONFLICT (channel_user_id) DO NOTHING;

UPDATE sessions s
SET customer_id = c.id
FROM customers c
WHERE s.channel_user_id = c.channel_user_id
AND s.customer_id IS NULL;

-- 4. Otimização de Performance nos Relacionamentos Novos
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);

-- 5. Função Utilitária para Manutenção Automática do Último Contato
CREATE OR REPLACE FUNCTION update_customer_last_contact()
RETURNS TRIGGER AS $$
BEGIN
   UPDATE customers SET ultimo_contato_em = NOW() WHERE id = NEW.customer_id;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_last_contact ON sessions;
CREATE TRIGGER trigger_update_customer_last_contact
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW WHEN (NEW.customer_id IS NOT NULL) EXECUTE FUNCTION update_customer_last_contact();
