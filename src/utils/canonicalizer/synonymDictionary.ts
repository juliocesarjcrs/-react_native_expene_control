// Cada entrada: [término_canónico, [...sinónimos y variantes]]
// El término canónico es la forma "preferida" que quedará en BD.
// Criterio: usar el nombre más común en supermercados colombianos formales.
// Última actualización: generado a partir de historial de comentarios (OCR + manual)

export const SYNONYM_GROUPS: [string, string[]][] = [
  // ─── VERDURAS Y TUBÉRCULOS ──────────────────────────────────────────────────

  [
    'Cebolla Larga',
    ['cebolla junca', 'cebolla de rama', 'cebolla cabezona larga', 'cebolla larga']
  ],
  [
    'Cebolla Blanca',
    [
      'cebolla blanca s',
      'cebolla blanca g',
      'cebolia blanca s',
      'cebolia blanca g',
      'cebolla blanc'
    ]
  ],
  ['Cebolla Roja', ['cebolla roja', 'cebolla criolla']],
  ['Cebolla Puerro', ['cebolla puerro']],
  ['Champiñon Tajado', ['champia a n tajado']],

  ['Ahuyama', ['auyama', 'zapallo', 'calabaza', 'ahuyama entera', 'auyama entera']],
  ['Cilantro', ['cilantra', 'culantro']], // "cilantra" aparece en datos reales
  ['Pimentón', ['pimenton', 'pimiento']],
  ['Pepino Cohombro', ['pepino cohombro', 'pepino']], // distinto de pepino calabacín
  ['Pepino Calabacín', ['pepino calabacin', 'pepino calabacín']],
  [
    'Pepino Zukini',
    [
      // calabacín / zucchini
      'pepino zukini',
      'pepino sukini',
      'pepino para rell',
      'zukini',
      'calabacin'
    ]
  ],

  [
    'Tomate Chonto',
    [
      'tomate chonto (a',
      'tomate chonto (aa',
      'tomate chonto',
      'tomate chonto a',
      'tomate chonto ca'
    ]
  ],
  ['Tomate de Árbol', ['tomate de árbol', 'tomate arbol', 'tomate árbol']],

  ['Zanahoria', ['zanahoria a gran', 'zanahoria al granel']],
  ['Lechuga Crespa', ['lechuga hidrop', 'lechuga hidro', 'lechuga creo', 'lechuga crespa']],
  ['Lechuga Batavia', ['lechuga batavia', 'lechuga batavia 320 gr']],
  ['Habichuela', ['habichuela a gra']],
  [
    'Arveja',
    ['arveja en vaina', 'arveja', 'alberja', 'alverja', 'arveja verde', 'arverja verde', 'arvejas']
  ],
  ['Arveja Seca', ['alverja amarilla']], // arveja partida/seca, distinta a la fresca

  [
    'Mazorca',
    [
      'chocolo tierno',
      'chocolo tiernom',
      'chocolo tierno(m',
      'maiz dulce',
      'maiiz dulce',
      'mazorca',
      'mazorcas'
    ]
  ],
  ['Remolacha', ['remolacha', 'remolacha a gran']],
  ['Berenjena', ['berenjena', 'verenjena']],
  ['Espinaca', ['espinaca', 'espinaca bogotan', 'manojo de espinaca', 'espinaa']],
  ['Acelga', ['acelga']],
  ['Coliflor', ['coliflor', 'coliflor 661', 'cloliflor']],
  ['Brocoli', ['brocoli', 'brócoli']],
  ['Repollo', ['repollo blanco', 'repollo verde', 'repollo morado', 'repollo']],
  ['Rábano', ['rabano rojo', 'rábano rojo', 'rabano']],
  ['Raíz China', ['raíz china', 'raiz china']],

  ['Ajo', ['ajo en malla', 'ajo malla x', 'ajo granulado', 'ajo malla import', 'ajos', 'ajo']],
  ['Papa Sin Lavar', ['papa sin lavar g']],
  ['Papa Criolla', ['papa criolla']],
  ['Yuca', ['yuca fresca', 'yuca']],
  ['Arracacha', ['arracacha']],
  ['Perejil', ['perejil liso']],

  // ─── FRUTAS ─────────────────────────────────────────────────────────────────

  ['Sandia', ['sandía', 'sandia', 'patilla', 'sandiapatilla', 'sandia(patilla)', 'sandia gourmet']],
  ['Papaya', ['papaya comun', 'papaya común', 'papaya']],
  [
    'Piña',
    [
      'pita goldoro mi',
      'pita',
      'piña oro miel',
      'piña gold',
      'pita gold(oro mi',
      'pita gold( oro mi'
    ]
  ],
  ['Banano', ['banano', 'banana', 'bananos', 'plátanos amarillo']],
  [
    'Platano Verde',
    ['platano verde', 'plátano verde', 'platano harton', 'plátano hartón', 'platano harton maduro']
  ],
  ['Platano Maduro', ['platano maduro', 'plátano maduro', 'maduros', 'platano insupera']],
  ['Mango', ['mango', 'mangos', 'mango yulima']],
  [
    'Mandarina',
    [
      'mandarina onecco',
      'mandarina importada',
      'mandarinas',
      'mandarina oneco',
      'mandarinas onecco'
    ]
  ],
  ['Fresa', ['fresa', 'fresas']],
  ['Bandeja Fresa', ['Fresa Bandeja']],

  ['Mora', ['mora', 'moras', 'mora para jugo']],
  ['Lulo', ['lulo']],
  ['Maracuyá', ['maracuya', 'maracuyá']],
  ['Guayaba', ['guayaba']],
  ['Uva', ['uva red globre', 'uvas red global', 'uva']],
  ['Pitaya', ['pitayas', 'pitahaya']],
  ['Granadilla', ['granadilla']],
  ['Uchuva', ['uchuva']],
  ['Manzana', ['manzana gala', 'manzana verde', 'manzana']],
  ['Bandeja Manzana', ['Bandeja Manzana']],

  ['Naranja', ['naranja']],
  ['Pera', ['pera boyacense', 'pera']],
  ['Aguacate', ['Aguacate Und']],

  // ─── PROTEÍNAS ANIMALES ──────────────────────────────────────────────────────

  // Pollo
  [
    'Pechuga Blanca',
    [
      'pechuga a granel',
      'pechuga blanca',
      'pechuga blanca m',
      'pechusa blanca m',
      'pechuga pollo',
      'pechuga congelada',
      'pechuga fileteada',
      'filete pechuga',
      'pechuga de pollo'
    ]
  ],
  ['Pechuga Campesina', ['pechuga campesina', 'pechuga campesin']],
  [
    'Pernil de Pollo',
    [
      'pernil blanco',
      'pernil mixto a granel',
      'pernil mixto',
      'pernil pollo',
      'pernil pollo blanco'
    ]
  ],
  ['Muslo', ['muslo a granel', 'muslo']],
  [
    'Contramuslo de Pollo',
    [
      'contramuslo camp',
      'contramusios camp',
      'contra muslo',
      'contramuslo pollo',
      'contramuslos de pollo'
    ]
  ],

  // Res
  [
    'Carne Molida',
    [
      'carne molida',
      'carne molida especial',
      'carne rez molida',
      'carne molida rez',
      'carne res molida',
      'carne de res molida',
      'lagarto molida',
      'carne molida corriente'
    ]
  ],
  ['Lagarto', ['lagarto']],
  ['Pecho Corriente', ['pecho corriente', 'pecho']],
  ['Cadera Corriente', ['cadera corriente', 'cadera', 'carne de rez cadera']],
  ['Solomo', ['solomo extranjero', 'solomo']],
  ['Lomo Caracha', ['lomo caracha', 'lomo caracas', 'lomo caracha*']],
  ['Muchacho', ['muchacho si*', 'muchacho']],
  [
    'Sobrebarriga',
    ['sobrebarrigax gr', 'sobrebarriga', 'carne sobrebarriga', 'carne res sobrebarriga']
  ],
  ['Pepino Res', ['pepino rez', 'pepino res', 'pepino res*']], // "rez" → OCR corrupto de "res"
  ['Centro de Pierna', ['st centro de pie']],

  // Pescado
  [
    'Trucha',
    [
      'trucha xkg el mar',
      'trucha deshuesada',
      'trucha mariposa',
      'filete trucha',
      'trucha deshuesada arcoiris',
      'trucha arcoiris'
    ]
  ],
  [
    'Tilapia',
    [
      'tilapia rio claro',
      'tilapia roja',
      'filapia',
      'filete de tilapi',
      'filete tilapia',
      'filete tulapia',
      'tilapia roja ban'
    ]
  ],

  // Procesadas / embutidos
  ['Tocineta Ahumada', ['tocineta ahum', 'tocineta ahumada', 'tocineta ahumado']],
  ['Chorizo', ['chorizo antio', 'chorizo santa rosano', 'chorizo de cerdo', 'chorizos']],
  ['Salchicha', ['salchicha par', 'salchicha pe 9', 'salchicha']],
  ['Jamón Estándar', ['jaman estaNdar s', 'jamón estándar', 'jamón ideal 50%']],
  ['Jamón Serrano', ['jamon serrano']],
  ['Jamón Pietran', ['jamon pietran']],

  // ─── LÁCTEOS Y DERIVADOS ────────────────────────────────────────────────────

  ['Crema de Leche', ['crema de leche', 'crema culinaria', 'crema de lech']],
  ['Leche en Polvo', ['Leche en Polv']],
  [
    'Yogurt Griego',
    ['yog griego premi', 'yogourt griego', 'yogur griego 1 litro sentu', 'yogurt semidesc']
  ],
  [
    'Queso Mozzarella',
    ['quezo mozarella', 'queso mozarella', 'queso mozarella tajado', 'queso mix mexicano']
  ],
  ['Queso Parmesano', ['queso parmesano', 'queso rayado parmesano', 'queso tipo parmesano']],
  ['Suero Costeño', ['suero costeño']],
  ['Queso Costeño', ['queso costeño']],
  [
    'Mantequilla Esparcible',
    ['esparcible aj', 'esparcible do', 'esparcible de', 'mantequilla esparcible']
  ],

  // ─── GRANOS Y LEGUMBRES ─────────────────────────────────────────────────────

  [
    'Frijol',
    [
      'frijol blanco',
      'frijol cargam',
      'frijol caraot',
      'frijoles',
      'frijol rojo e',
      'frijol calima d1',
      'frijol duba rojo',
      'frijol antioqueño',
      'frijol zaragoza',
      'frijol caraota',
      'frijol cargaman'
    ]
  ],
  ['Lenteja', ['lenteja el es', 'lentejas', 'lenteja']],
  ['Garbanzo', ['garbanzo']],

  // ─── CEREALES Y HARINAS ─────────────────────────────────────────────────────

  ['Arroz Premium', ['arroz premium', 'arroz diana', 'arroz basmati']],
  ['Harina de Trigo', ['harina de trigo', 'harina trigo', 'harina']],
  [
    'Harina de Maíz',
    ['harina de maiz', 'harina maiz', 'harina pan diana', 'harina arepa', 'harina de Mai']
  ],
  ['Polvo de Hornear', ['polvo hornear', 'polvo de horneo']],

  // ─── PASTAS ─────────────────────────────────────────────────────────────────

  [
    'Spaghetti',
    [
      'spaguetti',
      'spaghetti del',
      'spaguetti deliziare',
      'espagueti',
      'espagueti la muñeca',
      'espaguetis',
      'spagueti deli',
      'espagueti deli',
      'spaghetti',
      'spaquetti',
      'pasta spaguetti 500 gr',
      'spaguetti doria'
    ]
  ],
  ['Penne', ['pasta penne', 'penne delicatece']],
  [
    'Fusilli',
    [
      'fusilli',
      'fusilli deliz',
      'pasta fusilli',
      'pasta fusilli delizia',
      'fusilli mixto 500 gr',
      'pasta fussilli'
    ]
  ],
  ['Fettuccine', ['fettuccine gramo', 'fettuccine de', 'fettuccini']],
  [
    'Lasaña',
    ['pasta lasaña', 'pasta lasagña', 'lasaña', 'lasagna', 'pasta lazaña 400 gr la muñeca']
  ],
  ['Macarrón', ['macarrón', 'macarroni', 'macarron']],
  ['Fideos', ['fideos', 'fideos doria', 'pasta fideos']],

  // ─── ACEITES ────────────────────────────────────────────────────────────────

  ['Aceite de Girasol', ['aceite de gir', 'aceite de girasol 2 lts']],
  [
    'Aceite de Canola',
    ['aceite de can', 'aceite canola 2 lts', 'aceite canola', 'acete canola sprai']
  ],
  ['Aceite de Oliva', ['aceite de oliva', 'aceit oliva', 'aceite oliva']],
  ['Aceite Vegetal', ['aceite vegetal', 'aceite thomas', 'aceite gota de oro', 'aceite gota oro']],

  // ─── AZÚCAR Y ENDULZANTES ───────────────────────────────────────────────────

  ['Azúcar Morena', ['azucar morena', 'azúcar morena', 'azucar moren']],
  ['Azúcar Blanca', ['azucar', 'azúcar', 'azucar blanca', 'azúcar blanco']],

  // ─── CONDIMENTOS Y SALSAS ───────────────────────────────────────────────────

  ['Salsa de Soya', ['salsa de soya', 'salsa soya']],
  [
    'Salsa de Tomate',
    ['salsa de tomate', 'pasta de tomate', 'salsa tomate', 'salsa De Toma', 'pasta tomate']
  ],
  [
    'Salsa Mayomostaza',
    [
      'mayomostaza',
      'salsa mayomostaza',
      'salsa mayo mostaza',
      'moztasa con miel',
      'salsa miel moztaza',
      'salsa mostaneza',
      'salsa miel mostaza'
    ]
  ],
  [
    'Salsa Barbacoa',
    ['salsa barbiquiu', 'salsa barbicua', 'salsa barbacoa', 'salsa bbq', 'salsa bassi']
  ],
  ['Salsa Teriyaki', ['salsa teriyaki n', 'salsa terikay']],
  ['Paprika', ['paprika speci', 'paprika special', 'papikra', 'paprika']],
  ['Comino', ['comino especial', 'comino']],
  [
    'Caldo de Costilla',
    ['caldo de cost', 'caldo costilla', 'caldo de costilla', 'condimento caldo costilla']
  ],
  ['Caldo de Gallina', ['caldo de gallina', 'caldo gallina']],
  ['Color', ['color', 'colorante natural', 'color especial', 'color doña julia']],

  // ─── VINAGRES ───────────────────────────────────────────────────────────────

  ['Vinagre Blanco', ['vinagre blanc', 'vinagre blanco']],

  // ─── BEBIDAS E INFUSIONES ───────────────────────────────────────────────────

  ['Infusión', ['infusion f ro', 'aromatica be', 'aromática', 'aromatica', 'infusion frut']],

  // ─── LIMONES ────────────────────────────────────────────────────────────────

  [
    'Limón Tahití',
    [
      'limon tahiti',
      'limhn tahity',
      'liman',
      'limon tahiti a g',
      'limon tahiti ag',
      'limón tahití',
      'limon tahiti malla inter',
      'malla limon tahiti',
      'limón tahiti malla'
    ]
  ], // "limhn" = OCR corrupto de "limón"
  ['Limón Tahití Malla', ['liman tahitã1⁄2 mal']], // OCR con encoding roto
  ['Limón Mandarino', ['limon mandarino', 'limón mandarino']],

  // ─── DESAYUNOS Y CENAS — LÁCTEOS ────────────────────────────────────────────

  [
    'Leche Semideslactosada',
    [
      'leche semid desl', // OCR [Carulla] / [Exito]
      'leche semideslactosada',
      'leche semideslactosada exito',
      'leche semid desl',
      'leche semi deslactosada',
      '2 leche semi deslactosada',
      'deslactosada bol',
      'leche semidescremada'
    ]
  ],
  [
    'Leche Deslactosada',
    [
      'leche deslactosada',
      'leche deslac',
      'leche desl d',
      'leche deslact',
      'leche deslactosada exito',
      'leche deslactosada d1'
    ]
  ],
  [
    'Leche Entera',
    [
      'leche entera',
      'leche entera total',
      'leche forti d1',
      'leche colfrance',
      'leche miramonte',
      'leche ara',
      'leche éxito',
      'bolsa leche alpina',
      'bolsa leche colanta'
    ]
  ],
  [
    'Leche en Polvo',
    [
      'leche en polvo d', // OCR [Carulla]
      'leche polvo desl', // OCR [Carulla]
      'leche en polvo'
    ]
  ],
  [
    'Leche de Almendras',
    [
      'leche de almendras',
      'leche almendras',
      'leche almendras ara',
      'leche almendras d1',
      'leche almendras exito',
      'bebida almendras',
      'bebida almendra',
      'bebida de almendras',
      'leche almendra d1'
    ]
  ],
  ['Leche de Soya', ['leche de soya', 'soya']],
  ['Kumis', ['kumis entero', 'kumid']],
  [
    'Cuajada',
    ['cuajada', 'quajada', 'quesillo tajado', 'quesillo en bloque', 'quesito pasteurizado']
  ],
  ['Queso Mozarella Latti Rallado', ['Queso latti m', 'Queso latti']],
  [
    'Queso Doble Crema',
    ['queso doble crema', 'queso doblcr', 'queso de crema', 'queso crema', 'queso crema ara']
  ],
  ['Queso Campesino', ['queso campesino', 'queso criollo']],
  [
    'Queso Sabanero',
    ['queso sabanero', 'queso sabaner', 'queso sabane', 'queso sabane *', 'queso sabanero d1']
  ],
  [
    'Queso Holandés',
    [
      'queso holandés',
      'queso muenster',
      'queso muenste d1',
      'queso ghalia muenster 5 porciones',
      'queso suizo gha',
      'queso suizo loncha'
    ]
  ],
  ['Queso Paipa', ['queso paipa', 'queso pera b']], // "pera b" = OCR corrupto de "Paipa"
  [
    'Queso Tajado',
    ['queso tajado', 'queso tajado bajo en grasa', 'queso tajado 5 unid', 'queso amarillo ara']
  ],
  ['Queso Ahumado', ['queso ahumado']],

  // ─── DESAYUNOS Y CENAS — PANES ──────────────────────────────────────────────

  [
    'Pan Tajado',
    [
      'pan tajado br', // OCR [D1]
      'pan tajado',
      'pan tajado brioche',
      'pan tajado brio',
      'pan tajado integral',
      'pan tajado integral d1',
      'pan tajado arte',
      'pan tajado santa clara',
      'pan taj ama 3',
      'pan molde integral',
      'pan blanco',
      'pan multigranos d1'
    ]
  ],
  [
    'Pan Perro',
    [
      'pan perro hor', // OCR [D1]
      'pan hamburgue', // OCR [D1]
      'pan perro',
      'pan para perro',
      'pan para perro caliente',
      'pan de perro',
      'pan perro bimbo x',
      'pan hamburguesa',
      'pan hamburguesas',
      'pan de hamburguesa',
      'pan de hamburguesas'
    ]
  ],
  [
    'Pan Árabe',
    [
      'pan arabe bac',
      'pan arabe 5u',
      'pan árabe',
      'pan arabe',
      'tortilla fina',
      'tortillas finas',
      'fajita tortillas'
    ]
  ],
  ['Pan de Bono', ['pan de bono', 'pandebono', 'pandebonos', 'arepas pandebono', 'pan de bonos']],
  ['Mantecada', ['mantecada', 'mantecada limón', '1 mantecada de maiz']],
  [
    'Pan Hawaiano',
    [
      'pan hawaiano',
      'pastel hawaiano',
      'pastel hawaiiano',
      'hawaiano' // contexto panadería
    ]
  ],
  [
    'Pan Integral',
    [
      'pan integral',
      'pan integral de coco silvia',
      'mogolla integral',
      'mogolla',
      'pan de desayuno',
      'pan desayunos'
    ]
  ],

  // ─── DESAYUNOS Y CENAS — HUEVOS ─────────────────────────────────────────────

  [
    'Cartón Huevos Nápoles',
    [
      'huevo napoles li', // OCR (marca Napoles)
      'huevo napoles de',
      'huevo napoles v ahorro',
      'huevo napoles l'
    ]
  ],
  [
    'Cartón Huevos',
    [
      'huevos',
      'huevo',
      'cartón huevos',
      'cartón de huevos',
      'canasta de huevos',
      'carton huevos',
      'cartón huevos blancos aaa',
      'cartón huevos napoles',
      'cartón huevos napoles aa',
      'carton huevos blanco aaa',
      'cartón huevos blanco aaa super',
      'huevos criollos aa inter'
    ]
  ],

  // ─── DESAYUNOS Y CENAS — BEBIDAS CALIENTES ──────────────────────────────────

  [
    'Café Instantáneo',
    [
      'cafe instanta', // OCR [D1]
      'cafe instan/l', // OCR [D1]
      'Cafe Instan/L',
      'cafe instan l',
      'café instantáneo',
      'cafe instantáneo',
      'cafe instantaneo',
      'café instantáneo nescafe',
      'cafe granulado',
      'cafe tostado molido',
      'crema cafe',
      'crema de cafe'
    ]
  ],
  [
    'Chocolate en Polvo',
    [
      'chocolate de', // OCR
      'chocolate aroma',
      'chocolate tr ara',
      'chocolate ama',
      'chocolate sol ara',
      'chocolate lyne',
      'chocolate tradicional corona',
      'chocolate corona',
      'chocolate d1',
      'chocolisto',
      'bebida achocolatada',
      'bebida achocolatado',
      'bebida chocolatada',
      'pastillas chocolate aroma',
      'pastillas de cocoa',
      'chocolate mesa',
      'chocolate instantáneo',
      'chocolate light silvia',
      'sikolata'
    ]
  ],

  // ─── DESAYUNOS Y CENAS — AREPAS Y MASA ──────────────────────────────────────

  [
    'Arepas de Choclo',
    [
      'arepas de chocolo',
      'arepas choclo',
      'arepas de choclo',
      'arepa choclo',
      'arepa chocolo',
      'paquete 5 arepas choclo',
      'arepas chocolo'
    ]
  ],
  ['Arepas Paisas', ['arepas paisas', 'arepas paisa', 'arepas maiz pelao', 'arepa maiz']],
  ['Arepas de Queso', ['arepas de queso', 'arepas extraqueso', 'arepa rellena queso 4 unid']],
  [
    'Masa para Empanadas',
    [
      'practipasta grande',
      'practimasa de oro redonda 15 laminas para empanadas',
      'masa empanadas practipasta',
      'masa para empanadas',
      'pasta para empanadas',
      'plastipasta grande 15 unid',
      'base para empanadas',
      'masa empanadas horneadas',
      'masa para empanada horneadas'
    ]
  ],

  // ─── DESAYUNOS Y CENAS — EMBUTIDOS ──────────────────────────────────────────

  [
    'Salchicha Perro',
    [
      'salchicha par', // OCR [D1]  (= salchicha para perro)
      'salchicha sup', // OCR
      'salchicha perro',
      'salchicha perro viande',
      'salchicha super perro',
      'salchichas perro',
      'salchicha de pollo',
      'salchicha ranchera',
      'salchicha ahumada',
      'salchicha super',
      'salchilla tipo parrilla',
      'salchicha para perro'
    ]
  ],
  [
    'Jamón de Cerdo',
    [
      'jam petran p', // OCR
      'jamón de cerdo',
      'jamon de cerdo',
      'jamón cerdo',
      'jamon cerdo',
      'jamón pollo',
      'jamón pavo',
      'jamon pavo f',
      'jamón sándwich',
      'jamón sándwich ara',
      'jamón curado',
      'chorizo curado',
      'jamón premium 50%',
      'jamón pechuga',
      'jamón pechuga d1',
      'jamón ideal',
      'jamon porci'
    ]
  ],
  [
    'Panela',
    [
      'panela fracci', // OCR [D1]  (= panela fraccionada)
      'panela 4 und', // OCR [Carulla]
      'panela',
      'panela cuadrada',
      'panela pulver',
      'panela fracción',
      'panela 4 unid',
      'panela 4 uni'
    ]
  ],

  // ─── DESAYUNOS Y CENAS — MISCELÁNEOS ────────────────────────────────────────

  [
    'Granola',
    [
      'granola',
      'granola familiar',
      'granola tradicio',
      'granola los almendros',
      'granola media libra'
    ]
  ],
  [
    'Avena en Hojuelas',
    [
      'avena en hojuelas',
      'avena en hojuela',
      'avena ojuelas',
      'avena ojuelas quaquer',
      'avena en ojuelas',
      'avena tetra p'
    ]
  ],
  ['Mermelada', ['mermelada', 'mermelada mora', 'mermelada de fresa', 'mermelada ma']],
  ['Almidón de Maíz', ['maizena', 'fecula']],

  // ─── ONCES ──────────────────────────────────────────────────────────────────

  [
    'Bocadillo Veleño',
    [
      'bocadillo vel', // OCR
      'bocadillo gu', // OCR (= bocadillo guayaba)
      'bocadillo veleño',
      'bocadillo',
      'bocadillos',
      'bocadillo veleño d1',
      'bocadillos d1',
      'bocadillo d1',
      'bocadillos ara',
      'caja bocadillo guayaba x 18 unidades',
      'bocadillo de guayaba'
    ]
  ],
  [
    'Ponque',
    [
      'ponque vainilla',
      'ponque nueces',
      'ponque tajado coco',
      'ponque bimbo',
      'ponque casero',
      'ponque tradicional',
      'ponque de vino ramo',
      'porque tradicional', // typo de "ponque"
      'porqués surtidos',
      'ponques',
      'lonchera ramo'
    ]
  ],
  ['Maní', ['mani', 'mani dulce', 'many mezcla crunchy', 'mezcla mani', 'mix garbanzos y']],
  [
    'Galletas Tosh',
    [
      'galletas tosh',
      'galletas tosh coco',
      'galletas tosh cacao',
      'tosh fusion',
      'galletas tosh coco y almendra',
      '2 paquetes de galletas tosh cacao snacks saludables',
      '3 paquetes galletas tosh wafer sin azucar'
    ]
  ],
  [
    'Galletas Saltinas',
    [
      'galletas ajedrez',
      'galleta ajedrez',
      'galletas de soda',
      'galleta saltinas',
      'galleta saltina',
      'galletas saltinas',
      'galleta tradicional saltisima 4 tacos',
      'galletas saltin noe 4 tacos',
      'galleta saltisima',
      'saltin integral'
    ]
  ],
  ['Galletas Integrales', ['galleta integral', 'galletas integrales', 'palitos integrales']],
  ['Maíz Pira', ['maiz pira', 'maiz pira diana', 'maíz pira', 'popetas']],
  ['Chocolatina Jet Wafer', ['Chocolatina W']],

  // ─── LICORES ────────────────────────────────────────────────────────────────

  [
    'Cola y Pola Six Pack',
    [
      'sixpack cola&pol', // OCR [Carulla]
      'six pack cola y pola',
      'sixpack cola&pola',
      'cola y pola',
      'kola y pola',
      '1 kola y pola',
      'six pack kola y pola',
      'six pack cola y pola',
      'cola y pola x6',
      'cola y pola x 6',
      '6 kola y pola',
      '6 cola y polas'
    ]
  ],
  ['Refajo Andina', ['refajo rojo unid']],
  ['Refajo Andina Six Pack', ['andina refajo six pack']],
  [
    'Cerveza',
    [
      'bebida embriagan', // OCR [Carulla]  (= bebida embriagante)
      'cerveza',
      'cerveza bahia',
      'cerveza brunoni',
      'cerveza limón',
      'cerveza de limón',
      'cerveza rosü lat',
      'cerveza tipo ra',
      'cerveza tour francia',
      'cerveza corona',
      'cerveza club colombia',
      'brunoni',
      'bahia'
    ]
  ],
  ['Ron', ['ron viejo caldas', 'ron blanco']],
  ['Crema de Whisky', ['crema de whisky', 'crema de whisky bailleys']],
  [
    'Piña Colada',
    [
      'piña colada',
      'base cóctel piña colada',
      'base piña colada',
      'cóctel piña colada marca alicante'
    ]
  ],
  // ─── ASEO ────────────────────────────────────────────────────────────────
  ['Esponja Malla', ['esponja malla']],
  ['Detergente Líquido', ['Detergente Li']],
  ['Toalla de Cocina', ['Toalla De Coc']],
  ['Crema Lavaloza', ['Crema Lavaloz']],
  ['Talco Antibacterial', ['talco antibac']],
  ['Copitos Little', ['Copitos Littl']]
];

// ─── ÍNDICE INVERTIDO O(1): sinónimo → canónico ──────────────────────────────
export const SYNONYM_INDEX: Map<string, string> = new Map(
  SYNONYM_GROUPS.flatMap(([canonical, synonyms]) =>
    synonyms.map((s) => [s.toLowerCase(), canonical])
  )
);
