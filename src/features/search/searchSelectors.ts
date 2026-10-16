// features/search/searchSelectors.ts
import { RootState } from '~/store';

export const selectSearchQuery = (state: RootState) => state.search.query;
