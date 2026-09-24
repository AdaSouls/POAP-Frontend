// callTx resolves to FinalizedCallTxData (midnight-js-contracts' tx-model.d.ts / call.d.ts): the
// transaction hash lives under `public.txHash`, not at the top level, and a circuit's own return
// value under `private.result`. Destructuring `{ txHash }` straight off the result gives
// undefined — every flow reads it through here instead. The top-level fallback keeps plain
// `{ txHash }` objects (tests, wrappers that already unwrapped it) working.
export function txHashOf(result: any): string | null {
  return result?.public?.txHash ?? result?.txHash ?? null;
}
