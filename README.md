# Alertaê

Protótipo web de alertas comunitários, ocorrências e canais de emergência, com foco em navegação mobile e demonstração de fluxos de segurança.

## Executar localmente

```powershell
cd front
py servidor.py
```

Depois acesse `http://127.0.0.1:8000`.

## Estrutura

- `front/html/`: páginas da aplicação.
- `front/css/`: estilos globais e específicos por tela.
- `front/js/aplicacao.js`: inicialização, eventos e regras de interface.
- `front/js/dados.js`: dados demonstrativos e rotas internas.
- `front/servidor.py`: servidor HTTP local sem dependências externas.
- `.github/workflows/deploy.yml`: publicação automática no GitHub Pages.

> O projeto é demonstrativo: não possui autenticação real, backend, banco de dados ou acionamento de serviços de emergência.
