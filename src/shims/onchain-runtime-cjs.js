// See src/shims/ledger-cjs.js and craco.config.js for the full explanation — same fix for
// @midnight-ntwrk/onchain-runtime (transitive dependency of compact-runtime).
// Generated from onchain-runtime.d.ts's exported class/function/const/enum declarations.

// Bare "@midnight-ntwrk/onchain-runtime" would hit craco.config.js's exact-match alias for
// "@midnight-ntwrk/onchain-runtime$" and redirect right back onto this very shim file — that
// self-reference resolves to this module's own (still-empty) exports mid-evaluation via Node's
// standard circular-require semantics, silently leaving every export here `undefined`. A subpath
// like ".../onchain-runtime.cjs" dodges the alias but the package's "exports" map in package.json
// only declares "." (no deep subpaths), so that 404s too. A literal relative-path string (not a
// bare specifier, and not built at runtime via the Node "path" module — that isn't polyfilled in
// this browser bundle, and __dirname isn't a real filesystem path here anyway) is neither: webpack
// resolves it statically at build time straight to the file, bypassing both problems.
const real = require("../../node_modules/@midnight-ntwrk/onchain-runtime/onchain-runtime.cjs");

exports.ContractOperation = real.ContractOperation;
exports.ContractState = real.ContractState;
exports.NetworkId = real.NetworkId;
exports.QueryContext = real.QueryContext;
exports.QueryResults = real.QueryResults;
exports.StateBoundedMerkleTree = real.StateBoundedMerkleTree;
exports.StateMap = real.StateMap;
exports.StateValue = real.StateValue;
exports.VmResults = real.VmResults;
exports.VmStack = real.VmStack;
exports.bigIntModFr = real.bigIntModFr;
exports.bigIntToValue = real.bigIntToValue;
exports.checkProofData = real.checkProofData;
exports.coinCommitment = real.coinCommitment;
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
exports.leafHash = real.leafHash;
exports.maxAlignedSize = real.maxAlignedSize;
exports.maxField = real.maxField;
exports.persistentCommit = real.persistentCommit;
exports.persistentHash = real.persistentHash;
exports.runProgram = real.runProgram;
exports.sampleContractAddress = real.sampleContractAddress;
exports.sampleTokenType = real.sampleTokenType;
exports.setNetworkId = real.setNetworkId;
exports.tokenType = real.tokenType;
exports.transientCommit = real.transientCommit;
exports.transientHash = real.transientHash;
exports.valueToBigInt = real.valueToBigInt;
