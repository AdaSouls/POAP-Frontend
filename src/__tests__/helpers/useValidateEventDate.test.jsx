import { renderHook } from '@testing-library/react';
import useValidateEventDate from '../../jsx/helpers/useValidateEventDate';

describe('useValidateEventDate Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true for future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    const { result } = renderHook(() =>
      useValidateEventDate({ date: futureDate.toISOString() })
    );

    expect(result.current.isDateValid).toBe(true);
  });

  it('returns false for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const { result } = renderHook(() =>
      useValidateEventDate({ date: pastDate.toISOString() })
    );

    expect(result.current.isDateValid).toBe(false);
  });

  it('returns true for today', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { result } = renderHook(() =>
      useValidateEventDate({ date: today.toISOString() })
    );

    expect(result.current.isDateValid).toBe(true);
  });

  it('updates validation when date changes', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const { result, rerender } = renderHook(
      ({ date }) => useValidateEventDate({ date }),
      { initialProps: { date: futureDate.toISOString() } }
    );

    expect(result.current.isDateValid).toBe(true);

    rerender({ date: pastDate.toISOString() });

    expect(result.current.isDateValid).toBe(false);
  });
});

