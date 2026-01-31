// Configuración centralizada de títulos y subtítulos para cada pantalla

export const screenConfigs = {
  // Auth
  checkCodePassword: {
    title: 'Verificar Código',
    subtitle: 'Ingresa el código enviado a tu correo'
  },
  resetPassword: {
    title: 'Nueva Contraseña',
    subtitle: 'Crea una contraseña segura'
  },
  forgotPassword: {
    title: 'Olvidé Contraseña',
    subtitle: 'Restaurar contraseña'
  },
  // EXPENSES
  main: {
    title: 'Gastos del mes',
    subtitle: 'Visualiza y gestiona tus gastos mensuales'
  },
  sumary: {
    title: 'Resumen',
    subtitle: 'Análisis detallado de tus gastos'
  },
  createExpense: {
    title: 'Nuevo gasto',
    subtitle: 'Registra un nuevo gasto en tu presupuesto'
  },
  scanInvoiceExpense: {
    title: 'Escanear factura',
    subtitle: 'Extrae datos automáticamente de tus facturas'
  },
  createSubcategory: {
    title: 'Nueva subcategoría',
    subtitle: 'Organiza mejor tus gastos'
  },
  createCategory: {
    title: 'Nueva categoría',
    subtitle: 'Crea una categoría personalizada'
  },
  editCategory: {
    title: 'Editar categoría',
    subtitle: 'Modifica los detalles de tu categoría'
  },
  lastExpenses: {
    title: 'Últimos gastos',
    subtitle: 'Historial reciente de transacciones'
  },
  editExpense: {
    title: 'Editar gasto',
    subtitle: 'Actualiza la información del gasto'
  },
  editSubcategory: {
    title: 'Editar subcategoría',
    subtitle: 'Modifica tu subcategoría'
  },

  // INCOMES
  sumaryIncomes: {
    title: 'Ingresos del mes',
    subtitle: 'Visualiza tus fuentes de ingreso'
  },
  createIncome: {
    title: 'Nuevo ingreso',
    subtitle: 'Registra un ingreso en tu balance'
  },
  lastIncomes: {
    title: 'Últimos ingresos',
    subtitle: 'Historial de ingresos recientes'
  },
  editIncome: {
    title: 'Editar ingreso',
    subtitle: 'Actualiza la información del ingreso'
  },

  // BALANCE
  cashFlow: {
    title: 'Balance',
    subtitle: 'Resumen de tu flujo de efectivo'
  },
  graphBalances: {
    title: 'Gráficas',
    subtitle: 'Visualización de tu balance financiero'
  },
  savingsAnalysis: {
    title: 'Análisis de Ahorros',
    subtitle: 'Consulta estadísticas y tendencias de tu ahorro en períodos personalizados'
  },

  // SETTINGS
  settings: {
    title: 'Ajustes',
    subtitle: 'Configura tu aplicación'
  },
  editUser: {
    title: 'Editar perfil',
    subtitle: 'Actualiza tu información personal'
  },
  createUser: {
    title: 'Nuevo usuario',
    subtitle: 'Crear cuenta de usuario'
  },
  changePassword: {
    title: 'Cambiar contraseña',
    subtitle: 'Actualiza tu contraseña de acceso'
  },
  calculeProducts: {
    title: 'Calcular productos',
    subtitle: 'Herramienta de cálculo de costos'
  },
  createLoan: {
    title: 'Nuevo préstamo',
    subtitle: 'Registra un préstamo o deuda'
  },
  exportData: {
    title: 'Exportar datos',
    subtitle: 'Descarga tus gastos por rango de fechas'
  },
  advancedSearch: {
    title: 'Búsqueda avanzada',
    subtitle: 'Encuentra transacciones específicas'
  },
  virtualBudget: {
    title: 'Presupuesto virtual',
    subtitle: 'Planifica tus gastos mensuales'
  },
  manageCSV: {
    title: 'Gestionar CSV',
    subtitle: 'Importa y exporta datos en formato CSV'
  },
  manageFeatureFlags: {
    title: 'Gestión Funcionalidades',
    subtitle: 'Activa o desactiva módulos del sistema'
  },
  chatbotConfig: {
    title: 'Configurar Chatbot',
    subtitle: 'Gestiona prompts, herramientas y comportamiento del asistente'
  },
  manageThemes: {
    title: 'Gestión de Temas',
    subtitle: 'Selecciona el tema del sistema'
  },
  editTheme: {
    title: 'Editar tema',
    subtitle: 'Modifica colores y estilos'
  },
  adminDashboard: {
    title: 'Panel administración',
    subtitle: 'Gestión avanzada del sistema'
  },
  userThemeSettings: {
    title: 'Mi Tema',
    subtitle: 'Personaliza la apariencia de tu aplicación'
  },
  customizeThemeColors: {
    title: 'Personalizar Colores',
    subtitle: 'Crea tu tema único modificando cada color'
  },
  investmentComparisonHome: {
    title: 'Comparador de Inversiones',
    subtitle: 'Analiza y compara opciones financieras en Colombia'
  },
  scenarioConfig: {
    title: 'Configurar Escenario',
    subtitle: 'Personaliza los parámetros de tu inversión'
  },
  comparisonResults: {
    title: 'Resultados de Comparación',
    subtitle: 'Análisis detallado y recomendación personalizada'
  },

  // STATISTICS
  comparePeriods: {
    title: 'Comparar periodos',
    subtitle: 'Analiza y compara gastos entre dos periodos'
  },

  // ADMIN
  aiModels: {
    title: 'Modelos de IA',
    subtitle: 'Gestiona los modelos disponibles y su prioridad'
  }
} as const;

export type ScreenConfigKey = keyof typeof screenConfigs;
