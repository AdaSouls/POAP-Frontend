// See craco.config.js: midnight-js-network-id's ESM build imports zswap via `import * as zswap`,
// which breaks webpack's static named-export analysis of zswap's wasm-bindgen CJS output. Its CJS
// build sidesteps this with a plain require() + runtime interop helper, so we force webpack to use
// that instead. CRA's ModuleScopePlugin blocks source files from resolving straight to an absolute
// node_modules path via alias, so this indirection file (inside src/) re-exports it.
module.exports = require("@midnight-ntwrk/midnight-js-network-id/dist/index.js");
