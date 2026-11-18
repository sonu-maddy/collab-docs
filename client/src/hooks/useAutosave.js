import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounced, serialised autosave.
 *  - schedule(patch) merges patches and (re)starts the debounce timer
 *  - only one request is in flight; edits made meanwhile are saved right after it
 *  - flush() saves immediately (used on unmount / tab close)
 * status: 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
 */
export function useAutosave(save, { delay = 800 } = {}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const pending = useRef(null);
  const timer = useRef(null);
  const inFlight = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const run = useCallback(async () => {
    if (inFlight.current || !pending.current) return;
    const patch = pending.current;
    pending.current = null;
    inFlight.current = true;
    setStatus('saving');
    try {
      await saveRef.current(patch);
      setError(null);
      setStatus(pending.current ? 'unsaved' : 'saved');
    } catch (err) {
      // Put the failed patch back (newer edits win) so a retry doesn't lose anything.
      pending.current = { ...patch, ...pending.current };
      setError(err);
      setStatus('error');
      inFlight.current = false;
      return;
    }
    inFlight.current = false;
    if (pending.current) run();
  }, []);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    return run();
  }, [run]);

  const schedule = useCallback(
    (patch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus('unsaved');
      clearTimeout(timer.current);
      timer.current = setTimeout(run, delay);
    },
    [run, delay]
  );

  useEffect(() => {
    const warn = (e) => {
      if (pending.current || inFlight.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      clearTimeout(timer.current);
      run(); // save whatever is left when leaving the editor
    };
  }, [run]);

  return { status, error, schedule, flush };
}
