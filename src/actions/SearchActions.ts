import { SetQueryAction } from '../shared/types/actions/search-actions';

export const setQueryAction = (state: string | null): SetQueryAction => {
  return {
    type: 'SET_QUERY',
    payload: state
  };
};
