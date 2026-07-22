// @midnight-ntwrk/midnight-js-indexer-public-data-provider imports isomorphic-ws expecting both a
// named `WebSocket` export and a default export. isomorphic-ws's own "browser" field build
// (browser.js) only provides a default export, which breaks under webpack's browser resolution.
// This shim provides both, backed by the browser's native WebSocket.
const WS = typeof window !== "undefined" ? window.WebSocket : undefined;

export { WS as WebSocket };
export default WS;
