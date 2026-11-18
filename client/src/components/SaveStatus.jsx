const TEXT = {
  idle: '',
  unsaved: 'Unsaved changes…',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: 'Save failed',
};

export default function SaveStatus({ status, error, onRetry }) {
  return (
    <span className={`save-status save-${status}`} role="status" aria-live="polite">
      {TEXT[status]}
      {status === 'error' && (
        <>
          {error?.message ? ` – ${error.message}` : ''}{' '}
          <button className="link-btn" onClick={onRetry}>Retry</button>
        </>
      )}
    </span>
  );
}
