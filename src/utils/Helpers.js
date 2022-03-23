import moment from "moment";
import 'moment/locale/es'  // without this line it didn't work
moment.locale('es')
import 'intl';
import 'intl/locale-data/jsonp/en';
import {colorPalette} from './colorPalette';

export const NumberFormat = (number) => {
  const valor = new Intl.NumberFormat().format(number)
  return `$ ${valor}`
}

export const DateFormat = (date, format = 'DD MMM hh:mm a') => {
  return moment(date).format(format);

}

export const GetNumberMonth =  (date) =>{
  const num =  moment(date).month();
  return num +1;
}
export const AsignColor = (index) =>{

  const leng = colorPalette.length
  if(index < leng){
      return colorPalette[index]
  }
  return '#AEA3CD'

}
export const  delay =(miliseconst) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, miliseconst);
  });
}
export const compareValues =(key, order = 'asc') => {
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}

export const GetInitialMonth =  (date) =>{
  return moment().diff(moment(date), 'months');
}

export const cutText =(text, n= 12) =>{
  if(text.length >n){
    return text.slice(0, n)+'...';
  }else{
    return text;
  }
 }

 export const dayMonth =  (offset=0) =>{
   const today =  moment().date();
   const daysInMonth = moment().daysInMonth();
   let percentage = 0;
   const numPercentage = percent(daysInMonth, today);
   if(offset > 0){
     let temp = numPercentage + offset;
     percentage = `${temp.toFixed(2)}%`
   }else{
     percentage = `${numPercentage.toFixed(2)}%`
   }
  return {
    day: today,
    daysInMonth,
    percentage,
    withOffset: offset > 0,
    numPercentage: numPercentage
  };
}

export const percent =(total, cant) =>{
  return total >0 ? (cant*100) / total: 0
}





