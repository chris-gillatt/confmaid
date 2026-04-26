import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

const outdir = "static/main/vendor";

await mkdir(outdir, { recursive: true });

const bundles = [
  {
    entry: "tools/forge-bridge.entry.js",
    output: `${outdir}/forge-bridge.js`,
  },
  {
    entry: "tools/mermaid.entry.js",
    output: `${outdir}/mermaid.js`,
  },
];

for (const bundle of bundles) {
  await build({
    entryPoints: [bundle.entry],
    outfile: bundle.output,
    bundle: true,
    platform: "browser",
    format: "esm",
    target: ["es2020"],
    sourcemap: false,
    minify: true,
    logLevel: "info",
  });
}

console.log("Built static/main/vendor/forge-bridge.js");
console.log("Built static/main/vendor/mermaid.js");
