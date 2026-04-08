-- ==========================================
-- AXIS - TEST DATA INSERTS (PROPERTIES)
-- Objetivo: Popular base mínima para testar integrações no n8n
-- ==========================================

-- Exemplo 1: Imóvel de Alto Padrão (Locação)
INSERT INTO properties (
    property_code, title, description, purpose, property_type, price,
    neighborhood, city, bedrooms, bathrooms, parking_spaces, area,
    status, property_url, main_image_url, source
) VALUES (
    'REF001', 
    'Cobertura Duplex Cyrela', 
    'Excelente oportunidade. Cobertura mobiliada no vigésimo andar, vista livre.', 
    'locacao', 
    'Cobertura', 
    14500.00,
    'Itaci', 
    'São Paulo', 
    3, 4, 3, 210.00,
    'disponivel', 
    'https://inspiring-chaja-984c35.netlify.app/imovel/cobertura-cyrela', 
    'https://inspiring-chaja-984c35.netlify.app/assets/img-cob1.jpg',
    'test_seed'
) ON CONFLICT (property_code) DO UPDATE SET status = 'disponivel';

-- Exemplo 2: Casa Padrão Médio (Venda)
INSERT INTO properties (
    property_code, title, description, purpose, property_type, price,
    neighborhood, city, bedrooms, bathrooms, parking_spaces, area,
    status, property_url, main_image_url, source
) VALUES (
    'REF002', 
    'Casa Térrea Condomínio Fechado', 
    'Ampla casa em condomínio fechado com energia solar e piscina aquecida.', 
    'venda', 
    'Casa', 
    890000.00,
    'Granja Viana', 
    'Cotia', 
    4, 3, 2, 160.00,
    'disponivel', 
    'https://inspiring-chaja-984c35.netlify.app/imovel/casa-granja', 
    'https://inspiring-chaja-984c35.netlify.app/assets/img-casa2.jpg',
    'test_seed'
) ON CONFLICT (property_code) DO NOTHING;

-- Exemplo 3: Apartamento (Venda ou Locação)
INSERT INTO properties (
    property_code, title, description, purpose, property_type, price,
    neighborhood, city, bedrooms, bathrooms, parking_spaces, area,
    status, property_url, main_image_url, source
) VALUES (
    'REF003', 
    'Apto Compacto Studio Metro', 
    'Studio completo perto do metro, perfeito para estudantes ou solteiros.', 
    'ambos', 
    'Apartamento', 
    450000.00,
    'Pinheiros', 
    'São Paulo', 
    1, 1, 1, 45.00,
    'reservado', 
    'https://inspiring-chaja-984c35.netlify.app/imovel/studio-pinheiros', 
    'https://inspiring-chaja-984c35.netlify.app/assets/img-apto3.jpg',
    'test_seed'
) ON CONFLICT (property_code) DO NOTHING;

-- ==========================================
-- TEST QUERIES DE VALIDAÇÃO
-- ==========================================

-- Select manual do que o n8n faria (match por código):
-- SELECT id, title, status, price FROM properties WHERE property_code = 'REF001';

-- Select manual do que a Axis/Humano entenderia como matching de bairro/tipo:
-- SELECT title, price FROM properties WHERE property_type = 'Apartamento' AND neighborhood ILIKE '%Pinheiros%';
