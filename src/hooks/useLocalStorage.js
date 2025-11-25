import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 🔥 REF para evitar ciclos infinitos
  const isSettingRef = useRef(false);
  const initialLoadRef = useRef(true);

  const setValue = useCallback((value) => {
    try {
      isSettingRef.current = true;
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    } finally {
      setTimeout(() => {
        isSettingRef.current = false;
      }, 100);
    }
  }, [key, storedValue]);

  const loadValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedValue = JSON.parse(item);
        setStoredValue(parsedValue);
      } else if (initialValue !== undefined && storedValue === undefined) {
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.error(`Error loading localStorage key "${key}" on demand:`, error);
      if (initialValue !== undefined && storedValue === undefined) {
        setStoredValue(initialValue);
      }
    }
  }, [key, initialValue, storedValue]);
  
  // 🔥 EFECTO CORREGIDO - Sin ciclo infinito
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Solo procesar si NO somos nosotros los que estamos estableciendo el valor
      if (event.key === key && !isSettingRef.current) {
        try {
          if (event.newValue) {
            const newValue = JSON.parse(event.newValue);
            setStoredValue(newValue);
          }
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Carga inicial solo una vez
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      loadValue();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, loadValue]);

  return [storedValue, setValue, loadValue];
}