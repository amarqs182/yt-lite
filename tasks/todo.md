# Plano de Implementação YT Lite
## Etapa 1: Correção de Bugs (Fix)
- [x] Corrigir src/features/pause.js para separar ytl-hidden_pause e ytl-pause_loops
## Etapa 2: Implementar Feature Faltante (Experiments)
- [x] Criar toggle em popup.html e popup.js para experimentos A/B
- [x] Atualizar content_script.js com nova opção de config
- [x] Criar script src/features/experiments.js para congelar flags
- [x] Registrar experiments.js no manifest.json
## Etapa 3: Implementar Bloqueador de Telemetria
- [x] Criar arquivo de regras de telemetria (rules.json)
- [x] Atualizar manifest.json com permissões e declarativeNetRequest

## Etapa 4: Contador de Bloqueios e Logs de Debug
- [x] Criar background script para monitorar declarativeNetRequestFeedback
- [x] Adicionar botão de 'Copiar Log' e área de terminal no popup.html
- [x] Implementar integração do popup com o background.js para receber os logs

## Etapa 5: Seleção de Codecs e Suporte a Hardware
- [x] Alterar UI para permitir bloqueio de AV1, VP9, H264 e Opus individualmente
- [x] Implementar detecção de hardware (API navigator.mediaCapabilities) para auxiliar na UI

## Etapa 6: Melhorias de Design (UI)
- [x] Refatorar popup.html para design minimalista
- [x] Melhorar contrastes e simplificar as informações nas seções
- [x] Atualizar o esquema de cores e espaçamento (CSS)

## Etapa 7: Reestruturação de Opções (Select/Segmented UI)
- [x] Agrupar Áudio e Vídeo em categorias visuais
- [x] Transformar Codecs em Seletor (Dropdown ou Radio)
- [x] Transformar Resolução em Seletor de múltiplas opções
- [x] Transformar FPS em Seletor
- [x] Atualizar scripts de background/features para aceitar valores ao invés de apenas true/false
