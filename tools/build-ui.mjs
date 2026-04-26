import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

const outdir = "static/main/vendor";

await mkdir(outdir, { recursive: true });

await build({
  entryPoints: ["tools/forge-bridge.entry.js"],
  outfile: `${outdir}/forge-bridge.js`,
  bundle: true,
  platform: "browser",
  format: "esm",
  target: ["es2020"],
  sourcemap: false,
  minify: true,
  logLevel: "info",
});

console.log("Built static/main/vendor/forge-bridge.js");