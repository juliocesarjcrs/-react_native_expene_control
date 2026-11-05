/**
 * Ayuda "¿Dónde va una compra de comida?" (regla v7)
 * Ubicación sugerida: junto a ExpenseList.tsx, en la carpeta components de CreateExpenseScreen.
 *
 * Renderiza un enlace discreto y, al tocarlo, un modal con la regla.
 * Se usa con una sola línea en CreateExpenseScreen: <FoodRuleHelp />
 *
 * El texto de la regla es una constante: si cambias un nombre de subcategoría, edítalo aquí.
 */
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';

import MyButton from '~/components/MyButton';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM, SMALL } from '~/styles/fonts';

type RuleStep = {
  question: string;
  answer: string;
};

const RULE_STEPS: RuleStep[] = [
  {
    question: '¿Fue por una ocasión (cumpleaños, despedida, invitación, aporte, regalo)?',
    answer: 'Regalos. La comida del evento va en un solo monto (mi comida + mi aporte).'
  },
  {
    question: '¿Almuerzo comprado porque era día de trabajo, mío o de Silvia?',
    answer:
      'Almuerzo comprado - día de trabajo (corrientazo, restaurante o domicilio, aunque se coma en casa). Cuenta el propósito, no el calendario.'
  },
  {
    question: '¿Plan para disfrutar, con su postre, café o trago?',
    answer: 'Salidas a comer.'
  },
  {
    question: '¿Hay que cocinarlo o armarlo en casa?',
    answer:
      'Mercado o Proteínas (almuerzo), o Ingredientes desayunos y cenas. El agua sola y los ingredientes de un postre casero van a Mercado. Huevos y jamón siempre van a Ingredientes.'
  },
  {
    question: '¿Ya viene hecho?',
    answer:
      'Bebida embotellada: Gaseosas. Galleta, wafer, ponqué, papas o chocolate: Chucherías. Helado, torta o cholado: Postres y helados comprados. Comida servida, panadería o café: Comida lista. Licor o cerveza para llevar a casa: Licores.'
  },
  {
    question: '¿La compra mezcla dos tipos?',
    answer: 'Va a la que más pesa.'
  }
];

const CONVENTIONS: string[] = [
  'Salidas a comer, Comida lista y Almuerzo comprado: primera línea con el nombre del restaurante, siempre escrito igual.',
  'Líneas siguientes (opcionales): plato — $precio, solo para platos grandes que quieras comparar.',
  'Almuerzo de una jornada de Silvia: agrega @Silvia viáticos. Un solo registro con el monto de la cuenta.'
];

export default function FoodRuleHelp(): React.JSX.Element {
  const colors = useThemeColors();
  const [visible, setVisible] = useState<boolean>(false);

  const close = (): void => setVisible(false);

  return (
    <>
      <TouchableOpacity
        style={styles.link}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Ver regla de comida"
        activeOpacity={0.7}
      >
        <Icon type="material-community" name="help-circle-outline" size={18} color={colors.INFO} />
        <Text style={[styles.linkText, { color: colors.INFO }]}>
          ¿Dónde va una compra de comida?
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.CARD_BACKGROUND, borderColor: colors.BORDER }
            ]}
          >
            <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
              Regla para digitar comida
            </Text>
            <Text style={[styles.hint, { color: colors.TEXT_SECONDARY }]}>
              Responde en orden y para en la primera que aplique.
            </Text>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator>
              {RULE_STEPS.map((step, index) => (
                <View key={step.question} style={styles.step}>
                  <Text style={[styles.question, { color: colors.TEXT_PRIMARY }]}>
                    {index + 1}. {step.question}
                  </Text>
                  <Text style={[styles.answer, { color: colors.TEXT_SECONDARY }]}>
                    → {step.answer}
                  </Text>
                </View>
              ))}

              <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
                Cómo escribir el comentario
              </Text>
              {CONVENTIONS.map((line) => (
                <Text key={line} style={[styles.answer, { color: colors.TEXT_SECONDARY }]}>
                  • {line}
                </Text>
              ))}
            </ScrollView>

            <MyButton title="Cerrar" onPress={close} variant="primary" />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    marginTop: 4
  },
  linkText: {
    fontSize: SMALL + 1,
    textDecorationLine: 'underline'
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  card: {
    maxHeight: '85%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: MEDIUM,
    fontWeight: '700'
  },
  hint: {
    fontSize: SMALL
  },
  scroll: {
    flexGrow: 0
  },
  step: {
    marginBottom: 12
  },
  question: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    marginBottom: 2
  },
  answer: {
    fontSize: SMALL,
    lineHeight: 19,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: SMALL + 1,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6
  }
});
