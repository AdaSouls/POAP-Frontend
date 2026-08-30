import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { deployContract, type DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract } from './contract/managed/poap/contract/index.js';
import { compiledPoapContract } from './contract.service';
import { POAP_PRIVATE_STATE_KEY, buildProviders, connectToWalletForNetwork } from './providers';
import { createPoapPrivateState, type PoapPrivateState } from './witnesses';

// Gate for /admin/deploy — see .env.example's REACT_APP_ADMIN_WALLET_ADDRESSES. Client-side UI
// gating only, same convention as isAdmin in user-roles.provider.jsx (there it's derived from the
// contract's own adminPk; here there's no contract yet, so it's a static allowlist instead). The
// real trust boundary is still the connected wallet's own signature on the deploy transaction.
function getAdminWalletAddresses(): string[] {
  return (process.env.REACT_APP_ADMIN_WALLET_ADDRESSES ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
}

export function isAdminWallet(shieldedAddress: string): boolean {
  return getAdminWalletAddresses().includes(shieldedAddress);
}

export type DeployResult = {
  contractAddress: string;
  deployTxHash: string;
  networkId: string;
};

// Deploys a brand-new POAP contract using the connected wallet (Lace/1am) as both the fee-paying
// wallet and the on-chain admin (adminPk is set at construction from this deployer's caller_pk,
// itself derived from the fresh secretKey generated below). Mirrors
// ../../POAP-Midnight/scripts/deploy.ts's deployContract() call, but bridged through the wallet
// extension instead of a Node-side MidnightWalletProvider — see providers.ts's buildProviders()
// for why that avoids the multi-hour cold-sync problem a fresh headless wallet has on a real
// network: Lace balances/signs using its own already-synced session, not a from-genesis rescan.
export async function deployPoapContract(wallet: InitialAPI, networkId: string): Promise<DeployResult> {
  const connection = await connectToWalletForNetwork(wallet, networkId);
  const providers = await buildProviders(connection);
  const config = await connection.connectedApi.getConfiguration();

  // Always a fresh secretKey — this is a new deployment, not a reconnect to an existing one, so
  // there is no prior private state to load (and no contract address yet to scope it under; see
  // PrivateStateProvider.setContractAddress's doc comment — deployContract handles that internally
  // once the new address is known, same as it does for the sampled contract-maintenance signing key).
  const secretKey = new Uint8Array(32);
  crypto.getRandomValues(secretKey);
  const initialPrivateState: PoapPrivateState = createPoapPrivateState(secretKey);

  const deployed: DeployedContract<Contract<PoapPrivateState>> = await deployContract(providers, {
    compiledContract: compiledPoapContract,
    privateStateId: POAP_PRIVATE_STATE_KEY,
    initialPrivateState,
  });

  return {
    contractAddress: deployed.deployTxData.public.contractAddress,
    deployTxHash: deployed.deployTxData.public.txHash,
    networkId: config.networkId,
  };
}
