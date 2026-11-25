// Warteg Rush — main.ts: hand-in program (Node 22, standard library only).
// Copies game/ and screenshots/ from this repository into the output
// directory, then writes dossier.json with buildDossier from
// vendor/makefun-game.ts. Deterministic: two runs write identical bytes.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to);
    } else if (entry.isFile()) {
      cpSync(from, to);
    }
  }
}

function main(): void {
  const gameSrc = join(repoRoot, "game");
  const shotsSrc = join(repoRoot, "screenshots");
  if (!existsSync(gameSrc) || !statSync(gameSrc).isDirectory()) {
    throw new Error("main.ts: game/ is missing from the repository");
  }
  if (!existsSync(shotsSrc) || !statSync(shotsSrc).isDirectory()) {
    throw new Error("main.ts: screenshots/ is missing from the repository");
  }
  // Start from a clean output directory so stale files never leak in.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  copyTree(gameSrc, join(outDir, "game"));
  copyTree(shotsSrc, join(outDir, "screenshots"));
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  if (dossier.length > 1572864) {
    throw new Error(`main.ts: dossier.json is ${dossier.length} bytes, over the 1.5 MiB gate cap`);
  }
  writeFileSync(join(outDir, "dossier.json"), dossier);
}

main();
