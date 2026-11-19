/* Persistência local e importação/exportação JSON da prancha. */
(function (root, factory) {
  const deps =
    typeof module === 'object' && module.exports ? { board: require('./board.js') } : { board: root.Board };
  const api = factory(deps.board);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BoardStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Board) {
  'use strict';

  const KEY = 'prancha-caa:v1';
  const MAX_BYTES = 2 * 1024 * 1024;

  function validate(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      return { ok: false, errors: ['O arquivo não contém um objeto de prancha.'] };
    }
    if (data.version != null && Number(data.version) !== Board.SCHEMA_VERSION) {
      errors.push(`Versão desconhecida (${data.version}); esperada ${Board.SCHEMA_VERSION}.`);
    }
    if (!Array.isArray(data.categories) || data.categories.length === 0) {
      errors.push('A prancha precisa de pelo menos uma categoria.');
      return { ok: false, errors };
    }
    const seen = new Set();
    data.categories.forEach((category, index) => {
      if (!category || typeof category !== 'object') {
        errors.push(`Categoria ${index + 1} inválida.`);
        return;
      }
      if (!Board.cleanLabel(category.label)) errors.push(`Categoria ${index + 1} sem nome.`);
      if (!Array.isArray(category.cards)) {
        errors.push(`Categoria "${category.label || index + 1}" sem lista de cartões.`);
        return;
      }
      category.cards.forEach((card) => {
        if (!card || !Board.cleanLabel(card.label)) {
          errors.push(`Cartão sem nome em "${category.label || index + 1}".`);
          return;
        }
        if (card.id) {
          if (seen.has(card.id)) errors.push(`Cartão repetido: ${card.id}.`);
          seen.add(card.id);
        }
      });
    });
    return { ok: errors.length === 0, errors };
  }

  function exportJSON(board) {
    const payload = {
      version: Board.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      name: board.name,
      categories: board.categories,
    };
    return JSON.stringify(payload, null, 2) + '\n';
  }

  function importJSON(text) {
    const raw = String(text == null ? '' : text);
    if (!raw.trim()) return { ok: false, error: 'Arquivo vazio.' };
    if (raw.length > MAX_BYTES) return { ok: false, error: 'Arquivo grande demais (limite de 2 MB).' };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return { ok: false, error: 'JSON inválido: verifique vírgulas e aspas.' };
    }
    const check = validate(parsed);
    if (!check.ok) return { ok: false, error: check.errors.join(' '), errors: check.errors };
    return { ok: true, board: Board.createBoard(parsed), warnings: check.errors };
  }

  function createStore(storage) {
    const store = storage;
    const available = (() => {
      try {
        const probe = '__caa_probe__';
        store.setItem(probe, '1');
        store.removeItem(probe);
        return true;
      } catch (_err) {
        return false;
      }
    })();

    return {
      available,
      save(board) {
        if (!available) return { ok: false, error: 'Armazenamento indisponível neste navegador.' };
        try {
          store.setItem(KEY, JSON.stringify({ version: Board.SCHEMA_VERSION, name: board.name, categories: board.categories }));
          return { ok: true };
        } catch (_err) {
          return { ok: false, error: 'Não foi possível salvar (armazenamento cheio ou bloqueado).' };
        }
      },
      load() {
        if (!available) return { ok: false, error: 'Armazenamento indisponível neste navegador.' };
        const raw = store.getItem(KEY);
        if (!raw) return { ok: false, error: 'Nenhuma prancha salva.' };
        const result = importJSON(raw);
        if (!result.ok) return { ok: false, error: `Prancha salva ilegível: ${result.error}` };
        return { ok: true, board: result.board };
      },
      clear() {
        if (!available) return false;
        store.removeItem(KEY);
        return true;
      },
    };
  }

  function memoryStorage() {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
      get length() {
        return map.size;
      },
    };
  }

  return { KEY, MAX_BYTES, validate, exportJSON, importJSON, createStore, memoryStorage };
});
