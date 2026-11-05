import { readFileSync, writeFileSync } from "node:fs";
const source = new URL("../packages/tokens/src/tokens.json", import.meta.url);
const tokens = JSON.parse(readFileSync(source, "utf8"));
const declarations = Object.entries(tokens).flatMap(([group, values]) =>
  Object.entries(values).map(
    ([name, value]) => `  --${group}-${name}: ${value};`,
  ),
);
writeFileSync(
  new URL("../packages/tokens/src/tokens.css", import.meta.url),
  `/* Generated from tokens.json. Run npm run tokens:build. */\n:root {\n${declarations.join("\n")}\n}\n`,
);
