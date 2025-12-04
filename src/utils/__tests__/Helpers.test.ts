import { handlerDataSearch } from '../Helpers';

describe('handlerDataSearch', () => {
  const prevData = [
    { id: 1, value: 'a' },
    { id: 2, value: 'b' }
  ];
  const newData = [
    { id: 3, value: 'c' },
    { id: 4, value: 'd' }
  ];

  it('should reset the list if the query changes', () => {
    const result = handlerDataSearch(newData, prevData, 'new', 'old', 1);
    expect(result).toEqual(newData);
  });

  it('should concatenate if the query is the same and the page is greater than 1', () => {
    const result = handlerDataSearch(newData, prevData, 'same', 'same', 2);
    expect(result).toEqual([...prevData, ...newData]);
  });

  it('should reset if the page is 1 even if the query is the same', () => {
    const result = handlerDataSearch(newData, prevData, 'same', 'same', 1);
    expect(result).toEqual(newData);
  });

  it('should concatenate if there is no query and the page is greater than 1', () => {
    const result = handlerDataSearch(newData, prevData, null, null, 2);
    expect(result).toEqual([...prevData, ...newData]);
  });
});
