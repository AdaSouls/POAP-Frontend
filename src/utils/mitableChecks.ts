import { IGetAllEventsResult } from "../services/paima.service";

export function isEventExpired(expiration: number | null): boolean {
  if (!expiration) {
    return false;
  }
  const currentDate = new Date();
  return expiration * 1000 < currentDate.getTime();
}

export function hasPoapsToBeMinted(
  poapsToBeMinted: number,
  mintedPoaps: number
): boolean {
  return poapsToBeMinted > 0 && poapsToBeMinted > mintedPoaps;
}

// export function isPoapEventAlreadyMinted():boolean {

// }

export function isPoapMintable(event: IGetAllEventsResult): boolean {
  const isExpired = isEventExpired(event?.expiration ?? null);
  const hasMintablePoaps = hasPoapsToBeMinted(
    event.poapsToBeMinted,
    event.mintedPoaps
  );

  return !isExpired && hasMintablePoaps;
}
