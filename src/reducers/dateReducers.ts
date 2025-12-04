import { MonthlyAction } from '../shared/types/reducers';
import { DateState } from '../shared/types/reducers/date-reducers.type';
import { DateFormat } from '../utils/Helpers';

const initialProps: DateState = {
  month: DateFormat(new Date(), 'YYYY-MM-DD')
};
export default function (state = initialProps, action: MonthlyAction): DateState {
  switch (action.type) {
    case 'SET_MONTH':
      return {
        ...state,
        month: action.payload
      };

    default:
      return state;
  }
}
