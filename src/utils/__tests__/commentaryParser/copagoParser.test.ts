/**
 * copagoParser.test.ts
 * Ubicación: src/utils/__tests__/commentaryParser/copagoParser.test.ts
 *
 * Casos tomados de comentarios reales de la subcategoría "Cuota moderadora".
 */

import {
  parseCopagoCommentary,
  getSeriesStats,
  getTotalByInstitution
} from '~/utils/commentaryParser/copagoParser';
import { CopagoData } from '~/shared/types/utils/commentaryParser/copago-analysis.types';

const COST = 43900;
const DATE = '2026-03-17';

const p = (text: string, cost = COST, date = DATE) => parseCopagoCommentary(text, cost, date);

/** Parsea una lista asignando fechas crecientes (el orden del arreglo = orden cronológico) */
const parseAll = (items: [string, number?][]): CopagoData[] =>
  items.map(([text, cost], i) => {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    const r = parseCopagoCommentary(text, cost ?? COST, date);
    if (!r) throw new Error(`No parseó: "${text}"`);
    return r;
  });

describe('copagoParser — formato estándar', () => {
  test('terapia con institución y sesión/total', () => {
    const r = p('Colmedica Terapia Física #11/20');
    expect(r).toMatchObject({
      institution: 'Colmedica',
      act: 'terapia',
      area: 'Física',
      specialtyKey: 'terapia_fisica',
      groupKey: 'terapia_fisica',
      sequenceNumber: 11,
      totalSessions: 20,
      hasSequence: true,
      sequenceKind: 'session'
    });
  });

  test('"Copago" inicial es opcional y no cambia el resultado', () => {
    expect(p('Copago Colmedica Terapia Física #11/20')).toEqual(
      p('Colmedica Terapia Física #11/20')
    );
  });

  test('consulta sin número', () => {
    const r = p('Colmedica Consulta Neurología');
    expect(r).toMatchObject({ act: 'consulta', specialtyKey: 'neurologia', hasSequence: false });
    expect(r!.sequenceKind).toBeUndefined();
  });

  test('control con número = cita #N de la especialidad (visit)', () => {
    const r = p('Colmedica Control Reumatología #2');
    expect(r).toMatchObject({
      act: 'control',
      specialtyKey: 'reumatologia',
      sequenceNumber: 2,
      sequenceKind: 'visit'
    });
    expect(r!.totalSessions).toBeUndefined();
  });

  test('sin institución', () => {
    const r = p('Control Fisiatría #3');
    expect(r!.institution).toBeUndefined();
    expect(r!.specialtyKey).toBe('fisiatria');
  });

  test('costo y fecha se preservan', () => {
    const r = p('Colmedica Terapia Física #1/20', 41800, '2026-01-05');
    expect(r!.cost).toBe(41800);
    expect(r!.date).toBe('2026-01-05');
  });

  test('actos sin especialidad agrupan por acto', () => {
    expect(p('Salud Total Medicamentos')).toMatchObject({
      groupKey: 'medicamentos',
      act: 'medicamentos'
    });
    expect(p('Colmedica Examen Gammagrafía ósea')).toMatchObject({
      groupKey: 'examenes',
      area: 'Gammagrafía ósea'
    });
    expect(p('Salud Total Laboratorio Sangre')).toMatchObject({ groupKey: 'laboratorio' });
    expect(p('Colmedica Procedimiento')).toMatchObject({ groupKey: 'procedimientos' });
    expect(p('Domicilio Laboratorio')).toMatchObject({
      groupKey: 'domicilio',
      area: 'Laboratorio'
    });
  });

  test('urgencia con especialidad cuenta para esa especialidad', () => {
    expect(p('Colmedica Urgencia Psiquiatría - Clínica Comfamiliar')).toMatchObject({
      act: 'urgencia',
      groupKey: 'psiquiatria',
      note: 'Clínica Comfamiliar'
    });
    expect(p('Urgencia')).toMatchObject({ groupKey: 'urgencias' });
  });
});

describe('copagoParser — paciente', () => {
  test('sin @ se asume Silvia', () => {
    const r = p('Colmedica Consulta Neurología');
    expect(r).toMatchObject({ patient: 'Silvia', patientIsExplicit: false });
  });

  test('@Julio explícito', () => {
    expect(p('Salud Total Medicamentos @Julio')).toMatchObject({
      patient: 'Julio',
      patientIsExplicit: true
    });
  });

  test('nombre suelto en datos históricos', () => {
    expect(p('Copago Salud Total Medicamentos Julio')!.patient).toBe('Julio');
    expect(p('Copago Colmedica Psicología Julio #3')).toMatchObject({
      patient: 'Julio',
      sequenceNumber: 3
    });
    expect(p('Copago Colmedica consulta Ortopedia y Traumatilogia(Julio)')).toMatchObject({
      patient: 'Julio',
      specialtyKey: 'ortopedia'
    });
  });

  test('el paciente no ensucia el área', () => {
    expect(p('Colmedica Consulta Neurología @Julio')!.area).toBe('Neurología');
  });
});

