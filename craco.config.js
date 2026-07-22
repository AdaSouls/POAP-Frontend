const { addBeforeLoader, loaderByName } = require("@craco/craco");
const webpack = require("webpack");
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push(".wasm");
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      webpackConfig.resolve.fallback = {
        buffer: require.resolve("buffer/"),
        stream: false,
      };
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // See src/shims/isomorphic-ws-browser-shim.js — isomorphic-ws's own browser build only
        // has a default export, which breaks @midnight-ntwrk/midnight-js-indexer-public-data-provider's
        // `import * as ws from 'isomorphic-ws'; ws.WebSocket` usage.
        "isomorphic-ws": path.resolve(__dirname, "src/shims/isomorphic-ws-browser-shim.js"),
        // @midnight-ntwrk/zswap is a wasm-bindgen CJS-only build whose `module.exports`
        // reassignment pattern breaks webpack's static named-export analysis for any ESM
        // `import { X } from 'zswap'` — including inside midnight-js-network-id's own ESM build
        // (dist/index.esm.js, which webpack picks via the "module" field by default). Its CJS
        // build (dist/index.js) requires zswap via plain require() + a runtime interop helper,
        // which sidesteps the static analysis entirely, so force webpack to use that build.
        // Trailing `$` = exact match only, so the shim's own subpath require() below isn't
        // recursively redirected back onto itself by webpack's default prefix-matching aliases.
        "@midnight-ntwrk/midnight-js-network-id$": path.resolve(
          __dirname,
          "src/shims/midnight-js-network-id-cjs.js"
        ),
        "@midnight-ntwrk/ledger$": path.resolve(__dirname, "src/shims/ledger-cjs.js"),
        "@midnight-ntwrk/onchain-runtime$": path.resolve(__dirname, "src/shims/onchain-runtime-cjs.js"),
      };
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            oneOf.exclude.push(wasmExtensionRegExp);
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
