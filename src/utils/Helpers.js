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

export const AsignColor = (index) =>{

  const leng = colorPalette.length
  if(index < leng){
      return colorPalette[index]
  }
  return '#AEA3CD'

}


