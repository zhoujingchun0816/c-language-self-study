// 由「中文关键词概念表」生成 data/keywords.generated.js
// 用法：node tools/build-keywords.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);

function loadInOrder(files) {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of files) {
    const filePath = join(root, file.replace(/\//g, "\\"));
    if (!existsSync(filePath)) continue;
    vm.runInContext(readFileSync(filePath, "utf8"), context, { filename: file });
  }
  return context.window;
}

const dataScripts = scripts.filter(s => s.startsWith("data/") && !s.includes("keywords.generated"));
const entries = loadInOrder(dataScripts).C_SYNTAX_ENTRIES;
const { concepts, overrides } = loadInOrder(["data/keyword-concepts.js"]).C_SYNTAX_KEYWORD_CONCEPTS;

// ---------- 校验概念表 ----------
const ids = entries.map(e => e.id);
const idSet = new Set(ids);
const matchesPattern = (id, pattern) => id === pattern || id.startsWith(pattern);

const unknownPatterns = [];
const conceptTermsById = new Map();
concepts.forEach((concept, index) => {
  let hits = 0;
  for (const id of ids) {
    if (concept.match.some(p => matchesPattern(id, p))) {
      hits += 1;
      if (!conceptTermsById.has(id)) conceptTermsById.set(id, []);
      conceptTermsById.get(id).push(...concept.terms);
    }
  }
  if (hits === 0) unknownPatterns.push(`#${index} ${JSON.stringify(concept.terms)} -> ${concept.match.join(", ")}`);
});
const unknownOverrideIds = Object.keys(overrides).filter(id => !idSet.has(id));

// ---------- 生成每条的关键词 ----------
const isChinese = s => /[\u4e00-\u9fff]/.test(s);
const usable = s => typeof s === "string" && s.trim().length >= 2 && s.trim().length <= 12;

const rawById = new Map();
for (const entry of entries) {
  const list = [];
  const push = value => { if (usable(value)) list.push(value.trim()); };
  (Array.isArray(entry.keywords) ? entry.keywords : []).forEach(push); // 词条内联关键词优先级最高
  (overrides[entry.id] || []).forEach(push);
  (conceptTermsById.get(entry.id) || []).forEach(push);
  entry.aliases.filter(isChinese).forEach(push);           // 已有的中文别名天然就是好关键词
  entry.aliases.filter(a => !isChinese(a)).forEach(push);  // 英文别名（如 "strcpy"）
  push(entry.name);
  rawById.set(entry.id, [...new Set(list)]);
}

// ---------- 去掉覆盖过宽的词（>32 条）----------
// 说明：「数学」「字符串」「文件」这类家族词天然会覆盖二三十条词条，属于有意义的关键词；
// 上限设 32 只用来拦住「编程」「C语言」这类放到谁身上都成立的万能词。
const WIDE_TERM_CAP = 32;
const coverage = new Map();
for (const list of rawById.values()) for (const term of list) coverage.set(term, (coverage.get(term) || 0) + 1);
const overWide = [...coverage.entries()].filter(([, n]) => n > WIDE_TERM_CAP).sort((a, b) => b[1] - a[1]);

const finalById = new Map();
const thin = [];
for (const entry of entries) {
  const inlineTerms = new Set((Array.isArray(entry.keywords) ? entry.keywords : [])
    .filter(usable).map(term => term.trim()));
  const list = rawById.get(entry.id)
    .filter(term => inlineTerms.has(term) || (coverage.get(term) || 0) <= WIDE_TERM_CAP)
    .slice(0, 8);
  finalById.set(entry.id, list);
  const chineseCount = list.filter(isChinese).length;
  if (list.length < 3 || chineseCount === 0) thin.push(`${entry.id}(${list.length} 个/中文 ${chineseCount})`);
}

// ---------- 写出 ----------
const lines = [];
lines.push("(function () {");
lines.push('  "use strict";');
lines.push("");
lines.push("  // 本文件由 tools/build-keywords.mjs 自动生成，请勿手改；要改关键词请编辑词条内联 keywords 或 data/keyword-concepts.js");
lines.push("  window.C_SYNTAX_KEYWORDS = {");
for (const id of ids) {
  lines.push(`    ${JSON.stringify(id)}: ${JSON.stringify(finalById.get(id))},`);
}
lines.push("  };");
lines.push("}());");
lines.push("");
const output = lines.join("\n");
writeFileSync(join(root, "data", "keywords.generated.js"), output, "utf8");

// ---------- 汇总 ----------
const counts = ids.map(id => finalById.get(id).length);
console.log(`词条：${ids.length}；关键词总数：${counts.reduce((a, b) => a + b, 0)}`);
console.log(`每条关键词数：最少 ${Math.min(...counts)}、最多 ${Math.max(...counts)}、平均 ${(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1)}`);
console.log(`唯一关键词：${new Set([...finalById.values()].flat()).size} 个`);
console.log(`概念规则：${concepts.length} 条；覆盖词条：${conceptTermsById.size} 条；手工 override：${Object.keys(overrides).length} 条`);
if (unknownPatterns.length) {
  console.log(`WARN 有 ${unknownPatterns.length} 条概念规则没匹配到任何词条（模式写错了？）：`);
  unknownPatterns.forEach(p => console.log("  " + p));
}
if (unknownOverrideIds.length) console.log(`WARN override 里有不存在的 id：${unknownOverrideIds.join(", ")}`);
if (overWide.length) {
  console.log(`WARN 有 ${overWide.length} 个词覆盖超过 ${WIDE_TERM_CAP} 条，已自动剔除：`);
  overWide.slice(0, 10).forEach(([term, n]) => console.log(`  ${term} ×${n}`));
}
if (thin.length) console.log(`WARN 关键词不足 3 个或缺中文的词条：${thin.join("；")}`);

// ---------- 矩阵自检 ----------
const MATRIX = [["内存", 8], ["字符串", 10], ["文件", 8], ["输入", 5], ["输出", 5], ["时间", 5], ["数学", 8],
  ["随机", 3], ["排序", 2], ["查找", 2], ["指针", 8], ["数组", 6], ["结构体", 4], ["错误", 4],
  ["类型转换", 3], ["内存泄漏", 1], ["越界", 1]];
console.log("\n--- 中文查询矩阵（按关键词命中）---");
let failed = 0;
for (const [query, min] of MATRIX) {
  const hits = entries.filter(e => finalById.get(e.id).some(k => k.includes(query))).map(e => e.id);
  const ok = hits.length >= min;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${query}：${hits.length} 条（要求 ≥${min}）${hits.length ? "，例如 " + hits.slice(0, 5).join(", ") : ""}`);
}
const mustInclude = { "内存": ["malloc-function", "calloc-function", "realloc-function", "free-function"], "文件": ["fopen-function", "fclose-function"], "排序": ["qsort-function"] };
for (const [query, required] of Object.entries(mustInclude)) {
  const hits = entries.filter(e => finalById.get(e.id).some(k => k.includes(query))).map(e => e.id);
  const missing = required.filter(r => !hits.includes(r));
  if (missing.length) { failed += 1; console.log(`FAIL ${query} 必须包含：${missing.join(", ")}`); }
  else console.log(`ok   ${query} 包含必需词条：${required.join(", ")}`);
}
console.log(failed ? `\nFAIL 矩阵未通过（${failed} 项）` : "\nPASS 矩阵通过");
process.exitCode = failed ? 1 : 0;
