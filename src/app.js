/* Prancha CAA — interface (100% local). */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const store = BoardStorage.createStore(window.localStorage);
  const voice = Speech.createQueue(window.speechSynthesis);

  const state = {
    board: Board.createBoard(),
    sentence: Board.emptySentence(),
    activeCategory: null,
    editing: false,
    query: '',
  };

  const escapeHTML = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function setStatus(message, kind) {
    const el = $('status');
    el.textContent = message;
    el.dataset.kind = kind || 'info';
  }

  /* ---------- renderização ---------- */

  function renderTabs() {
    const tabs = $('tabs');
    tabs.innerHTML = '';
    state.board.categories.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tab';
      button.dataset.category = category.id;
      button.setAttribute('aria-pressed', String(category.id === state.activeCategory));
      button.innerHTML = `<span aria-hidden="true">${escapeHTML(category.symbol)}</span> ${escapeHTML(category.label)}`;
      button.addEventListener('click', () => {
        state.activeCategory = category.id;
        state.query = '';
        $('search').value = '';
        renderTabs();
        renderGrid();
      });
      tabs.appendChild(button);
    });
  }

  function currentCards() {
    if (state.query) return Board.searchCards(state.board, state.query);
    const category = state.board.categories.find((c) => c.id === state.activeCategory);
    return category ? category.cards.map((c) => Object.assign({ categoryId: category.id }, c)) : [];
  }

  function renderGrid() {
    const grid = $('grid');
    grid.innerHTML = '';
    const cards = currentCards();

    if (!cards.length) {
      grid.innerHTML = `<p class="empty">${state.query ? 'Nenhum cartão encontrado para esta busca.' : 'Esta categoria está vazia. Adicione um cartão abaixo.'}</p>`;
      return;
    }

    cards.forEach((card) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('aria-label', `${card.label}. Adicionar à frase.`);
      tile.innerHTML =
        `<span class="glyph" aria-hidden="true">${escapeHTML(card.symbol)}</span>` +
        `<span class="label">${escapeHTML(card.label)}</span>` +
        (state.editing ? `<button type="button" class="remove" aria-label="Apagar cartão ${escapeHTML(card.label)}">✕</button>` : '');

      tile.addEventListener('click', (event) => {
        if (event.target.closest('.remove')) return;
        addToSentence(card);
      });
      tile.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          addToSentence(card);
        }
      });

      const remove = tile.querySelector('.remove');
      if (remove) {
        remove.addEventListener('click', (event) => {
          event.stopPropagation();
          deleteCard(card);
        });
      }

      grid.appendChild(tile);
    });
  }

  function renderSentence() {
    const box = $('sentence');
    if (!state.sentence.length) {
      box.innerHTML = '<p class="placeholder">Toque nos cartões abaixo para montar a frase.</p>';
      return;
    }
    box.innerHTML = state.sentence
      .map(
        (item) =>
          `<span class="item"><span class="glyph" aria-hidden="true">${escapeHTML(item.symbol)}</span>${escapeHTML(item.label)}</span>`
      )
      .join('');
  }

  function renderCategorySelect() {
    const select = $('new-category');
    const previous = select.value;
    select.innerHTML = state.board.categories
      .map((c) => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.label)}</option>`)
      .join('');
    const wanted = previous || state.activeCategory;
    if (wanted && state.board.categories.some((c) => c.id === wanted)) select.value = wanted;
  }

  function renderAll() {
    renderTabs();
    renderGrid();
    renderSentence();
    renderCategorySelect();
  }

  /* ---------- frase ---------- */

  function addToSentence(card) {
    const before = state.sentence.length;
    state.sentence = Board.pushToSentence(state.sentence, card);
    renderSentence();
    if (state.sentence.length === before) {
      setStatus(`A frase chegou ao limite de ${Board.MAX_SENTENCE} cartões. Fale ou apague antes de continuar.`, 'error');
      return;
    }
    setStatus(`"${card.label}" adicionado. ${state.sentence.length} cartão(ões) na frase.`, 'ok');
  }

  function deleteCard(card) {
    if (!window.confirm(`Apagar o cartão "${card.label}"?`)) return;
    Board.removeCard(state.board, card.id);
    state.sentence = state.sentence.filter((item) => item.id !== card.id);
    renderAll();
    persist(true);
    setStatus(`Cartão "${card.label}" apagado.`, 'ok');
  }

  /* ---------- persistência ---------- */

  function persist(silent) {
    const result = store.save(state.board);
    if (!silent) {
      if (result.ok) setStatus('Prancha salva neste navegador.', 'ok');
      else setStatus(result.error, 'error');
    } else if (!result.ok) {
      setStatus(result.error, 'error');
    }
    return result.ok;
  }

  function exportBoard() {
    const json = BoardStorage.exportJSON(state.board);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prancha-${Board.slug(state.board.name) || 'caa'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setStatus('Arquivo .json exportado. Guarde como backup.', 'ok');
  }

  function importBoard(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = BoardStorage.importJSON(String(reader.result || ''));
      if (!result.ok) {
        setStatus(`Importação recusada: ${result.error}`, 'error');
        return;
      }
      state.board = result.board;
      state.sentence = Board.emptySentence();
      state.activeCategory = state.board.categories[0] ? state.board.categories[0].id : null;
      state.query = '';
      $('search').value = '';
      renderAll();
      persist(true);
      setStatus(`Prancha "${state.board.name}" importada com ${Board.allCards(state.board).length} cartões.`, 'ok');
    };
    reader.onerror = () => setStatus('Não foi possível ler o arquivo.', 'error');
    reader.readAsText(file);
  }

  /* ---------- fala ---------- */

  function speakSentence() {
    if (!state.sentence.length) {
      setStatus('Monte uma frase antes de falar.', 'error');
      return;
    }
    const text = Speech.buildText(state.sentence);
    const rate = Number($('rate').value) || 0.95;
    voice.queue.supported
      ? setStatus(`Falando: ${text}`, 'info')
      : setStatus('Este navegador não oferece síntese de voz. A prancha continua utilizável por cartões.', 'error');

    voice.speak(text, { rate }).then((result) => {
      if (!result.ok) setStatus(`Não foi possível falar: ${result.error}`, 'error');
    });
  }

  /* ---------- eventos ---------- */

  function bind() {
    $('btn-add').addEventListener('click', () => {
      const categoryId = $('new-category').value;
      const label = $('new-label').value;
      const symbol = $('new-symbol').value || '🔤';
      try {
        const id = Board.addCard(state.board, categoryId, { label, symbol });
        $('new-label').value = '';
        $('new-symbol').value = '';
        state.activeCategory = categoryId;
        state.query = '';
        $('search').value = '';
        renderAll();
        persist(true);
        setStatus(`Cartão "${Board.findCard(state.board, id).label}" adicionado em ${categoryId}.`, 'ok');
        $('new-label').focus();
      } catch (err) {
        setStatus(err.message, 'error');
      }
    });

    $('btn-add-category').addEventListener('click', () => {
      const label = window.prompt('Nome da nova categoria:');
      if (!label) return;
      try {
        const id = Board.addCategory(state.board, { label });
        state.activeCategory = id;
        state.query = '';
        $('search').value = '';
        renderAll();
        persist(true);
        setStatus(`Categoria "${label}" criada. Adicione cartões a ela.`, 'ok');
      } catch (err) {
        setStatus(err.message, 'error');
      }
    });

    $('edit-mode').addEventListener('change', (event) => {
      state.editing = event.target.checked;
      renderGrid();
      setStatus(state.editing ? 'Modo de edição ativo: os cartões mostram o botão apagar.' : 'Modo de edição desligado.', 'info');
    });

    $('search').addEventListener('input', (event) => {
      state.query = event.target.value.trim();
      renderGrid();
    });

    $('btn-speak').addEventListener('click', speakSentence);

    $('btn-back').addEventListener('click', () => {
      if (!state.sentence.length) return;
      state.sentence = Board.popFromSentence(state.sentence);
      renderSentence();
      setStatus('Último cartão removido da frase.', 'info');
    });

    $('btn-clear').addEventListener('click', () => {
      voice.stop();
      state.sentence = Board.emptySentence();
      renderSentence();
      setStatus('Frase limpa.', 'info');
    });

    $('rate').addEventListener('input', (event) => {
      $('rate-out').textContent = Number(event.target.value).toFixed(2).replace('.', ',') + '×';
    });

    $('btn-save').addEventListener('click', () => persist(false));

    $('btn-load').addEventListener('click', () => {
      const result = store.load();
      if (!result.ok) {
        setStatus(result.error, 'error');
        return;
      }
      state.board = result.board;
      state.sentence = Board.emptySentence();
      state.activeCategory = state.board.categories[0] ? state.board.categories[0].id : null;
      renderAll();
      setStatus(`Prancha "${state.board.name}" carregada.`, 'ok');
    });

    $('btn-export').addEventListener('click', exportBoard);

    $('btn-import').addEventListener('click', () => $('file').click());
    $('file').addEventListener('change', (event) => {
      importBoard(event.target.files && event.target.files[0]);
      event.target.value = '';
    });

    $('btn-reset').addEventListener('click', () => {
      if (!window.confirm('Voltar à prancha padrão? Suas alterações não salvas serão perdidas.')) return;
      state.board = Board.createBoard();
      state.sentence = Board.emptySentence();
      state.activeCategory = state.board.categories[0].id;
      state.query = '';
      $('search').value = '';
      renderAll();
      persist(true);
      setStatus('Prancha padrão restaurada.', 'ok');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();

    const saved = store.load();
    if (saved.ok) {
      state.board = saved.board;
      setStatus('Prancha salva carregada automaticamente.', 'ok');
    } else {
      setStatus(
        store.available
          ? 'Prancha padrão pronta. Edite e salve para guardar suas mudanças.'
          : 'Este navegador bloqueou o armazenamento local: a prancha funciona, mas não fica salva.',
        store.available ? 'info' : 'error'
      );
    }

    state.activeCategory = state.board.categories[0] ? state.board.categories[0].id : null;
    renderAll();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {
        setStatus('A prancha funciona, mas o modo offline não pôde ser ativado neste navegador.', 'info');
      });
    }
  });
})();
