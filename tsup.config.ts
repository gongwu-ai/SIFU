import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/sifu-cli.ts", "src/sifu-init.ts"],
  outDir: "dist",
  format: ["cjs"],
  banner: {
    js: "#!/usr/bin/env node",
  },
  clean: true,
  splitting: false,
  noExternal: [/.*/],
  bundle: false,
});
