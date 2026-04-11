const { addBeforeLoader, loaderByName } = require("@craco/craco");
const webpack = require("webpack");

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
