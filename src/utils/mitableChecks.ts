import { IGetAllEventsResult } from "../services/paima.service";

export function isEventExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) {
    return false; // If no expiry date is set, we consider it not expired
  }
  const currentDate = new Date();
  return expiryDate < currentDate;
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
  const isExpired = isEventExpired(event?.expiryDate);
  const hasMintablePoaps = hasPoapsToBeMinted(
    event.poapsToBeMinted,
    event.mintedPoaps
  );

  return !isExpired && hasMintablePoaps;
}
