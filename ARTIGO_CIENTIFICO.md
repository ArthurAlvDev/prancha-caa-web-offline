# Prancha CAA: comunicação alternativa offline-first no navegador

**Arthur Alves Ferreira (Ferreira, A. A.)**
OlacDev · <https://olacdev.com/>

**Versão:** 1.0 · **Data:** 19/11/2026
**Licença do texto:** CC BY 4.0 · **Licença do software:** MIT
**Tipo de recurso (Zenodo):** Preprint · **Idioma:** Português (Brasil)

*Pré-print interno. Ainda não depositado em repositório de dados; ao publicar, substituir esta nota pelo DOI. A versão citável do software é o repositório público indicado nas referências.*

---

## Resumo

A comunicação alternativa e ampliada (CAA) é recurso essencial para pessoas com deficiência motora, intelectual ou neurológica que não usam a fala funcional. As soluções disponíveis, no entanto, concentram-se em aplicativos proprietários para tablets dedicados, dependem de conexão ou exigem curadoria de pictogramas com licença restrita. Este trabalho apresenta a **Prancha CAA**, aplicação web estática que organiza cartões pictográficos em categorias semânticas, monta e vocaliza frases em português, permite edição do vocabulário pelo próprio cuidador e funciona **sem internet** após o primeiro carregamento, por meio de um service worker que mantém o *app shell* em cache. A persistência usa o armazenamento local do navegador com validação de esquema, e a portabilidade é garantida por exportação e importação de arquivo JSON, com verificação de versão, identificadores repetidos e limites de tamanho. A síntese de voz é delegada à API nativa do navegador, com escolha de voz por idioma e degradação explícita quando indisponível: a prancha permanece utilizável como comunicação por cartões. A suíte de 65 testes automatizados cobre o modelo da prancha, a busca sem acentos, o acúmulo e o limite da frase, a validação de importação, o armazenamento em memória e a integridade dos arquivos da página.

**Palavras-chave:** comunicação alternativa; CAA; acessibilidade digital; offline-first; tecnologia assistiva; PWA.

## 1. Introdução

A prancha de comunicação em papel resolve um problema real com custo quase zero, mas tem três limites: não fala, não guarda histórico de frase e não se adapta sem imprimir de novo. Aplicativos dedicados resolvem esses limites, porém introduzem outros: custo, dependência de plataforma e, frequentemente, exigência de conexão.

Entre os dois extremos há um espaço pouco explorado: uma aplicação web que abra no celular ou no computador que a família já tem, funcione sem rede e permita que o vocabulário seja editado por quem conhece a pessoa.

**Objetivo.** Descrever e validar uma prancha CAA em português, offline-first, com edição local, backup em arquivo e voz nativa, sem contas e sem servidor.

## 2. Fundamentação

### 2.1 CAA e vocabulário núcleo

Pranchas eficazes combinam vocabulário núcleo (verbos, pronomes, marcadores como "mais", "acabou", "quero") com vocabulário periférico (nomes próprios, lugares, alimentos). O vocabulário núcleo é pequeno e reutilizável; o periférico muda com a rotina. Um sistema útil precisa ser fácil de editar justamente na parte que muda.

### 2.2 Offline como requisito, não conveniência

Escolas, unidades de saúde e residências nem sempre têm rede estável. Um recurso de comunicação que falha quando a conexão cai não é confiável. Daí a escolha de *cache-first* para os arquivos do aplicativo e de armazenamento local para o vocabulário.

### 2.3 Voz como reforço, não como dependência

A vocalização amplia a compreensão por terceiros, mas não pode ser ponto único de falha. Se a síntese não existir, a prancha deve continuar funcionando — o que exige decisões explícitas de degradação.

## 3. Método

### 3.1 Modelo de dados (`board.js`)

A prancha é um objeto versionado com categorias e cartões. Cada cartão tem `id` estável derivado do rótulo (slug sem acentos), `label`, `symbol` e, opcionalmente, `speak` — o texto efetivamente falado, útil quando o rótulo é abreviado. Funções puras cobrem criação defensiva (`createBoard` normaliza e filtra cartões sem nome), busca (`searchCards` normaliza acentos e exige todas as palavras), edição (`addCard`, `removeCard`, `addCategory`, `removeCategory`, com resolução de colisão por sufixo numérico) e a frase (`pushToSentence`, `popFromSentence`, `sentenceToText`).

### 3.2 Persistência e portabilidade (`storage.js`)

`validate` verifica estrutura, versão de esquema, presença de rótulos e unicidade de identificadores. `exportJSON` acrescenta versão e data de exportação. `importJSON` recusa arquivos vazios, acima de 2 MB, com JSON inválido ou com estrutura inconsistente — devolvendo a lista de erros em vez de aceitar dados parcialmente corrompidos. `createStore` encapsula `localStorage` com teste de disponibilidade na inicialização e tratamento de cota excedida; `memoryStorage` permite testar o fluxo completo sem navegador.

### 3.3 Fala (`speech.js`)

