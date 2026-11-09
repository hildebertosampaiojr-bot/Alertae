# Alertaê — front-end

Protótipo de interface para alertas comunitários, ocorrências e canais de emergência.

## Como executar

```powershell
py servidor.py
```

Acesse `http://127.0.0.1:8000`. Para encerrar, pressione `Ctrl+C`.

## Organização

- `html/`: telas do protótipo.
- `css/base.css`: tokens e estilos globais compartilhados.
- `css/preferencias-compartilhadas.css`: base visual das telas de preferências.
- `css/*.css`: estilos específicos de cada tela.
- `js/aplicacao.js`: inicialização da aplicação, eventos, armazenamento local, acessibilidade, mapa e geolocalização.
- `js/dados.js`: rotas, FAQ e ocorrências fictícias usadas pelo protótipo.
- `servidor.py`: servidor HTTP local, sem dependências externas.

## Limites do protótipo

Login, cadastro, ocorrências, chatbot e pedido de SOS são demonstrações locais. Não existe autenticação real, banco de dados, envio de e-mail ou acionamento de uma central. Utilize dados fictícios. Senhas não são armazenadas; perfil e preferências ficam apenas no armazenamento do navegador.

O mapa usa Leaflet e provedores externos de imagens, portanto depende de internet. As 25 ocorrências são exemplos fictícios no Distrito Federal. A localização atual só é solicitada mediante autorização do navegador e é usada para centralizar o mapa desta página.

As camadas Claro e Escuro usam OpenStreetMap; Satélite e Híbrido usam Esri. Os créditos dos provedores devem permanecer visíveis.

## Desenvolvimento

Ao alterar o projeto:

1. preserve o caráter demonstrativo dos dados e fluxos;
2. mantenha regras de interface fora do HTML sempre que possível;
3. prefira classes CSS a estilos inline criados por JavaScript;
4. mantenha dados fictícios separados da lógica de interação;
5. valide navegação, acessibilidade e sintaxe JavaScript antes de publicar.
