# ModernTable

Componente de tabla responsive y minimalista con soporte para temas claro/oscuro, totalmente tipado en TypeScript.

## 📦 Instalación

Los componentes se encuentran en `~/components/tables/`:
- `ModernTable.tsx` - Componente principal
- `ModernTableHead.tsx` - Encabezados
- `ModernTableRow.tsx` - Filas

## 🚀 Uso Básico

```typescript
import ModernTable from '~/components/tables/ModernTable';

<ModernTable 
  tableHead={['Mes', '% Ahorro', 'Valor']}
  tableData={[
    ['agosto 2025', '34 %', '$ 5.277.413'],
    ['septiembre 2025', '4 %', '$ 617.416'],
    ['Promedio', '10 %', '$ 2.235.692']
  ]}
/>
```

## 📋 Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `tableHead` | `string[]` | ✅ | - | Encabezados de columnas |
| `tableData` | `string[][]` | ✅ | - | Datos (array de arrays de strings) |
| `columnWidths` | `number[]` | ❌ | `[120, ...]` | Anchos en píxeles por columna |
| `columnAlignments` | `('left' \| 'center' \| 'right')[]` | ❌ | `['left', ...]` | Alineación por columna |
| `highlightedRows` | `number[]` | ❌ | `[]` | Índices de filas a destacar |
| `horizontalScroll` | `boolean` | ❌ | `false` | Activar scroll horizontal |
| `defaultColumnWidth` | `number` | ❌ | `120` | Ancho por defecto en píxeles |

## 💡 Ejemplos

### Tabla con anchos personalizados

```typescript
<ModernTable 
  tableHead={['Producto', 'Cantidad', 'Precio']}
  tableData={[
    ['Laptop', '3', '$ 3.500.000'],
    ['Mouse', '10', '$ 85.000']
  ]}
  columnWidths={[200, 80, 140]}
  columnAlignments={['left', 'center', 'right']}
/>
```

### Tabla con scroll horizontal (muchas columnas)

```typescript
<ModernTable 
  tableHead={['Fecha', 'Categoría', 'Descripción', 'Monto', 'Estado']}
  tableData={[/* datos */]}
  columnWidths={[100, 120, 180, 120, 100]}
  horizontalScroll={true}
/>
```

### Tabla con fila destacada

```typescript
<ModernTable 
  tableHead={['Mes', 'Valor']}
  tableData={[
    ['Enero', '$ 1.000.000'],
    ['Febrero', '$ 1.200.000'],
    ['Total', '$ 2.200.000']  // Esta fila se destacará
  ]}
  highlightedRows={[2]}  // Índice de la fila "Total"
/>
```

## 🎨 Características Automáticas

### Colorización inteligente
- 🔴 **Porcentajes negativos** → Color rojo automático
- 🟢 **Porcentajes >20%** → Color verde automático
- 🔴 **Valores monetarios negativos** → Color rojo automático
- 🔵 **Filas destacadas** → Color primario del tema

### Auto-detección de filas especiales
Detecta y resalta automáticamente filas que contienen:
- "Promedio"
- "Total"
- "Suma"

### Scroll automático
Si el ancho total de las columnas excede el ancho de la pantalla, se activa automáticamente el scroll horizontal.

### Ajuste de texto
Los textos largos se ajustan automáticamente con `adjustsFontSizeToFit` y `numberOfLines={2}`.

## 🎯 Uso en Columnas Dinámicas

Para tablas con columnas que varían:

```typescript
const getColumnWidths = (headers: string[]): number[] => {
  return headers.map((header) => {
    if (header.includes('Descripción')) return 180;
    if (header.includes('Fecha')) return 110;
    if (header.includes('Monto')) return 130;
    return 120; // Default
  });
};

const getColumnAlignments = (headers: string[]): ('left' | 'center' | 'right')[] => {
  return headers.map((header) => {
    if (header.includes('Monto') || header.includes('Valor')) return 'right';
    if (header.includes('Fecha')) return 'center';
    return 'left';
  });
};

<ModernTable 
  tableHead={dynamicHeaders}
  tableData={dynamicData}
  columnWidths={getColumnWidths(dynamicHeaders)}
  columnAlignments={getColumnAlignments(dynamicHeaders)}
/>
```

## 🌈 Compatibilidad con Temas

El componente usa `useThemeColors()` y respeta automáticamente:
- ✅ Tema claro / oscuro
- ✅ Colores personalizados (`PRIMARY`, `SUCCESS`, `ERROR`, `INFO`)
- ✅ Fondos y bordes adaptativos

## 📱 Responsive

- **Portrait**: Tabla estándar con anchos fijos
- **Landscape**: Se adapta automáticamente
- **Overflow**: Activa scroll horizontal cuando es necesario

## 🔧 Mantenimiento

### Modificar estilos globales
Edita los estilos en cada componente:
- `ModernTableHead.tsx` → Estilos del header
- `ModernTableRow.tsx` → Estilos de las filas
- `ModernTable.tsx` → Estilos del contenedor

### Cambiar comportamiento de colorización
Modifica la función `getCellColor()` en `ModernTableRow.tsx`

### Ajustar anchos por defecto
Cambia `defaultColumnWidth` en el componente principal

## 📝 Notas

- Todos los datos deben ser **strings**
- Los anchos se especifican en **píxeles** (no en flex)
- El componente es **totalmente tipado** (sin `any`)
- Compatible con **React Native** (no web)

## 🐛 Troubleshooting

**Problema**: Las columnas no se alinean
- **Solución**: Asegúrate de especificar `columnWidths` con valores en píxeles

**Problema**: El scroll no funciona
- **Solución**: Activa `horizontalScroll={true}` o el componente lo hará automáticamente

**Problema**: Los colores no cambian con el tema
- **Solución**: Verifica que `useThemeColors()` esté configurado correctamente

---

**Versión**: 1.0.0
**Última actualización**: Noviembre 2025
**Autor**: [Tu nombre/equipo]