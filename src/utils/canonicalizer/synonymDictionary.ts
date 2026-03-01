// Cada entrada: [término_canónico, [...sinónimos y variantes]]
// El término canónico es la forma "preferida" que quedará en BD.
// Criterio: usar el nombre más común en supermercados colombianos formales.

export const SYNONYM_GROUPS: [string, string[]][] = [
  [
    'Cebolla Larga',
    ['cebolla junca', 'cebolla de rama', 'cebolla cabezona larga', 'cebolla larga']
  ],
  ['Ahuyama', ['auyama', 'zapallo', 'calabaza']],
  ['Patilla', ['sandía', 'sandia', 'patilla']],
  ['Cilantro', ['cilantra', 'culantro']], // "cilantra" aparece en tus datos reales
  [
    'Limón Tahití',
    ['limon tahiti', 'limhn tahity', 'liman', 'Limon Tahiti A G', 'Limon Tahiti Ag']
  ], // "limhn" es OCR corrupto de "limón"
  ['Pimentón', ['pimenton', 'pimiento']],
  ['Pepino Cohombro', ['pepino cohombro', 'pepino']], // distinto de pepino calabacín
  ['Pepino Res', ['pepino rez', 'pepino res']], // "rez" → OCR corrupto de "res"
  [
    'Pechuga Blanca',
    ['pechuga a granel', 'pechuga blanca', 'Pechuga Blanca M', 'Pechusa Blanca M']
  ],
  ['Tomate Chonto', ['tomate chonto (a', 'tomate chonto (aa', 'tomate chonto', 'Tomate Chonto A']],
  ['Chocolo Tierno', ['Chocolo Tiernom']],
  ['Cebolla Blanca', ['Cebolla Blanca S']],
  ['Zanahoria', ['Zanahoria A Gran']],
  ['Lechuga Crespa', ['Lechuga Hidrop']],
  ['Habichuela', ['Habichuela A Gra']],
  ['Trucha', ['Trucha Xkg El Mar']],
  ['Tilapia', ['Tilapia Rio Claro']],
  ['Muslo', ['Muslo A Granel']],
  ['Papaya', ['papaya comun']],
  ['Limón Mandarino', ['Limon Mandarino']],
  ['Perníl Blanco', ['Pernil Blanco Ma']],
  ['Piña', ['Pita Goldoro Mi', 'Pita']],
  ['Papa Sin Lavar', ['Papa Sin Lavar G']],
  ['Yogurt Griego', ['Yog Griego Premi']],
  ['Fettuccine', ['Fettuccine Gramo']],
  ['Polvo Hornear', ['Polvo De Horneo']],
  ['Jamón estandar', ['Jaman EstaNdar S']]

  // ['Muslo', ['Muslo A Granel']],

  // Agrega según veas en tus datos. El diccionario crece con el uso.
];

// Índice invertido para lookup O(1): sinónimo → canónico
export const SYNONYM_INDEX: Map<string, string> = new Map(
  SYNONYM_GROUPS.flatMap(([canonical, synonyms]) =>
    synonyms.map((s) => [s.toLowerCase(), canonical])
  )
);
