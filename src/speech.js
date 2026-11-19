/* Fala: montagem do texto e fila de síntese de voz (SpeechSynthesis). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Speech = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULTS = { rate: 0.95, pitch: 1, volume: 1, lang: 'pt-BR' };

  function normalizeOptions(options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    const clamp = (value, min, max, fallback) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(max, Math.max(min, n));
    };
    return {
      rate: clamp(opts.rate, 0.5, 2, DEFAULTS.rate),
      pitch: clamp(opts.pitch, 0, 2, DEFAULTS.pitch),
      volume: clamp(opts.volume, 0, 1, DEFAULTS.volume),
      lang: String(opts.lang || DEFAULTS.lang),
    };
  }

  function buildText(sentence) {
    const items = Array.isArray(sentence) ? sentence : [];
    const text = items
      .map((item) => (item && (item.speak || item.label)) || '')
      .map((part) => String(part).replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' ');
    if (!text) return '';
    const first = text.charAt(0).toUpperCase();
    return first + text.slice(1) + (/[.!?]$/.test(text) ? '' : '.');
  }

  function pickVoice(voices, lang) {
    const list = Array.isArray(voices) ? voices : [];
    if (!list.length) return null;
    const target = String(lang || 'pt-BR').toLowerCase();
    const base = target.split('-')[0];
    const exact = list.find((v) => String(v.lang || '').toLowerCase() === target);
    if (exact) return exact;
    const sameBase = list.find((v) => String(v.lang || '').toLowerCase().startsWith(base));
    if (sameBase) return sameBase;
    return list.find((v) => /^pt/i.test(String(v.lang || ''))) || null;
  }

  function createQueue(backend) {
    const synth = backend || (typeof window !== 'undefined' ? window.speechSynthesis : null);
    const queue = {
      speaking: false,
      supported: Boolean(synth && typeof synth.speak === 'function'),
      lastError: null,
    };

    function speak(text, options) {
      if (!queue.supported) {
        queue.lastError = 'Este navegador não oferece síntese de voz.';
        return Promise.resolve({ ok: false, error: queue.lastError });
      }
      const value = String(text || '').trim();
      if (!value) return Promise.resolve({ ok: false, error: 'Nada para falar.' });
      if (typeof window === 'undefined' || !window.SpeechSynthesisUtterance) {
        queue.lastError = 'Síntese de voz indisponível neste ambiente.';
        return Promise.resolve({ ok: false, error: queue.lastError });
      }

      const opts = normalizeOptions(options);
      return new Promise((resolve) => {
        const utterance = new window.SpeechSynthesisUtterance(value);
        utterance.lang = opts.lang;
        utterance.rate = opts.rate;
        utterance.pitch = opts.pitch;
        utterance.volume = opts.volume;
        const voice = pickVoice(synth.getVoices ? synth.getVoices() : [], opts.lang);
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          queue.speaking = false;
          resolve({ ok: true });
        };
        utterance.onerror = (event) => {
          queue.speaking = false;
          queue.lastError = (event && event.error) || 'falha na síntese';
          resolve({ ok: false, error: queue.lastError });
        };
        queue.speaking = true;
        synth.speak(utterance);
      });
    }

    function stop() {
      if (synth && typeof synth.cancel === 'function') synth.cancel();
      queue.speaking = false;
    }

    return { queue, speak, stop, normalizeOptions, buildText, pickVoice };
  }

  return { DEFAULTS, normalizeOptions, buildText, pickVoice, createQueue };
});
