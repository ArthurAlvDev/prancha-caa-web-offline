'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Board = require('../src/board.js');

test('a prancha padrão tem categorias e cartões utilizáveis', () => {
  const board = Board.createBoard();
  assert.ok(board.categories.length >= 5);
  assert.ok(Board.allCards(board).length >= 30);
  for (const category of board.categories) {
    assert.ok(category.cards.length > 0, `categoria vazia: ${category.label}`);
    for (const card of category.cards) {
      assert.ok(card.label.length > 0);
      assert.ok(card.symbol.length > 0);
      assert.ok(card.id.length > 0);
    }
  }
});

test('os identificadores de cartão são únicos', () => {
  const board = Board.createBoard();
  const ids = Board.allCards(board).map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('createBoard não compartilha estado com a constante padrão', () => {
  const board = Board.createBoard();
  board.categories[0].cards.pop();
  assert.notEqual(board.categories[0].cards.length, Board.DEFAULT_BOARD.categories[0].cards.length);
});

test('busca ignora acentos e caixa', () => {
  const board = Board.createBoard();
  assert.ok(Board.searchCards(board, 'agua').some((c) => c.id === 'agua'));
  assert.ok(Board.searchCards(board, 'ÁGUA').length > 0);
});

test('busca exige todas as palavras', () => {
  const board = Board.createBoard();
  const out = Board.searchCards(board, 'quero agua');
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'agua');
});

test('busca vazia não devolve tudo', () => {
  const board = Board.createBoard();
  assert.deepEqual(Board.searchCards(board, '   '), []);
});

test('adiciona cartão em uma categoria', () => {
  const board = Board.createBoard();
  const before = board.categories[0].cards.length;
  const id = Board.addCard(board, 'necessidades', { label: 'Quero água gelada', symbol: '🧊' });
  assert.equal(id, 'quero-agua-gelada');
  assert.equal(board.categories[0].cards.length, before + 1);
});

test('adiciona cartão com identificador repetido recebendo sufixo', () => {
  const board = Board.createBoard();
  assert.equal(Board.addCard(board, 'necessidades', { label: 'Quero água' }), 'quero-agua');
  assert.equal(Board.addCard(board, 'necessidades', { label: 'Quero água' }), 'quero-agua-2');
});

test('rejeita cartão sem nome', () => {
  const board = Board.createBoard();
  assert.throws(() => Board.addCard(board, 'necessidades', { label: '   ' }), /precisa de um nome/);
});

test('rejeita categoria inexistente', () => {
  const board = Board.createBoard();
  assert.throws(() => Board.addCard(board, 'nao-existe', { label: 'Teste' }), /não encontrada/);
});

test('remove cartão pelo identificador', () => {
  const board = Board.createBoard();
  const removed = Board.removeCard(board, 'agua');
  assert.equal(removed.label, 'Quero água');
  assert.equal(Board.findCard(board, 'agua'), null);
});

test('remove cartão inexistente devolve null', () => {
  assert.equal(Board.removeCard(Board.createBoard(), 'nada'), null);
});

test('adiciona e remove categoria', () => {
  const board = Board.createBoard();
  const id = Board.addCategory(board, { label: 'Comidas', symbol: '🍎' });
  assert.equal(id, 'comidas');
  assert.ok(Board.removeCategory(board, 'comidas'));
  assert.equal(board.categories.some((c) => c.id === 'comidas'), false);
});

test('nome de categoria repetido recebe sufixo', () => {
  const board = Board.createBoard();
  assert.equal(Board.addCategory(board, { label: 'Ações' }), 'acoes-2');
});

test('rótulos são normalizados e limitados', () => {
  const long = 'a'.repeat(200);
  assert.equal(Board.cleanLabel(`  ${long}  `).length, Board.MAX_LABEL);
  assert.equal(Board.cleanLabel('  olá   mundo '), 'olá mundo');
});

test('slug remove acentos e pontuação', () => {
  assert.equal(Board.slug('Ação Rápida!'), 'acao-rapida');
  assert.equal(Board.slug('   '), '');
});

test('frase acumula cartões na ordem', () => {
  const board = Board.createBoard();
  let sentence = Board.emptySentence();
  sentence = Board.pushToSentence(sentence, Board.findCard(board, 'agua'));
  sentence = Board.pushToSentence(sentence, Board.findCard(board, 'agora'));
  assert.deepEqual(Board.sentenceToDisplay(sentence), ['Quero água', 'Agora']);
});

test('frase respeita o limite máximo', () => {
  const card = { id: 'x', label: 'Eu quero', symbol: '👉' };
  let sentence = Board.emptySentence();
  for (let i = 0; i < Board.MAX_SENTENCE + 5; i += 1) sentence = Board.pushToSentence(sentence, card);
  assert.equal(sentence.length, Board.MAX_SENTENCE);
});

test('remover o último item da frase', () => {
  const sentence = [{ id: 'a', label: 'Um', symbol: '1' }, { id: 'b', label: 'Dois', symbol: '2' }];
  assert.deepEqual(Board.popFromSentence(sentence).map((i) => i.id), ['a']);
  assert.deepEqual(Board.popFromSentence([]), []);
});

test('texto da frase usa fala personalizada quando existe', () => {
  const sentence = [
    { id: 'a', label: 'X', symbol: '1', speak: 'xis' },
    { id: 'b', label: 'Y', symbol: '2' },
  ];
  assert.equal(Board.sentenceToText(sentence), 'xis Y');
});

test('frase vazia vira texto vazio', () => {
  assert.equal(Board.sentenceToText([]), '');
});

test('push ignora cartão inexistente', () => {
  assert.deepEqual(Board.pushToSentence([], null), []);
});
