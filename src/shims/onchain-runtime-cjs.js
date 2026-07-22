// See src/shims/ledger-cjs.js and craco.config.js for the full explanation — same fix for
// @midnight-ntwrk/onchain-runtime (transitive dependency of compact-runtime).
// Generated from onchain-runtime.d.ts's exported class/function/const/enum declarations.

const real = require("@midnight-ntwrk/onchain-runtime");

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
