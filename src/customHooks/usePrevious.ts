import { useState } from 'react';

const usePrevious = <T>(value: T): T | undefined => {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T | undefined>(undefined);

  if (!Object.is(value, current)) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
};

export default usePrevious;
