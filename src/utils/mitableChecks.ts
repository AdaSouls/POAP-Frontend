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

// Check if event has available supply for minting
export function hasAvailableSupply(event: IGetAllEventsResult): boolean {
  // Use totalSupply from database (preferred) or fallback to legacy fields
  const totalSupply = event.totalSupply !== undefined ? event.totalSupply : 
                     (event.mintedPoaps !== undefined ? event.mintedPoaps : 0);
  const maxSupply = event.maxSupply || event.poapsToBeMinted || 0;
  const available = maxSupply - totalSupply;
  
  return available > 0;
}

// export function isPoapEventAlreadyMinted():boolean {

// }

export function isPoapMintable(event: IGetAllEventsResult): boolean {
  const isExpired = isEventExpired(event?.expiration ?? null);
  
  // Use new hasAvailableSupply function (preferred) or fallback to legacy check
  const hasMintablePoaps = event.totalSupply !== undefined || event.maxSupply !== undefined
    ? hasAvailableSupply(event)
    : hasPoapsToBeMinted(event.poapsToBeMinted, event.mintedPoaps);

  return !isExpired && hasMintablePoaps;
}
