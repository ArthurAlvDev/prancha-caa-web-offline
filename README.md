# Prancha CAA

Prancha de **comunicação alternativa e ampliada (CAA)** em português, feita para rodar no navegador e **funcionar sem internet** depois da primeira visita.

- Site: <https://prancha.olacdev.com>
- Licença: MIT
- Feito por **OlacDev** — <https://olacdev.com/>

## O problema

Comunicação alternativa costuma depender de aplicativos pagos, tablets dedicados ou conexão estável. Em casa, na escola pública ou no atendimento, a prancha de papel é o que existe — e ela não fala, não guarda a frase e não se adapta ao vocabulário da pessoa.

## O que a ferramenta faz

1. **Prancha com pictogramas** organizada por categorias: necessidades, sentimentos, pessoas, ações, lugares e tempo.
2. **Frase falada**: toque nos cartões na ordem e use **Falar** (síntese de voz do próprio navegador, em PT-BR).
3. **Busca** por nome do cartão, ignorando acentos.
4. **Edição**: criar cartões e categorias, apagar o que não serve, escolher o emoji.
5. **Persistência local** e **backup em `.json`** para levar a prancha para outro computador.
6. **Offline-first**: service worker guarda o app inteiro no cache; depois do primeiro acesso, funciona sem rede.
7. **Instalável**: manifesto PWA — pode ser adicionado à tela inicial.

## Como usar

1. Escolha a categoria e toque nos cartões.
2. Toque em **Falar**.
3. Em **Editar prancha**, troque os nomes pelos da rotina da pessoa.
4. **Salvar no navegador** e **Exportar .json** para backup.

## Estrutura

```
index.html            interface (frase, cartões, edição, ajuda)
src/board.js          modelo da prancha: categorias, cartões, busca, frase
src/storage.js        validação, importação/exportação JSON e armazenamento local
src/speech.js         texto da frase, escolha de voz e fila de síntese
src/app.js            interface, eventos, persistência e registro do service worker
sw.js                 cache offline (app shell)
manifest.webmanifest  instalação como aplicativo
tests/                65 testes (node:test), sem dependências
```

## Desenvolvimento

```bash
npm test        # 65 testes
npm run serve   # http://localhost:8083
```

## Decisões de projeto

- **Emoji como pictograma.** Sem dependência de banco de imagens proprietário, sem requisição externa, funciona offline e o usuário troca o símbolo se quiser. Limite conhecido: emojis variam entre sistemas.
- **Nada sai do dispositivo.** Sem contas, sem telemetria, sem servidor. CSP restritiva e `form-action 'none'`.
- **Frase com limite de 24 cartões** para manter a leitura útil e a interface previsível.
- **Falha de voz não bloqueia o uso.** Se o navegador não tiver síntese, a prancha continua servindo como comunicação por cartões, e a interface avisa.
- **Backup explícito.** O `.json` é o caminho para não perder a prancha quando o navegador limpa dados.

## Acessibilidade da própria prancha

Alvos grandes (mínimo de 118 px de altura), foco visível de 3 px, contraste AA em tema claro e escuro, textos em vez de só ícones, `aria-live` para a frase e para o status, navegação por teclado nos cartões (Enter/Espaço) e respeito a `prefers-reduced-motion`.

## Limitações

1. **Pictogramas são emojis**, não um conjunto CAA curado (ARASAAC e similares têm licenças próprias).
2. **Voz depende do sistema.** Qualidade e disponibilidade variam por navegador e por aparelho.
3. **Sem sincronização entre dispositivos** — o backup é manual, por arquivo.
4. **Sem prancha impressa otimizada** nesta versão (há estilo de impressão, mas o foco é o uso em tela).
5. **Sem validação com fonoaudiólogos** ou estudo com usuários nesta etapa.

## Licença

MIT — veja [LICENSE](LICENSE).

Citação sugerida:

> FERREIRA, A. A. **Prancha CAA: comunicação alternativa offline em português**. 2026. Software. Disponível em: <https://prancha.olacdev.com>.
