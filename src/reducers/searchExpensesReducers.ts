import {SearchExpensesActionType } from "../shared/types/reducers/search-expenses-reducers";

const initialProps = {
  query: null,
  fullData: [],
}
export default function(state = initialProps, action: SearchExpensesActionType){
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload
      }
      case 'SET_FULL_DATA':
        return {
          ...state,
          fullData: action.payload
        }
    default:
     return state;
  }
}