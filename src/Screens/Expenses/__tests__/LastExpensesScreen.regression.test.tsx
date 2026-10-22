import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import searchReducer, { setQuery } from '~/features/search/searchSlice';
import LastExpensesScreen from '../LastExpensesScreen';
import * as expensesService from '../../../services/expenses';

jest.mock('../../../services/expenses');
const fetchExpenses = expensesService.getLastExpensesWithPaginate as jest.Mock;

jest.mock('~/components/ScreenHeader', () => ({ ScreenHeader: () => null }));
jest.mock('../components/RenderItemExpense', () => jest.fn(() => null));
jest.mock('~/components/loading/MyLoading', () => jest.fn(() => null));
jest.mock('~/utils/showError', () => ({ showError: jest.fn() }));

jest.mock('@react-navigation/native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (effect: () => void | (() => void)) => {
      // Se comporta como un useEffect: corre al montar y cuando cambia el callback
      React.useEffect(effect, [effect]);
    }
  };
});

// BarSearch REAL: solo se mockean sus dependencias visuales
jest.mock('~/components/MyButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TouchableOpacity, Text } = require('react-native');
  const MockMyButton = ({ title, onPress }: any) => (
    <TouchableOpacity onPress={onPress} testID="search-button">
      <Text>{title}</Text>
    </TouchableOpacity>
  );
  return MockMyButton;
});
jest.mock('react-native-elements', () => ({
  Icon: ({ name }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View } = require('react-native');
    return <View testID={`icon-${name}`} />;
  }
}));
jest.mock('~/customHooks/useThemeColors', () => ({
  useThemeColors: () => ({
    BACKGROUND: '#FFF',
    CARD_BACKGROUND: '#FFF',
    TEXT_PRIMARY: '#000',
    TEXT_SECONDARY: '#666',
    DARK_GRAY: '#666',
    BLACK: '#000'
  })
}));

const navigation = { navigate: jest.fn() } as any;
const EMPTY_TEXT = 'No se registran últimos gastos';

const makeStore = () => configureStore({ reducer: { search: searchReducer } });

// Ids distintos por búsqueda para saber de qué petición viene cada fila
const BASE: Record<string, number> = { '': 0, a: 1000, ab: 2000, super: 3000 };
const makePage = (page: number, query: string | null, size = 15) =>
  Array.from({ length: size }, (_, i) => ({
    id: (BASE[query ?? ''] ?? 9000) + (page - 1) * size + i,
    description: `item`,
    date: new Date().toISOString()
  }));

const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

const respond = (page: number, query: string | null) =>
  Promise.resolve({ data: { data: makePage(page, query) } });

const renderScreen = (store = makeStore()) => {
  const utils = render(
    <Provider store={store}>
      <LastExpensesScreen navigation={navigation} />
    </Provider>
  );
  return { store, ...utils };
};

const callsWith = (predicate: (p: any) => boolean) =>
  fetchExpenses.mock.calls.map(([p]) => p).filter(predicate);

describe('LastExpensesScreen: fallos conocidos (deben fallar antes del fix)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchExpenses.mockImplementation(({ page, query }) => respond(page, query));
  });

  it('BUG A: tras pulsar "Buscar" el texto y la query se conservan', async () => {
    const { store, getByPlaceholderText, getByTestId } = renderScreen();
    await waitFor(() => expect(fetchExpenses).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText('Buscar...'), 'luz');
    fireEvent.press(getByTestId('search-button'));

    await waitFor(() =>
      expect(fetchExpenses).toHaveBeenCalledWith(expect.objectContaining({ query: 'luz' }))
    );
    // Se vuelve a consultar el input: si hubo remontaje, el anterior ya no es el mismo
    expect(getByPlaceholderText('Buscar...').props.value).toBe('luz');
    expect(store.getState().search.queries.expenses).toBe('luz');
  });

  it('BUG B: buscar estando en la página 2 no pide página 2 con la query nueva', async () => {
    const { store, getByTestId } = renderScreen();
    await waitFor(() => expect(callsWith((p) => p.page === 1)).toHaveLength(1));

    await act(async () => getByTestId('flatlist-expenses').props.onEndReached());
    await waitFor(() => expect(callsWith((p) => p.page === 2)).toHaveLength(1));

    fetchExpenses.mockClear();
    await act(async () => {
      store.dispatch(setQuery({ scope: 'expenses', query: 'super' }));
    });
    await waitFor(() =>
      expect(callsWith((p) => p.query === 'super' && p.page === 1)).toHaveLength(1)
    );

    expect(callsWith((p) => p.query === 'super' && p.page > 1)).toHaveLength(0);
  });

  it('BUG C: una respuesta lenta vieja no pisa la búsqueda más reciente', async () => {
    const slowA = deferred<any>();
    fetchExpenses.mockImplementation(({ page, query }) =>
      query === 'a' ? slowA.promise : respond(page, query)
    );

    const { store, getByTestId } = renderScreen();
    await waitFor(() => expect(callsWith((p) => p.query === null)).toHaveLength(1));

    await act(async () => {
      store.dispatch(setQuery({ scope: 'expenses', query: 'a' }));
    });
    await act(async () => {
      store.dispatch(setQuery({ scope: 'expenses', query: 'ab' }));
    });
    await waitFor(() => expect(callsWith((p) => p.query === 'ab')).toHaveLength(1));

    // Llega tarde la respuesta de "a"
    await act(async () => {
      slowA.resolve({ data: { data: makePage(1, 'a') } });
    });

    const ids: number[] = getByTestId('flatlist-expenses').props.data.map((e: any) => e.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id >= 2000 && id < 3000)).toBe(true);
  });

  it('BUG D: no muestra "sin gastos" mientras la primera carga está pendiente', async () => {
    const first = deferred<any>();
    fetchExpenses.mockImplementation(() => first.promise);

    const { queryByText } = renderScreen();
    await waitFor(() => expect(fetchExpenses).toHaveBeenCalled());

    expect(queryByText(EMPTY_TEXT)).toBeNull();

    await act(async () => {
      first.resolve({ data: { data: [] } });
    });
    await waitFor(() => expect(queryByText(EMPTY_TEXT)).toBeTruthy());
  });

  it('BUG E: dos onEndReached seguidos piden la página 2, no saltan a la 3', async () => {
    const { getByTestId } = renderScreen();
    await waitFor(() => expect(callsWith((p) => p.page === 1)).toHaveLength(1));

    const page2 = deferred<any>();
    fetchExpenses.mockImplementation(({ page, query }) =>
      page === 2 ? page2.promise : respond(page, query)
    );

    await act(async () => {
      const { onEndReached } = getByTestId('flatlist-expenses').props;
      onEndReached();
      onEndReached();
    });

    const pages = callsWith((p) => p.page > 1).map((p) => p.page);
    expect(pages).toEqual([2]);
  });
});
