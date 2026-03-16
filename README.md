# ytライト🌱 (yt bettr) 🪶 ▶🚀

**yt bettr** é um otimizador refinado e de alta estabilidade para YouTube, focado em entregar a melhor performance e qualidade visual sem comprometer a experiência do usuário. Diferente de outras extensões, o yt bettr utiliza detecção profunda de hardware para servir os streams de vídeo mais eficientes para o seu PC.

---

## 🎮 Modos de Operação (yt bettr Auto)

O yt bettr se adapta instantaneamente às suas necessidades através de três perfis inteligentes:

- **Auto Lite:** Focado em economia extrema. Força o uso de H.264, limita a resolução a 480p/30fps e ativa todas as otimizações de interface para preservar CPU e bateria.
- **Auto High:** A experiência Premium. Libera AV1 (se suportado por hardware), resoluções até 4K/60fps e ativa automaticamente os filtros visuais e de áudio de alta fidelidade.
- **Custom:** Liberdade total para você configurar cada codec, filtro e limite individualmente.

---

## ✨ Recursos Premium (Modo High)

Eleve a sua experiência de visualização com processamento de imagem e som de nível profissional:

- **Nitidez /|\:** Sharpening acelerado por GPU via filtros compostos nativos, proporcionando bordas cristalinas sem artefatos ou halos.
- **Destaque <>:** Um algoritmo refinado de HDR que melhora o contraste e a profundidade de cor de forma natural, sem saturar excessivamente a imagem.
- **Granulação (*):** Filtro de granulação cinematográfica animado (24fps) baseado em Canvas com distribuição gaussiana e mesclagem *soft-light*, proporcionando uma textura orgânica de película 35mm.
- **Áudio Hi-Fi:** Equalização dinâmica com assinatura "V-Shape" (Bass Boost + Treble Clarity) e compressão musical para um som mais encorpado e detalhado.

---

## ⚡ Performance e Economia (Eco Mode)

- **Capas Estáticas & Básicas:** Remove as capas animadas (`ytd-moving-thumbnail-renderer`) e imagens de alta resolução.
- **Otimização de Loops:** Intercepta o `requestVideoFrameCallback` para pausar loops de renderização inúteis quando o vídeo está parado, reduzindo o uso de CPU a quase zero.
- **Modo OLED Real:** Força o fundo da página do YouTube para preto puro (#000000), economizando energia em telas OLED/AMOLED.
- **Eco UI Extremo:** Remove animações pesadas, esconde Shorts e limpa elementos de interface que poluem a DOM e consomem recursos.

---

## 💻 Arquitetura Técnica

- **Manifest V3 Compliant:** Totalmente aderente aos novos padrões de segurança e performance do Chrome.
- **Trusted Types Ready:** Construção segura do DOM sem uso de `innerHTML`, garantindo compatibilidade com as políticas de segurança mais rígidas do YouTube.
- **Low Latency Sync:** Sistema de sincronização em tempo real via atributos DOM e eventos customizados, permitindo que as alterações no popup reflitam instantaneamente no player sem necessidade de recarregar a página.
- **Hardware-Aware:** Integração com a API `navigator.mediaCapabilities` para recomendar as melhores configurações baseadas na sua placa de vídeo real.

---

## 🛠️ Instalação

1. Clone ou baixe este repositório.
2. Abra seu navegador baseado em Chromium (Chrome, Edge, Brave, etc.).
3. Navegue até `chrome://extensions/`.
4. Ative o **Modo do Desenvolvedor** (canto superior direito).
5. Clique em **Carregar sem pacote** e selecione a pasta do projeto.
6. O ícone do **yt bettr ▶🚀** aparecerá na sua barra de ferramentas.

---

## 📜 Licença
Distribuído sob a licença MIT. Baseado nos conceitos originais de `h264ify`.
