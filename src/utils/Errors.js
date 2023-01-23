
export const Errors = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log('1----',error.response.data);
    // console.log('1.1----',error.response.status);
    // console.log('1.2----',error.response.headers);
    if(error.response.status === 401){
      console.log('1----','Necesita iniciar sesión');
    }
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log('2----',error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('My Error', error);
  }
}
