import { useEffect, useRef, useState } from "react";

// Drafts survive navigation/refresh within this tab. Explicit Save writes to the case record.
export function useReviewDraft<T extends Record<string, string>>(
  key: string,
  saved: T,
) {
  const storageKey = `alta-review-draft:${key}`;
  const read = () => {
    try {
      const candidate = JSON.parse(
        sessionStorage.getItem(storageKey) || "null",
      );
      if (
        candidate &&
        Object.keys(saved).every((k) => typeof candidate[k] === "string")
      )
        return Object.fromEntries(
          Object.keys(saved).map((k) => [k, candidate[k]]),
        ) as T;
    } catch {
      /* Unavailable browser storage must not prevent editing. */
    }
    return saved;
  };
  const [value, setValue] = useState<T>(read);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const previous = useRef(JSON.stringify(saved));
  const serialized = JSON.stringify(saved);
  const dirty = JSON.stringify(value) !== serialized;
  useEffect(() => {
    if (previous.current !== serialized) {
      const before = previous.current;
      setValue((current) =>
        JSON.stringify(current) === before ? saved : current,
      );
      previous.current = serialized;
    }
  }, [serialized]);
  useEffect(() => {
    try {
      if (dirty) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [storageKey, value, dirty]);
  function accept(next: T) {
    setValue(next);
    previous.current = JSON.stringify(next);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* See above. */
    }
  }
  return { value, setValue, dirty, accept, storageAvailable };
}
