# Para el mantenedor de `POAP-Midnight` — problemas encontrados en el pipeline de deploy

Investigado desde el frontend entre el 2026-07-30 y el 2026-08-03, tratando de levantar un
ambiente de prueba local (devnet de Docker + deploy del contrato) para validar de punta a punta el
flujo de claim/mint. **Nada de esto se aplicó a `POAP-Midnight`** — todo se investigó leyendo el
código, instalando dependencias en una copia local aislada (`node_modules`, nunca commiteado) y
corriendo un fix de prueba en una rama local que después se descartó a pedido del dueño del
proyecto, para no arriesgar pisar tu propio trabajo en este repo. Este documento es la forma en
que ese trabajo de diagnóstico llega hasta vos.

## Resumen ejecutivo

No se pudo desplegar el contrato POAP contra un devnet local por **tres problemas independientes**,
en tres capas distintas:

1. **Tres partes del repo en dos generaciones de SDK de Midnight distintas** (`contracts/`+`scripts/`
   nueva vs. `indexer/` vieja) — y el frontend (`POAP-Frontend`) también está en la generación
   vieja. Este es el bloqueo de fondo; los otros dos son cosas que aparecen al intentar resolverlo.
2. **`scripts/deploy.ts` no coincide con sus propias dependencias declaradas** — ya identificamos
   el fix exacto (abajo, sección "Fix probado"), pero no lo aplicamos a este repo.
3. **Faltan las claves prover/verifier** del contrato compilado (`contracts/src/managed/poap/keys/`)
   — sin esto, ningún deploy real puede completarse aunque el script esté arreglado.

Con esto así, no se puede levantar un ambiente de prueba local coherente de punta a punta, y todo
lo que construimos del lado del frontend sigue probado solo con mocks/tests unitarios, nunca contra
el contrato real desplegado. Esto es además la ruta crítica del Hito 5 de Catalyst (vence
2026-10-30): sus 5 criterios de aceptación dependen de un contrato desplegado + indexer
sincronizado funcionando de punta a punta.

## 1. Tres partes del repo en dos generaciones distintas del SDK (bloqueo de fondo)

| Parte | `compact-runtime` | `ledger` | SDK (`midnight-js-*`) | Formato del contrato compilado |
|---|---|---|---|---|
| `contracts/` (`package.json`) | `0.16.0` | — | — | — |
| `scripts/` (`package.json`, deploy) | `0.16.0` | `4.0.0` | `4.1.1`, `wallet 5.0.0` | — |
| `contracts/src/managed/poap/contract/index.js` (compilado actual) | espera `0.16.0` | — | — | **ESM** (`import`) |
| `indexer/` (`package.json`) | `0.6.13` | `2.0.8` | `network-id 0.1.15` | — |
| **`POAP-Frontend/package.json`** (confirmado 2026-08-03) | `0.6.13` | `2.0.8` | `0.1.15` | — |
| Copia en `POAP-Frontend/src/midnight/contract/managed/poap/.../index.cjs` | espera `0.6.13` | — | — | **CommonJS** (`.cjs`) |

`contracts/` y `scripts/` ya están en una generación bastante más nueva del SDK (contrato compilado
como ESM), mientras que `indexer/` **y este frontend** siguen en la generación vieja (CommonJS).
Confirmamos el 2026-08-03 que el propio `POAP-Frontend/package.json` está en `0.6.13`/`0.1.15` —
no es solo un problema entre `contracts/` e `indexer/`, es de tres puntas.

**Consecuencia concreta**: aunque se resuelvan los puntos 2 y 3 de abajo y se logre un deploy real
con el pipeline de `contracts/`+`scripts/`, **ni el indexer actual ni este frontend van a poder
interactuar correctamente con ese contrato** — son formatos de `ContractState` y APIs de
`midnight-js-contracts` incompatibles entre generaciones.

**Lo que necesitamos que decidas**: ¿cuál generación es la "vigente" — la nueva (`contracts/`/
`scripts/`) o la vieja (`indexer/`, y el frontend)? ¿O están en medio de una migración interna? Si
es la nueva, `indexer/` y el frontend necesitan actualizarse (y nosotros necesitaríamos que nos
pases una copia actualizada de `contract/managed/poap/`, ver la nota de sync ya documentada en
`CLAUDE.md` de este repo). Si es la vieja, `contracts/`/`scripts/` tendrían que volver a compilar/
declarar dependencias en esa generación.

## 2. `scripts/deploy.ts` no coincide con sus propias dependencias declaradas

Instalando exactamente las versiones que `scripts/package.json` pide (`midnight-js-types@4.1.1`,
`wallet@5.0.0`, etc., en una copia aislada, sin tocar el repo real) el script rompe apenas arranca:
`createBalancedTx` no existe en esa versión, y varias otras piezas están escritas contra una API
más vieja que la que las dependencias declaradas realmente exponen (confirmado leyendo los `.d.ts`
reales instalados, no adivinando):

