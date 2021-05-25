import {DateFormat} from '../utils/Helpers';

const initialProps = {
  month:DateFormat(new Date(), "YYYY-MM-DD"),
}
export default function(state= initialProps, action){
  switch (action.type) {
    case 'SET_MONTH':
      return {
        ...state,
        month: action.payload
      }

    default:
     return state;
  }
}