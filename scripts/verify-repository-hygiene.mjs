import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const run = args => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0)
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout;
};

const files = run(["ls-files", "--cached", "--others", "--exclude-standard"])
  .split("\n")
  .filter(Boolean);
const forbiddenFile =
  /(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx|sqlite|sqlite3|db|xlsx|xls|csv))$/i;
const forbiddenPathMatches = files.filter(file => forbiddenFile.test(file));
const binaryFile =
  /\.(?:png|jpe?g|gif|webp|ico|woff2?|ttf|pdf|xlsx?|zip|gz|lock)$/i;
const textFiles = files.filter(
  file =>
    !binaryFile.test(file) && file !== "scripts/verify-repository-hygiene.mjs"
);
const suspicious = [];
const secretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bBearer\s+[A-Za-z0-9._-]{30,}\b/,
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{20,}\b/,
];
const emailPattern =
  /\b[A-Z0-9._%+-]+@[A-Z][A-Z0-9-]*(?:\.[A-Z0-9-]+)*\.[A-Z]{2,63}\b/i;
// Requer o formato explícito mais comum para não confundir IDs numéricos de mídia com telefone.
const phonePattern =
  /(?:\+55[\s.-]?[1-9][0-9][\s.-]?9?[0-9]{4}[\s.-]?[0-9]{4}|\([1-9][0-9]\)[\s.-]?9?[0-9]{4}[\s.-]?[0-9]{4})/;
const documentationOnly =
  /(?:^|\/)(?:README\.md|docs\/(?:environment-contract|github-migration|operations-runbook|security-and-secrets)\.md)$/;
const piiExempt =
  /(?:^|\/)(?:package\.json|pnpm-lock\.yaml|template\.json|drizzle\/meta\/)|(?:\.test\.|\.spec\.)/;

for (const file of textFiles) {
  const content = readFileSync(resolve(file), "utf8");
  if (secretPatterns.some(pattern => pattern.test(content)))
    suspicious.push(`secret-pattern:${file}`);
  if (
    !documentationOnly.test(file) &&
    !piiExempt.test(file) &&
    (emailPattern.test(content) || phonePattern.test(content))
  ) {
    suspicious.push(`possible-pii:${file}`);
  }
}

const issues = [
  ...forbiddenPathMatches.map(file => `forbidden-file:${file}`),
  ...suspicious,
];
if (issues.length) {
  console.error("Repository hygiene check failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(
  `Repository hygiene OK: ${files.length} candidate files inspected; no forbidden exports or credential patterns found.`
);
