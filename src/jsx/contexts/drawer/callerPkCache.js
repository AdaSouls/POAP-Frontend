// localStorage cache of the connected wallet's derived caller pk — see useMidnight.js's
// resolveCallerPkHex for why it's keyed by BOTH the wallet's coinPublicKey and the contract address.
// Its own module so views that only need to invalidate it (backupRestore.jsx, after restoring a
// different identity) don't pull in the Midnight SDK through useMidnight.js.
const CALLER_PK_CACHE_PREFIX = "velum:midnight:callerPkHex:";

export function callerPkCacheKey(coinPublicKey, contractAddress) {
  return CALLER_PK_CACHE_PREFIX + coinPublicKey + ":" + contractAddress;
}

export function clearCallerPkCache(coinPublicKey, contractAddress) {
  window.localStorage.removeItem(callerPkCacheKey(coinPublicKey, contractAddress));
}
