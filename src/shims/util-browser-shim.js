// Several Midnight wasm-bindgen .cjs builds (e.g. @midnight-ntwrk/ledger) do
// `const { TextDecoder, TextEncoder } = require('util')` — valid in real Node.js, where
// util.TextDecoder/TextEncoder just alias the global constructors, but the `util/` browserify
// polyfill (needed for object-inspect's `require('util')`, see craco.config.js) predates Node
// adding those and doesn't export them, so the destructure silently gives `undefined` and
// `new undefined(...)` throws "is not a constructor". Browsers already have native
// TextDecoder/TextEncoder globals — just forward those instead of polyfilling them.
const real = require("util/");

module.exports = {
  ...real,
  TextDecoder: typeof TextDecoder !== "undefined" ? TextDecoder : real.TextDecoder,
  TextEncoder: typeof TextEncoder !== "undefined" ? TextEncoder : real.TextEncoder,
};