describe('copagoParser — nota, sesión y normalización', () => {
  test('lo que sigue a " - " es nota y no ensucia el área', () => {
    const r = p('Colmedica Control Otorrino - Limpieza oídos Bucaramanga');
    expect(r).toMatchObject({ area: 'Otorrino', note: 'Limpieza oídos Bucaramanga' });
  });

  test('rango "#18-19" no se confunde con separador de nota', () => {
    const r = p('Colmedica Terapia Física #18-19/20');
    expect(r).toMatchObject({ sequenceNumber: 18, totalSessions: 20 });
    expect(r!.note).toBeUndefined();
  });

  test('el total exige "/" (antes "#4 2026" daba total 2026)', () => {
    const r = p('Terapia Psicología #4 2026');
    expect(r).toMatchObject({ sequenceNumber: 4 });
    expect(r!.totalSessions).toBeUndefined();
  });

  test('espacios dentro de la sesión', () => {
    expect(p('Colmedica Terapia Física # 10 /20')).toMatchObject({
      sequenceNumber: 10,
      totalSessions: 20
    });
  });

  test('"Hídrica" e "Hidroterapia" son la misma especialidad', () => {
    expect(p('Colmedica Terapia Hídrica #5')!.specialtyKey).toBe('hidroterapia');
    expect(p('Colmedica Hidroterapia #1/15')).toMatchObject({
      act: 'terapia',
      specialtyKey: 'hidroterapia'
    });
  });

  test('Psicología sola implica terapia (serie abierta)', () => {
    expect(p('Psicología #3 @Julio')).toMatchObject({
      act: 'terapia',
      specialtyKey: 'psicologia',
      patient: 'Julio',
      sequenceNumber: 3
    });
  });

  test('tildes y mayúsculas no importan', () => {
    expect(p('colmédica CONSULTA neurologia')).toMatchObject({
      institution: 'Colmedica',
      specialtyKey: 'neurologia'
    });
  });

  test('"Nueva EPS" gana sobre "EPS"', () => {
    expect(p('Nueva EPS Consulta Medicina General')!.institution).toBe('Nueva EPS');
    expect(p('EPS Consulta Medicina General')!.institution).toBe('EPS');
  });

  test('"gral" se entiende como general', () => {
    expect(p('Consulta Medicina gral')!.specialtyKey).toBe('medicina_general');
  });

  test('especialidad fuera del catálogo se agrupa por su texto, no en "otro"', () => {
    const r = p('Colmedica Consulta Cardiología');
    expect(r).toMatchObject({
      specialtyKey: 'cardiologia',
      specialtyLabel: 'Cardiología',
      groupKey: 'cardiologia',
      isKnownSpecialty: false
    });
  });

  test('varias líneas — toma solo la primera', () => {
    const r = p('Colmedica Terapia Física #2/20\nColmedica Terapia Ocupacional #3/10');
    expect(r).toMatchObject({ specialtyKey: 'terapia_fisica', sequenceNumber: 2 });
  });
});

describe('copagoParser — compatibilidad con acto al final', () => {
  test('"Reumatología Control #1" se acepta (área conocida)', () => {
    expect(p('Colmedica Reumatologia Control #1')).toMatchObject({
      act: 'control',
      specialtyKey: 'reumatologia',
      sequenceNumber: 1
    });
  });

  test('no se acepta si el área no es una especialidad del catálogo', () => {
    expect(p('Pago particular exámen')).toBeNull();
    expect(p('Cardiología Control #1')).toBeNull();
  });
});

describe('copagoParser — retorna null', () => {
  test.each([
    ['"Cuota moderadora" no es sinónimo', 'Cuota moderadora cita control reumatologia'],
    ['sin acto', 'Copago Colmedica Neurocirugía'],
    ['pago particular', 'Pago particular exámen Evaluación Electro Acústica Trompa Eustaquio'],
    [
      'laboratorio a domicilio es ambiguo (debe ser Domicilio)',
      'Laboratorio sangre a domicilio Lopez Correa'
    ],
    ['consulta sin área', 'Colmedica Consulta'],
    ['control sin área', 'Control #2'],
    ['solo institución', 'Colmedica'],
    ['solo "Copago"', 'Copago'],
    ['vacío', ''],
    ['solo espacios', '   ']
  ])('%s → null', (_label, text) => {
    expect(p(text)).toBeNull();
  });
});

