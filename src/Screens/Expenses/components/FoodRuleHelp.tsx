/**
 * Ayuda "¿Dónde va una compra de comida?" (regla v7)
 * Ubicación: junto a ExpenseList.tsx, en la carpeta components de CreateExpenseScreen.
 *
 * Enlace discreto que abre la regla en una hoja inferior. Se usa con una línea en
 * CreateExpenseScreen: <FoodRuleHelp />
 *
 * El texto de la regla duplica docs/domain/alimentacion.md: si la regla cambia, se actualizan
 * los dos.
 */
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

// Components
import MyButton from '~/components/MyButton';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '~/styles/fonts';

interface RuleDestination {
  /** Nombre de la subcategoría (en negrilla) */
  name: string;
  /** Qué entra ahí */
  detail?: string;
}

interface RuleStep {
  question: string;
  /** Aclaración de la pregunta */
  examples?: string;
  destinations: RuleDestination[];
  note?: string;
}

interface Convention {
  title: string;
  text: string;
}

const RULE_STEPS: RuleStep[] = [
  {
    question: '¿Fue por una ocasión?',
    examples: 'Cumpleaños, despedida, invitación, aporte, regalo.',
    destinations: [
      {
        name: 'Regalos',
        detail: 'La comida del evento va en un solo monto (mi comida + mi aporte).'
      }
    ]
  },
  {
    question: '¿Es un almuerzo comprado por día de trabajo?',
    examples: 'Mío o de Silvia. Cuenta el propósito, no el calendario.',
    destinations: [
      {
        name: 'Almuerzo comprado - día de trabajo',
        detail: 'Corrientazo, restaurante o domicilio, aunque se coma en casa.'
      }
    ]
  },
  {
    question: '¿Es un plan para disfrutar?',
    examples: 'Con su postre, café o trago.',
    destinations: [{ name: 'Salidas a comer' }]
  },
  {
    question: '¿Hay que cocinarlo o armarlo en casa?',
    destinations: [
      {
        name: 'Mercado',
        detail:
          'Lo del almuerzo y los básicos. También el agua sola y los ingredientes de un postre casero.'
      },
      { name: 'Proteínas', detail: 'Carne, pollo y pescado del almuerzo.' },
      {
        name: 'Ingredientes desayunos y cenas',
        detail: 'Pan, huevos, arepas, leche y embutidos (jamón, salchicha, chorizo, tocineta).'
      }
    ],
    note: 'Huevos y jamón siempre van a Ingredientes.'
  },
  {
    question: '¿Ya viene hecho?',
    destinations: [
      { name: 'Gaseosas', detail: 'Bebida embotellada.' },
      { name: 'Chucherías', detail: 'Galleta, wafer, ponqué, papas, chocolate.' },
      { name: 'Postres', detail: 'Helado, torta, cholado.' },
      { name: 'Comida lista', detail: 'Comida servida, panadería, café.' },
      { name: 'Licores', detail: 'Licor o cerveza para llevar a casa.' }
    ]
  }
];

const MIXED_TIP = 'Si una compra mezcla dos tipos, va a la que más pesa.';

const CONVENTIONS: Convention[] = [
  {
    title: 'Restaurante',
    text: 'Primera línea: el nombre, siempre escrito igual.'
  },
  {
    title: 'Platos (opcional)',
    text: 'Líneas siguientes: plato — $precio. Solo los platos grandes que quieras comparar.'
  },
  {
    title: 'Almuerzo de Silvia en jornada',
    text: 'Agrega @Silvia viáticos. Un solo registro con el monto de la cuenta.'
  },
  {
    title: 'Evento gastronómico',
    text: 'Restaurante en la primera línea y #NombreEvento. Sus precios no se comparan con los normales.'
  },
  {
    title: 'No recuerdas el nombre',
    text: 'Escribe solo los platos con precio. No se crea un restaurante falso.'
  },
  {
    title: 'Feria con puestos sin nombre',
    text: 'Solo #NombreEvento en la primera línea y los platos debajo.'
  }
];

const EXAMPLE = 'Crepes & Waffles #BurgerMaster\nPollo al Curry — $32.000\nPropina $6.000';

interface StepCardProps {
  index: number;
  step: RuleStep;
}

