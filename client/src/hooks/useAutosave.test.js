import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useAutosave } from './useAutosave';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useAutosave', () => {
  test('debounces rapid edits into one save with merged patches', async () => {
    const save = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() => useAutosave(save, { delay: 500 }));

    act(() => { result.current.schedule({ content: '<p>a</p>' }); });
    act(() => { vi.advanceTimersByTime(300); result.current.schedule({ content: '<p>ab</p>', title: 'T' }); });
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe('unsaved');

    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ content: '<p>ab</p>', title: 'T' });
    expect(result.current.status).toBe('saved');
  });

  test('edits made while saving are saved afterwards, never in parallel', async () => {
    let release;
    const save = vi.fn()
      .mockImplementationOnce(() => new Promise((r) => { release = r; }))
      .mockResolvedValue({});
    const { result } = renderHook(() => useAutosave(save, { delay: 100 }));

    act(() => { result.current.schedule({ content: 'one' }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(save).toHaveBeenCalledTimes(1);

    act(() => { result.current.schedule({ content: 'two' }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(save).toHaveBeenCalledTimes(1); // first request still in flight

    await act(async () => { release({}); await vi.advanceTimersByTimeAsync(0); });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ content: 'two' });
  });

  test('keeps the patch on failure and retries it via flush()', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({});
    const { result } = renderHook(() => useAutosave(save, { delay: 100 }));

    act(() => { result.current.schedule({ content: 'keep me' }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.status).toBe('error');
    expect(result.current.error.message).toBe('offline');

    await act(async () => { await result.current.flush(); });
    expect(save).toHaveBeenLastCalledWith({ content: 'keep me' });
    expect(result.current.status).toBe('saved');
  });
});
