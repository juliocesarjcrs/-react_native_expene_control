
const initialProps = {
  user: null,
  auth: false
}
export default function(state= initialProps, action){
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload
      }
      case 'SET_AUTH':
        return {
          ...state,
          auth: action.payload
        }
      case 'LOGOUT':
        return {
          ...state,
          auth: false,
          user: null
        }

    default:
     return state;
  }
}