// See craco.config.js — @midnight-ntwrk/ledger's ESM build (ledger.mjs) internally imports
// its wasm-bindgen base64 payload via ESM `import`, which webpack can't statically resolve
// named exports from. require()-ing the package (which resolves to ledger.cjs via the
// package's "require" export condition) sidesteps that entirely. Individual `exports.X = ...`
// assignments (rather than a single `module.exports = real`) are required so THIS shim's own
// exports are themselves statically analyzable by webpack for downstream ESM imports.
// Generated from ledger.d.ts's exported class/function/const/enum declarations.

// See the full explanation in src/shims/onchain-runtime-cjs.js: a bare or subpath require of
// "@midnight-ntwrk/ledger" either self-redirects via craco.config.js's exact-match alias or 404s
// against the package's restrictive "exports" map. A literal relative-path string sidesteps both —
// webpack resolves it statically at build time straight to the file.
const real = require("../../node_modules/@midnight-ntwrk/ledger/ledger.cjs");

exports.ContractCall = real.ContractCall;
exports.ContractCallPrototype = real.ContractCallPrototype;
exports.ContractCallsPrototype = real.ContractCallsPrototype;
exports.ContractDeploy = real.ContractDeploy;
exports.ContractOperation = real.ContractOperation;
exports.ContractState = real.ContractState;
exports.EncryptionSecretKey = real.EncryptionSecretKey;
exports.Input = real.Input;
exports.LedgerState = real.LedgerState;
exports.LocalState = real.LocalState;
exports.MerkleTreeCollapsedUpdate = real.MerkleTreeCollapsedUpdate;
exports.NetworkId = real.NetworkId;
exports.Offer = real.Offer;
exports.Output = real.Output;
exports.ProofErasedInput = real.ProofErasedInput;
exports.ProofErasedOffer = real.ProofErasedOffer;
exports.ProofErasedOutput = real.ProofErasedOutput;
exports.ProofErasedTransaction = real.ProofErasedTransaction;
exports.ProofErasedTransient = real.ProofErasedTransient;
exports.QueryContext = real.QueryContext;
exports.QueryResults = real.QueryResults;
exports.StateBoundedMerkleTree = real.StateBoundedMerkleTree;
exports.StateMap = real.StateMap;
exports.StateValue = real.StateValue;
exports.Transaction = real.Transaction;
exports.Transient = real.Transient;
exports.UnprovenInput = real.UnprovenInput;
exports.UnprovenOffer = real.UnprovenOffer;
exports.UnprovenOutput = real.UnprovenOutput;
exports.UnprovenTransaction = real.UnprovenTransaction;
exports.UnprovenTransient = real.UnprovenTransient;
exports.VmResults = real.VmResults;
exports.VmStack = real.VmStack;
exports.ZswapChainState = real.ZswapChainState;
exports.bigIntModFr = real.bigIntModFr;
exports.bigIntToValue = real.bigIntToValue;
exports.checkProofData = real.checkProofData;
exports.coinCommitment = real.coinCommitment;
exports.communicationCommitmentRandomness = real.communicationCommitmentRandomness;
exports.createCoinInfo = real.createCoinInfo;
exports.decodeCoinInfo = real.decodeCoinInfo;
exports.decodeCoinPublicKey = real.decodeCoinPublicKey;
exports.decodeContractAddress = real.decodeContractAddress;
exports.decodeQualifiedCoinInfo = real.decodeQualifiedCoinInfo;
exports.decodeTokenType = real.decodeTokenType;
exports.degradeToTransient = real.degradeToTransient;
exports.dummyContractAddress = real.dummyContractAddress;
exports.ecAdd = real.ecAdd;
exports.ecMul = real.ecMul;
exports.ecMulGenerator = real.ecMulGenerator;
exports.encodeCoinInfo = real.encodeCoinInfo;
exports.encodeCoinPublicKey = real.encodeCoinPublicKey;
exports.encodeContractAddress = real.encodeContractAddress;
exports.encodeQualifiedCoinInfo = real.encodeQualifiedCoinInfo;
exports.encodeTokenType = real.encodeTokenType;
exports.hashToCurve = real.hashToCurve;
exports.inputFeeOverhead = real.inputFeeOverhead;
exports.leafHash = real.leafHash;
exports.maxAlignedSize = real.maxAlignedSize;
exports.maxField = real.maxField;
exports.nativeToken = real.nativeToken;
exports.outputFeeOverhead = real.outputFeeOverhead;
exports.persistentCommit = real.persistentCommit;
exports.persistentHash = real.persistentHash;
exports.runProgram = real.runProgram;
exports.sampleCoinPublicKey = real.sampleCoinPublicKey;
exports.sampleContractAddress = real.sampleContractAddress;
exports.sampleTokenType = real.sampleTokenType;
exports.setNetworkId = real.setNetworkId;
exports.tokenType = real.tokenType;
exports.transientCommit = real.transientCommit;
exports.transientHash = real.transientHash;
exports.valueToBigInt = real.valueToBigInt;
