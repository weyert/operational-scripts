const { join } = require("path");
const { existsSync, readFileSync } = require("fs");
const { execSync } = require("child_process");
const { sync: pkgDir } = require("pkg-dir");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const DashboardPlugin = require("webpack-dashboard/plugin");
const merge = require("webpack-merge");
const webpack = require("webpack");

const context = pkgDir(process.cwd());
const pathToOwnWebpackConfig = join(context, "webpack.config.js");
const hasOwnWebpackConfig = existsSync(pathToOwnWebpackConfig);
const webpackConfigToMerge = hasOwnWebpackConfig ? require(pathToOwnWebpackConfig) : {};

const getGitShortSha = () =>
  execSync("git rev-parse --short HEAD")
    .toString()
    .trim();

const getVersion = () => {
  const package = JSON.parse(readFileSync(join(context, "package.json")));
  try {
    return `${package.version}-${getGitShortSha()}`;
  } catch (e) {
    console.log(e.message);
    return package.version;
  }
};

const defaultConfig = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  context,
  entry: {
    main: join(context, "src/index"),
    config: join(context, "public/config"),
  },
  output: {
    filename: "[name].js",
    chunkFilename: "[name].js",
    path: join(context, "dist"),
    publicPath: "/",
  },
  node: {
    fs: "empty",
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)/,
        loader: "ts-loader",
        options: {
          configFile: join(__dirname, "tsconfig.json"),
          context,
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  plugins: [
    new DashboardPlugin(),
    new webpack.EnvironmentPlugin({
      VERSION: getVersion(), // Accessible in the js with: `process.env.VERSION`
    }),
    new HtmlWebpackPlugin({
      chunksSortMode: "manual",
      // The `config` chunk must come before `main` to make sure that runtime configuration variables are loaded
      chunks: ["config", "main"],
      template: join(context, "public/index.html"),
      version: getVersion(), // Accessible in the html with: `<%= htmlWebpackPlugin.options.version %>`
    }),
  ],
};

module.exports = merge(defaultConfig, webpackConfigToMerge);
