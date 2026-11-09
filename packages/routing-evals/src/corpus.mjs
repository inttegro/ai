import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function isFile(path) {
  return (await stat(path).catch(() => null))?.isFile() === true;
}

function repositoryPath(root, path) {
  return relative(root, path).split(sep).join("/");
}

function frontmatter(source, path) {
  assert(source.startsWith("---\n"), `${path} must start with YAML frontmatter`);
  const end = source.indexOf("\n---\n", 4);
  assert(end >= 0, `${path} has no closing YAML frontmatter delimiter`);
  const header = source.slice(4, end);
  const name = header.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = header.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  assert(name, `${path} has no frontmatter name`);
  assert(description, `${path} has no frontmatter description`);
  return { name, description };
}

async function skillPath(root, name) {
  const pluginPath = join(root, "plugins", "inttegro", "skills", name, "SKILL.md");
  if (await isFile(pluginPath)) return pluginPath;

  const productsRoot = join(root, "products");
  const products = await readdir(productsRoot, { withFileTypes: true }).catch(() => []);
  for (const product of products) {
    if (!product.isDirectory()) continue;
    const candidate = join(productsRoot, product.name, "skills", name, "SKILL.md");
    if (await isFile(candidate)) return candidate;
  }
  throw new Error(`No skill source exists for routing unit ${name}`);
}

async function loadUnit(root, kind, name) {
  const path = kind === "skill"
    ? await skillPath(root, name)
    : join(root, "plugins", "inttegro", "agents", `${name}.md`);
  assert(await isFile(path), `No ${kind} source exists for routing unit ${name}`);
  const metadata = frontmatter(await readFile(path, "utf8"), repositoryPath(root, path));
  assert(metadata.name === name, `${repositoryPath(root, path)} names ${metadata.name}, expected ${name}`);
  return {
    kind,
    name,
    description: metadata.description,
    source: repositoryPath(root, path),
  };
}

function unitCases(kind, entry) {
  const definitions = [
    ["positive", "include", entry.should_trigger],
    ["negative", "exclude", entry.should_not_trigger],
    ["ambiguous", "include_or_clarify", entry.ambiguous],
  ];
  return definitions.flatMap(([caseType, mode, prompts]) => prompts.map((prompt, index) => ({
    id: `${kind}:${entry.name}:${caseType}:${index + 1}`,
    kind,
    case_type: caseType,
    target: entry.name,
    prompt,
    expectation: { mode, units: [entry.name] },
  })));
}

export async function loadRoutingSuite({
  root = process.cwd(),
  corpusPath = join(root, "evals", "routing.json"),
} = {}) {
  const repositoryRoot = resolve(root);
  const resolvedCorpus = resolve(corpusPath);
  const corpus = JSON.parse(await readFile(resolvedCorpus, "utf8"));
  assert(corpus.schema_version === 1, "routing corpus must use schema_version 1");
  assert(Array.isArray(corpus.skills), "routing corpus must contain skills");
  assert(Array.isArray(corpus.agents), "routing corpus must contain agents");
  assert(Array.isArray(corpus.overlap_cases), "routing corpus must contain overlap_cases");

  const units = [];
  for (const entry of corpus.skills) units.push(await loadUnit(repositoryRoot, "skill", entry.name));
  for (const entry of corpus.agents) units.push(await loadUnit(repositoryRoot, "agent", entry.name));

  const names = units.map((unit) => unit.name);
  assert(new Set(names).size === names.length, "routing unit names must be globally unique");
  const known = new Set(names);

  const cases = [
    ...corpus.skills.flatMap((entry) => unitCases("skill", entry)),
    ...corpus.agents.flatMap((entry) => unitCases("agent", entry)),
    ...corpus.overlap_cases.map((entry, index) => {
      const unknown = entry.expected.filter((name) => !known.has(name));
      assert(unknown.length === 0, `overlap case ${index + 1} references unknown units: ${unknown.join(", ")}`);
      return {
        id: `overlap:${index + 1}`,
        kind: "overlap",
        case_type: "overlap",
        target: null,
        prompt: entry.prompt,
        expectation: { mode: "exact", units: [...entry.expected] },
        reason: entry.reason,
      };
    }),
  ];

  return {
    schema_version: corpus.schema_version,
    corpus: repositoryPath(repositoryRoot, resolvedCorpus),
    units,
    cases,
  };
}
