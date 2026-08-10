const { addBeforeLoader, loaderByName } = require("@craco/craco");
const webpack = require("webpack");
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const wasmExtensionRegExp = /\.wasm$/;
      // CRA's default JS rule only tests .js/.mjs/.jsx/.ts/.tsx (see react-scripts'
      // webpack.config.js), so a literal require of a .cjs file (as several Midnight
      // wasm-bindgen packages ship, e.g. onchain-runtime.cjs, ledger.cjs) falls through to the
      // generic "everything else" asset/resource rule and gets served as a URL string instead of
      // being parsed/executed as CommonJS — surfaces as "X.someExport is not a function" at
      // runtime, not a build error, since require() still "succeeds" with the wrong value.
      const cjsExtensionRegExp = /\.cjs$/;
      webpackConfig.resolve.extensions.push(".wasm");
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      webpackConfig.resolve.fallback = {
        buffer: require.resolve("buffer/"),
        stream: false,
        // Needed by @subsquid/scale-codec, a transitive dependency of the new-generation
        // midnight-js-indexer-public-data-provider.
        assert: require.resolve("assert/"),
        // Needed by object-inspect (a compact-runtime dependency) now that its .cjs files are
        // actually parsed as JS instead of falling through to the asset/resource rule (see the
        // cjsExtensionRegExp exclusion above) — that previously masked this requirement entirely.
        // (The actual redirect to our shim is in resolve.alias below, not here — see that entry's
        // comment for why `fallback` alone doesn't work once a real `util` package is installed.)
        util: require.resolve("util/"),
      };
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // See src/shims/isomorphic-ws-browser-shim.js — isomorphic-ws's own browser build only
        // has a default export, which breaks @midnight-ntwrk/midnight-js-indexer-public-data-provider's
        // `import * as ws from 'isomorphic-ws'; ws.WebSocket` usage.
        "isomorphic-ws": path.resolve(__dirname, "src/shims/isomorphic-ws-browser-shim.js"),
        // NOTE: the old midnight-js-network-id$ / ledger$ / onchain-runtime$ aliases (forcing
        // those packages to a CJS build) existed only because @midnight-ntwrk/zswap was a
        // wasm-bindgen CJS-only build that broke webpack's static ESM export analysis for anything
        // re-exporting it — removed along with zswap in the dapp-connector-api v4.x migration
        // (Lace bridges via hex tx strings now, no zswap Transaction type needed). The
        // new-generation packages (midnight-js-network-id@4.1.1, ledger-v8@8.1.0, etc.) ship
        // proper dual ESM/CJS builds via their own package.json "exports" map, so webpack resolves
        // them natively without a shim.
        // `resolve.fallback` (above) is only consulted when normal resolution FAILS — since
        // `npm install util` put a real package at node_modules/util, plain `require('util')`
        // resolves there directly and fallback never even gets checked. `resolve.alias` applies
        // unconditionally, so route it to our shim (adds TextDecoder/TextEncoder — see its
        // comment) the same way the other Midnight package shims above are forced.
        util$: path.resolve(__dirname, "src/shims/util-browser-shim.js"),
        // The `assert` polyfill explicitly requires 'util/' (trailing slash, not just 'util') to
        // sidestep bundler core-module shimming — needs its own exact-match alias to reach our
        // patched shim (see that file's comment re: util.inspect.custom) instead of the raw
        // browserify util/ package.
        "util/$": path.resolve(__dirname, "src/shims/util-browser-shim.js"),
      };
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            oneOf.exclude.push(wasmExtensionRegExp, cjsExtensionRegExp);
          }
        });
      });
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        })
      );
      webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

      return webpackConfig;
    },
  },
};
