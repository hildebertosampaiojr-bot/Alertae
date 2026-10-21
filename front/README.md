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

Login, cadastro, ocorrências, localização, chatbot e pedido de SOS são demonstrações locais, sem conexão com serviços externos ou banco de dados.

