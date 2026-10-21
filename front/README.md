# Alertaê

Protótipo de interface para alertas comunitários, ocorrências e canais de emergência.

## Como executar

Abra um terminal nesta pasta e inicie o servidor local:

```powershell
py servidor.py
```

Acesse <http://127.0.0.1:8000>. Para encerrar, pressione `Ctrl+C`.

## Arquivos

- `html/`: páginas `index.html`, `cadastro.html`, `mapa.html`, `socorro.html`, `samu.html`, `chatbot.html`, `duvidas-frequentes.html`, `configuracoes.html`, `acessibilidade.html`, `perfil.html`, `permissoes.html` e `recuperar-senha.html`.
- `css/base.css`: estilos globais e compartilhados. `css/preferencias-compartilhadas.css`: base visual das telas de preferências.
- `css/`: estilos de `login`, `cadastro`, `mapa`, `socorro`, `samu`, `chatbot`, `duvidas-frequentes`, `configuracoes` e `recuperar-senha`.
- `js/aplicacao.js`: navegação e interações.
- `servidor.py`: servidor HTTP local, sem dependências externas.

Login, cadastro, ocorrências, chatbot e pedido de SOS são demonstrações locais, sem autenticação real, banco de dados, envio de e-mail ou acionamento de uma central. Utilize dados fictícios. Senhas não são armazenadas; o perfil e as preferências ficam apenas no armazenamento deste navegador.

O mapa usa o Leaflet e provedores externos de imagens, portanto depende de conexão com a internet. As 25 ocorrências são exemplos fictícios em Brasília e outras regiões do Distrito Federal. Ao abrir o mapa, ele solicita a localização atual ao navegador, mediante autorização, e centraliza nessa posição. O botão de centralizar permite buscar a posição novamente, sem reutilizar posições em cache. Se a localização não estiver disponível, o mapa mantém a visão geral do Brasil e informa o motivo. A preferência de localização pode ser desativada em Configurações > Permissões.

As telas incluem navegação, validação de confirmação de senha, busca nas dúvidas frequentes, respostas locais do assistente, preferências de acessibilidade e simulação de SOS com controle de foco por teclado.

Configurações reúne o resumo do perfil, permissões, acessibilidade, ajuda e canais de emergência. Em “Seu mapa”, é possível escolher o estilo padrão e desativar a centralização automática ao abrir; o botão de localização continua disponível para buscar a posição manualmente. As preferências são persistidas neste navegador. A seção de privacidade explica o armazenamento local e os limites do protótipo.

