-- ==========================================
-- Bloco de Validação: Operação Axis CRUD Completo
-- Objetivo: Testar os módulos primários de banco antes da conexão nativa.
-- Executar bloco por bloco na interface de SQL do Supabase.
-- ==========================================

-- 1º PASSO: Simular Início de Conversa (Criando Sessão)
-- ==========================================
INSERT INTO sessions (channel, channel_user_id, current_state)
VALUES ('whatsapp', '5511999998888', 'recepcao')
RETURNING id; 
-- ! IMPORTANTE: Copie o UUID retornado pelo terminal para substituir na linha abaixo.

-- 2º PASSO: Ingestão de mensagens de Transcrição
-- Substitua 'COLE_O_UUID_AQUI'
-- ==========================================
INSERT INTO messages (session_id, role, content, nlu_metadata)
VALUES 
  ('COLE_O_UUID_AQUI', 'system', 'Sistemas Axis inicializado com diretriz operacional...', '{}'),
  ('COLE_O_UUID_AQUI', 'user', 'Pelo amor de deus, estourou um cano na sala, vaza muita agua!', '{"override_trigger": true}');

-- 3º PASSO: Simular Processamento do Turno (Update State)
-- O Robô NLU detectou urgência através da API, então ele faz Bypass
-- ==========================================
UPDATE sessions 
SET 
  current_state = 'encaminhamento',
  intent_principal = 'manutencao_regular',
  detected_signals = '{"urgency": true, "frustration": true, "commercial_heat": false}'::jsonb,
  is_active = false
WHERE id = 'COLE_O_UUID_AQUI';

-- 4º PASSO: Emissão Final (Gerar o Handoff Ticket)
-- ==========================================
INSERT INTO handoff_tickets (session_id, setor_destino, prioridade, payload)
VALUES (
  'COLE_O_UUID_AQUI',
  'prioridade_alta',
  'alta',
  '{
    "intencao_principal": "manutencao_regular",
    "subintencao": "urgencia_eletrica_hidraulica",
    "etapa_da_conversa": "encaminhamento",
    "estagio_da_jornada": "cliente_ativo",
    "prioridade": "alta",
    "nivel_de_confianca": 0.98,
    "nome_cliente": null,
    "perfil_cliente": "nao_identificado",
    "dados_minimos_coletados": [],
    "dados_ainda_faltantes": ["nome_cliente", "imovel_relacionado"],
    "urgencia_detectada": true,
    "frustracao_detectada": false,
    "alta_intencao_comercial": false,
    "handoff_recomendado": true,
    "motivo_do_handoff": "urgencia",
    "setor_destino": "prioridade_alta",
    "resumo_do_caso": "Extrema urgencia física relatada: Cano estourado vazando água na sala. Cliente não identificou imóvel.",
    "proxima_acao": "Telefonar imedtiamente para número cadastrado do telefone"
  }'::jsonb
);

-- 5º PASSO: SELECT FINAL (Verificar os rastros de toda Transação)
-- ==========================================
SELECT * FROM sessions WHERE channel_user_id = '5511999998888';
SELECT * FROM messages WHERE session_id = 'COLE_O_UUID_AQUI' ORDER BY created_at ASC;
SELECT * FROM handoff_tickets WHERE session_id = 'COLE_O_UUID_AQUI';
