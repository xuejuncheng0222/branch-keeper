import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import shebang from "rollup-plugin-preserve-shebang";

export default {
  input: "bin/bk.js", // CLI 入口
  output: {
    file: "dist/cli.js",
    format: "esm",
  },
  plugins: [shebang(), resolve(), commonjs(), json()],
  external: [],
};
