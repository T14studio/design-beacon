-- ==========================================
-- AXIS - SQL EXTENSÃO PARA IMÓVEIS (BLOCO C)
-- Objetivo: Criar tabela properties, alinhar com modelagem relacional da Axis e preparar busca
-- Padrão: Incremento Seguro (Idempotente)
-- ==========================================

-- 1. Criação de Tipos e ENUMs auxiliares para imóveis
DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('disponivel', 'reservado', 'alugado', 'vendido', 'indisponivel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_purpose AS ENUM ('venda', 'locacao', 'ambos');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Imóveis (Properties) Principal
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_code VARCHAR(50) UNIQUE NOT NULL, -- Código publico (ex: REF123)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    purpose property_purpose NOT NULL,
    property_type VARCHAR(100), -- Casa, Apartamento, Terreno
    
    price NUMERIC(15, 2), -- Preço base de locação ou venda
    
    -- Localização Básica (Axis não precisa de geocalização complexa inicialmente)
    neighborhood VARCHAR(150),
    city VARCHAR(150),
    address_line VARCHAR(255),
    
    -- Dimensões e Comodidades
    bedrooms INT DEFAULT 0,
    bathrooms INT DEFAULT 0,
    parking_spaces INT DEFAULT 0,
    area NUMERIC(10, 2), -- metros quadrados
    
    -- Links e Visual
    property_url VARCHAR(500),
    main_image_url VARCHAR(500),
    
    status property_status DEFAULT 'disponivel',
    
    -- Dados de Integração Bruta (útil caso scraper mude)
    raw_payload JSONB DEFAULT '{}'::jsonb,
    source VARCHAR(100) DEFAULT 'website', -- Onde foi pego (n8n_sync, web_scraper)
    source_external_id VARCHAR(100),       -- ID Original do sistema fonte
    
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexação para buscas ágeis pela Axis
CREATE INDEX IF NOT EXISTS idx_properties_code ON properties(property_code);
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties(neighborhood, property_type, purpose);

-- Trigger de Atualização Automática
DROP TRIGGER IF EXISTS trigger_properties_updated_at ON properties;
CREATE TRIGGER trigger_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Injeção Relacional: Conectando Imóveis aos Estados da Axis
-- Adicionando FKs para vincular as interações ao imóvel exato sem depender só do JSON textual

-- Na Sessão FSM (Extracted Context & State)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_property ON sessions(property_id);

-- Nos Tickets de Transbordo Humano
ALTER TABLE handoff_tickets ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_property ON handoff_tickets(property_id);
