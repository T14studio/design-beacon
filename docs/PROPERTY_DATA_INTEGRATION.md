# Integração de Dados dos Imóveis na Axis

Para que a Axis atue como assistente especialista (e não "chatbot cego"), o catálogo imobiliário vitrine da empresa precisa existir dentro do ecossistema de dados (`Supabase`), transformando o catálogo em memória associável.

## 1. Origem de Dados Identificada (Site Netlify React/Vite)
A varredura demonstrou que o site `inspiring-chaja-984c35` é uma Single Page Application baseada em React (build gerido pelo Vite). Isso significa que as propriedades não são embutidas em HTML estático primitivo, mas carregadas dinamicamente via requisição de um JSON ou compiladas no próprio Bundle da pipeline.

## 2. Estratégia de Ingestão: Sincronização Periódica
**NÃO É RECOMENDÁVEL** que o fluxo conversacional (n8n) leia o site em tempo de execução ("na hora") abrindo Webhooks HTTP. O cliente experimentaria lag altíssimo (2s de rede + 3s de parsing GPT). 
**Temos de replicar as chaves transacionais para o nosso DB (PostgreSQL Supabase).** 

- **Por quê?** Integridade Relacional. A Engine liga diretamente a FSM (`session.property_id`) à linha do banco sem estourar SLAs da API.

### Fluxo Metodológico Recomendado
1. Um Cron Job / Webhook paralelo será estabelecido entre o Admin/CMS Atual e a nova tabela `properties` criada no Supabase.
2. Atualizações no sistema legado propagam um INSERT/PATCH assíncrono pro banco PostgreSQL da Axis (Atualizando Disponibilidades, Valores, Códigos).

## 3. Campos da Base "Properties"
Criamos via Schema Patch (`properties_extension.sql`) a tabela estrita contendo arrays fundamentais que importam para LLM conversacional:
- Títulos curtos.
- `property_type`, `purpose` e `neighborhood` rigorosamente mantidos.
- Preço convertido em Numeric exato (o LLM odeia strings para operações matemáticas comparativas como "Quero apartamentos *abaixo* de X").
- As URLs visuais (`main_image_url` e `property_url`) ficam em cache para Handoff visual por parte do CRM sem precisar voltar ao site.

## 4. Orquestração da Ingestão de Contexto no n8n

Para que a OpenAI consiga ser útil em tempo real sabendo que o cliente quer um código específico:
1. `Node Regex`: Inspeciona o input.
2. `Node Switch`: Caso Regex capture "Código = XXX", o fluxo abre um Query Select Rápido no Supabase e embute essa variável `DB_Property_Name` dentro da variável de Session no prompt System sob as Strings `{{DADOS_COLETADOS}}`.
3. Para o LLM, o evento fica imperceptível: "O cliente referenciou Casa no Bairro X". Ele agirá magicamente usando as Regras Operacionais descritos na Documentação Base.