function StepCard({ index, step }: StepCardProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View
      style={[styles.stepCard, { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }]}
    >
      <View style={[styles.badge, { backgroundColor: colors.PRIMARY }]}>
        <Text style={[styles.badgeText, { color: colors.WHITE }]}>{index}</Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={[styles.question, { color: colors.TEXT_PRIMARY }]}>{step.question}</Text>
        {step.examples ? (
          <Text style={[styles.secondary, { color: colors.TEXT_SECONDARY }]}>{step.examples}</Text>
        ) : null}

        <View style={styles.destinations}>
          {step.destinations.map((destination) => (
            <View
              key={destination.name}
              style={[styles.destination, { borderLeftColor: colors.PRIMARY }]}
            >
              <Text style={[styles.destinationName, { color: colors.TEXT_PRIMARY }]}>
                {destination.name}
              </Text>
              {destination.detail ? (
                <Text style={[styles.secondary, { color: colors.TEXT_SECONDARY }]}>
                  {destination.detail}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        {step.note ? (
          <Text style={[styles.note, { color: colors.TEXT_SECONDARY }]}>{step.note}</Text>
        ) : null}
      </View>
    </View>
  );
}

interface ConventionItemProps {
  convention: Convention;
}

function ConventionItem({ convention }: ConventionItemProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View style={styles.convention}>
      <Text style={[styles.conventionTitle, { color: colors.TEXT_PRIMARY }]}>
        {convention.title}
      </Text>
      <Text style={[styles.secondary, { color: colors.TEXT_SECONDARY }]}>{convention.text}</Text>
    </View>
  );
}

export default function FoodRuleHelp(): React.JSX.Element {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);

  const close = (): void => setVisible(false);

  return (
    <>
      <MyButton
        title="¿Dónde va una compra de comida?"
        variant="ghost"
        size="small"
        onPress={() => setVisible(true)}
        icon={
          <Icon
            type="material-community"
            name="help-circle-outline"
            size={16}
            color={colors.PRIMARY}
          />
        }
        style={{ alignSelf: 'flex-start', marginVertical: 0 }}
      />

      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
        <View style={[styles.overlay, { backgroundColor: colors.BLACK + '80' }]}>
          <View style={[styles.sheet, { backgroundColor: colors.CARD_BACKGROUND }]}>
            <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
              ¿Dónde va una compra de comida?
            </Text>
            <Text style={[styles.secondary, { color: colors.TEXT_SECONDARY }]}>
              Responde en orden y para en la primera pregunta que sea &quot;sí&quot;.
            </Text>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator>
              {RULE_STEPS.map((step, index) => (
                <StepCard key={step.question} index={index + 1} step={step} />
              ))}

              <View
                style={[
                  styles.tip,
                  { backgroundColor: colors.INFO + '15', borderColor: colors.INFO + '40' }
                ]}
              >
                <Icon
                  type="material-community"
                  name="information-outline"
                  size={20}
                  color={colors.INFO}
                />
                <Text style={[styles.tipText, { color: colors.TEXT_PRIMARY }]}>{MIXED_TIP}</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                Cómo escribir el comentario
              </Text>
              {CONVENTIONS.map((convention) => (
                <ConventionItem key={convention.title} convention={convention} />
              ))}

              <View style={[styles.example, { backgroundColor: colors.PRIMARY + '15' }]}>
                <Text style={[styles.exampleLabel, { color: colors.TEXT_SECONDARY }]}>Ejemplo</Text>
                <Text style={[styles.exampleText, { color: colors.TEXT_PRIMARY }]}>{EXAMPLE}</Text>
              </View>
            </ScrollView>

            <MyButton title="Cerrar" variant="primary" fullWidth onPress={close} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
    gap: 8
  },
  title: { fontSize: MEDIUM + 2, fontWeight: '700' },
  scroll: { flexShrink: 1, marginTop: 8 },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: { fontSize: SMALL + 1, fontWeight: '700' },
  stepContent: { flex: 1, gap: 4 },
  question: { fontSize: SMALL + 2, fontWeight: '700' },
  secondary: { fontSize: SMALL + 1, lineHeight: 20 },
  destinations: { gap: 8, marginTop: 8 },
  destination: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  destinationName: { fontSize: SMALL + 2, fontWeight: '700' },
  note: { fontSize: SMALL + 1, fontStyle: 'italic', marginTop: 4 },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  tipText: { flex: 1, fontSize: SMALL + 1, fontWeight: '600', lineHeight: 20 },
  sectionTitle: { fontSize: MEDIUM, fontWeight: '700', marginBottom: 8 },
  convention: { marginBottom: 12, gap: 4 },
  conventionTitle: { fontSize: SMALL + 2, fontWeight: '700' },
  example: { borderRadius: 8, padding: 12, gap: 4, marginTop: 4, marginBottom: 12 },
  exampleLabel: { fontSize: SMALL, fontWeight: '600' },
  exampleText: { fontSize: SMALL + 1, fontFamily: 'monospace', lineHeight: 20 }
});
