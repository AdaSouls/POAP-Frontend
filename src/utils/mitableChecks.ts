export function isEventExpired(expiration: number | null): boolean {
  if (!expiration) {
    return false;
  }
  const currentDate = new Date();
  return expiration * 1000 < currentDate.getTime();
}
