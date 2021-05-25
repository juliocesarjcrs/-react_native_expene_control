import {combineReducers}  from 'redux';

import authReducers from "./authReducers";
import dateReducers from "./dateReducers";

export default combineReducers({
  auth: authReducers,
  date: dateReducers
})