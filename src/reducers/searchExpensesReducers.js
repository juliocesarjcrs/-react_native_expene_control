
const initialProps = {
  query: null,
  fullData: [],
}
export default function(state= initialProps, {type, payload} = {}){
  switch (type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: payload
      }
      case 'SET_FULL_DATA':
        return {
          ...state,
          fullData: payload
        }
    default:
     return state;
  }
}