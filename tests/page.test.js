'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('declara idioma, título e descrição', () => {
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<title>[^<]*Prancha CAA/);
  assert.match(html, /name="description"/);
});

test('tem estrutura semântica com um único h1', () => {
  assert.match(html, /class="skip-link" href="#main"/);
  assert.match(html, /<main id="main">/);
  assert.equal((html.match(/<h1/g) || []).length, 1);
});

test('referências locais existem', () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)]
    .map((m) => m[1])
    .filter((r) => !/^https?:|^data:/.test(r));
  assert.ok(refs.length >= 5);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), `ausente: ${ref}`);
});

test('status e frase são regiões vivas', () => {
  assert.match(html, /id="status"[^>]*role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /id="sentence"[^>]*aria-live="polite"/);
});

test('CSP restritiva e nenhum script externo', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'self'/);
  assert.doesNotMatch(html, /src="https?:\/\//);
});

test('campos do formulário têm rótulo', () => {
  const ids = [
    ...html.matchAll(/<input[^>]*type="(?:text|search|range)"[^>]*id="([^"]+)"/g),
    ...html.matchAll(/<select[^>]*id="([^"]+)"/g),
  ].map((m) => m[1]);
  assert.ok(ids.length >= 5);
  for (const id of ids) assert.ok(html.includes(`for="${id}"`), `sem rótulo: ${id}`);
});

test('o formulário não envia dados para servidor', () => {
  assert.doesNotMatch(html, /<form[^>]*action="https?:/);
  assert.match(html, /form-action 'none'/);
});

test('credita OlacDev', () => {
  assert.match(html, /Made by OlacDev/);
  assert.match(html, /https:\/\/olacdev\.com\//);
});

test('não carrega imagens externas', () => {
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /url\(https?:/);
});

test('a prancha padrão oferece vocabulário suficiente para uso imediato', () => {
  const Board = require('../src/board.js');
  const board = Board.createBoard();
  assert.ok(board.categories.length >= 6);
  assert.ok(Board.allCards(board).length >= 36);
  const categories = board.categories.map((c) => c.id);
  for (const expected of ['necessidades', 'sentimentos', 'pessoas', 'acoes']) {
    assert.ok(categories.includes(expected), `faltou categoria ${expected}`);
  }
});

test('o service worker lista apenas arquivos existentes', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const assets = [...sw.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]);
  assert.ok(assets.length >= 7);
  for (const asset of assets) {
    if (asset === '/' || asset === '/index.html') continue;
    assert.ok(fs.existsSync(path.join(root, asset.slice(1))), `ausente no cache: ${asset}`);
  }
});

test('o manifesto é válido e aponta para o ícone', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.lang, 'pt-BR');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.length >= 1);
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)));
});

test('a interface registra o service worker', () => {
  const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
  assert.match(app, /serviceWorker\.register\('sw\.js'\)/);
});
