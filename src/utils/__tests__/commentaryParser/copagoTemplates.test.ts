/**
 * copagoTemplates.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/copagoTemplates.test.ts
 *
 * Garantiza que los chips de copago producen texto que el parser entiende,
 * y que validateCopagoCommentary y el parser nunca se contradicen.
 */

import {
  COPAGO_CHIPS,
  buildCopagoConfig,
  validateCopagoCommentary
} from '~/utils/commentary/copagoTemplates.utils';
import { parseCopagoCommentary } from '~/utils/commentaryParser/copagoParser';
import {
  COPAGO_FORMAT_EXAMPLE,
  ACT_WORDS,
  ACT_LABELS,
  ACT_LABELS_PLURAL
} from '~/utils/commentaryParser/copagoCatalog';

describe('chips de copago', () => {
  test.each(COPAGO_CHIPS.map((c) => [c.label, c.template]))(
    'chip "%s" → "%s" parsea sin null',
    (_label, template) => {
      expect(parseCopagoCommentary(template, 1000, '2026-01-01')).not.toBeNull();
    }
  );

  test('cada chip es válido para validateCopagoCommentary', () => {
    for (const chip of COPAGO_CHIPS) {
      expect(validateCopagoCommentary(chip.template).state).toBe('valid');
    }
  });

  test('los chips cubren todos los actos del catálogo', () => {
    const covered = new Set(
      COPAGO_CHIPS.map((c) => parseCopagoCommentary(c.template, 1, '2026-01-01')!.act)
    );
    const all = new Set(Object.values(ACT_WORDS));
    // urgencia y procedimiento se escriben a mano; el resto debe tener chip
    const expected = [...all].filter((a) => a !== 'urgencia' && a !== 'procedimiento');
    expect(expected.filter((a) => !covered.has(a))).toEqual([]);
  });

  test('el ejemplo oficial y el placeholder parsean', () => {
    expect(parseCopagoCommentary(COPAGO_FORMAT_EXAMPLE, 1, '2026-01-01')).not.toBeNull();
    expect(buildCopagoConfig(1, 'Cuota moderadora', 'Salud').smartPlaceholder).toContain(
      COPAGO_FORMAT_EXAMPLE
    );
  });

  test('todos los actos tienen etiqueta singular y plural', () => {
    for (const act of new Set(Object.values(ACT_WORDS))) {
      expect(ACT_LABELS[act]).toBeTruthy();
      expect(ACT_LABELS_PLURAL[act]).toBeTruthy();
    }
  });

  test('la config declara validación activa con el parserType copago', () => {
    expect(buildCopagoConfig(1, 'x', 'y')).toMatchObject({
      parserType: 'copago',
      assistanceLevel: 'structured',
      enableValidation: true
    });
  });
});

describe('validateCopagoCommentary', () => {
  test('texto válido', () => {
    expect(validateCopagoCommentary('Colmedica Control Reumatología #2').state).toBe('valid');
  });

  test('"Cuota moderadora ..." da warning con el formato correcto', () => {
    const r = validateCopagoCommentary('Cuota moderadora medicina general');
    expect(r.state).toBe('warning');
    expect(r.message).toContain('Consulta');
  });

  test.each([
    'Colmedica Consulta Neurología',
    'Copago Colmedica Terapia Física #1/20',
    'Psicología #3 @Julio',
    'Domicilio Laboratorio - Lopez Correa',
    'Cuota moderadora cita dermatologia',
    'Laboratorio sangre a domicilio',
    'Consulta'
  ])('validate y parser coinciden en "%s"', (text) => {
    const parsed = parseCopagoCommentary(text, 1, '2026-01-01') !== null;
    expect(validateCopagoCommentary(text).state === 'valid').toBe(parsed);
  });
});
