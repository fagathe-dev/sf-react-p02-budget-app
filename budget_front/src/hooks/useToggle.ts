import { useCallback, useState } from 'react';

export const useToggle = (
  initialState = false
): [boolean, (nextValue?: unknown) => void] => {
  const [value, setValue] = useState(initialState);

  const toggle = useCallback((nextValue?: unknown) => {
    if (typeof nextValue === 'boolean') {
      setValue(nextValue);
    } else {
      setValue((prev) => !prev);
    }
  }, []);

  return [value, toggle];
};
