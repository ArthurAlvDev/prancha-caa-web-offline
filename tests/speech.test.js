'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Speech = require('../src/speech.js');

test('normaliza opções com limites', () => {
  const opts = Speech.normalizeOptions({ rate: 9, pitch: -3, volume: 2 });
  assert.equal(opts.rate, 2);
  assert.equal(opts.pitch, 0);
  assert.equal(opts.volume, 1);
});

test('usa padrões quando faltam valores', () => {
  assert.deepEqual(Speech.normalizeOptions(), Speech.DEFAULTS);
  assert.deepEqual(Speech.normalizeOptions({ rate: 'abc' }).rate, Speech.DEFAULTS.rate);
});

test('lang padrão é português do Brasil', () => {
  assert.equal(Speech.normalizeOptions().lang, 'pt-BR');
});

test('texto da frase recebe ponto final e maiúscula', () => {
  const text = Speech.buildText([{ id: 'a', label: 'quero água' }]);
  assert.equal(text, 'Quero água.');
});

test('não duplica pontuação final', () => {
  assert.equal(Speech.buildText([{ id: 'a', label: 'Estou feliz!' }]), 'Estou feliz!');
});

test('usa fala personalizada quando definida', () => {
  assert.equal(Speech.buildText([{ id: 'a', label: 'X', speak: 'xis' }]), 'Xis.');
});

test('frase vazia produz texto vazio', () => {
  assert.equal(Speech.buildText([]), '');
  assert.equal(Speech.buildText(null), '');
});

test('escolhe voz exata pelo idioma', () => {
  const voices = [{ lang: 'en-US' }, { lang: 'pt-BR' }, { lang: 'pt-PT' }];
  assert.equal(Speech.pickVoice(voices, 'pt-BR').lang, 'pt-BR');
});

test('escolhe voz do mesmo idioma base quando não há exata', () => {
  const voices = [{ lang: 'en-US' }, { lang: 'pt-PT' }];
  assert.equal(Speech.pickVoice(voices, 'pt-BR').lang, 'pt-PT');
});

test('devolve null quando não há voz compatível', () => {
  assert.equal(Speech.pickVoice([{ lang: 'en-US' }], 'pt-BR'), null);
  assert.equal(Speech.pickVoice([], 'pt-BR'), null);
});

test('fila sem suporte informa erro claro', async () => {
  const { speak, queue } = Speech.createQueue(null);
  assert.equal(queue.supported, false);
  const result = await speak('teste');
  assert.equal(result.ok, false);
  assert.match(result.error, /síntese de voz/);
});

test('fila recusa texto vazio', async () => {
  const fake = { speak() {}, getVoices: () => [], cancel() {} };
  const { speak } = Speech.createQueue(fake);
  const result = await speak('   ');
  assert.equal(result.ok, false);
  assert.match(result.error, /Nada para falar/);
});

test('stop cancela a síntese pendente', () => {
  let cancelled = false;
  const fake = { speak() {}, getVoices: () => [], cancel: () => { cancelled = true; } };
  const { stop } = Speech.createQueue(fake);
  stop();
  assert.equal(cancelled, true);
});