| | Lo que usa `deploy.ts` hoy | Lo que expone lo instalado (`midnight-js-types@4.1.1`, `testkit-js@4.1.1`, `wallet-sdk@1.1.0`) |
|---|---|---|
| Instanciar el contrato | `new Contract(withZswapWitnesses(witnesses)(pk))` | `withZswapWitnesses` **no existe más en ningún paquete instalado**. Se usa `CompiledContract.make(tag, Contract).pipe(CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets(zkConfigPath))` de `@midnight-ntwrk/midnight-js-protocol/compact-js` |
| `deployContract` | posicional: `(providers, privateStateId, privateState, contractInstance)` | objeto de opciones: `(providers, { compiledContract, privateStateId, initialPrivateState })` |
| Wallet | `@midnight-ntwrk/wallet`'s `WalletBuilder.buildFromSeed(...)` | `MidnightWalletProvider`/`syncWallet`/`initializeMidnightProviders`, ya implementados y exportados por `@midnight-ntwrk/testkit-js@4.1.1` — no hace falta reimplementarlos a mano |
| Balancear tx | `balanceTransaction()` → `proveTransaction()` → `submitTransaction()` (3 pasos, manual) | `MidnightWalletProvider.balanceTx()` ya encapsula esto en un solo método |
| `WalletState.syncProgress` | `{synced, total}` en bigints | `{lag: {sourceGap, applyGap}, synced: boolean}` — forma completamente distinta, el loop de espera de sync viejo también está roto por esto, no solo por `createBalancedTx` |
| Network ID | `toLedgerNetworkId`/`toRuntimeNetworkId`/`toZswapNetworkId` + 3 llamadas `setNetworkId` separadas | una sola llamada, `setNetworkId('undeployed')` |

