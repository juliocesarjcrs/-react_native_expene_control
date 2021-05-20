import moment from "moment";
import 'intl';
import 'intl/locale-data/jsonp/en';

export const NumberFormat = (number) => {
  const valor = new Intl.NumberFormat().format(number)
  return `$ ${valor}`
}

export const DateFormat = (date, format = 'DD MMM hh:mm a') => {
  return moment(date).format(format);

}


