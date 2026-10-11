import {
  closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, rmdirSync, writeFileSync
} from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = join(root, "tools", ".tmp");
const tempRootExisted = existsSync(tempRoot);
mkdirSync(tempRoot, { recursive: true });
const tempDirectory = mkdtempSync(join(tempRoot, "verify-"));
let captureIndex = 0;

function cleanupTempDirectory() {
  rmSync(tempDirectory, { recursive: true, force: true });
  if (!tempRootExisted) {
    try { rmdirSync(tempRoot); } catch (error) { /* 保留非空目录，避免删除其他内容。 */ }
  }
}

process.once("exit", cleanupTempDirectory);

const expectedDataScripts = [
  "data/c-syntax-data.js",
  "data/learning-path.js",
  "data/entries/01-roadmap.js",
  "data/entries/05-beginner.js",
  "data/entries/03-tools.js",
  "data/entries/00-syntax.js",
  "data/entries/10-stdio.js",
  "data/entries/15-practice.js",
  "data/entries/20-stdlib.js",
  "data/entries/30-string.js",
  "data/entries/35-ctype.js",
  "data/entries/40-math.js",
  "data/entries/50-time-and-headers.js",
  "data/entries/90-pitfalls.js",
  "data/exercises/10-basics.js",
  "data/exercises/20-advanced.js",
  "data/exercises/30-stdio-and-more.js",
  "data/exercises/40-more-functions.js",
  "data/exercises/50-wengkai.js",
  "data/keywords.generated.js"
];
const baseFiles = ["index.html", "styles.css", "app.js", "chat.js", "tools/verify.mjs",
  "tools/build-keywords.mjs", "tools/verify-exercises.mjs", "README.md"];
const categories = [
  "入门基础", "实战运用", "工具与环境",
  "基础语法", "数据类型", "运算符", "流程控制", "函数", "数组与字符串", "指针",
  "结构体·联合·枚举", "内存管理", "预处理", "标准库函数", "文件 IO", "常见易错点"
];
const allowedHosts = [
  "https://api.deepseek.com",
  "https://platform.deepseek.com",
  "https://api-docs.deepseek.com",
  "https://www.bilibili.com",
  "https://space.bilibili.com",
  "https://www.internetdownloadmanager.com",
  "https://www.embarcadero.com",
  "https://github.com",
  "https://code.visualstudio.com",
  "https://visualstudio.microsoft.com",
  "https://www.mingw-w64.org",
  "https://www.msys2.org",
  "https://marketplace.visualstudio.com",
  "https://winlibs.com",
  "https://leetcode.cn",
  "https://www.luogu.com.cn"
];
const allowedHostSet = new Set(allowedHosts);
function isAllowedExternalUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && allowedHostSet.has(parsed.origin);
  } catch (error) {
    return false;
  }
}
const allowedHeaders = new Set([
  "assert.h", "complex.h", "ctype.h", "errno.h", "fenv.h", "float.h", "inttypes.h",
  "iso646.h", "limits.h", "locale.h", "math.h", "setjmp.h", "signal.h", "stdalign.h",
  "stdarg.h", "stdatomic.h", "stdbool.h", "stddef.h", "stdint.h", "stdio.h", "stdlib.h",
  "stdnoreturn.h", "string.h", "tgmath.h", "threads.h", "time.h", "uchar.h", "wchar.h", "wctype.h"
]);
let failures = 0;
let skippedExamples = 0;

function pass(message) { console.log(`PASS ${message}`); }
function fail(message) { failures += 1; console.log(`FAIL ${message}`); }
function check(condition, message, detail = "") {
  if (condition) pass(message);
  else fail(`${message}${detail ? `：${detail}` : ""}`);
}

function balancedCssBody(source, openBraceIndex) {
  let depth = 0;
  let quote = "";
  let inComment = false;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (inComment) {
      if (character === "*" && next === "/") { inComment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (character === "\\") { index += 1; continue; }
      if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "*") { inComment = true; index += 1; continue; }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === "{") depth += 1;
    if (character === "}" && (depth -= 1) === 0) {
      return { body: source.slice(openBraceIndex + 1, index), end: index };
    }
  }
  return null;
}

function cssBlocks(source, openingPattern) {
  const pattern = new RegExp(openingPattern.source, openingPattern.flags.includes("g") ? openingPattern.flags : `${openingPattern.flags}g`);
  const blocks = [];
  for (const match of source.matchAll(pattern)) {
    const openBraceIndex = source.indexOf("{", match.index);
    const block = balancedCssBody(source, openBraceIndex);
    if (block) blocks.push({ header: match[0].slice(0, match[0].lastIndexOf("{")).trim(), ...block });
  }
  return blocks;
}

function topLevelCssRules(source) {
  const rules = [];
  let cursor = 0;
  while (cursor < source.length) {
    while (/\s/.test(source[cursor] || "")) cursor += 1;
    if (source.startsWith("/*", cursor)) {
      const commentEnd = source.indexOf("*/", cursor + 2);
      cursor = commentEnd === -1 ? source.length : commentEnd + 2;
      continue;
    }
    if (cursor >= source.length) break;
    const openBraceIndex = source.indexOf("{", cursor);
    if (openBraceIndex === -1) return { rules, remainder: source.slice(cursor).trim() };
    const block = balancedCssBody(source, openBraceIndex);
    if (!block) return { rules, remainder: source.slice(cursor).trim() };
    rules.push({ selector: source.slice(cursor, openBraceIndex).trim(), body: block.body });
    cursor = block.end + 1;
  }
  return { rules, remainder: "" };
}

function customPropertyMap(source) {
  const properties = {};
  const cleanSource = source.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const declaration of cleanSource.split(";")) {
    const match = declaration.trim().match(/^(--[\w-]+)\s*:\s*(.+)$/s);
    if (match) properties[match[1]] = match[2].trim();
  }
  return properties;
}

function onlyCustomPropertyDeclarations(source) {
  const cleanSource = source.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (/[{}]/.test(cleanSource)) return false;
  return cleanSource.split(";").every(declaration => {
    const value = declaration.trim();
    return !value || /^--[\w-]+\s*:\s*.+$/s.test(value);
  });
}

function relativeLuminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return NaN;
  const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  if (!Number.isFinite(firstLuminance) || !Number.isFinite(secondLuminance)) return NaN;
  return (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function cssColorTokens(value) {
  const tokens = [];
  for (const match of String(value || "").matchAll(/#[0-9a-f]{6}\b|rgba?\([^)]*\)/gi)) {
    const token = match[0];
    let channels;
    if (token.startsWith("#")) {
      channels = token.slice(1).match(/../g).map(channel => parseInt(channel, 16));
    } else {
      const parts = token.slice(token.indexOf("(") + 1, -1).split(",").map(part => part.trim());
      channels = parts.slice(0, 3).map(Number);
    }
    if (channels.length === 3 && channels.every(channel => Number.isFinite(channel) && channel >= 0 && channel <= 255)) {
      tokens.push({ token, channels });
    }
  }
  return tokens;
}

function runCommand(command, args) {
  const outputPath = join(tempDirectory, `subprocess-${captureIndex += 1}.log`);
  let descriptor;
  let result;
  let executionError;
  try {
    descriptor = openSync(outputPath, "w");
    result = spawnSync(command, args, { stdio: ["ignore", descriptor, descriptor], windowsHide: true });
  } catch (error) {
    executionError = error;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
  const output = existsSync(outputPath) ? readFileSync(outputPath, "utf8").trim() : "";
  rmSync(outputPath, { force: true });
  return { result: result || { status: null, error: executionError }, output };
}

function spawnErrorDetail(error) { return `${error.code || "UNKNOWN"}: ${error.message}`; }

function executablePath(command) {
  if (/[\\/]/.test(command)) return command;
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";") : [""];
  for (const directory of (process.env.PATH || "").split(delimiter)) {
    const cleanDirectory = directory.replace(/^"|"$/g, "");
    if (!cleanDirectory) continue;
    for (const extension of extensions) {
      const candidate = join(cleanDirectory, `${command}${extension.toLocaleLowerCase()}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return command;
}

function findCompiler() {
  const candidates = [
    { label: "CC", command: process.env.CC && process.env.CC.trim() },
    { label: "gcc", command: "gcc" },
    { label: "cc", command: "cc" },
    { label: "预设 MinGW", command: "D:\\software\\environment\\mingw64\\bin\\gcc.exe" }
  ];
  const diagnostics = [];
  for (const candidate of candidates) {
    if (!candidate.command) { diagnostics.push(`${candidate.label}：未设置`); continue; }
    const execution = runCommand(candidate.command, ["--version"]);
    if (execution.result.error) {
      diagnostics.push(`${candidate.label} (${candidate.command})：无法执行，${spawnErrorDetail(execution.result.error)}`);
      continue;
    }
    if (execution.result.status !== 0) {
      diagnostics.push(`${candidate.label} (${candidate.command})：退出码 ${execution.result.status}${execution.output ? `，${execution.output}` : ""}`);
      continue;
    }
    return { command: candidate.command, display: executablePath(candidate.command), diagnostics };
  }
  return { command: "", display: "", diagnostics };
}

for (const file of baseFiles) check(existsSync(join(root, file)), `交付文件存在：${file}`);

let indexSource = "";
let dataScripts = [];
try {
  indexSource = readFileSync(join(root, "index.html"), "utf8");
  const scriptPattern = /<script\b[^>]*\bsrc\s*=\s*["'](data\/[^"']+)["'][^>]*><\/script>/gi;
  dataScripts = [...indexSource.matchAll(scriptPattern)].map(match => match[1]);
  check(JSON.stringify(dataScripts) === JSON.stringify(expectedDataScripts),
    "index.html 按固定顺序加载全部数据脚本", dataScripts.join(" -> "));
  check(dataScripts.includes("data/entries/03-tools.js"), "index.html 已加载工具与网课词条脚本 data/entries/03-tools.js");
  const headerSource = indexSource.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  const headerAnchors = [...headerSource.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map(match => match[0]);
  const hasHeaderCourseButton = (url, label) => headerAnchors.some(anchor => {
    const href = anchor.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    const rel = (anchor.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] || "").toLowerCase().split(/\s+/);
    const text = anchor.replace(/<[^>]+>/g, "");
    return href === url && /\btarget\s*=\s*["']_blank["']/i.test(anchor) &&
      rel.includes("noopener") && rel.includes("noreferrer") && text.includes(label);
  });
  check(hasHeaderCourseButton("https://www.bilibili.com/video/BV1Ls411w7rx/", "浙大翁恺"),
    "页头含浙大翁恺网课按钮及规范地址、target=_blank 与安全 rel");
  check(hasHeaderCourseButton("https://space.bilibili.com/535834809", "山大陈千"),
    "页头含山大陈千网课按钮及规范地址、target=_blank 与安全 rel");
  const practiceSource = indexSource.match(/<section\b[^>]*\bclass\s*=\s*["'][^"']*\bpractice-sites\b[^"']*["'][^>]*>[\s\S]*?<\/section>/i)?.[0] || "";
  const practiceOpeningTag = practiceSource.match(/^<section\b[^>]*>/i)?.[0] || "";
  const practiceAnchors = [...practiceSource.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map(match => match[0]);
  const hasPracticeButton = (url, label) => practiceAnchors.some(anchor => {
    const href = anchor.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    const rel = (anchor.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] || "").toLowerCase().split(/\s+/);
    const text = anchor.replace(/<[^>]+>/g, "");
    return href === url && /\btarget\s*=\s*["']_blank["']/i.test(anchor) &&
      rel.includes("noopener") && rel.includes("noreferrer") && text.includes(label);
  });
  check(Boolean(practiceSource) && !/\bhidden\b/i.test(practiceOpeningTag),
    "侧栏在线刷题窗口存在且默认展开");
  check(hasPracticeButton("https://leetcode.cn/", "LeetCode 刷题") &&
    hasPracticeButton("https://www.luogu.com.cn/", "洛谷刷题"),
  "在线刷题窗口含两个规范地址、target=_blank 与安全 rel 按钮");
} catch (error) {
  fail(`解析 index.html 数据脚本：${error.message}`);
}

for (const file of expectedDataScripts) check(existsSync(join(root, file)), `数据文件存在：${file}`);

for (const file of ["app.js", "chat.js", "tools/verify.mjs", "tools/build-keywords.mjs",
  "tools/verify-exercises.mjs", "data/keyword-concepts.js"].concat(dataScripts)) {
  if (!existsSync(join(root, file))) continue;
  const execution = runCommand(process.execPath, ["--check", join(root, file)]);
  if (execution.result.error) fail(`无法执行 JavaScript 语法检查：${file}：${spawnErrorDetail(execution.result.error)}`);
  else check(execution.result.status === 0 && !execution.output, `JavaScript 语法检查：${file}`,
    execution.output || `退出码 ${execution.result.status}`);
}

let entries = [];
let exercises = [];
let keywordTable = null;
let learningPath = null;
const entrySourceFiles = new Map();
try {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of dataScripts) {
    if (!existsSync(join(root, file))) continue;
    const beforeCount = Array.isArray(context.window.C_SYNTAX_ENTRIES)
      ? context.window.C_SYNTAX_ENTRIES.length : 0;
    vm.runInContext(readFileSync(join(root, file), "utf8"), context, { filename: file });
    const loadedEntries = Array.isArray(context.window.C_SYNTAX_ENTRIES)
      ? context.window.C_SYNTAX_ENTRIES.slice(beforeCount) : [];
    for (const entry of loadedEntries) entrySourceFiles.set(entry.id, file);
  }
  entries = context.window.C_SYNTAX_ENTRIES;
  exercises = context.window.C_SYNTAX_EXERCISES;
  keywordTable = context.window.C_SYNTAX_KEYWORDS || null;
  learningPath = context.window.C_SYNTAX_LEARNING_PATH || null;
  check(Array.isArray(entries), `按页面顺序加载数据脚本并导出数组（${dataScripts.length} 个脚本）`);
} catch (error) {
  fail(`按 index.html 顺序加载词条数据：${error.stack || error.message}`);
}

if (!Array.isArray(entries)) entries = [];
if (!Array.isArray(exercises)) exercises = [];
check(entries.length >= 92, `词条总数不少于 92（实际 ${entries.length}）`);

const ids = new Set();
const duplicateIds = [];
for (const entry of entries) {
  if (ids.has(entry.id)) duplicateIds.push(entry.id);
  ids.add(entry.id);
}
check(duplicateIds.length === 0, "词条 id 全局唯一", duplicateIds.join(", "));

// ---------------- 学习顺序与路线图 ----------------
const stages = learningPath && Array.isArray(learningPath.stages) ? learningPath.stages : [];
check(dataScripts.includes("data/learning-path.js") && learningPath && stages.length >= 8,
  `学习路径脚本已加载并导出至少 8 个阶段（实际 ${stages.length} 个）`);

const pathPatternMatches = (entryId, pattern) => pattern === "*" ||
  (typeof pattern === "string" && (entryId === pattern || entryId.startsWith(pattern)));
const stagePatternErrors = [];
for (const [stageIndex, stage] of stages.entries()) {
  const patterns = Array.isArray(stage.match) ? stage.match : [];
  if (!patterns.length) stagePatternErrors.push(`第 ${stageIndex + 1} 阶段没有 match 模式`);
  for (const pattern of patterns) {
    const hits = entries.filter(entry => pathPatternMatches(entry.id, pattern));
    if (!hits.length) stagePatternErrors.push(`${stage.id || `stage-${stageIndex + 1}`}: ${String(pattern)}`);
  }
}
const coveredEntryCount = entries.filter(entry => stages.some(stage =>
  Array.isArray(stage.match) && stage.match.some(pattern => pathPatternMatches(entry.id, pattern)))).length;
console.log(`INFO 学习顺序覆盖 ${coveredEntryCount}/${entries.length}`);
check(coveredEntryCount === entries.length && stagePatternErrors.length === 0,
  `学习阶段覆盖 ${coveredEntryCount}/${entries.length}，且每个 match 模式至少命中 1 条真实词条`,
  stagePatternErrors.join("；"));
const expectedSetupMatches = [
  "learning-roadmap", "course-zju-wengkai", "course-sdu-chenqian", "install-dev-cpp", "install-vscode", "install-visual-studio", "install-idm", "site-leetcode", "site-luogu"
];
check(stages[0] && stages[0].id === "stage-setup" &&
  JSON.stringify(stages[0].match) === JSON.stringify(expectedSetupMatches) &&
  typeof stages[0].title === "string" && stages[0].title.includes("刷题"),
"第 0 阶段按约定覆盖路线图、两门网课、四个工具与两个刷题网站，且标题含“刷题”",
stages[0] ? `${stages[0].id}: ${(stages[0].match || []).join(" -> ")}` : "缺少首阶段");

const roadmap = learningPath && learningPath.roadmap;
const roadmapNodes = roadmap && Array.isArray(roadmap.nodes) ? roadmap.nodes : [];
const roadmapEdges = roadmap && Array.isArray(roadmap.edges) ? roadmap.edges : [];
const roadmapNodeIds = new Set(roadmapNodes.map(node => node.id));
const roadmapErrors = [];
if (roadmapNodes.length < 8) roadmapErrors.push(`节点不足 8 个（实际 ${roadmapNodes.length}）`);
for (const node of roadmapNodes) {
  if (!ids.has(node.entryId)) roadmapErrors.push(`节点 ${node.id} 的 entryId 不存在：${node.entryId}`);
}
for (const edge of roadmapEdges) {
  if (!roadmapNodeIds.has(edge.from)) roadmapErrors.push(`连线起点不存在：${edge.from}`);
  if (!roadmapNodeIds.has(edge.to)) roadmapErrors.push(`连线终点不存在：${edge.to}`);
}
check(roadmapErrors.length === 0, `路线图节点不少于 8 个且节点、连线引用有效（实际 ${roadmapNodes.length} 个节点）`,
  roadmapErrors.join("；"));

const roadmapEntry = entries.find(entry => entry.id === "learning-roadmap");
const firstStageMatches = stages[0] && Array.isArray(stages[0].match) ? stages[0].match : [];
check(Boolean(roadmapEntry) && roadmapEntry.category === "入门基础" && firstStageMatches[0] === "learning-roadmap",
  "learning-roadmap 属于入门基础，并位于第 1 阶段第 1 位",
  roadmapEntry ? `category=${roadmapEntry.category}；首项=${firstStageMatches[0] || "缺失"}` : "词条不存在");
const zjuCourseIndex = firstStageMatches.indexOf("course-zju-wengkai");
const chenQianCourseIndex = firstStageMatches.indexOf("course-sdu-chenqian");
check(stages[0]?.id === "stage-setup" && zjuCourseIndex >= 0 && chenQianCourseIndex === zjuCourseIndex + 1,
  "山大陈千网课位于第 0 阶段，并紧跟浙大翁恺网课之后",
  firstStageMatches.join(" -> "));

const expectedBeginnerIds = [
  "what-is-c", "program-lifecycle", "first-program", "how-to-compile", "compile-error-reading",
  "link-error-reading", "variables-and-types-intro", "naming-rules", "statements-and-blocks",
  "printf-format-basics", "comments-and-style", "debug-print", "common-first-week-errors",
  "how-to-practice", "reading-docs"
];
const actualBeginnerIds = entries.filter(entry => entrySourceFiles.get(entry.id) === "data/entries/05-beginner.js")
  .map(entry => entry.id);
check(JSON.stringify(actualBeginnerIds) === JSON.stringify(expectedBeginnerIds),
  "入门基础 15 条按约定学习顺序排列", actualBeginnerIds.join(" -> "));

const categoryCounts = Object.fromEntries(categories.map(category => [category, 0]));
const unknownCategories = new Set();
for (const entry of entries) {
  if (Object.hasOwn(categoryCounts, entry.category)) categoryCounts[entry.category] += 1;
  else unknownCategories.add(entry.category);
}
for (const category of categories) {
  const minimum = category === "工具与环境" ? 8 : 3;
  check(categoryCounts[category] >= minimum,
    `分类“${category}”至少 ${minimum} 条（实际 ${categoryCounts[category]}）`);
}
check(unknownCategories.size === 0, "没有未知分类", [...unknownCategories].join(", "));

const chenQianCourse = entries.find(entry => entry.id === "course-sdu-chenqian");
check(Boolean(chenQianCourse) && chenQianCourse.category === "工具与环境" &&
  Array.isArray(chenQianCourse.links) && chenQianCourse.links.some(link =>
    link && link.url === "https://space.bilibili.com/535834809"),
  "山大陈千网课词条存在、归入工具与环境且使用规范主页地址",
  chenQianCourse ? `category=${chenQianCourse.category}` : "词条不存在");

for (const [entryId, expectedUrl] of [
  ["site-leetcode", "https://leetcode.cn/"],
  ["site-luogu", "https://www.luogu.com.cn/"]
]) {
  const practiceEntry = entries.find(entry => entry.id === entryId);
  check(Boolean(practiceEntry) && practiceEntry.category === "工具与环境" &&
    Array.isArray(practiceEntry.links) && practiceEntry.links.some(link =>
      link && link.url === expectedUrl && isAllowedExternalUrl(link.url)),
  `${entryId} 词条存在、归入工具与环境且链接位于白名单`,
  practiceEntry ? `category=${practiceEntry.category}` : "词条不存在");
}

const schemaErrors = [];
const headerErrors = [];
const usageErrors = [];
const noteErrors = [];
const includeErrors = [];
const relatedErrors = [];
const linkErrors = [];
let entriesWithLinks = 0;
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const [index, entry] of entries.entries()) {
  const label = entry && entry.id ? entry.id : `索引 ${index}`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    schemaErrors.push(`${label}: 不是对象`);
    continue;
  }
  for (const field of ["id", "name", "category", "summary", "syntax", "usage", "example"]) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) schemaErrors.push(`${label}: ${field} 为空或类型错误`);
  }
  if (!idPattern.test(entry.id || "")) schemaErrors.push(`${label}: id 不是英文小写短横线格式`);
  if (!/[\u3400-\u9fff]/u.test(entry.summary || "")) schemaErrors.push(`${label}: summary 缺少中文说明`);
  for (const field of ["aliases", "headers", "notes", "related"]) {
    if (!Array.isArray(entry[field]) || entry[field].some(value => typeof value !== "string")) {
      schemaErrors.push(`${label}: ${field} 必须是字符串数组`);
    }
  }
  if (Object.hasOwn(entry, "links")) {
    if (!Array.isArray(entry.links)) {
      linkErrors.push(`${label}: links 必须是数组`);
    } else {
      if (entry.links.length) entriesWithLinks += 1;
      entry.links.forEach((link, linkIndex) => {
        const itemLabel = `${label}: links[${linkIndex}]`;
        if (!link || typeof link !== "object" || Array.isArray(link)) {
          linkErrors.push(`${itemLabel} 必须是对象`);
          return;
        }
        if (typeof link.label !== "string" || !link.label.trim() || link.label.length > 20 ||
            !/[\u3400-\u9fff]/u.test(link.label)) {
          linkErrors.push(`${itemLabel}.label 必须含中文、非空且不超过 20 字`);
        }
        if (typeof link.url !== "string" || !isAllowedExternalUrl(link.url)) {
          linkErrors.push(`${itemLabel}.url 不在外链白名单：${String(link.url)}`);
        }
      });
    }
  }

  if (!Array.isArray(entry.headers)) headerErrors.push(`${label}: headers 不是数组`);
  else {
    const invalid = entry.headers.filter(header => !allowedHeaders.has(header));
    if (invalid.length) headerErrors.push(`${label}: 非 C11 标准头 ${invalid.join(", ")}`);
    if (new Set(entry.headers).size !== entry.headers.length) headerErrors.push(`${label}: headers 存在重复值`);
  }

  if (typeof entry.usage !== "string" || entry.usage.trim().length < 20 || !/[\u3400-\u9fff]/u.test(entry.usage)) {
    usageErrors.push(`${label}: usage 必须含中文且不少于 20 字符（实际 ${typeof entry.usage === "string" ? entry.usage.trim().length : 0}）`);
  }
  if (!Array.isArray(entry.notes) || entry.notes.length < 3) noteErrors.push(`${label}: notes 少于 3 条`);
  else entry.notes.forEach((note, noteIndex) => {
    if (typeof note !== "string" || note.trim().length < 10) noteErrors.push(`${label}: notes[${noteIndex}] 少于 10 字符`);
  });

  if (!(entry.example || "").includes("int main(void)") || !(entry.example || "").includes("return 0;")) {
    schemaErrors.push(`${label}: example 不是包含 main 与 return 0 的完整程序`);
  }
  const exampleHeaders = [...(entry.example || "").matchAll(/^\s*#include\s*<([^>]+)>/gm)].map(match => match[1]);
  const declaredHeaders = Array.isArray(entry.headers) ? entry.headers : [];
  const actualSet = [...new Set(exampleHeaders)].sort();
  const declaredSet = [...new Set(declaredHeaders)].sort();
  if (JSON.stringify(actualSet) !== JSON.stringify(declaredSet)) {
    includeErrors.push(`${label}: headers=[${declaredSet.join(", ")}], example=[${actualSet.join(", ")}]`);
  }
}
check(schemaErrors.length === 0, "所有词条基础字段齐全且类型正确", schemaErrors.join("；"));
check(headerErrors.length === 0, "所有词条 headers 均为去重后的 C11 标准头文件数组", headerErrors.join("；"));
check(usageErrors.length === 0, "所有词条 usage 均含中文且不少于 20 字符", usageErrors.join("；"));
check(noteErrors.length === 0, "所有词条 notes 至少 3 条且每条不少于 10 字符", noteErrors.join("；"));
check(includeErrors.length === 0,
  `全部 ${entries.length} 条词条的 headers 与 example 中 #include 集合完全一致`, includeErrors.join("；"));
console.log(`INFO 带 links 的词条数：${entriesWithLinks}`);
check(linkErrors.length === 0 && entriesWithLinks >= 5,
  `links 字段均为有效数组，标签含中文且不超过 20 字，URL 位于白名单（${entriesWithLinks} 条词条）`,
  linkErrors.join("；"));

const behaviorErrorsByFile = new Map(expectedDataScripts.filter(file => file.startsWith("data/entries/"))
  .map(file => [file, []]));
const chinesePattern = /[\u3400-\u9fff]/u;
for (const entry of entries) {
  const file = entrySourceFiles.get(entry.id) || "未知来源";
  if (!behaviorErrorsByFile.has(file)) behaviorErrorsByFile.set(file, []);
  if (typeof entry.behavior !== "string") {
    behaviorErrorsByFile.get(file).push(`${entry.id}: 缺失或不是字符串`);
    continue;
  }
  const behavior = entry.behavior.trim();
  const errors = [];
  if (behavior.length < 50) errors.push(`少于 50 字符（实际 ${behavior.length}）`);
  if (!chinesePattern.test(behavior)) errors.push("不含中文");
  if (errors.length) behaviorErrorsByFile.get(file).push(`${entry.id}: ${errors.join("、")}`);
}
for (const [file, errors] of behaviorErrorsByFile) {
  check(errors.length === 0, `${file} 的 behavior 均为含中文且不少于 50 字符的字符串`, errors.join("；"));
}

// “=”排除变量初始化中的函数调用，“[]{}”排除数组边界表达式和类型定义中的伪命中。
const functionSyntaxPattern = /\b(void|char|short|int|long|float|double|size_t|ssize_t|FILE|bool|_Bool|unsigned|signed)\b[^;()=\[\]{}]*\*?\s*[A-Za-z_]\w*\s*\(/;
const functionEntries = entries.filter(entry => functionSyntaxPattern.test(entry.syntax || ""));
console.log(`INFO behavior 函数类判定命中 ${functionEntries.length} 条`);
const returnErrorsByFile = new Map();
const shortFunctionBehaviors = [];
for (const entry of functionEntries) {
  const file = entrySourceFiles.get(entry.id) || "未知来源";
  if (!returnErrorsByFile.has(file)) returnErrorsByFile.set(file, []);
  const behavior = typeof entry.behavior === "string" ? entry.behavior.trim() : "";
  if (!behavior.includes("返回")) returnErrorsByFile.get(file).push(entry.id);
  if (behavior && behavior.length < 80) shortFunctionBehaviors.push(`${entry.id}(${behavior.length})`);
}
for (const [file, idsWithoutReturn] of returnErrorsByFile) {
  check(idsWithoutReturn.length === 0, `${file} 的函数类 behavior 均包含“返回”`, idsWithoutReturn.join(", "));
}
if (shortFunctionBehaviors.length) {
  console.log(`WARN 函数类 behavior 建议不少于 80 字符：${shortFunctionBehaviors.join(", ")}`);
} else {
  pass("所有已有 behavior 的函数类词条均不少于建议的 80 字符");
}

const behaviorOwners = new Map();
for (const entry of entries) {
  if (typeof entry.behavior !== "string" || !entry.behavior.trim()) continue;
  const text = entry.behavior.trim();
  if (!behaviorOwners.has(text)) behaviorOwners.set(text, []);
  behaviorOwners.get(text).push(entry.id);
}
const duplicateBehaviors = [...behaviorOwners.entries()]
  .filter(([, ownerIds]) => ownerIds.length > 1)
  .map(([text, ownerIds]) => `“${text}” -> ${ownerIds.join(", ")}`);
check(duplicateBehaviors.length === 0, "所有已有 behavior 全局唯一", duplicateBehaviors.join("；"));

const summariesAndUsages = new Map();
for (const entry of entries) {
  for (const field of ["summary", "usage"]) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) continue;
    const text = entry[field].trim();
    if (!summariesAndUsages.has(text)) summariesAndUsages.set(text, []);
    summariesAndUsages.get(text).push(`${entry.id}.${field}`);
  }
}
const copiedBehaviorErrors = [];
for (const [text, ownerIds] of behaviorOwners) {
  if (summariesAndUsages.has(text)) {
    copiedBehaviorErrors.push(`${ownerIds.join(", ")} 与 ${summariesAndUsages.get(text).join(", ")} 相同`);
  }
}
check(copiedBehaviorErrors.length === 0, "behavior 不与任何 summary 或 usage 原文相同",
  copiedBehaviorErrors.join("；"));

const bannedBehaviorPhrases = ["适合在", "相关场景中使用", "本条语法用于", "前置条件"];
const templatedBehaviorErrors = [];
for (const entry of entries) {
  if (typeof entry.behavior !== "string") continue;
  const hits = bannedBehaviorPhrases.filter(phrase => entry.behavior.includes(phrase));
  if (hits.length) templatedBehaviorErrors.push(`${entry.id}: ${hits.join("、")}`);
}
check(templatedBehaviorErrors.length === 0, "behavior 不含空泛模板句", templatedBehaviorErrors.join("；"));

const usageOwners = new Map();
for (const entry of entries) {
  if (typeof entry.usage !== "string") continue;
  const text = entry.usage.trim();
  if (!text) continue;
  if (!usageOwners.has(text)) usageOwners.set(text, []);
  usageOwners.get(text).push(entry.id);
}
const duplicateUsages = [...usageOwners.entries()]
  .filter(([, ownerIds]) => ownerIds.length > 1)
  .map(([text, ownerIds]) => `“${text}” -> ${ownerIds.join(", ")}`);
check(duplicateUsages.length === 0, "所有词条 usage 两两不同",
  duplicateUsages.join("；"));

const noteOwners = new Map();
for (const entry of entries) {
  if (!Array.isArray(entry.notes)) continue;
  for (const note of entry.notes) {
    if (typeof note !== "string") continue;
    const text = note.trim();
    if (!text) continue;
    if (!noteOwners.has(text)) noteOwners.set(text, new Set());
    noteOwners.get(text).add(entry.id);
  }
}
const duplicateNotes = [...noteOwners.entries()]
  .filter(([, ownerIds]) => ownerIds.size > 1)
  .slice(0, 10)
  .map(([text, ownerIds]) => `“${text}” -> ${[...ownerIds].join(", ")}`);
check(duplicateNotes.length === 0, "notes 不含跨词条重复模板句（最多显示 10 条）",
  duplicateNotes.join("；"));

const syntaxCategories = new Set([
  "基础语法", "数据类型", "运算符", "流程控制", "函数", "数组与字符串", "指针",
  "结构体·联合·枚举", "内存管理", "预处理", "常见易错点"
]);
const stdioUsePattern = /\b(?:printf|fprintf|sprintf|snprintf|puts|fputs|putchar|putc|fputc|getchar|getc|fgetc|scanf|fscanf|sscanf|fgets|fopen|fclose|FILE|EOF|perror|fflush|fread|fwrite|fseek|ftell|rewind)\b/;
const unjustifiedStdioHeaders = entries
  .filter(entry => syntaxCategories.has(entry.category) && Array.isArray(entry.headers) &&
    entry.headers.includes("stdio.h") && !stdioUsePattern.test(entry.example || ""))
  .map(entry => entry.id);
check(unjustifiedStdioHeaders.length === 0,
  "语法类词条声明 stdio.h 时，示例确实使用 stdio 函数、宏或类型",
  unjustifiedStdioHeaders.join(", "));

for (const entry of entries) {
  if (!Array.isArray(entry.related)) continue;
  for (const relatedId of entry.related) if (!ids.has(relatedId)) relatedErrors.push(`${entry.id} -> ${relatedId}`);
}
check(relatedErrors.length === 0, "related 引用全部存在", relatedErrors.join("；"));

// ---------------- 练习题数据 ----------------
const exerciseErrors = [];
const exerciseIds = new Set();
const duplicateExerciseIds = [];
const exerciseIdPattern = /^ex-[a-z0-9]+(?:-[a-z0-9]+)*$/;
let emptyExpectedOutputCount = 0;
const tmpfileExerciseIds = [];
const crlfExpectedOutputExerciseIds = [];
for (const [index, exercise] of exercises.entries()) {
  const label = exercise && exercise.id ? exercise.id : `练习索引 ${index}`;
  if (!exercise || typeof exercise !== "object" || Array.isArray(exercise)) {
    exerciseErrors.push(`${label}: 不是对象`);
    continue;
  }
  if (exerciseIds.has(exercise.id)) duplicateExerciseIds.push(exercise.id);
  exerciseIds.add(exercise.id);
  if (!exerciseIdPattern.test(exercise.id || "")) exerciseErrors.push(`${label}: id 必须以 ex- 开头并使用小写短横线`);
  for (const field of ["title", "prompt", "starter", "solution", "explanation"]) {
    if (typeof exercise[field] !== "string" || !exercise[field].trim()) exerciseErrors.push(`${label}: ${field} 为空或类型错误`);
  }
  if (typeof exercise.title === "string" && exercise.title.length > 18) exerciseErrors.push(`${label}: title 超过 18 字`);
  for (const field of ["prompt", "explanation"]) {
    const value = typeof exercise[field] === "string" ? exercise[field].trim() : "";
    if (value.length < 20 || !chinesePattern.test(value)) exerciseErrors.push(`${label}: ${field} 必须含中文且不少于 20 字符`);
  }
  if (!Array.isArray(exercise.entryIds) || exercise.entryIds.length < 1 || exercise.entryIds.length > 3 ||
      exercise.entryIds.some(entryId => typeof entryId !== "string")) {
    exerciseErrors.push(`${label}: entryIds 必须是含 1–3 个字符串的数组`);
  } else {
    const missing = exercise.entryIds.filter(entryId => !ids.has(entryId));
    if (missing.length) exerciseErrors.push(`${label}: entryIds 不存在 ${missing.join(", ")}`);
  }
  if (![1, 2, 3].includes(exercise.difficulty)) exerciseErrors.push(`${label}: difficulty 必须是 1、2 或 3`);
  for (const [field, minimum] of [["requirements", 3], ["hints", 2]]) {
    const list = exercise[field];
    if (!Array.isArray(list) || list.length < minimum || list.some(value => typeof value !== "string" || !value.trim())) {
      exerciseErrors.push(`${label}: ${field} 必须是至少 ${minimum} 项的非空字符串数组`);
    }
  }
  if (typeof exercise.solution !== "string" || !exercise.solution.includes("int main(void)")) {
    exerciseErrors.push(`${label}: solution 必须包含 int main(void)`);
  }
  if ([exercise.solution, exercise.starter].some(source => typeof source === "string" && source.includes("tmpfile("))) {
    tmpfileExerciseIds.push(label);
  }
  if (typeof exercise.expectedOutput !== "string") exerciseErrors.push(`${label}: expectedOutput 必须是字符串`);
  else {
    if (exercise.expectedOutput === "") emptyExpectedOutputCount += 1;
    if (exercise.expectedOutput.includes("\r")) crlfExpectedOutputExerciseIds.push(label);
  }
}
check(duplicateExerciseIds.length === 0, "练习 id 全局唯一", duplicateExerciseIds.join(", "));
check(exerciseErrors.length === 0, `全部 ${exercises.length} 道练习字段与关联关系合规`, exerciseErrors.slice(0, 12).join("；"));
check(tmpfileExerciseIds.length === 0,
  "练习未使用平台相关的 tmpfile()（请改用当前目录临时文件 + remove）",
  `练习 id：${tmpfileExerciseIds.join("、")}`);
check(crlfExpectedOutputExerciseIds.length === 0,
  "练习 expectedOutput 统一使用 LF（不含 \\r）",
  `练习 id：${crlfExpectedOutputExerciseIds.join("、")}`);
check(exercises.length >= 90, `练习总数不少于 90（实际 ${exercises.length}）`);
const exercisedEntryIds = new Set(exercises.flatMap(exercise => Array.isArray(exercise.entryIds) ? exercise.entryIds : []));
check(exercisedEntryIds.size >= 105, `有练习覆盖的词条数不少于 105（实际 ${exercisedEntryIds.size}）`);
const invalidExerciseEntryIds = exercises.flatMap(exercise =>
  (Array.isArray(exercise.entryIds) ? exercise.entryIds : [])
    .filter(entryId => !ids.has(entryId)).map(entryId => `${exercise.id} -> ${entryId}`));
check(invalidExerciseEntryIds.length === 0, "全部练习 entryIds 均引用真实词条", invalidExerciseEntryIds.join("；"));
const requiredExerciseEntryNames = [
  "scanf", "getchar", "putchar", "puts", "sprintf", "fopen", "fgetc", "fputc",
  "strncpy", "memcpy", "memset", "union", "atoi", "rand", "NULL"
];
const uncoveredRequiredNames = [];
for (const requiredName of requiredExerciseEntryNames) {
  const matches = entries.filter(entry => entry.name === requiredName || entry.name.startsWith(`${requiredName} `));
  if (!matches.length) {
    console.log(`SKIP 点名词条不存在：${requiredName}`);
    continue;
  }
  if (!matches.some(entry => exercisedEntryIds.has(entry.id))) uncoveredRequiredNames.push(requiredName);
}
check(uncoveredRequiredNames.length === 0,
  "用户点名的高频词条均至少有一道练习", uncoveredRequiredNames.join("、"));
console.log(`INFO 有练习的词条数：${exercisedEntryIds.size} / ${entries.length}；expectedOutput 为空：${emptyExpectedOutputCount} 道`);
const exerciseVerifierSource = readFileSync(join(root, "tools", "verify-exercises.mjs"), "utf8");
check(/stdio:\s*\["ignore", stdoutDescriptor, stderrDescriptor\]/.test(exerciseVerifierSource) &&
  /join\(root, "tools", "\.tmp"\)/.test(exerciseVerifierSource) && /normalizeNewlines/.test(exerciseVerifierSource),
"练习运行验证使用文件描述符捕获、项目内 tools/.tmp 并统一换行后逐字节比较");

// 外部地址白名单：只允许 DeepSeek、指定网课与工具官方域名，其它任何外链都算违规。
// 这些普通链接不等于网络请求；只有 chat.js 可向 CHAT_CONFIG.endpoint 发起 fetch/XHR。
const scannedFiles = ["index.html", "styles.css", "app.js", "chat.js", "data/keyword-concepts.js", "data/keywords.generated.js"].concat(dataScripts);
const offlineErrors = [];
const structuralBans = [
  ["ES module", /type\s*=\s*["']module["']/i],
  ["document.cookie", /document\.cookie/]
];
for (const file of scannedFiles) {
  if (!existsSync(join(root, file))) continue;
  const source = readFileSync(join(root, file), "utf8");
  for (const [label, pattern] of structuralBans) if (pattern.test(source)) offlineErrors.push(`${file}: ${label}`);
  if (/\/\/cdn/i.test(source)) offlineErrors.push(`${file}: CDN 地址`);
  const fetchCalls = [...source.matchAll(/\bfetch\s*\(\s*([^,\n)]+)/gi)].map(match => match[1].trim());
  const xhrCount = (source.match(/\bXMLHttpRequest\b/gi) || []).length;
  if (file !== "chat.js" && (fetchCalls.length || xhrCount)) {
    offlineErrors.push(`${file}: 只有 chat.js 可以使用 fetch/XHR`);
  }
  if (file === "chat.js") {
    if (fetchCalls.some(argument => argument !== "CHAT_CONFIG.endpoint")) {
      offlineErrors.push("chat.js: fetch 只能发往 CHAT_CONFIG.endpoint");
    }
    const endpointOpenCount = (source.match(/\.open\s*\(\s*[^,]+,\s*CHAT_CONFIG\.endpoint\b/gi) || []).length;
    if (xhrCount > endpointOpenCount) offlineErrors.push("chat.js: XHR 只能发往 CHAT_CONFIG.endpoint");
  }
  if (/<(?:script|link|img|iframe|source|video|audio)\b[^>]*(?:src|href|poster)\s*=\s*["']https?:\/\//i.test(source)) {
    offlineErrors.push(`${file}: 禁止外链脚本、样式、图片或嵌入资源`);
  }
  for (const match of source.matchAll(/https?:\/\/[^\s"'`)<>]+/gi)) {
    if (!isAllowedExternalUrl(match[0])) offlineErrors.push(`${file}: 非白名单外链 ${match[0].slice(0, 60)}`);
  }
}
check(offlineErrors.length === 0,
  `离线约束：仅允许 ${allowedHosts.length} 个指定外链域名，且只有 chat.js 可请求 CHAT_CONFIG.endpoint`,
  offlineErrors.slice(0, 6).join("；"));

try {
  const require = createRequire(import.meta.url);
  const { filterEntries, filterEntriesWithMode, resultCountText, searchableText, headerOptions,
    exercisesForEntry, difficultyLabel } = require(join(root, "app.js"));
  const dataHeaders = [...new Set(entries.flatMap(entry => entry.headers))].sort((left, right) => left.localeCompare(right, "en"));
  const uiHeaders = headerOptions(entries).slice(1);
  check(JSON.stringify(uiHeaders) === JSON.stringify(dataHeaders),
    `头文件下拉覆盖数据中全部 ${dataHeaders.length} 个头文件（实际选项 ${uiHeaders.length} 个）`, uiHeaders.join(", "));

  const printfResults = filterEntriesWithMode(entries, "printf", "全部", "全部头文件");
  check(printfResults.entries.length > 0 && printfResults.entries[0].id === "printf-function" && !printfResults.exampleFallback,
    `搜索“printf”首项为 printf-function（实际命中 ${printfResults.entries.length} 条）`);

  const pointerResults = filterEntries(entries, "指针", "全部", "全部头文件");
  check(pointerResults.length > 0 && pointerResults.every(entry => searchableText(entry).includes("指针")),
    `搜索“指针”命中均真实包含可搜文本（实际命中 ${pointerResults.length} 条）`);

  const upperResults = filterEntries(entries, "PRINTF", "全部", "全部头文件");
  check(JSON.stringify(printfResults.entries.map(entry => entry.id)) === JSON.stringify(upperResults.map(entry => entry.id)),
    `搜索大小写不敏感 printf / PRINTF（实际各命中 ${printfResults.entries.length}/${upperResults.length} 条）`);

  const absentResults = filterEntries(entries, "zzzz-不存在-zzzz", "全部", "全部头文件");
  check(absentResults.length === 0, `不存在的字符串命中 0 条（实际命中 ${absentResults.length} 条）`);

  const stdioResults = filterEntries(entries, "stdio.h", "全部", "全部头文件");
  check(stdioResults.length > 0 && stdioResults.every(entry => entry.headers.includes("stdio.h")),
    `搜索“stdio.h”仅命中声明该头文件的词条（实际命中 ${stdioResults.length} 条）`);

  const combined = filterEntriesWithMode(entries, "指针", "指针", "stdio.h");
  check(combined.entries.length > 0 && !combined.exampleFallback && combined.entries.every(entry =>
    entry.category === "指针" && entry.headers.includes("stdio.h") && searchableText(entry).includes("指针")),
  `分类、头文件与关键词按“与”关系筛选（实际命中 ${combined.entries.length} 条）`);

  const rewindResults = filterEntriesWithMode(entries, "rewind", "全部", "全部头文件");
  const rewindCountText = resultCountText(rewindResults.entries.length, entries.length, true, false,
    rewindResults.exampleFallback && rewindResults.entries.length > 0);
  check(rewindResults.entries.length > 0 && rewindResults.entries[0].id === "rewind-function" && !rewindResults.exampleFallback,
    `搜索“rewind”直接命中独立词条（实际命中 ${rewindResults.entries.length} 条）`);
  check(!rewindCountText.includes("在示例代码中匹配"),
    `直接命中时不显示示例回退提示（实际命中 ${rewindResults.entries.length} 条；${rewindCountText}）`);
  const sampleExercises = [
    { id: "ex-one", entryIds: ["entry-a"] },
    { id: "ex-two", entryIds: ["entry-a", "entry-b"] },
    { id: "ex-three", entryIds: ["entry-c"] }
  ];
  check(exercisesForEntry(sampleExercises, "entry-a").map(item => item.id).join(",") === "ex-one,ex-two",
    "练习区只收集 entryIds 命中当前词条的全部题目");
  check([1, 2, 3].map(difficultyLabel).join(",") === "入门,进阶,综合", "练习难度 1/2/3 正确映射为入门/进阶/综合");
} catch (error) {
  fail(`搜索与头文件筛选逻辑反例自检：${error.stack || error.message}`);
}

const appSource = existsSync(join(root, "app.js")) ? readFileSync(join(root, "app.js"), "utf8") : "";
const roadmapBodySource = appSource.match(/function roadmapBody\(\)[\s\S]*?\n  function renderRoadmap\(/)?.[0] || "";
check(roadmapBodySource.includes("https://www.bilibili.com/video/BV1Ls411w7rx/") &&
  roadmapBodySource.includes("https://space.bilibili.com/535834809") &&
  roadmapBodySource.includes("看网课（浙大翁恺）") && roadmapBodySource.includes("看网课（山大陈千）"),
  "路线图快捷按钮包含两门网课的文案与规范地址");
check(/renderExercises\(entry\)/.test(appSource) && /exercise\.requirements/.test(appSource) && /exercise\.hints/.test(appSource) &&
  /exercise\.solution/.test(appSource) && /exercise\.expectedOutput/.test(appSource) && /exercise\.explanation/.test(appSource),
"详情页练习区渲染题目、要求、提示、参考答案、预期输出与讲解");
check(/hasDeepSeekKey\(\)/.test(appSource) && /C_SYNTAX_CHAT\.reviewCode/.test(appSource),
  "练习批改入口仅在本地有 API Key 时渲染，并调用 chat.js 批改入口");
const exerciseRenderSource = appSource.match(/function renderExercises\(entry\)[\s\S]*?\n  function renderDetail\(/)?.[0] || "";
check(/if \(hasDeepSeekKey\(\)\) \{[\s\S]*?exercise-review[\s\S]*?createExerciseGenerate\(exercise\)/.test(exerciseRenderSource) &&
  /exercise-generate/.test(appSource),
  "出题区块与批改区块共用 hasDeepSeekKey 判定，仅在本地有 API Key 时渲染");
check(/new Map\(\)/.test(appSource) && /exerciseGenerations\.get\(exercise\.id\)/.test(appSource) &&
  /exerciseGenerations\.set\(exercise\.id, cached\)/.test(appSource) && /count: 3/.test(appSource),
  "出题结果与默认题量 3 按练习 id 缓存在内存 Map");
const entryGenerateSource = appSource.match(/function entryGenerateExercise\(entry\)[\s\S]*?\n  function renderExercises\(/)?.[0] || "";
check(/if \(!matched\.length\)/.test(exerciseRenderSource) &&
  /这个词条还没有内置练习题/.test(exerciseRenderSource) &&
  /让 AI 出几道关于「/.test(exerciseRenderSource) && /ariaLabel: buttonText/.test(exerciseRenderSource) &&
  /createExerciseGenerate\(entryGenerateExercise\(entry\)/.test(exerciseRenderSource),
  "无内置练习的词条渲染带中文 aria-label 的 AI 出题真按钮，并复用现有出题区块");
check(exerciseRenderSource.indexOf("createExerciseGenerate(entryGenerateExercise(entry)") <
  exerciseRenderSource.indexOf("if (!matched.length) return"),
  "词条级 AI 出题入口在有无内置练习时都可见，原有练习卡片保持不变");
check(/id: "entry:" \+ entry\.id/.test(entryGenerateSource) && /title: entry\.name/.test(entryGenerateSource) &&
  /entry\.syntax/.test(entryGenerateSource) && /notes\.join/.test(entryGenerateSource) &&
  /entryIds: \[entry\.id\]/.test(entryGenerateSource),
  "词条伪练习对象包含词条 id、名称、syntax 与注意事项");
check(/openChatForMissingKey && !hasDeepSeekKey\(\)/.test(appSource) &&
  /C_SYNTAX_CHAT\.open\(\)/.test(appSource),
  "无 Key 点击词条出题按钮会打开现有对话面板供填写 Key");
check(/exercise-generate-output/.test(appSource) && /"复制"/.test(appSource) && /"再来一批"/.test(appSource) &&
  /"在对话里继续问"/.test(appSource) && /generateButton\.disabled = cached\.status === "loading"/.test(appSource),
  "出题结果窗口包含复制、再来一批、在对话里继续问，并在生成中禁用按钮");
check(/Array\.isArray\(list\) \? list\.slice\(\) : \(Array\.isArray\(entry\.keywords\) \? entry\.keywords : \[\]\)/.test(appSource),
  "生成关键词表缺项时，页面保留词条内联 keywords");
const globalKeydownSource = appSource.match(/document\.addEventListener\("keydown",[\s\S]*?\n  \}\);/)?.[0] || "";
check(/function isTypingTarget[\s\S]*?TEXTAREA[\s\S]*?isContentEditable/.test(appSource) &&
  /typing && !searchShortcut\) return/.test(globalKeydownSource) &&
  globalKeydownSource.indexOf("typing && !searchShortcut") < globalKeydownSource.indexOf('event.key === "Enter"'),
  "全局快捷键在 Enter 分支前放行 INPUT/TEXTAREA/SELECT/contenteditable（Ctrl/Cmd+K 除外）");
check(/EXERCISE_DRAFTS_KEY\s*=\s*["']csyntax\.exercise\.drafts["']/.test(appSource) &&
  /new Map\(\)/.test(appSource) && /exerciseDrafts\.get\(exercise\.id\)/.test(appSource) &&
  /addEventListener\("input"[\s\S]*?saveExerciseDraft\(exercise\.id, reviewInput\.value\)/.test(appSource),
  "练习代码按练习 id 缓存到 Map + sessionStorage，并在渲染时回填");

const stylesSource = existsSync(join(root, "styles.css")) ? readFileSync(join(root, "styles.css"), "utf8") : "";
const chatPanelRule = stylesSource.match(/\.chat-panel\s*\{[\s\S]*?\}/)?.[0] || "";
check(/resize:\s*none/.test(chatPanelRule) && !/resize:\s*both/.test(chatPanelRule) && /overflow:\s*hidden/.test(chatPanelRule) &&
  /min-width:\s*320px/.test(chatPanelRule) && /min-height:\s*320px/.test(chatPanelRule) &&
  /max-width:/.test(chatPanelRule) && /max-height:/.test(chatPanelRule),
  "DeepSeek 面板关闭原生 resize，并保留最小/最大尺寸与单层滚动限制");

const desktopChatBlocks = cssBlocks(stylesSource, /@media\s*\(\s*min-width\s*:\s*761px\s*\)\s*\{/gi);
const mobileChatBlocks = cssBlocks(stylesSource, /@media\s*\(\s*max-width\s*:\s*760px\s*\)\s*\{/gi);
const desktopChatCss = desktopChatBlocks.map(block => block.body).join("\n");
const mobileChatCss = mobileChatBlocks.map(block => block.body).join("\n");
check(/\.chat-resize-handle\s*\{[^{}]*display:\s*block/.test(desktopChatCss) &&
  /\.chat-resize-handle\s*\{[^{}]*display:\s*none/.test(mobileChatCss),
  "DeepSeek 缩放手柄仅在桌面端显示，移动端明确隐藏");
check(/\.chat-panel\s*\{[^{}]*max-height:\s*88vh[^{}]*resize:\s*none/.test(mobileChatCss) &&
  !/resize:\s*(?:both|vertical)/.test(mobileChatCss) && /\.chat-maximize\s*\{[^{}]*display:\s*none/.test(mobileChatCss),
  "DeepSeek 移动端保持整宽底部面板、88vh 上限、禁止缩放并隐藏放大按钮");
check(/touch-action:\s*none/.test(stylesSource) &&
  /\.chat-resize-n,\s*\.chat-resize-s/.test(desktopChatCss) && /cursor:\s*ns-resize/.test(desktopChatCss) &&
  /\.chat-resize-e,\s*\.chat-resize-w/.test(desktopChatCss) && /cursor:\s*ew-resize/.test(desktopChatCss) &&
  /\.chat-resize-ne\s*\{[^{}]*cursor:\s*nesw-resize/.test(desktopChatCss) &&
  /\.chat-resize-nw\s*\{[^{}]*cursor:\s*nwse-resize/.test(desktopChatCss),
  "DeepSeek 手柄使用 touch-action:none，并为边与角设置正确 resize 光标");

// ---------------- 默认蓝色 / 三档滑块 / 黑灰深色主题 ----------------
const headerSource = indexSource.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
const themeSliderSource = headerSource.match(/<div\b[^>]*\bclass\s*=\s*["'][^"']*\btheme-slider\b[^"']*["'][^>]*>[\s\S]*?<\/div>/i)?.[0] || "";
const themeRadioSources = [...themeSliderSource.matchAll(/<button\b[^>]*\brole\s*=\s*["']radio["'][^>]*>[\s\S]*?<\/button>/gi)].map(match => match[0]);
const themeValues = themeRadioSources.map(source => source.match(/\bdata-theme-value\s*=\s*["']([^"']+)["']/i)?.[1] || "");
const thumbCount = (themeSliderSource.match(/\bclass\s*=\s*["'][^"']*\btheme-slider-thumb\b[^"']*["']/gi) || []).length;
check(/\brole\s*=\s*["']radiogroup["']/i.test(themeSliderSource) && themeRadioSources.length === 3 &&
  themeValues.join(",") === "light,blue,dark" && thumbCount === 1 &&
  /浅色/.test(themeRadioSources[0]) && /蓝色/.test(themeRadioSources[1]) && /深色/.test(themeRadioSources[2]),
"主题检查 1/10：页头为一个 radiogroup，正好包含 light/blue/dark 三个 radio 与一个滑块拇指");

const themeSliderRule = stylesSource.match(/\.theme-slider\s*\{([^{}]*)\}/i)?.[1] || "";
const themeSliderButtonRule = stylesSource.match(/\.theme-slider\s+button\s*\{([^{}]*)\}/i)?.[1] || "";
const narrowThemeBlocks = cssBlocks(stylesSource, /@media\s*\(\s*max-width\s*:\s*390px\s*\)\s*\{/gi);
check(/\baria-checked\s*=\s*["']true["']/i.test(themeRadioSources[1]) &&
  !/\baria-checked\s*=\s*["']true["']/i.test(`${themeRadioSources[0]}${themeRadioSources[2]}`) &&
  /--theme-index\s*:\s*1\s*;/.test(themeSliderRule) &&
  appSource.indexOf("initializeTheme(document.documentElement") < appSource.indexOf("var ALL_CATEGORY"),
  "主题首屏检查：HTML 与 CSS 初始位置均为 blue，app.js 在主应用初始化前恢复存储主题");
check(/min-height\s*:\s*(?:4[0-9]|[5-9][0-9]|\d{3,})px\s*;/.test(themeSliderButtonRule) &&
  narrowThemeBlocks.some(block => /\.theme-slider\s*\{[^{}]*width\s*:\s*100%\s*;?[^{}]*\}/i.test(block.body)),
  "主题布局检查：每档触控高度至少 40px，390px 窄屏下滑块可占满一行");

check(/THEME_ORDER\s*=\s*\[\s*["']light["']\s*,\s*["']blue["']\s*,\s*["']dark["']\s*\]/.test(appSource) &&
  /event\.key\s*===\s*["']ArrowLeft["']/.test(appSource) && /event\.key\s*===\s*["']ArrowRight["']/.test(appSource),
  "主题检查 2/10：主题顺序固定为 light/blue/dark，并包含左右方向键处理路径");

try {
  const require = createRequire(import.meta.url);
  const { isSupportedTheme, readStoredTheme, initializeTheme, effectiveTheme, setupThemeSlider } = require(join(root, "app.js"));
  const createStorage = initial => {
    const values = new Map(Object.entries(initial || {}));
    const writes = [];
    return {
      values,
      writes,
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) { values.set(key, String(value)); writes.push(`${key}=${value}`); },
      removeItem(key) { values.delete(key); }
    };
  };
  const createStyle = () => {
    const values = new Map();
    return { values, setProperty(name, value) { values.set(name, String(value)); } };
  };
  const createRoot = () => {
    const attributes = new Map();
    return {
      style: createStyle(),
      getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      removeAttribute(name) { attributes.delete(name); },
      hasAttribute(name) { return attributes.has(name); }
    };
  };
  const createButton = value => {
    const attributes = new Map([["data-theme-value", value]]);
    const listeners = {};
    return {
      attributes,
      listeners,
      focused: false,
      getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
      setAttribute(name, nextValue) { attributes.set(name, String(nextValue)); },
      addEventListener(name, listener) { listeners[name] = listener; },
      focus() { this.focused = true; }
    };
  };
  const createSlider = () => {
    const buttons = ["light", "blue", "dark"].map(createButton);
    return {
      buttons,
      style: createStyle(),
      querySelectorAll() { return buttons; }
    };
  };

  const clickStorage = createStorage();
  const clickRoot = createRoot();
  initializeTheme(clickRoot, clickStorage);
  const clickSlider = createSlider();
  setupThemeSlider(clickSlider, clickRoot, clickStorage);
  const themeSequence = [];
  const indexSequence = [];
  for (const button of clickSlider.buttons) {
    button.listeners.click();
    themeSequence.push(clickRoot.getAttribute("data-theme"));
    indexSequence.push(clickRoot.style.values.get("--theme-index"));
  }
  const storedSequence = clickStorage.writes.map(item => item.split("=")[1]);
  const checkedCounts = clickSlider.buttons.map(clickedButton => {
    clickedButton.listeners.click();
    return clickSlider.buttons.filter(button => button.attributes.get("aria-checked") === "true").length;
  });
  check(themeSequence.join(" → ") === "light → blue → dark" && indexSequence.join(" → ") === "0 → 1 → 2" &&
    storedSequence.slice(0, 3).join(" → ") === "light → blue → dark" && checkedCounts.every(count => count === 1),
  `主题检查 3/10：点击 data-theme=${themeSequence.join(" → ")}；--theme-index=${indexSequence.join(" → ")}；存储=${storedSequence.slice(0, 3).join(" → ")}；aria-checked 唯一=${checkedCounts.join("/")}`);

  const keyStorage = createStorage();
  const keyRoot = createRoot();
  initializeTheme(keyRoot, keyStorage);
  const keySlider = createSlider();
  setupThemeSlider(keySlider, keyRoot, keyStorage);
  const keySequence = [];
  const press = (buttonIndex, key) => {
    let prevented = false;
    keySlider.buttons[buttonIndex].listeners.keydown({ key, preventDefault() { prevented = true; } });
    keySequence.push(`${key}:${keyRoot.getAttribute("data-theme")}:${keyRoot.style.values.get("--theme-index")}:${prevented}`);
  };
  press(1, "ArrowRight");
  press(2, "ArrowLeft");
  press(1, "ArrowLeft");
  press(0, "ArrowLeft");
  check(keySequence.join(" | ") === "ArrowRight:dark:2:true | ArrowLeft:blue:1:true | ArrowLeft:light:0:true | ArrowLeft:dark:2:true",
    `主题检查 4/10：方向键 ${keySequence.join(" | ")}`);

  const legacyDarkStorage = createStorage({ "csyntax.theme": "dark" });
  const legacyLightStorage = createStorage({ "csyntax.theme": "light" });
  const migratedDarkTheme = readStoredTheme(legacyDarkStorage);
  const migratedLightTheme = readStoredTheme(legacyLightStorage);
  const invalidStorage = createStorage({ "csyntax.theme.v2": "sepia" });
  const invalidRoot = createRoot();
  const invalidTheme = initializeTheme(invalidRoot, invalidStorage);
  check(migratedDarkTheme === "blue" && migratedLightTheme === "light" &&
    legacyDarkStorage.values.get("csyntax.theme.v2") === "blue" && legacyLightStorage.values.get("csyntax.theme.v2") === "light" &&
    !legacyDarkStorage.values.has("csyntax.theme") && !legacyLightStorage.values.has("csyntax.theme") &&
    invalidTheme === "blue" && invalidRoot.getAttribute("data-theme") === "blue" &&
    !invalidStorage.values.has("csyntax.theme.v2") && ["light", "blue", "dark"].every(isSupportedTheme) &&
    !isSupportedTheme("sepia") && effectiveTheme(createRoot()) === "blue",
  `主题检查 5/10：旧键 dark → ${migratedDarkTheme}、light → ${migratedLightTheme}；非法 v2 清理后默认 ${invalidTheme}；无显式主题默认 ${effectiveTheme(createRoot())}`);
} catch (error) {
  fail(`主题检查 3–5/10：滑块、键盘与迁移运行时自检：${error.stack || error.message}`);
}

const rootBlocks = cssBlocks(stylesSource, /:root\s*\{/gi);
const rootPalette = customPropertyMap(rootBlocks[0]?.body || "");
const darkMediaBlocks = cssBlocks(stylesSource, /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/gi);
const explicitLightBlocks = cssBlocks(stylesSource, /:root\s*\[\s*data-theme\s*=\s*["']light["']\s*\]\s*\{/gi);
const explicitBlueBlocks = cssBlocks(stylesSource, /:root\s*\[\s*data-theme\s*=\s*["']blue["']\s*\]\s*\{/gi);
const explicitDarkBlocks = cssBlocks(stylesSource, /:root\s*\[\s*data-theme\s*=\s*["']dark["']\s*\]\s*\{/gi);
const explicitLightPalette = customPropertyMap(explicitLightBlocks[0]?.body || "");
const explicitBluePalette = customPropertyMap(explicitBlueBlocks[0]?.body || "");
const explicitDarkPalette = customPropertyMap(explicitDarkBlocks[0]?.body || "");
const paletteNames = ["light", "blue", "dark"];
const palettes = { light: explicitLightPalette, blue: explicitBluePalette, dark: explicitDarkPalette };
const paletteVariableNames = Object.keys(explicitLightPalette).sort();
const completePalettes = paletteNames.every(name => JSON.stringify(Object.keys(palettes[name]).sort()) === JSON.stringify(paletteVariableNames)) &&
  JSON.stringify(Object.keys(rootPalette).sort()) === JSON.stringify(paletteVariableNames);
// 蓝色主题的页面底是蓝、内容面板是米白，用浅色 color-scheme 才能让系统滚动条/表单控件不再是一条黑杠（v1.32 起）
check(rootBlocks.length === 1 && rootPalette["--bg"]?.toLowerCase() === "#5a8cd7" &&
  rootPalette["--color-scheme"] === "light" && JSON.stringify(rootPalette) === JSON.stringify(explicitBluePalette),
  "主题检查 6/10：:root 默认调色板完整等于 blue，--bg=#5a8cd7，color-scheme=light（避免系统深色滚动条），不读取系统深浅色");

check(explicitLightBlocks.length === 1 && explicitBlueBlocks.length === 1 && explicitDarkBlocks.length === 1 &&
  explicitLightPalette["--bg"]?.toLowerCase() === "#ffffff" &&
  explicitBluePalette["--bg"]?.toLowerCase() === "#5a8cd7" && explicitDarkPalette["--bg"]?.toLowerCase() === "#0d0d0d" &&
  completePalettes,
`主题检查 7/10：:root/light/blue/dark 四套完整调色板（各 ${paletteVariableNames.length} 个变量）`);

check(darkMediaBlocks.length === 0 && !/prefers-color-scheme\s*:\s*dark/i.test(stylesSource),
  "主题检查 8/10：不存在 prefers-color-scheme: dark 调色板切换");

const thumbRule = stylesSource.match(/\.theme-slider-thumb\s*\{([^{}]*)\}/i)?.[1] || "";
const bezierMatch = thumbRule.match(/transition\s*:[^;]*cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/i);
const bezierValues = bezierMatch ? bezierMatch.slice(1).map(Number) : [];
const reducedMotionBlocks = cssBlocks(stylesSource, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/gi);
const reducedMotionDisablesThumb = reducedMotionBlocks.some(block =>
  /\.theme-slider-thumb\s*\{[^{}]*transition\s*:\s*none\s*;?[^{}]*\}/i.test(block.body));
check(bezierValues.length === 4 && (bezierValues[1] > 1 || bezierValues[3] < 0) && reducedMotionDisablesThumb,
  `主题检查 9/10：拇指 cubic-bezier(${bezierValues.join(", ")}) 含过冲控制点，reduced-motion 禁用过渡`);

const grayscaleIssues = [];
for (const [name, value] of Object.entries(explicitDarkPalette)) {
  if (name === "--color-scheme") continue;
  const colors = cssColorTokens(value);
  if (!colors.length) {
    grayscaleIssues.push(`${name}=${value}（无法解析颜色）`);
    continue;
  }
  for (const color of colors) {
    const delta = Math.max(...color.channels) - Math.min(...color.channels);
    check(delta <= 2,
      `黑灰灰度 ${name} ${color.token}：R=${color.channels[0]} G=${color.channels[1]} B=${color.channels[2]}，最大通道差=${delta}`);
    if (delta > 2) grayscaleIssues.push(`${name}=${color.token}（通道差 ${delta}）`);
  }
}
check(grayscaleIssues.length === 0,
  `主题检查 10/10a：dark 的 ${Object.keys(explicitDarkPalette).length - 1} 个颜色变量全部为灰度（最大通道差 ≤ 2）`,
  grayscaleIssues.join("；"));

const contrastDetails = [];
let allThemeContrastsPass = true;
for (const name of paletteNames) {
  const palette = palettes[name];
  const ratios = [
    ["正文/面板", contrastRatio(palette["--text"], palette["--surface"])],
    ["次要文字/面板", contrastRatio(palette["--muted"], palette["--surface"])],
    ["页面文字/页面底", contrastRatio(palette["--page-text"], palette["--bg"])]
  ];
  const detail = `${name}：${ratios.map(([label, ratio]) => `${label} ${ratio.toFixed(2)}:1`).join("；")}`;
  contrastDetails.push(detail);
  const palettePasses = ratios.every(([, ratio]) => ratio >= 4.5);
  allThemeContrastsPass = allThemeContrastsPass && palettePasses;
  check(palettePasses, `三套对比度 ${detail}`, detail);
}
check(allThemeContrastsPass,
  `主题检查 10/10b：三套调色板的正文/面板、次要文字/面板、页面文字/页面底均 ≥ 4.5:1`,
  contrastDetails.join(" | "));

// ---------------- 中文关键字（data/keywords.generated.js）----------------
const keywordIssues = [];
const termCoverage = new Map();
const effectiveKeywords = entry => {
  const generated = keywordTable && typeof keywordTable === "object" ? keywordTable[entry.id] : null;
  if (Array.isArray(generated)) return generated;
  return Array.isArray(entry.keywords) ? entry.keywords : [];
};
for (const entry of entries) {
    const list = effectiveKeywords(entry);
    if (!list.length) { keywordIssues.push(`${entry.id}: 生成表与词条内联数据都缺 keywords`); continue; }
    if (list.length < 3 || list.length > 8) keywordIssues.push(`${entry.id}: 关键词 ${list.length} 个（要求 3–8）`);
    if (new Set(list).size !== list.length) keywordIssues.push(`${entry.id}: 关键词有重复`);
    if (!list.some(keyword => /[\u4e00-\u9fff]/.test(keyword))) keywordIssues.push(`${entry.id}: 没有中文关键词`);
    for (const keyword of list) {
      if (typeof keyword !== "string" || keyword.trim().length < 2 || keyword.trim().length > 20) {
        keywordIssues.push(`${entry.id}: 关键词长度不合规「${keyword}」`);
      }
      termCoverage.set(keyword, (termCoverage.get(keyword) || 0) + 1);
    }
}
check(keywordIssues.length === 0, `每条词条都有 3–8 个合规的有效关键词（生成表优先，缺失时用内联；${entries.length} 条）`, keywordIssues.slice(0, 8).join("；"));

const keywordBuilderSource = readFileSync(join(root, "tools", "build-keywords.mjs"), "utf8");
const inlinePriorityIndex = keywordBuilderSource.indexOf("Array.isArray(entry.keywords)");
const overridePriorityIndex = keywordBuilderSource.indexOf("overrides[entry.id]");
const conceptPriorityIndex = keywordBuilderSource.indexOf("conceptTermsById.get(entry.id)", overridePriorityIndex);
check(inlinePriorityIndex !== -1 && inlinePriorityIndex < overridePriorityIndex && overridePriorityIndex < conceptPriorityIndex,
  "关键词生成优先级为词条内联 keywords → overrides → 概念规则");

const wideTerms = [...termCoverage.entries()].filter(([, count]) => count > 32).sort((left, right) => right[1] - left[1]);
check(wideTerms.length === 0, `关键词里没有覆盖超过 32 条的“万能词”（共 ${termCoverage.size} 个词）`, wideTerms.slice(0, 6).map(([term, count]) => `${term}×${count}`).join("；"));

const keywordMatrix = [["内存", 8], ["字符串", 10], ["文件", 8], ["输入", 5], ["输出", 5], ["时间", 5], ["数学", 8],
  ["随机", 3], ["排序", 2], ["查找", 2], ["指针", 8], ["数组", 6], ["结构体", 4], ["错误", 4],
  ["类型转换", 3], ["内存泄漏", 1], ["越界", 1]];
const matrixFails = [];
for (const [query, min] of keywordMatrix) {
  const hits = entries.filter(entry => effectiveKeywords(entry).some(keyword => keyword.includes(query)));
  if (hits.length < min) matrixFails.push(`${query}: ${hits.length} < ${min}`);
}
check(matrixFails.length === 0, `中文查询矩阵（${keywordMatrix.length} 个常用中文词都能搜到东西）`, matrixFails.join("；"));

const keywordHits = query => entries.filter(entry => effectiveKeywords(entry).some(keyword => keyword.includes(query))).map(entry => entry.id);
const memoryHits = keywordHits("内存");
check(["malloc-function", "calloc-function", "realloc-function", "free-function"].every(id => memoryHits.includes(id)),
  `搜“内存”能捞到 malloc/calloc/realloc/free（实际命中 ${memoryHits.length} 条）`);

try {
  const require = createRequire(import.meta.url);
  const { filterEntriesWithMode, hasDeepSeekKey } = require(join(root, "app.js"));
  check(hasDeepSeekKey({ getItem: () => "sk-test" }) && !hasDeepSeekKey({ getItem: () => null }),
    "有 Key 时允许渲染出题区块，无 Key 时不渲染");
  const memorySearch = filterEntriesWithMode(entries, "内存", "全部", "全部头文件");
  check(memorySearch.entries.length >= 8 && memorySearch.entries.some(entry => entry.id === "malloc-function"),
    `搜索框输入“内存”能出 malloc 等词条（实际 ${memorySearch.entries.length} 条，首项 ${memorySearch.entries[0]?.id}）`);
  const keywordFirst = filterEntriesWithMode(entries, "字符串比较", "全部", "全部头文件");
  check(keywordFirst.entries[0]?.id === "strcmp-function",
    `中文关键词命中排在正文命中之前（搜“字符串比较”首项 ${keywordFirst.entries[0]?.id}）`);
} catch (error) {
  fail(`关键词搜索层自检：${error.stack || error.message}`);
}

// ---------------- DeepSeek 对话（chat.js）----------------
const chatSource = existsSync(join(root, "chat.js")) ? readFileSync(join(root, "chat.js"), "utf8") : "";
check(Boolean(chatSource), "chat.js 存在");
check(/<script\b[^>]*src\s*=\s*["']chat\.js["']/i.test(indexSource), "index.html 引入了 chat.js");
if (chatSource) {
  check(/endpoint:\s*["']https:\/\/api\.deepseek\.com\/chat\/completions["']/.test(chatSource), "已预配置 DeepSeek 官方接口");
  check(/model:\s*["']deepseek-flash["']/.test(chatSource) && /modelChoices:\s*\["deepseek-flash"\]/.test(chatSource),
    "只保留 deepseek-flash 一个模型（官方 V4.1 Flash 的 id）");
  check(/reasoningEffort:\s*["']medium["']/.test(chatSource), "默认推理强度 medium（官方映射为 high）");
  check(/panelSizeStorageKey:\s*["']csyntax\.deepseek\.panelSize["']/.test(chatSource) &&
    /panelSize:\s*panelSize/.test(chatSource) && /setPanelSize:\s*setPanelSize/.test(chatSource) &&
    /applyStoredPanelSize:\s*applyStoredPanelSize/.test(chatSource),
    "面板尺寸使用指定 localStorage 键持久化，并暴露读取、设置与恢复钩子");
  const resizeDirectionMatch = chatSource.match(/RESIZE_DIRECTIONS\s*=\s*\[([^\]]+)\]/)?.[1] || "";
  const resizeDirections = [...resizeDirectionMatch.matchAll(/["'](n|s|e|w|ne|nw|se|sw)["']/g)].map(match => match[1]);
  check(new Set(resizeDirections).size === 8 &&
    /setAttribute\(["']data-resize["'],\s*direction\)/.test(chatSource),
    "DeepSeek 面板创建 n/s/e/w/ne/nw/se/sw 八个 data-resize 手柄");
  check(/addEventListener\(["']pointerdown["'],\s*beginPanelResize\)/.test(chatSource) &&
    /addEventListener\(["']pointermove["'],\s*movePanelResize\)/.test(chatSource) &&
    /addEventListener\(["']pointerup["'],\s*finishPanelResize\)/.test(chatSource) &&
    /function finishPanelResize[\s\S]*?writeStorage\(CHAT_CONFIG\.panelSizeStorageKey/.test(chatSource),
    "DeepSeek 拖拽使用 pointerdown/pointermove/pointerup，结束函数负责持久化");
  check(/chat-maximize/.test(chatSource) && /aria-pressed/.test(chatSource) &&
    /aria-label["'],\s*["']放大 DeepSeek 对话面板/.test(chatSource) &&
    /addEventListener\(["']dblclick["']/.test(chatSource) && /preMaximizeSize/.test(chatSource),
    "DeepSeek 标题栏有中文无障碍放大按钮、aria-pressed、双击切换与放大前尺寸状态");
  check(/chat-model-badge/.test(chatSource) && !/modelSelect/.test(chatSource),
    "模型是不可选的静态标签（不给用户选到不支持的 id 的机会）");
  check(/staleModelNames/.test(chatSource) && /storedModel/.test(chatSource) && /检测到不被支持的模型名/.test(chatSource),
    "本地遗留的不支持模型名会被丢弃并自动改用 deepseek-flash 重试");
  check(/chat-billing/.test(chatSource) && /按 token/.test(chatSource) && /api-docs\.deepseek\.com/.test(chatSource),
    "面板里说明了 API 按 token 计费并给出官方计费说明链接");
  check(/没有api？/.test(chatSource) && /platform\.deepseek\.com\/api_keys/.test(chatSource),
    "有「没有api？」提示与跳转获取 Key 的按钮");
  check(/localStorage/.test(chatSource) && !/document\.cookie/.test(chatSource), "API Key 只存 localStorage");
  check(/允许简单日常对话/.test(chatSource) && /写小说或文案/.test(chatSource) && /医疗、法律、投资建议/.test(chatSource),
    "system prompt 以 C 语言为主、允许简单日常对话并拒绝越界请求");
  check(/现在是批改模式/.test(chatSource) && /不要重写学生的代码、不要直接给出完整答案/.test(chatSource),
    "system prompt 包含只检查、只建议且不重写答案的批改模式");
  check(/现在是出题模式/.test(chatSource) && /gcc -std=c11/.test(chatSource) && /不要用 scanf/.test(chatSource) &&
    /不要用 tmpfile/.test(chatSource) && /ASCII/.test(chatSource) && /预期输出/.test(chatSource) && /完整可编译/.test(chatSource),
    "出题模式 system prompt 包含编译、输入、文件、ASCII、完整答案与预期输出硬约束");
  check(/function buildGenerateQuestion[\s\S]*?item\.title[\s\S]*?item\.prompt[\s\S]*?requirements[\s\S]*?题量/.test(chatSource) &&
    /function generateExercises/.test(chatSource) && /buildGeneratePrompt/.test(chatSource),
    "出题 user 消息包含 title、prompt、requirements 与题量，并暴露生成入口和 prompt 钩子");
  check(/opts\.mode === "generate" \? Math\.max\(4000, CHAT_CONFIG\.maxTokens\)/.test(chatSource),
    "出题模式把 max_tokens 放宽到不少于 4000");
  check(/function reviewCode[\s\S]*?els\.launcher\.click\(\)[\s\S]*?send\(buildReviewQuestion\(exercise, code\), \{ mode: "review"/.test(chatSource),
    "练习批改会打开对话面板并以 review 模式自动发送");
  const fetchCalls = [...chatSource.matchAll(/fetch\(([^)]{0,80})/g)].map(match => match[1]);
  check(fetchCalls.length === 1 && /CHAT_CONFIG\.endpoint/.test(fetchCalls[0]), "只有一处 fetch，且发往 CHAT_CONFIG.endpoint");
}

try {
  const chatContext = { window: {}, console: { warn() {} } };
  vm.createContext(chatContext);
  vm.runInContext(chatSource, chatContext, { filename: "chat.js" });
  const chat = chatContext.window.C_SYNTAX_CHAT;
  check(Boolean(chat), "chat.js 在无 DOM 环境下也能被加载（页面出错不会拖垮词典）");
  if (chat) {
    const prompt = chat.buildSystemPrompt();
    check(/以 C 语言为主/.test(prompt) && /简单日常对话/.test(prompt) && /礼貌拒绝/.test(prompt),
      "system prompt 明确了 C 语言主范围、简单对话与拒绝边界");
    const reviewPrompt = chat.buildSystemPrompt({ mode: "review" });
    check(/只检查学生的代码并给建议/.test(reviewPrompt) && /不要重写学生的代码/.test(reviewPrompt) &&
      /不要直接给出完整答案/.test(reviewPrompt), "批改模式 system prompt 明确只检查给建议、不重写、不提供完整答案");
    const reviewQuestion = chat.buildReviewQuestion({ prompt: "输出一行", requirements: ["使用 printf", "换行"] }, "int main(void) {}\n");
    check(reviewQuestion.includes("【题目】输出一行") && reviewQuestion.includes("【要求】") &&
      reviewQuestion.includes("【我的代码】") && reviewQuestion.includes("int main(void)"),
    "批改消息完整带上题目、要求与学生代码");
    const payload = chat.buildPayload("malloc 怎么用", [], {});
    check(payload.model === "deepseek-flash" && payload.reasoning_effort === "medium" &&
      payload.messages[0].role === "system" && payload.messages[1].role === "user" && payload.stream === false,
      "请求体包含 模型 / 推理强度 / system 消息");
    const retryPayload = chat.buildPayload("x", [], { includeReasoning: false });
    check(!("reasoning_effort" in retryPayload), "模型不支持推理强度时能去掉该字段重试");
    check(chat.mapError(401, "Authentication Fails").includes("API Key 无效"), "401 映射为“API Key 无效”提示");
    check(chat.mapError(400, '{"error":{"message":"The supported API model names are deepseek-flash"}}').includes("deepseek-flash"),
      "400 模型名报错会提示本页面固定使用的模型名");
    // 本地遗留的旧模型名必须被丢弃，请求里只能出现 deepseek-flash
    chat.storage.write(chat.config.modelStorageKey, "deepseek-v41-flash");
    check(chat.storedModel() === "deepseek-flash" && chat.storage.read(chat.config.modelStorageKey) === null,
      "localStorage 里的旧模型名会被清掉并回落到 deepseek-flash", String(chat.storage.read(chat.config.modelStorageKey)));
    check(chat.isStaleModel("deepseek-v41-flash") && !chat.isStaleModel("deepseek-flash"), "旧模型名识别正确");
    check(chat.buildPayload("x", [], {}).model === "deepseek-flash", "请求体里的模型固定为 deepseek-flash");
    const reviewPayload = chat.buildPayload("检查", [], { mode: "review" });
    check(/现在是批改模式/.test(reviewPayload.messages[0].content), "批改请求把批改模式写入 system 消息");
    const generateMessages = chat.buildGeneratePrompt({
      title: "连续更新分数", prompt: "依次更新分数", requirements: ["输出三次结果"], difficulty: 2, entryIds: ["entry-a"]
    }, 5, "只练指针");
    check(/现在是出题模式/.test(generateMessages[0].content) && /gcc -std=c11/.test(generateMessages[0].content) &&
      /连续更新分数/.test(generateMessages[1].content) && /依次更新分数/.test(generateMessages[1].content) &&
      /输出三次结果/.test(generateMessages[1].content) && /题量：5/.test(generateMessages[1].content) &&
      /侧重：只练指针/.test(generateMessages[1].content),
      "出题 prompt 的 system 含硬约束，user 含当前练习 title/prompt/requirements、题量与侧重");
    check(chat.buildPayload("出题", [], { mode: "generate", count: 3 }).max_tokens >= 4000,
      "出题请求 max_tokens 不少于 4000");
    check(!/出题模式|批改模式/.test(payload.messages[0].content) &&
      /批改模式/.test(reviewPayload.messages[0].content) && !/出题模式/.test(reviewPayload.messages[0].content),
      "普通对话不带模式指令，批改模式只带批改指令，两者未被出题模式污染");
    check(typeof chat.reviewCode === "function", "暴露 reviewCode 测试与页面调用钩子");
    check(typeof chat.generateExercises === "function" && typeof chat.buildGeneratePrompt === "function",
      "暴露 generateExercises 与 buildGeneratePrompt 测试和页面调用钩子");
    check(!chat.sanitize("your api key sk-abcdef1234567890 is invalid").includes("abcdef1234567890"),
      "错误信息里形如 sk- 的内容会被脱敏");
    check(chat.maskKey("sk-1234567890abcdef").indexOf("1234567890") === -1, "界面上 Key 只显示掩码");
  }
} catch (error) {
  fail(`chat.js 可测钩子自检：${error.stack || error.message}`);
}

try {
  const values = new Map();
  const storageWrites = [];
  const windowListeners = new Map();
  class StubElement {
    constructor(tagName, panelWindow) {
      this.tagName = String(tagName).toUpperCase();
      this.ownerWindow = panelWindow;
      this.children = [];
      this.listeners = new Map();
      this.attributes = new Map();
      this.style = {};
      this.hidden = false;
      this.className = "";
      this.textContent = "";
      this.value = "";
    }
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) || null; }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(listener);
    }
    dispatch(type, properties = {}) {
      const event = { type, target: this, currentTarget: this, preventDefault() {}, ...properties };
      for (const listener of this.listeners.get(type) || []) listener(event);
    }
    click() { this.dispatch("click"); }
    focus() {}
    closest(selector) { return selector === "button" && this.tagName === "BUTTON" ? this : null; }
    setPointerCapture() {}
    releasePointerCapture() {}
    getBoundingClientRect() {
      if (this.className === "chat-panel" && this.hidden) {
        return { width: 0, height: 0, right: 0, bottom: 0, left: 0, top: 0 };
      }
      const width = Number.parseFloat(this.style.width) || (this.className === "chat-panel" ? 420 : 0);
      const height = Number.parseFloat(this.style.height) || (this.className === "chat-panel" ? 620 : 0);
      const rightOffset = Number.parseFloat(this.style.right);
      const bottomOffset = Number.parseFloat(this.style.bottom);
      const right = this.ownerWindow.innerWidth - (Number.isFinite(rightOffset) ? rightOffset : 20);
      const bottom = this.ownerWindow.innerHeight - (Number.isFinite(bottomOffset) ? bottomOffset : 78);
      return { width, height, right, bottom, left: right - width, top: bottom - height };
    }
  }
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); storageWrites.push({ key, value: String(value) }); },
    removeItem(key) { values.delete(key); storageWrites.push({ key, value: null }); }
  };
  const panelWindow = {
    innerWidth: 1200,
    innerHeight: 900,
    localStorage,
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(listener);
    },
    dispatchEvent() {}
  };
  const document = {
    body: new StubElement("body", panelWindow),
    createElement(tagName) { return new StubElement(tagName, panelWindow); }
  };
  panelWindow.document = document;
  const panelContext = {
    window: panelWindow,
    document,
    console: { warn() {} },
    CustomEvent: class CustomEvent {},
    setTimeout,
    clearTimeout
  };
  vm.createContext(panelContext);
  vm.runInContext(chatSource, panelContext, { filename: "chat.js" });
  const panelChat = panelWindow.C_SYNTAX_CHAT;
  const panelElements = panelChat.elements();
  const panel = panelElements.panel;
  const panelSizeKey = panelChat.config.panelSizeStorageKey;
  const initialHiddenPosition = { right: panel.style.right || "", bottom: panel.style.bottom || "" };
  panel.style.right = "37px";
  panel.style.bottom = "91px";
  panelChat.applyStoredPanelSize();
  const preservedHiddenPosition = { right: panel.style.right, bottom: panel.style.bottom };
  check(panel.hidden && initialHiddenPosition.right === "" && initialHiddenPosition.bottom === "" &&
    preservedHiddenPosition.right === "37px" && preservedHiddenPosition.bottom === "91px" &&
    preservedHiddenPosition.right !== `${panelWindow.innerWidth - 420}px` &&
    preservedHiddenPosition.bottom !== `${panelWindow.innerHeight - 620}px`,
  `DeepSeek 隐藏状态全 0 矩形不反推位置：初始 right="${initialHiddenPosition.right}" bottom="${initialHiddenPosition.bottom}"；已有内联值保持 ${preservedHiddenPosition.right}/${preservedHiddenPosition.bottom}`);

  panel.style.right = "";
  panel.style.bottom = "";
  panelChat.open();
  const defaultOpenRect = panel.getBoundingClientRect();
  check(defaultOpenRect.width === 420 && defaultOpenRect.height === 620 &&
    defaultOpenRect.right === panelWindow.innerWidth - 20 && defaultOpenRect.bottom === panelWindow.innerHeight - 78,
  `DeepSeek 无保存尺寸打开位于右下角：${defaultOpenRect.width}x${defaultOpenRect.height}，right=${defaultOpenRect.right}（期望 ${panelWindow.innerWidth - 20}），bottom=${defaultOpenRect.bottom}（期望 ${panelWindow.innerHeight - 78}）`);

  panelElements.close.click();
  values.set(panelSizeKey, JSON.stringify({ width: 540, height: 530 }));
  panelChat.open();
  const storedOpenRect = panel.getBoundingClientRect();
  check(JSON.stringify(panelChat.panelSize()) === JSON.stringify({ width: 540, height: 530 }) &&
    storedOpenRect.right === panelWindow.innerWidth - 20 && storedOpenRect.bottom === panelWindow.innerHeight - 78,
  `DeepSeek 旧 {width,height} 存储兼容且打开位于右下角：${storedOpenRect.width}x${storedOpenRect.height}，right=${storedOpenRect.right}，bottom=${storedOpenRect.bottom}`);

  const directionDeltas = {
    n: [0, -40], s: [0, 40], e: [40, 0], w: [-40, 0],
    ne: [40, -40], nw: [-40, -40], se: [40, 40], sw: [-40, 40]
  };
  const directionResults = [];
  for (const direction of ["n", "s", "e", "w", "ne", "nw", "se", "sw"]) {
    panelChat.state.maximized = false;
    // 留出足够的四边拖拽空间，避免视口边界夹紧与“对边固定”互相冲突。
    panel.style.right = "100px";
    panel.style.bottom = "150px";
    panelChat.setPanelSize(420, 620);
    storageWrites.length = 0;
    const handle = panelElements.resizeHandles.find(item => item.getAttribute("data-resize") === direction);
    const [deltaX, deltaY] = directionDeltas[direction];
    const startRect = panel.getBoundingClientRect();
    handle.dispatch("pointerdown", { pointerId: 7, button: 0, clientX: 500, clientY: 400 });
    handle.dispatch("pointermove", { pointerId: 7, clientX: 500 + deltaX, clientY: 400 + deltaY });
    const writesDuringMove = storageWrites.filter(item => item.key === panelChat.config.panelSizeStorageKey).length;
    const movedSize = panelChat.panelSize();
    const movedRect = panel.getBoundingClientRect();
    handle.dispatch("pointerup", { pointerId: 7, clientX: 500 + deltaX, clientY: 400 + deltaY });
    const sizeWrites = storageWrites.filter(item => item.key === panelChat.config.panelSizeStorageKey);
    const expectedWidth = direction.includes("e") || direction.includes("w") ? 460 : 420;
    const expectedHeight = direction.includes("n") || direction.includes("s") ? 660 : 620;
    const horizontalFixed = direction.includes("e") ? movedRect.left === startRect.left :
      direction.includes("w") ? movedRect.right === startRect.right :
        movedRect.left === startRect.left && movedRect.right === startRect.right;
    const verticalFixed = direction.includes("s") ? movedRect.top === startRect.top :
      direction.includes("n") ? movedRect.bottom === startRect.bottom :
        movedRect.top === startRect.top && movedRect.bottom === startRect.bottom;
    check(movedSize.width === expectedWidth && movedSize.height === expectedHeight && horizontalFixed && verticalFixed &&
      writesDuringMove === 0 && sizeWrites.length === 1,
    `DeepSeek 拖拽 ${direction}：420x620 → ${movedSize.width}x${movedSize.height}，对边固定=${horizontalFixed && verticalFixed}，move 写入 ${writesDuringMove} 次，pointerup 写入 ${sizeWrites.length} 次`);
    directionResults.push(`${direction}=${movedSize.width}x${movedSize.height}`);
  }
  console.log(`INFO 八方向拖拽原始结果：${directionResults.join("；")}`);

  const minimum = panelChat.resizedPanelSize("nw", { width: 320, height: 320 }, 9999, 9999);
  const maximum = panelChat.resizedPanelSize("se", { width: 420, height: 620 }, 9999, 9999);
  check(minimum.width === 320 && minimum.height === 320 && maximum.width === 900 && maximum.height === 828,
    `DeepSeek 拖拽夹紧：最小 ${minimum.width}x${minimum.height}；最大 ${maximum.width}x${maximum.height}`);

  panelChat.state.maximized = false;
  panelChat.setPanelSize(500, 500);
  storageWrites.length = 0;
  const normalSize = panelChat.panelSize();
  const maximizedSize = panelChat.togglePanelMaximize();
  const maximizedPressed = panelElements.maximize.getAttribute("aria-pressed");
  panelWindow.innerWidth = 800;
  panelWindow.innerHeight = 600;
  for (const listener of windowListeners.get("resize") || []) listener();
  const clampedMaximizedSize = panelChat.panelSize();
  const rememberedSize = { ...panelChat.state.preMaximizeSize };
  const restoredSize = panelChat.togglePanelMaximize();
  const restoredPressed = panelElements.maximize.getAttribute("aria-pressed");
  check(normalSize.width === 500 && normalSize.height === 500 && maximizedSize.width === 900 && maximizedSize.height === 828 &&
    clampedMaximizedSize.width === 768 && clampedMaximizedSize.height === 552 && rememberedSize.width === 500 && rememberedSize.height === 500 &&
    restoredSize.width === 500 && restoredSize.height === 500 && maximizedPressed === "true" && restoredPressed === "false",
    `DeepSeek 放大序列：${normalSize.width}x${normalSize.height} → ${maximizedSize.width}x${maximizedSize.height} → 窗口夹紧 ${clampedMaximizedSize.width}x${clampedMaximizedSize.height} → 还原 ${restoredSize.width}x${restoredSize.height}`);

  panelElements.header.dispatch("dblclick", { target: panelElements.header });
  const doubleClickMaximized = panelChat.state.maximized;
  panelElements.header.dispatch("dblclick", { target: panelElements.header });
  const doubleClickRestored = !panelChat.state.maximized && panelChat.panelSize().width === 500 && panelChat.panelSize().height === 500;
  check(doubleClickMaximized && doubleClickRestored,
    `DeepSeek 双击标题栏放大/还原：放大=${doubleClickMaximized}，还原=${doubleClickRestored}`);

  panel.style.right = "999px";
  panel.style.bottom = "999px";
  for (const listener of windowListeners.get("resize") || []) listener();
  const clampedTopLeftRect = panel.getBoundingClientRect();
  panel.style.right = "-100px";
  panel.style.bottom = "-100px";
  for (const listener of windowListeners.get("resize") || []) listener();
  const clampedBottomRightRect = panel.getBoundingClientRect();
  check(clampedTopLeftRect.left >= 0 && clampedTopLeftRect.top >= 0 &&
    clampedBottomRightRect.right <= panelWindow.innerWidth && clampedBottomRightRect.bottom <= panelWindow.innerHeight,
  `DeepSeek 越界夹紧：左上 (${clampedTopLeftRect.left},${clampedTopLeftRect.top})；右下 (${clampedBottomRightRect.right},${clampedBottomRightRect.bottom}) / 视口 ${panelWindow.innerWidth}x${panelWindow.innerHeight}`);
} catch (error) {
  fail(`DeepSeek 面板拖拽/放大 DOM 桩自检：${error.stack || error.message}`);
}

try {
  const values = new Map([["csyntax.deepseek.apiKey", "sk-test-only"]]);
  const requests = [];
  let responseStatus = 200;
  let responseBody = JSON.stringify({ choices: [{ message: { content: "【题目】桩返回的新题" } }] });
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const requestContext = {
    window: {
      localStorage,
      C_SYNTAX_ENTRIES: [{ id: "score-entry", name: "复合赋值" }]
    },
    console: { warn() {} },
    AbortController,
    setTimeout,
    clearTimeout,
    fetch(url, options) {
      requests.push({ url, body: JSON.parse(options.body) });
      return Promise.resolve({
        ok: responseStatus >= 200 && responseStatus < 300,
        status: responseStatus,
        text: () => Promise.resolve(responseBody)
      });
    }
  };
  vm.createContext(requestContext);
  vm.runInContext(chatSource, requestContext, { filename: "chat.js" });
  const requestChat = requestContext.window.C_SYNTAX_CHAT;
  const exercise = {
    title: "连续更新分数",
    prompt: "从 10 分开始连续更新",
    requirements: ["依次使用 += 与 *=", "逐行输出"],
    difficulty: 2,
    entryIds: ["score-entry"]
  };
  const outputWindow = { hidden: true, textContent: "" };
  await requestChat.generateExercises({
    exercise,
    count: 3,
    note: "只练复合赋值",
    onDone(text) { outputWindow.hidden = false; outputWindow.textContent = text; }
  });
  const generateRequest = requests[0]?.body;
  check(requests.length === 1 && generateRequest?.model === "deepseek-flash" && generateRequest.max_tokens >= 4000 &&
    /出题模式/.test(generateRequest.messages[0].content) && /gcc -std=c11/.test(generateRequest.messages[0].content) &&
    /不要用 scanf/.test(generateRequest.messages[0].content) && /tmpfile/.test(generateRequest.messages[0].content) &&
    /连续更新分数/.test(generateRequest.messages[1].content) && /从 10 分开始连续更新/.test(generateRequest.messages[1].content) &&
    /依次使用 \+= 与 \*=/.test(generateRequest.messages[1].content) && /题量：3/.test(generateRequest.messages[1].content) &&
    /关联词条：复合赋值/.test(generateRequest.messages[1].content),
    "fetch 桩收到的出题请求体含 system 硬约束、练习上下文、关联词条与题量");
  check(!outputWindow.hidden && outputWindow.textContent === "【题目】桩返回的新题",
    "fetch 成功后结果窗口显示桩返回的纯文本");

  responseStatus = 401;
  responseBody = "Authentication Fails";
  let readableError = "";
  await requestChat.generateExercises({ exercise, count: 1, onError(message) { readableError = message; } });
  check(/API Key 无效/.test(readableError) && /401/.test(readableError), "fetch 桩返回 401 时显示 mapError 的中文可读提示");

  values.delete("csyntax.deepseek.apiKey");
  const requestCountBeforeNoKey = requests.length;
  let noKeyError = "";
  await requestChat.generateExercises({ exercise, count: 1, onError(message) { noKeyError = message; } });
  check(requests.length === requestCountBeforeNoKey && /请先填入 API Key/.test(noKeyError),
    "无 Key 时不发送出题请求并给出可读提示");
} catch (error) {
  fail(`出题请求 fetch 桩自检：${error.stack || error.message}`);
}

const compiler = findCompiler();
if (!compiler.command) {
  skippedExamples = entries.length;
  console.log(`SKIP gcc 示例编译：未找到 CC、gcc、cc 或预设 MinGW gcc，跳过 ${skippedExamples} 条`);
  for (const diagnostic of compiler.diagnostics) console.log(`WARN 编译器候选 ${diagnostic}`);
  console.log("WARN 示例编译没有通过也没有失败；请在安装 C 编译器的环境复核。");
} else {
  const compileErrors = [];
  for (const entry of entries) {
    const sourcePath = join(tempDirectory, `${entry.id}.c`);
    writeFileSync(sourcePath, entry.example, "utf8");
    const execution = runCommand(compiler.command, ["-std=c11", "-Wall", "-Wextra", "-fsyntax-only", sourcePath]);
    if (execution.result.error) compileErrors.push(`${entry.id}: 无法执行，${spawnErrorDetail(execution.result.error)}`);
    else if (execution.result.status !== 0 || execution.output) {
      compileErrors.push(`${entry.id}: ${execution.output || `退出码 ${execution.result.status}`}`);
    }
  }
  check(compileErrors.length === 0, `gcc 逐条零错误零告警编译（${entries.length} 条，编译器 ${compiler.display}）`,
    compileErrors.join(" | "));
}

cleanupTempDirectory();
process.removeListener("exit", cleanupTempDirectory);

console.log("--- 自检汇总 ---");
console.log(`词条：${entries.length}；练习：${exercises.length}；分类：${categories.length}；示例跳过：${skippedExamples}；失败：${failures}`);
console.log(categories.map(category => `${category}=${categoryCounts[category]}`).join("；"));
if (failures > 0) {
  console.log("FAIL 自检未通过");
  process.exitCode = 1;
} else console.log("PASS 自检通过");
