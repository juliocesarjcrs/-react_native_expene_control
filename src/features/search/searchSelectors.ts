// features/search/searchSelectors.ts
import { RootState } from '~/store';
import type { SearchScope } from './searchSlice';

export const selectSearchQuery = (scope: SearchScope) => (state: RootState) =>
  state.search.queries[scope];
