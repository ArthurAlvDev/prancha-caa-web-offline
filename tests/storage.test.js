'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Board = require('../src/board.js');
const Storage = require('../src/storage.js');

test('valida uma prancha correta', () => {
  const result = Storage.validate(Board.createBoard());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('rejeita valor que não é objeto', () => {
  assert.equal(Storage.validate(null).ok, false);
  assert.equal(Storage.validate('texto').ok, false);
});

test('rejeita prancha sem categorias', () => {
  const result = Storage.validate({ version: 1, categories: [] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /pelo menos uma categoria/);
});

test('rejeita cartão sem nome', () => {
  const result = Storage.validate({ version: 1, categories: [{ label: 'A', cards: [{ id: 'a', label: '' }] }] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /sem nome/);
});

test('rejeita identificadores repetidos', () => {
  const result = Storage.validate({
    version: 1,
    categories: [
      { label: 'A', cards: [{ id: 'x', label: 'Um' }] },
      { label: 'B', cards: [{ id: 'x', label: 'Dois' }] },
    ],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /repetido/);
});

test('rejeita versão desconhecida', () => {
  const board = Board.createBoard();
  board.version = 99;
  const result = Storage.validate(board);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /Versão desconhecida/);
});

test('exportar e importar preserva o conteúdo', () => {
  const board = Board.createBoard();
  const json = Storage.exportJSON(board);
  const back = Storage.importJSON(json);
  assert.equal(back.ok, true);
  assert.equal(back.board.categories.length, board.categories.length);
  assert.equal(Board.allCards(back.board).length, Board.allCards(board).length);
});

test('exportação inclui versão e data', () => {
  const json = Storage.exportJSON(Board.createBoard());
  const parsed = JSON.parse(json);
  assert.equal(parsed.version, Board.SCHEMA_VERSION);
  assert.match(parsed.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('importação de texto vazio falha com mensagem', () => {
  assert.match(Storage.importJSON('').error, /vazio/);
});

test('importação de JSON inválido falha com mensagem', () => {
  assert.match(Storage.importJSON('{ nope }').error, /JSON inválido/);
});

test('importação grande demais é recusada', () => {
  const huge = 'x'.repeat(Storage.MAX_BYTES + 1);
  assert.match(Storage.importJSON(huge).error, /grande demais/);
});

test('importação de prancha inválida devolve erros', () => {
  const result = Storage.importJSON(JSON.stringify({ version: 1, categories: [] }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test('importação normaliza o rótulo da prancha', () => {
  const json = JSON.stringify({ version: 1, name: '   ', categories: [{ label: 'A', cards: [{ id: 'a', label: 'Um' }] }] });
  const result = Storage.importJSON(json);
  assert.equal(result.ok, true);
  assert.equal(result.board.name, 'Minha prancha');
});

test('store salva, carrega e limpa', () => {
  const store = Storage.createStore(Storage.memoryStorage());
  const board = Board.createBoard();
  Board.addCard(board, 'necessidades', { label: 'Teste de persistência' });
  assert.equal(store.save(board).ok, true);
  const loaded = store.load();
  assert.equal(loaded.ok, true);
  assert.ok(Board.findCard(loaded.board, 'teste-de-persistencia'));
  assert.equal(store.clear(), true);
  assert.equal(store.load().ok, false);
});

test('store informa quando não há nada salvo', () => {
  const store = Storage.createStore(Storage.memoryStorage());
  const result = store.load();
  assert.equal(result.ok, false);
  assert.match(result.error, /Nenhuma prancha salva/);
});

test('store detecta armazenamento indisponível', () => {
  const broken = {
    getItem() { throw new Error('bloqueado'); },
    setItem() { throw new Error('bloqueado'); },
    removeItem() { throw new Error('bloqueado'); },
  };
  const store = Storage.createStore(broken);
  assert.equal(store.available, false);
  assert.equal(store.save(Board.createBoard()).ok, false);
  assert.equal(store.load().ok, false);
});

test('store trata dado salvo corrompido', () => {
  const memory = Storage.memoryStorage();
  memory.setItem(Storage.KEY, '{{{');
  const store = Storage.createStore(memory);
  const result = store.load();
  assert.equal(result.ok, false);
  assert.match(result.error, /ilegível/);
});
