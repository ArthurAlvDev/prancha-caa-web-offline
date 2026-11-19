/* Modelo da prancha de comunicação alternativa (CAA) — puro, sem DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Board = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA_VERSION = 1;
  const MAX_LABEL = 48;
  const MAX_SENTENCE = 24;

  const DEFAULT_BOARD = {
    version: SCHEMA_VERSION,
    name: 'Prancha essencial',
    categories: [
      {
        id: 'necessidades',
        label: 'Necessidades',
        symbol: '🙋',
        cards: [
          { id: 'agua', label: 'Quero água', symbol: '💧' },
          { id: 'banheiro', label: 'Preciso do banheiro', symbol: '🚻' },
          { id: 'comida', label: 'Quero comer', symbol: '🍽️' },
          { id: 'dor', label: 'Estou com dor', symbol: '🤕' },
          { id: 'descanso', label: 'Quero descansar', symbol: '🛏️' },
          { id: 'ajuda', label: 'Preciso de ajuda', symbol: '🆘' },
        ],
      },
      {
        id: 'sentimentos',
        label: 'Sentimentos',
        symbol: '🙂',
        cards: [
          { id: 'feliz', label: 'Estou feliz', symbol: '😀' },
          { id: 'triste', label: 'Estou triste', symbol: '😢' },
          { id: 'cansado', label: 'Estou cansado', symbol: '😴' },
          { id: 'calmo', label: 'Estou calmo', symbol: '😌' },
          { id: 'ansioso', label: 'Estou ansioso', symbol: '😰' },
          { id: 'bravo', label: 'Estou com raiva', symbol: '😠' },
        ],
      },
      {
        id: 'pessoas',
        label: 'Pessoas',
        symbol: '👥',
        cards: [
          { id: 'mae', label: 'Minha mãe', symbol: '👩' },
          { id: 'pai', label: 'Meu pai', symbol: '👨' },
          { id: 'cuidador', label: 'Meu cuidador', symbol: '🧑‍⚕️' },
          { id: 'professor', label: 'Meu professor', symbol: '🧑‍🏫' },
          { id: 'amigo', label: 'Meu amigo', symbol: '🧑‍🤝‍🧑' },
          { id: 'eu', label: 'Eu', symbol: '🙂' },
        ],
      },
      {
        id: 'acoes',
        label: 'Ações',
        symbol: '✋',
        cards: [
          { id: 'quero', label: 'Eu quero', symbol: '👉' },
          { id: 'nao-quero', label: 'Eu não quero', symbol: '🙅' },
          { id: 'mais', label: 'Mais', symbol: '➕' },
          { id: 'acabou', label: 'Acabou', symbol: '✅' },
          { id: 'espera', label: 'Espere', symbol: '⏸️' },
          { id: 'de-novo', label: 'De novo', symbol: '🔁' },
        ],
      },
      {
        id: 'lugares',
        label: 'Lugares',
        symbol: '🏠',
        cards: [
          { id: 'casa', label: 'Ir para casa', symbol: '🏠' },
          { id: 'escola', label: 'Ir para a escola', symbol: '🏫' },
          { id: 'rua', label: 'Sair', symbol: '🚪' },
          { id: 'medico', label: 'Ir ao médico', symbol: '🏥' },
          { id: 'parque', label: 'Ir ao parque', symbol: '🌳' },
          { id: 'carro', label: 'Entrar no carro', symbol: '🚗' },
        ],
      },
      {
        id: 'tempo',
        label: 'Tempo',
        symbol: '⏰',
        cards: [
          { id: 'agora', label: 'Agora', symbol: '⏱️' },
          { id: 'depois', label: 'Depois', symbol: '🕓' },
          { id: 'hoje', label: 'Hoje', symbol: '📅' },
          { id: 'amanha', label: 'Amanhã', symbol: '🌅' },
          { id: 'noite', label: 'À noite', symbol: '🌙' },
          { id: 'rapido', label: 'Rápido', symbol: '⚡' },
        ],
      },
    ],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function slug(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function cleanLabel(value) {
    return String(value == null ? '' : value)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_LABEL);
  }

  function createBoard(source) {
    const board = source ? clone(source) : clone(DEFAULT_BOARD);
    board.version = SCHEMA_VERSION;
    board.name = cleanLabel(board.name || 'Minha prancha') || 'Minha prancha';
    board.categories = (board.categories || []).map((category, index) => ({
      id: category.id || slug(category.label) || `cat-${index + 1}`,
      label: cleanLabel(category.label) || `Categoria ${index + 1}`,
      symbol: String(category.symbol || '📁').slice(0, 8),
      cards: (category.cards || []).map((card, cardIndex) => ({
        id: card.id || slug(card.label) || `card-${index + 1}-${cardIndex + 1}`,
        label: cleanLabel(card.label),
        symbol: String(card.symbol || '🔤').slice(0, 8),
        speak: card.speak ? cleanLabel(card.speak) : undefined,
      })).filter((card) => card.label),
    }));
    return board;
  }

  function allCards(board) {
    const out = [];
    for (const category of board.categories) {
      for (const card of category.cards) {
        out.push(Object.assign({ categoryId: category.id, categoryLabel: category.label }, card));
      }
    }
    return out;
  }

  function findCard(board, cardId) {
    for (const category of board.categories) {
      const card = category.cards.find((c) => c.id === cardId);
      if (card) return Object.assign({ categoryId: category.id, categoryLabel: category.label }, card);
    }
    return null;
  }

  function normalizeQuery(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function searchCards(board, query) {
    const needle = normalizeQuery(query);
    if (!needle) return [];
    const words = needle.split(/\s+/);
    return allCards(board).filter((card) => {
      const haystack = normalizeQuery(`${card.label} ${card.categoryLabel}`);
      return words.every((word) => haystack.includes(word));
    });
  }

  function addCard(board, categoryId, card) {
    const category = board.categories.find((c) => c.id === categoryId);
    if (!category) throw new Error(`Categoria não encontrada: ${categoryId}`);
    const label = cleanLabel(card && card.label);
    if (!label) throw new Error('O cartão precisa de um nome.');
    const baseId = slug(label) || 'cartao';
    let id = baseId;
    let suffix = 2;
    while (findCard(board, id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    category.cards.push({ id, label, symbol: String((card && card.symbol) || '🔤').slice(0, 8) });
    return id;
  }

  function removeCard(board, cardId) {
    for (const category of board.categories) {
      const index = category.cards.findIndex((c) => c.id === cardId);
      if (index >= 0) {
        const removed = category.cards.splice(index, 1)[0];
        return removed;
      }
    }
    return null;
  }

  function addCategory(board, category) {
    const label = cleanLabel(category && category.label);
    if (!label) throw new Error('A categoria precisa de um nome.');
    const baseId = slug(label) || 'categoria';
    let id = baseId;
    let suffix = 2;
    while (board.categories.some((c) => c.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    board.categories.push({ id, label, symbol: String((category && category.symbol) || '📁').slice(0, 8), cards: [] });
    return id;
  }

  function removeCategory(board, categoryId) {
    const index = board.categories.findIndex((c) => c.id === categoryId);
    if (index < 0) return null;
    return board.categories.splice(index, 1)[0];
  }

  /* ---- frase ---- */

  function emptySentence() {
    return [];
  }

  function pushToSentence(sentence, card) {
    if (!card) return sentence;
    if (sentence.length >= MAX_SENTENCE) {
      return sentence.slice(0, MAX_SENTENCE);
    }
    return sentence.concat([{ id: card.id, label: card.label, symbol: card.symbol, speak: card.speak }]);
  }

  function popFromSentence(sentence) {
    return sentence.slice(0, -1);
  }

  function sentenceToText(sentence) {
    return sentence
      .map((item) => cleanLabel(item.speak || item.label))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sentenceToDisplay(sentence) {
    return sentence.map((item) => item.label);
  }

  return {
    SCHEMA_VERSION,
    MAX_LABEL,
    MAX_SENTENCE,
    DEFAULT_BOARD,
    createBoard,
    allCards,
    findCard,
    searchCards,
    addCard,
    removeCard,
    addCategory,
    removeCategory,
    emptySentence,
    pushToSentence,
    popFromSentence,
    sentenceToText,
    sentenceToDisplay,
    slug,
    cleanLabel,
    normalizeQuery,
  };
});
