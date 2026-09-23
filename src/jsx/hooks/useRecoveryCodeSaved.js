import { useEffect, useState } from "react";
import { isRecoveryCodeSaved, subscribeRecoveryCodeSaved } from "../../midnight/storage-password";

// Whether the connected wallet's recovery code was confirmed as saved (see storage-password.ts).
// null when there's no connected wallet to ask about.
export function useRecoveryCodeSaved(coinPublicKey) {
  const read = () => (coinPublicKey ? isRecoveryCodeSaved(coinPublicKey) : null);
  const [saved, setSaved] = useState(read);
  useEffect(() => {
    setSaved(read());
    return subscribeRecoveryCodeSaved(() => setSaved(read()));
    // read() only depends on coinPublicKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinPublicKey]);
  return saved;
}