**Fix probado**: reescribimos el script completo siguiendo el patrón oficial de Midnight (no
adivinando) — tomado directamente del ejemplo oficial
[`example-hello-world`](https://github.com/midnightntwrk/example-hello-world)
(`src/test/hw.test.ts` + `src/wallet.ts` + `src/providers.ts` + `contracts/index.ts`), obtenido vía
`curl` a los archivos raw de ese repo. El código completo probado queda en el Anexo A al final de
este documento, listo para aplicar.

**Validado** (en la copia aislada, no en este repo): typecheck limpio (`tsc --noEmit`), y correrlo
sin Docker levantado llega correctamente hasta el intento de sync de la wallet contra el nodo —
falla con `API-WS: disconnected from ws://127.0.0.1:9944/`, el error esperado por no tener el
devnet corriendo en ese momento, no un error de código.

**De paso, un bug de Node 24 (no relacionado al SDK)**: `globalThis.crypto = webcrypto` tira
`TypeError: Cannot set property crypto of #<Object> which has only a getter`, porque Node 19+ ya
expone `globalThis.crypto` como propiedad nativa de solo lectura. El fix del Anexo A lo resuelve
con una asignación condicional.

**Detalle menor encontrado de paso**: `getCallerPk` no aparece en el tipo `ProvableCircuits<PS>`
del contrato compilado (`contracts/src/managed/poap/contract/index.d.ts`) — solo en `Circuits<PS>`
(la versión no-provable/local). Si `POAP-Frontend/src/midnight/contract.service.ts` lo está
llamando como si fuera un circuito provable, vale la pena que lo revises; no profundizamos más
porque es un tema del lado del frontend, no del deploy.

## 3. Faltan las claves prover/verifier del contrato compilado

`contracts/src/managed/poap/keys/` no existe en el checkout que tenemos — solo está `zkir/`
(`.zkir`/`.bzkir` por circuito) y `compiler/contract-info.json`. `NodeZkConfigProvider` (usado
internamente por `initializeMidnightProviders`) lee las claves prover/verifier de
`<zkConfigPath>/keys/`, así que aunque el punto 2 esté resuelto, un deploy real va a fallar en la
etapa de carga de configuración ZK por esto.

Según `docs/environment.md` de este mismo repo, esas claves están ligadas al `public_params.bin`
extraído de la imagen `proof-server:2.0.7` exacta — necesitamos que nos confirmes el paso de
compilación que las genera (o nos pases la carpeta ya generada) para poder completar un deploy.

## Qué necesitamos de tu lado — resumen accionable

1. Confirmar qué generación de SDK es la "vigente" (punto 1) y coordinar la actualización del lado
   que corresponda (indexer + posiblemente el propio `POAP-Frontend`, o volver a compilar
   `contracts/`/`scripts/` contra la generación vieja).
2. Aplicar (o pedirnos que reapliquemos) el fix de `scripts/deploy.ts` del Anexo A — ya probado,
   solo falta incorporarlo a este repo.
3. Generar/pasarnos `contracts/src/managed/poap/keys/`.

Mientras esto no se resuelva, no podemos validar el flujo de claim/mint de punta a punta contra un
Midnight real.

---

## Anexo A — `scripts/deploy.ts` reescrito (probado, no aplicado a este repo)

Reemplaza el contenido completo de `scripts/deploy.ts`. También hace falta:
- En `scripts/package.json`: agregar `@midnight-ntwrk/testkit-js@^4.1.1`, `@midnight-ntwrk/wallet-sdk@^1.1.0`, `pino`, `pino-pretty`; sacar `@midnight-ntwrk/wallet` (ya no se usa).
- Instalar dependencias también dentro de `contracts/` (`cd contracts && npm install`) — el
  contrato compilado en `contracts/src/managed/poap/contract/index.js` importa
  `@midnight-ntwrk/compact-runtime` directamente, y Node resuelve ese import buscando hacia arriba
  desde `contracts/`, no desde `scripts/node_modules` (son directorios hermanos, no hay hoisting
  entre ellos sin un workspace).

```typescript
/**
 * TASK-015: Deploy the POAP contract to Midnight devnet.
 *
 * Rewritten 2026-08-03 against the SDK generation actually declared in this package's
 * package.json (compact-runtime 0.16.0 / ledger 4.0.0 / midnight-js-* 4.1.1 / wallet 5.0.0 /
 * zswap 4.0.0). The previous version of this script was written against an older,
 * Promise/positional-args API (createBalancedTx, WalletBuilder.buildFromSeed,
 * deployContract(providers, id, state, contractInstance), withZswapWitnesses) that no longer
 * exists in the installed packages — none of those symbols resolve anymore.
 *
 * The replacement pattern below (CompiledContract.make/.pipe, deployContract(providers, options),
 * MidnightWalletProvider/syncWallet/initializeMidnightProviders from @midnight-ntwrk/testkit-js)
 * is taken directly from Midnight's own official example
 * (https://github.com/midnightntwrk/example-hello-world, src/test/hw.test.ts + src/wallet.ts +
 * src/providers.ts + contracts/index.ts), not reverse-engineered from types alone.
 *
 * KNOWN BLOCKER (not fixed by this rewrite): contracts/src/managed/poap/keys/ does not exist on
 * this checkout — only zkir/ is present. NodeZkConfigProvider (used internally by
 * initializeMidnightProviders) reads prover/verifier keys from <zkConfigPath>/keys/, so this
 * script will fail at proof-config-loading time until those keys are generated against the
 * public_params.bin matching this environment's proof-server image (see docs/environment.md).
 * That generation step is outside the scope of this change.
 *
 * Run from scripts/, with contracts/ dependencies installed too (the compiled contract at
 * contracts/src/managed/poap/contract/index.js imports @midnight-ntwrk/compact-runtime, which
 * Node resolves by walking up from contracts/, not from scripts/node_modules — so `npm install`
 * must be run in both scripts/ and contracts/):
 *
 *   cd scripts && npm install && npx tsx deploy.ts
 *
 * Outputs the deployed contract address and saves it to docs/deployment.md.
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { WebSocket } from 'ws';

// Node 19+ already exposes a native, getter-only globalThis.crypto backed by the same
// node:crypto webcrypto implementation, so assigning over it throws
// "Cannot set property crypto of #<Object> which has only a getter" on modern Node (confirmed
// on Node 24). Only older Node runtimes need this polyfilled.
if (!globalThis.crypto) {
  // @ts-expect-error needed for Scala.js / WASM crypto on Node <19
  globalThis.crypto = webcrypto;
}
// @ts-expect-error needed for Apollo WebSocket (GraphQL subscriptions) in Node.js
globalThis.WebSocket = WebSocket;

import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx, type DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  MidnightWalletProvider,
  syncWallet,
  initializeMidnightProviders,
  type EnvironmentConfiguration,
} from '@midnight-ntwrk/testkit-js';

import { Contract } from '../contracts/src/managed/poap/contract/index.js';
import { createWitnesses, type PoapPrivateState } from '../contracts/src/witnesses.js';

type PoapCircuits =
  | 'pause'
  | 'unpause'
  | 'registerIssuer'
  | 'deactivateIssuer'
  | 'createEvent'
  | 'deactivateEvent'
  | 'claimOrUpdate'
  | 'mintTo'
  | 'burn';

// ── Config ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = path.resolve(__dirname, '..', 'contracts');
const ZK_CONFIG_PATH = path.join(CONTRACTS_DIR, 'src', 'managed', 'poap');

// Genesis wallet seed — funded in the genesis block of any local devnet
const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000042';
const PRIVATE_STATE_ID = 'poapPrivateState';

// Demo event parameters (TASK-016)
const DEMO_EVENT_ID = new Uint8Array(32);
DEMO_EVENT_ID[0] = 0xde;
DEMO_EVENT_ID[1] = 0x01;

// Matches docker-compose.devnet.yml's exposed ports. NOT the same as the official examples'
// LocalTestConfiguration defaults (those assume the official GraphQL indexer's own port/path
// conventions, e.g. /api/v4/graphql — this repo's devnet exposes /api/v1/graphql).
const envConfig: EnvironmentConfiguration = {
  walletNetworkId: 'undeployed',
  networkId: 'undeployed',
  indexer: 'http://127.0.0.1:8090/api/v1/graphql',
  indexerWS: 'ws://127.0.0.1:8090/api/v1/graphql/ws',
  node: 'http://127.0.0.1:9944',
  nodeWS: 'ws://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
  faucet: undefined,
};

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

// ── Compiled contract ─────────────────────────────────────────────────────────

const secretKey = Buffer.from(GENESIS_SEED, 'hex');

const CompiledPoapContract = CompiledContract.make('PoapContract', Contract).pipe(
  CompiledContract.withWitnesses(createWitnesses(secretKey)),
  CompiledContract.withCompiledFileAssets(ZK_CONFIG_PATH),
);

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logger.info('=== AdaSouls POAP Contract Deployment ===');

  setNetworkId(envConfig.networkId);

  logger.info('Building wallet from genesis seed...');
  const wallet = await MidnightWalletProvider.build(logger, envConfig, GENESIS_SEED);
  await wallet.start();

  logger.info('Syncing wallet...');
  await syncWallet(wallet.wallet);
  logger.info(`Wallet coin public key: ${wallet.getCoinPublicKey()}`);

  const providers = initializeMidnightProviders<PoapCircuits, PoapPrivateState>(wallet, envConfig, {
    privateStateStoreName: 'poap-deploy-state',
    zkConfigPath: ZK_CONFIG_PATH,
  });

  const initialPrivateState: PoapPrivateState = { secretKey, tokens: {} };

  logger.info('Deploying POAP contract...');
  const deployed: DeployedContract<Contract> = await deployContract<Contract>(providers, {
    compiledContract: CompiledPoapContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  const deployTxHash = deployed.deployTxData.public.txHash;
  logger.info(`Contract deployed! Address: ${contractAddress}, tx: ${deployTxHash}`);

  logger.info('Creating demo event...');
  const eventTx = await submitCallTx<Contract, 'createEvent'>(providers, {
    compiledContract: CompiledPoapContract,
    contractAddress,
    privateStateId: PRIVATE_STATE_ID,
    circuitId: 'createEvent',
    args: [DEMO_EVENT_ID, 100n, 0n, true],
  });
  logger.info(`Event created in block ${eventTx.public.blockHeight}, tx: ${eventTx.public.txHash}`);

  const demoEventHex = Buffer.from(DEMO_EVENT_ID).toString('hex');
  const deploymentMd = `# Deployment Record

## POAP Contract — Midnight Devnet

| Field | Value |
|---|---|
| Contract Address | \`${contractAddress}\` |
| Deploy Tx Hash | \`${deployTxHash}\` |
| Network | Undeployed (local devnet) |
| Deployed | ${new Date().toISOString()} |

## Demo Event

| Field | Value |
|---|---|
| Event ID | \`${demoEventHex}\` |
| Max Supply | 100 |
| Expiration | None |
| Public Mint | Yes |
| Create Tx Hash | \`${eventTx.public.txHash}\` |
| Block Height | ${eventTx.public.blockHeight} |
`;

  fs.writeFileSync(path.join(CONTRACTS_DIR, '..', 'docs', 'deployment.md'), deploymentMd);
  logger.info('Saved to docs/deployment.md');

  const envContent = `MIDNIGHT_NODE_URL=${envConfig.nodeWS}
MIDNIGHT_INDEXER_URL=${envConfig.indexer}
MIDNIGHT_INDEXER_WS=${envConfig.indexerWS}
MIDNIGHT_PROOF_SERVER_URL=${envConfig.proofServer}
CONTRACT_ADDRESS=${contractAddress}
DEMO_EVENT_ID=${demoEventHex}
ADMIN_SEED=${GENESIS_SEED}
`;
  fs.writeFileSync(path.join(CONTRACTS_DIR, '..', '.env.local'), envContent);
  logger.info('Saved to .env.local');

  logger.info('=== Deployment complete ===');
  await wallet.stop();
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Deployment failed');
  process.exit(1);
});
```
