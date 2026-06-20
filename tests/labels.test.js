import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONDITION_LABELS_ES,
  CONDITION_SKY_PHRASE_ES,
  conditionLabelEs,
  conditionSkyPhraseEs,
  formatAqiPhraseEs,
} from '../src/logic/agent-context/labels.js';

describe('labels', () => {
  describe('conditionSkyPhraseEs', () => {
    it('derives sky phrases from condition labels with explicit overrides', () => {
      assert.equal(CONDITION_SKY_PHRASE_ES.Clear, CONDITION_LABELS_ES.Clear);
      assert.equal(CONDITION_SKY_PHRASE_ES.Cloudy, CONDITION_LABELS_ES.Cloudy);
      assert.notEqual(CONDITION_SKY_PHRASE_ES.Thunderstorm, CONDITION_LABELS_ES.Thunderstorm);
    });

    it('returns singular predicative phrases for clear skies', () => {
      assert.equal(conditionSkyPhraseEs('Clear'), 'despejado');
      assert.equal(conditionSkyPhraseEs('Partly Cloudy'), 'parcialmente nublado');
    });

    it('uses natural thunderstorm phrasing', () => {
      assert.equal(conditionSkyPhraseEs('Thunderstorm'), 'cubierto con tormenta eléctrica activa');
    });

    it('falls back when condition is missing', () => {
      assert.equal(conditionSkyPhraseEs(undefined), 'con condiciones no disponibles');
    });
  });

  describe('formatAqiPhraseEs', () => {
    it('maps EPA bands to Spanish phrases', () => {
      assert.equal(formatAqiPhraseEs(38), 'aire limpio');
      assert.equal(formatAqiPhraseEs(77), 'aire moderado');
      assert.equal(formatAqiPhraseEs(120), 'aire poco saludable para sensibles');
      assert.equal(formatAqiPhraseEs(180), 'aire poco saludable');
      assert.equal(formatAqiPhraseEs(250), 'aire muy poco saludable');
      assert.equal(formatAqiPhraseEs(350), 'aire peligroso');
    });

    it('does not use aceptable for moderate band', () => {
      assert.doesNotMatch(formatAqiPhraseEs(57), /aceptable/);
    });
  });

  describe('conditionLabelEs', () => {
    it('keeps short labels for tldr', () => {
      assert.equal(conditionLabelEs('Cloudy'), 'nublado');
      assert.equal(conditionLabelEs('Thunderstorm'), 'con tormenta');
    });
  });
});
