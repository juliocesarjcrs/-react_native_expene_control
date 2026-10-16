import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { Icon } from 'react-native-elements';
import { selectSelectedMonth } from '~/features/period/periodSelectors';
import Constants from 'expo-constants';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

// Services
import { getUrlSignedAws } from '~/services/files';
import { getAllExpensesByMonth } from '~/services/categories';

// Components
import CardLastExpenses, { CardLastExpensesNavigationProp } from './components/CardLastExpenses';
import MyMonthPicker from '~/components/datePicker/MyMonthPicker';
import MyLoading from '~/components/loading/MyLoading';
import MyButton from '~/components/MyButton';
import OptionsGrid from './components/OptionsGrid';
import MyDonutChart from '~/components/charts/MyDonutChart';
import { ScreenHeader } from '~/components/ScreenHeader';
import { ChatScreen } from '~/Screens/common/ChatScreen';

// Types
import { ExpenseStackParamList } from '~/shared/types';

// Utils
import { AsignColor, compareValues } from '~/utils/Helpers';
import { showError } from '~/utils/showError';

// Hooks
import { useFeatureFlag } from '~/contexts/FeatureFlagsContext';
import { useAppDispatch, useAppSelector } from '~/store/hooks';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { commonStyles } from '~/styles/common';
import { SMALL } from '~/styles/fonts';

// Configs
import { screenConfigs } from '~/config/screenConfigs';
import { signOut } from '~/features/auth/authThunks';

type MainScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'main'>;

interface MainScreenProps {
  navigation: MainScreenNavigationProp;
}

type CategoryDataFormat = {
  name: string;
  population: number;
  color: string;
};

type RawExpenses = Awaited<ReturnType<typeof getAllExpensesByMonth>>['data']['data'];

// Datos de gastos junto con el mes para el que se cargaron
type ExpenseData = {
  month: string;
  total: number;
  categories: CategoryDataFormat[];
};

const cutName = (name: string): string => (name.length < 12 ? name : `${name.slice(0, 10)}...`);

const buildCategories = (rows: RawExpenses): CategoryDataFormat[] => {
  const formatted = rows.map((e, idx) => ({
    name: cutName(e.name),
    population: e.total,
    color: AsignColor(idx)
  }));
  formatted.sort(compareValues('population', 'desc'));
  return formatted;
};

export default function MainScreen({ navigation }: MainScreenProps) {
  const config = screenConfigs.main;
  const colors = useThemeColors();

  const dispatch = useAppDispatch();
  const month = useAppSelector(selectSelectedMonth);
  const user = useAppSelector((s) => s.auth.user);

  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [userImgSigned, setUserImgSigned] = useState<string | null>(null);

  const { isEnabled } = useFeatureFlag('chatbot');
  const version = Constants.expoConfig?.version ?? 'Desconocida';

  // Hay carga mientras los datos no correspondan al mes seleccionado
  const loading = expenseData?.month !== month;
  const total = expenseData?.total ?? 0;
  const categories = expenseData?.categories ?? [];

  // Gastos: al enfocar la pantalla y cuando cambia el mes
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadExpenses = async (): Promise<void> => {
        try {
          const { data } = await getAllExpensesByMonth(month);
          if (active) {
            setExpenseData({ month, total: data.total, categories: buildCategories(data.data) });
          }
        } catch (error) {
          if (active) {
            showError(error);
            setExpenseData({ month, total: 0, categories: [] });
          }
        }
      };

      loadExpenses();

      return () => {
        active = false;
      };
    }, [month])
  );

  // Usuario y foto: al enfocar la pantalla
  const userImage = user?.image;

  useFocusEffect(
    useCallback(() => {
      if (!userImage) {
        setUserImgSigned(null);
        return;
      }

      let active = true;

      const loadAvatar = async (): Promise<void> => {
        try {
          const { data: signedUrl } = await getUrlSignedAws({ file: userImage });
          if (active) setUserImgSigned(signedUrl);
        } catch (error) {
          if (active) showError(error);
        }
      };

      loadAvatar();

      return () => {
        active = false;
      };
    }, [userImage])
  );

  const logOut = async (): Promise<void> => {
    try {
      await dispatch(signOut()).unwrap();
    } catch (error) {
      showError(error);
    }
  };

  const renderChart = () => {
    if (loading) return <MyLoading />;

    if (total > 0) return <MyDonutChart data={categories} total={total} />;

    return (
      <View style={styles.emptyState}>
        <Icon type="material-community" name="chart-pie" size={48} color={colors.TEXT_SECONDARY} />
        <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
          No se registran gastos en este mes
        </Text>
      </View>
    );
  };

  return (
    <View style={[commonStyles.screenContainer, { backgroundColor: colors.BACKGROUND }]}>
      <ScreenHeader
        title={config.title}
        subtitle={config.subtitle}
        rightComponent={
          <View style={styles.userHeaderCompact}>
            <View style={[styles.avatarSmall, { borderColor: colors.PRIMARY }]}>
              {user?.image && userImgSigned ? (
                <Image source={{ uri: userImgSigned }} style={styles.avatarSmallImage} />
              ) : (
                <View
                  style={[
                    styles.avatarSmallPlaceholder,
                    { backgroundColor: colors.PRIMARY + '20' }
                  ]}
                >
                  <Icon type="material-community" name="account" size={20} color={colors.PRIMARY} />
                </View>
              )}
            </View>
            <Text style={[styles.userName, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
              {user?.name ?? 'Usuario'}
            </Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* MONTH PICKER */}
        <View style={styles.section}>
          <MyMonthPicker />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <View
            style={[
              styles.actionCard,
              { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
            ]}
          >
            <OptionsGrid
              actions={[
                { title: 'Ingresar gasto', onPress: () => navigation.navigate('createExpense') },
                {
                  title: 'Escanear',
                  onPress: () => navigation.navigate('scanInvoiceExpense'),
                  featureKey: 'invoice_scanner'
                }
              ]}
            />
          </View>
        </View>

        {/* CHART SECTION */}
        <View style={styles.section}>{renderChart()}</View>

        {/* DETAIL BUTTON */}
        <MyButton
          onPress={() => navigation.navigate('sumary')}
          title="Detallar gastos"
          variant="primary"
        />

        {/* LAST EXPENSES */}
        <View style={styles.section}>
          <CardLastExpenses navigation={navigation as CardLastExpensesNavigationProp} />
        </View>

        {/* LOGOUT BUTTON */}
        <MyButton onPress={logOut} title="Cerrar sesión" variant="cancel" />

        {/* VERSION */}
        <Text style={[styles.versionText, { color: colors.TEXT_SECONDARY }]}>
          Versión: {version}
        </Text>
      </ScrollView>

      {isEnabled && <ChatScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 30
  },
  section: {
    marginBottom: 16
  },
  actionCard: {
    padding: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: SMALL + 1,
    marginTop: 12,
    textAlign: 'center'
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    fontSize: SMALL
  },
  userHeaderCompact: {
    alignItems: 'flex-end',
    maxWidth: 160
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 4
  },
  avatarSmallImage: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  avatarSmallPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  userName: {
    fontSize: SMALL,
    fontWeight: '600',
    textAlign: 'right'
  }
});
