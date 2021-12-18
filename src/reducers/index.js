import {combineReducers}  from 'redux';

import authReducers from "./authReducers";
import dateReducers from "./dateReducers";
import searchExpensesReducers from "./searchExpensesReducers";


export default combineReducers({
  auth: authReducers,
  date: dateReducers,
  search: searchExpensesReducers
})