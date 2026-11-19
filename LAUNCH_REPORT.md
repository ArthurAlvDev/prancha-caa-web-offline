# Launch Report — Prancha CAA (ACC-003)

**Data:** 19/11/2026
**Projeto:** `prancha-caa-web-offline`
**Licença:** MIT
**Responsável:** Ferreira, A. A. (OlacDev)

## Estado

| Etapa | Estado | Evidência |
| --- | --- | --- |
| Build local | Concluído | 13 arquivos, sem dependências de execução |
| Testes | 65/65 | `node --test tests/*.test.js` |
| GitHub | Publicado | `ArthurAlvDev/prancha-caa-web-offline` (branch `main`) |
| Vercel | Publicado | `https://prancha-caa-web-offline.vercel.app` (HTTP 200) |
| Domínio próprio | Pendente de DNS | `prancha.olacdev.com` adicionado; CNAME no Cloudflare |
| Artigo | Pronto (não publicado) | `ARTIGO_CIENTIFICO.md` |

## Escopo entregue

- Prancha com 6 categorias e 36 cartões de vocabulário núcleo e periférico em PT-BR.
- Frase com limite de 24 cartões, anúncio por `aria-live` e remoção passo a passo.
- Voz nativa do navegador com escolha de voz em português e controle de velocidade.
- Busca sem acentos exigindo todas as palavras.
- Edição: novos cartões, novas categorias, exclusão com confirmação, modo de edição.
- Persistência local validada e backup `.json` com versão de esquema.
- Offline-first: service worker com cache do app shell e manifesto instalável.
- Marca: "Made by OlacDev" no rodapé.

## Verificações executadas

- `node --test`: 65 testes, 65 aprovados.
- Service worker lista apenas arquivos existentes (teste automatizado).
- Manifesto válido e ícone presente (teste automatizado).
- Degradação sem voz coberta por teste: erro explícito, app continua utilizável.

## Pendências e riscos

1. **DNS do domínio próprio** — CNAME `prancha` no Cloudflare apontando para o alvo do projeto.
2. **Pictogramas em emoji** — variação entre sistemas; sem biblioteca CAA licenciada nesta versão.
3. **Voz depende do aparelho** — sem voz em português instalada, a prancha fica silenciosa.
4. **Sem validação clínica** — vocabulário inicial não substitui avaliação fonoaudiológica.

## Próximo passo sugerido

Importação de pictogramas livres em SVG e prancha impressa dedicada em A4.