describe('getSeriesStats', () => {
  test('ciclos: #20/20 y luego #1/10 son ciclos distintos, no 280%', () => {
    const items = parseAll([
      ...Array.from({ length: 17 }, (_, i): [string] => [`Colmedica Terapia Física #${i + 1}/20`]),
      ['Colmedica Terapia Física #20/20'],
      ...Array.from({ length: 10 }, (_, i): [string] => [`Colmedica Terapia Física #${i + 1}/10`])
    ]);
    const stats = getSeriesStats(items).filter((s) => s.specialtyKey === 'terapia_fisica');
    expect(stats).toHaveLength(2);

    const first = stats.find((s) => s.episode === 1)!;
    expect(first).toMatchObject({
      entries: 18,
      lastNumber: 20,
      totalSessions: 20,
      isClosed: true,
      progressPercent: 100
    });
    expect(first.missingNumbers).toEqual([18, 19]);

    const second = stats.find((s) => s.episode === 2)!;
    expect(second).toMatchObject({
      entries: 10,
      lastNumber: 10,
      totalSessions: 10,
      isClosed: true
    });
    expect(second.totalEpisodes).toBe(2);
  });

  test('progreso usa el mayor #N, no la cantidad de registros', () => {
    const items = parseAll([
      ['Terapia Hidroterapia #1/15'],
      ['Terapia Hidroterapia #2/15'],
      ['Terapia Hidroterapia #4/15']
    ]);
    const [s] = getSeriesStats(items);
    expect(s).toMatchObject({ entries: 3, lastNumber: 4, progressPercent: 27, isClosed: false });
    expect(s.missingNumbers).toEqual([3]);
  });

  test('psicología abierta: sin total, nunca parte el ciclo', () => {
    const items = parseAll([
      ['Terapia Psicología #1 @Julio'],
      ['Terapia Psicología #2 @Julio'],
      ['Terapia Psicología #3 @Julio']
    ]);
    const [s] = getSeriesStats(items);
    expect(s).toMatchObject({
      patient: 'Julio',
      entries: 3,
      lastNumber: 3,
      isClosed: false,
      sequenceKind: 'session'
    });
    expect(s.totalSessions).toBeUndefined();
    expect(s.progressPercent).toBeUndefined();
  });

  test('pacientes distintos no se mezclan', () => {
    const items = parseAll([
      ['Terapia Psicología #1'],
      ['Terapia Psicología #1 @Julio'],
      ['Terapia Psicología #2 @Julio']
    ]);
    const stats = getSeriesStats(items);
    expect(stats).toHaveLength(2);
    expect(stats.map((s) => s.patient).sort()).toEqual(['Julio', 'Silvia']);
  });

  test('consulta + controles de una especialidad forman una sola serie', () => {
    const items = parseAll([
      ['Colmedica Consulta Reumatología #1', 43900],
      ['Colmedica Control Reumatología #2', 43900],
      ['Colmedica Control Reumatología #3 - resultado resonancia', 43900]
    ]);
    const [s] = getSeriesStats(items);
    expect(s).toMatchObject({
      specialtyKey: 'reumatologia',
      sequenceKind: 'visit',
      entries: 3,
      lastNumber: 3,
      totalCost: 131700,
      avgCost: 43900
    });
    expect(s.acts).toEqual({ consulta: 1, control: 2 });
  });

  test('un nuevo #1 en la misma especialidad abre un episodio nuevo', () => {
    const items = parseAll([
      ['Consulta Reumatología #1'],
      ['Control Reumatología #2'],
      ['Consulta Reumatología #1'],
      ['Control Reumatología #2']
    ]);
    const stats = getSeriesStats(items);
    expect(stats).toHaveLength(2);
    expect(stats.every((s) => s.entries === 2 && s.totalEpisodes === 2)).toBe(true);
  });

  test('un registro sin número no entra en series', () => {
    expect(getSeriesStats(parseAll([['Colmedica Consulta Neurología']]))).toEqual([]);
  });
});

describe('getTotalByInstitution', () => {
  test('agrupa y ordena por total', () => {
    const items = parseAll([
      ['Colmedica Consulta Neurología', 40000],
      ['Colmedica Terapia Física #1/20', 40000],
      ['Salud Total Medicamentos', 5000],
      ['Domicilio Laboratorio', 30000]
    ]);
    expect(getTotalByInstitution(items)).toEqual([
      { institution: 'Colmedica', total: 80000, count: 2 },
      { institution: 'Sin institución', total: 30000, count: 1 },
      { institution: 'Salud Total', total: 5000, count: 1 }
    ]);
  });
});
