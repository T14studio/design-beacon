-- ============================================================
-- SQL DE TESTE — Área do Cliente / Consulta de Contratos
-- Ética Áxis Imobiliária
-- ============================================================
-- INSTRUÇÕES:
--   1. Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard)
--   2. Antes, suba os PDFs no Supabase Storage (ver instruções abaixo)
--   3. Ajuste as pdf_url se o nome do seu bucket for diferente de "contracts"
-- ============================================================


-- PASSO 1: Criar a tabela contracts (caso ainda não exista)
-- Execute apenas se a tabela NÃO existir. Se já existir, pule para o PASSO 2.

CREATE TABLE IF NOT EXISTS contracts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number TEXT NOT NULL,
    nome_cliente    TEXT,
    cpf             TEXT,         -- Apenas dígitos: ex: 12345678901
    cnpj            TEXT,         -- Apenas dígitos (para empresas)
    cpf_cnpj        TEXT,         -- Campo alternativo (dígitos)
    documento       TEXT,         -- Campo alternativo (dígitos)
    tipo_contrato   TEXT,
    imovel          TEXT,
    pdf_url         TEXT,         -- URL pública do PDF no Supabase Storage
    pdf_path        TEXT,         -- Caminho interno no bucket (ex: test/CTR-2024-0001.pdf)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) — recomendado em produção
-- ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASSO 2: Inserir os 5 contratos de teste
-- ATENÇÃO: Substitua "SEU_PROJECT_ID" pelo ID real do seu projeto Supabase
-- O ID está na URL do Supabase: https://hocrbyevkaothhnxptem.supabase.co
-- Neste caso, o PROJECT_ID é: hocrbyevkaothhnxptem
-- ============================================================

INSERT INTO contracts (contract_number, nome_cliente, cpf, tipo_contrato, imovel, pdf_url, pdf_path, created_at)
VALUES
(
    'CTR-2024-0001',
    'Carlos Eduardo Mendes',
    '12345678901',
    'Contrato de Locacao Residencial',
    'Apto 301, Rua das Flores, 120 - Jardim dos Estados, CG/MS',
    'https://hocrbyevkaothhnxptem.supabase.co/storage/v1/object/public/contracts/test/CTR-2024-0001.pdf',
    'test/CTR-2024-0001.pdf',
    '2024-03-15T10:00:00Z'
),
(
    'CTR-2024-0002',
    'Fernanda Lima Oliveira',
    '98765432100',
    'Contrato de Compra e Venda',
    'Casa, Rua Alagoas, 540 - Vivendas do Bosque, CG/MS',
    'https://hocrbyevkaothhnxptem.supabase.co/storage/v1/object/public/contracts/test/CTR-2024-0002.pdf',
    'test/CTR-2024-0002.pdf',
    '2024-05-22T14:30:00Z'
),
(
    'CTR-2024-0003',
    'Roberto Henrique Souza',
    '11122233344',
    'Contrato de Locacao Comercial',
    'Sala 908, Rua Alagoas, 396 - Jardim dos Estados, CG/MS',
    'https://hocrbyevkaothhnxptem.supabase.co/storage/v1/object/public/contracts/test/CTR-2024-0003.pdf',
    'test/CTR-2024-0003.pdf',
    '2024-07-10T09:15:00Z'
),
(
    'CTR-2024-0004',
    'Patricia Goncalves Ramos',
    '55566677788',
    'Contrato de Compra e Venda',
    'Apto 502, Av. Mato Grosso, 1200 - Centro, CG/MS',
    'https://hocrbyevkaothhnxptem.supabase.co/storage/v1/object/public/contracts/test/CTR-2024-0004.pdf',
    'test/CTR-2024-0004.pdf',
    '2024-09-05T11:45:00Z'
),
(
    'CTR-2024-0005',
    'Marcos Vinicius Pereira',
    '99988877766',
    'Contrato de Locacao Residencial',
    'Casa 2, Rua Ceara, 88 - Jardim Paulista, CG/MS',
    'https://hocrbyevkaothhnxptem.supabase.co/storage/v1/object/public/contracts/test/CTR-2024-0005.pdf',
    'test/CTR-2024-0005.pdf',
    '2024-10-18T16:20:00Z'
);

-- ============================================================
-- VERIFICAR se os dados foram inseridos corretamente
-- ============================================================
SELECT id, contract_number, nome_cliente, cpf, tipo_contrato, pdf_url, created_at
FROM contracts
ORDER BY created_at DESC;

-- ============================================================
-- SIMULAR A BUSCA que o sistema faz (para checar se funciona)
-- ============================================================
-- Teste com o CPF do Carlos: 12345678901
SELECT id, contract_number, pdf_url, created_at
FROM contracts
WHERE cpf = '12345678901'
   OR cnpj = '12345678901'
   OR cpf_cnpj = '12345678901'
   OR documento = '12345678901';

-- ============================================================
-- CPFs PARA TESTAR NO SITE (área do cliente):
-- ============================================================
-- Carlos Eduardo Mendes  => 123.456.789-01
-- Fernanda Lima Oliveira => 987.654.321-00
-- Roberto Henrique Souza => 111.222.333-44
-- Patricia Goncalves     => 555.666.777-88
-- Marcos Vinicius        => 999.888.777-66
-- ============================================================

-- ============================================================
-- LIMPAR OS DADOS DE TESTE (quando não precisar mais)
-- ============================================================
-- DELETE FROM contracts WHERE contract_number LIKE 'CTR-2024-%';
