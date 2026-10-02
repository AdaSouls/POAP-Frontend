import { act, renderHook } from '@testing-library/react';
import { useLastRolePath, DEFAULT_ROLE_PATH } from '../../jsx/hooks/useLastRolePath';
import { SITE_ROLES } from '../../jsx/hooks/useSiteRole';

const STORAGE_KEY = 'velum:lastRolePath';

describe('useLastRolePath', () => {
  beforeEach(() => window.localStorage.clear());

  it("remembers only each role's own pages", () => {
    const { result } = renderHook(() => useLastRolePath());
    act(() => result.current[1](SITE_ROLES.SUBSCRIBER, '/app/my-subscriptions'));
    act(() => result.current[1](SITE_ROLES.SUBSCRIBER, '/app/Settings-profile'));
    act(() => result.current[1](SITE_ROLES.SUBSCRIBER, '/app/my-events'));
    act(() => result.current[1](SITE_ROLES.ORGANIZER, '/app/verify'));

    expect(result.current[0]).toEqual({ [SITE_ROLES.SUBSCRIBER]: '/app/my-subscriptions' });
  });

  it('drops a stored page that no longer belongs to the role, so the role falls back to its default', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ [SITE_ROLES.SUBSCRIBER]: '/app/Settings-profile', [SITE_ROLES.ORGANIZER]: '/app/my-events' }),
    );
    const { result } = renderHook(() => useLastRolePath());
    const [paths] = result.current;

    expect(paths[SITE_ROLES.SUBSCRIBER]).toBeUndefined();
    expect(paths[SITE_ROLES.SUBSCRIBER] || DEFAULT_ROLE_PATH[SITE_ROLES.SUBSCRIBER]).toBe('/app/explore-events');
    expect(paths[SITE_ROLES.ORGANIZER]).toBe('/app/my-events');
  });
});