`buildText` compõe a frase a partir de `speak || label`, normaliza espaços, capitaliza e acrescenta pontuação final apenas quando ausente. `normalizeOptions` limita taxa (0,5–2), tom (0–2) e volume (0–1), descartando valores não numéricos. `pickVoice` busca voz exata pelo idioma, depois pelo idioma base, depois qualquer voz `pt`. `createQueue` encapsula a API de síntese e devolve sempre uma promessa resolvida com `{ ok, error }` — a interface nunca depende de exceção para saber que a voz falhou.

### 3.4 Offline e instalação

O service worker mantém em cache a página inicial, os quatro módulos JavaScript, o CSS, o ícone e o manifesto. Navegação usa *network-first* com queda para o cache; demais requisições usam *cache-first* com atualização em segundo plano. O manifesto declara `start_url`, `display: standalone` e ícone SVG, permitindo instalação na tela inicial. O arquivo `sw.js` é servido com `no-store` para que atualizações sejam detectadas.

### 3.5 Interface

Cartões são elementos com `role="button"`, foco por teclado e rótulo que descreve a ação ("Quero água. Adicionar à frase."). A frase é uma região `aria-live="polite"`, assim como o status. O modo de edição é explícito e revela o botão de apagar, evitando remoção acidental. Ações destrutivas pedem confirmação.

## 4. Validação

| Arquivo | Foco | Testes |
| --- | --- | --- |
| `board.test.js` | padrão, unicidade, busca, adição/remoção, slug, frase, limites | 22 |
| `storage.test.js` | validação, exportação, importação, corrupção, cota, memória | 18 |
| `speech.test.js` | normalização, texto, escolha de voz, ausência de suporte | 13 |
| `page.test.js` | integridade, rótulos, CSP, offline, manifesto, marca | 12 |

Resultado: **65 testes, 65 aprovados, 0 falhas**.

Casos notáveis: a busca por "ÁGUA" encontra o cartão "Quero água"; a adição repetida de um mesmo rótulo gera sufixo em vez de sobrescrever; a frase para de crescer em 24 cartões; um JSON com identificadores repetidos é recusado com mensagem específica; e um armazenamento que lança exceção é detectado na inicialização, sem quebrar a interface.

## 5. Acessibilidade

Alvos de toque grandes, contraste AA em tema claro e escuro, foco visível, textos que acompanham cada pictograma (a prancha não depende de reconhecimento de imagem), navegação por teclado e anúncio da frase montada. O vocabulário padrão é editável porque nenhuma lista fixa cobre a vida de uma pessoa.

## 6. Limitações

1. **Pictogramas são emojis**, não um conjunto CAA validado; a representação varia por sistema operacional.
2. **Voz dependente do dispositivo** — qualidade e disponibilidade variam.
3. **Sem sincronização automática** entre dispositivos; o backup é um arquivo.
4. **Sem prancha impressa dedicada** nesta versão.
5. **Sem validação clínica** com fonoaudiólogos ou estudo com usuários.
6. **Vocabulário inicial genérico**: serve para começar, não substitui avaliação profissional.

## 7. Trabalhos relacionados

Pranchas de papel de baixa tecnologia continuam sendo a base. Aplicativos de CAA consolidados oferecem bibliotecas pictográficas amplas e pranchas compartilháveis, com custo e ecossistema próprios. Sistemas abertos baseados em pictogramas livres aproximam-se do propósito, mas costumam exigir servidor ou instalação. A contribuição aqui é o recorte: **offline real, edição local, backup em arquivo, voz nativa e nenhuma conta** — com o código e o vocabulário sob licença MIT.

## 8. Conclusão

A Prancha CAA mostra que é possível entregar comunicação alternativa utilizável em um navegador comum, sem servidor e sem rede, mantendo o vocabulário sob controle de quem cuida. O sistema não substitui avaliação fonoaudiológica nem bibliotecas pictográficas profissionais; ele reduz a barreira de entrada e garante continuidade quando a infraestrutura falha. Como continuação, prevê-se suporte a pictogramas livres importáveis, prancha impressa dedicada e um estudo de uso com famílias e escolas.

## Referências

AMERICAN SPEECH-LANGUAGE-HEARING ASSOCIATION. **Augmentative and Alternative Communication (AAC)**. Rockville, 2024.

BRASIL. **Lei nº 13.146, de 6 de julho de 2015**. Institui a Lei Brasileira de Inclusão da Pessoa com Deficiência. Brasília, DF, 2015.

FERREIRA, A. A. **Prancha CAA**: comunicação alternativa offline em português. 2026. Software. Disponível em: <https://github.com/ArthurAlvDev/prancha-caa-web-offline>.

W3C. **Web Content Accessibility Guidelines (WCAG) 2.2**. Recommendation. 2023.

W3C. **Service Workers**. Working Draft / Candidate Recommendation. 2024.

---

### Nota sobre publicação

Este texto é um pré-print interno. **Não houve submissão a periódico nem depósito em repositório de dados nesta etapa.** A versão citável do software é o repositório público indicado acima, sob licença MIT.
