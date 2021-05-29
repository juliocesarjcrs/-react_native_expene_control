export const setUserAction = state =>{
  return {
    type: "SET_USER",
    payload: state
  }
}
export const setAuthAction = state =>{
  return {
    type: "SET_AUTH",
    payload: state
  }
}

export const userSignOut = () =>{
  return {
    type: "LOGOUT"
  }
}

export const setLoadingAuthAction = state =>{
  return {
    type: "SET_LOADING_AUTH",
    payload: state
  }
}

