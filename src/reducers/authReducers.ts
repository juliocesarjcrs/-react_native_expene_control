import { AuthAction, AuthState } from "../shared/types/reducers"

const initialProps = {
  user: null,
  isAuth: false,
  loadingAuth: false
}

const authReducers = (state = initialProps, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'SET_IS_AUTH':
      return {
        ...state,
        isAuth: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuth: false,
        user: null
      };
    case 'SET_LOADING_AUTH':
      return {
        ...state,
        loadingAuth: action.payload
      };
    default:
      return state;
  }
};

export default authReducers;