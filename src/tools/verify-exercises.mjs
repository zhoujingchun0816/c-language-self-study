import {
  closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, rmdirSync, writeFileSync
} from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = join(root, "tools", ".tmp");
const tempRootExisted = existsSync(tempRoot);
mkdirSync(tempRoot, { recursive: true });
const tempDirectory = mkdtempSync(join(tempRoot, "verify-exercises-"));
let captureIndex = 0;

function cleanup() {
  rmSync(tempDirectory, { recursive: true, force: true });
  if (!tempRootExisted) {
    try { rmdirSync(tempRoot); } catch (error) { /* 其它验证可能正在使用该目录。 */ }
  }
}

process.once("exit", cleanup);

function runProcess(command, args, timeout = 15000) {
  const token = captureIndex += 1;
  const stdoutPath = join(tempDirectory, `stdout-${token}.bin`);
  const stderrPath = join(tempDirectory, `stderr-${token}.bin`);
  let stdoutDescriptor;
  let stderrDescriptor;
  let result;
  try {
    stdoutDescriptor = openSync(stdoutPath, "w");
    stderrDescriptor = openSync(stderrPath, "w");
    result = spawnSync(command, args, {
      stdio: ["ignore", stdoutDescriptor, stderrDescriptor],
      windowsHide: true,
      timeout
    });
  } catch (error) {
    result = { status: null, error };
  } finally {
    if (stdoutDescriptor !== undefined) closeSync(stdoutDescriptor);
    if (stderrDescriptor !== undefined) closeSync(stderrDescriptor);
  }
  const stdout = existsSync(stdoutPath) ? readFileSync(stdoutPath) : Buffer.alloc(0);
  const stderr = existsSync(stderrPath) ? readFileSync(stderrPath) : Buffer.alloc(0);
  rmSync(stdoutPath, { force: true });
  rmSync(stderrPath, { force: true });
  return { result: result || { status: null }, stdout, stderr };
}

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
  const candidates = [process.env.CC && process.env.CC.trim(), "gcc", "cc",
    "D:\\software\\environment\\mingw64\\bin\\gcc.exe"].filter(Boolean);
  const diagnostics = [];
  for (const command of candidates) {
    const execution = runProcess(command, ["--version"]);
    if (!execution.result.error && execution.result.status === 0) {
      return { command, display: executablePath(command), diagnostics };
    }
    const detail = execution.result.error
      ? `${execution.result.error.code || "UNKNOWN"}: ${execution.result.error.message}`
      : `退出码 ${execution.result.status}`;
    diagnostics.push(`${command}: ${detail}`);
  }
  return { command: "", display: "", diagnostics };
}

function normalizeNewlines(buffer) {
  const bytes = [];
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] === 13 && buffer[index + 1] === 10) continue;
    bytes.push(buffer[index]);
  }
  return Buffer.from(bytes);
}

function diagnostics(execution) {
  return Buffer.concat([execution.stdout, execution.stderr]).toString("utf8").trim();
}

function processFailure(execution) {
  if (execution.result.error) return `${execution.result.error.code || "UNKNOWN"}: ${execution.result.error.message}`;
  if (execution.result.signal) return `被信号 ${execution.result.signal} 终止`;
  return `退出码 ${execution.result.status}`;
}

let infrastructureFailures = 0;
let exercises = [];
try {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*><\/script>/gi)]
    .map(match => match[1]).filter(file => file.startsWith("data/"));
  const context = { window: {} };
  vm.createContext(context);
  for (const file of scripts) {
    const filePath = join(root, file);
    if (!existsSync(filePath)) {
      console.log(`FAIL 数据脚本不存在：${file}`);
      infrastructureFailures += 1;
      continue;
    }
    vm.runInContext(readFileSync(filePath, "utf8"), context, { filename: file });
  }
  exercises = Array.isArray(context.window.C_SYNTAX_EXERCISES) ? context.window.C_SYNTAX_EXERCISES : [];
  if (!Array.isArray(context.window.C_SYNTAX_EXERCISES)) {
    console.log("FAIL 未导出 C_SYNTAX_EXERCISES 数组");
    infrastructureFailures += 1;
  }
} catch (error) {
  console.log(`FAIL 加载练习数据：${error.stack || error.message}`);
  infrastructureFailures += 1;
}

const compiler = findCompiler();
if (!compiler.command) {
  console.log("FAIL 未找到可用的 gcc/cc 编译器");
  compiler.diagnostics.forEach(item => console.log(`  ${item}`));
  cleanup();
  process.removeListener("exit", cleanup);
  process.exitCode = 1;
} else {
  console.log(`INFO 编译器：${compiler.display}`);
  let passed = 0;
  let failed = infrastructureFailures;
  for (const [index, exercise] of exercises.entries()) {
    const id = exercise && typeof exercise.id === "string" ? exercise.id : `exercise-${index + 1}`;
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "-");
    const solutionPath = join(tempDirectory, `${safeId}-solution.c`);
    const starterPath = join(tempDirectory, `${safeId}-starter.c`);
    const executable = join(tempDirectory, `${safeId}${process.platform === "win32" ? ".exe" : ""}`);
    const problems = [];

    if (!exercise || typeof exercise.solution !== "string" || typeof exercise.expectedOutput !== "string") {
      problems.push("solution 或 expectedOutput 缺失/类型错误");
    } else {
      writeFileSync(solutionPath, exercise.solution, "utf8");
      const syntax = runProcess(compiler.command, ["-std=c11", "-Wall", "-Wextra", "-fsyntax-only", solutionPath]);
      const syntaxOutput = diagnostics(syntax);
      if (syntax.result.error || syntax.result.status !== 0 || syntaxOutput) {
        problems.push(`solution 零告警检查失败：${syntaxOutput || processFailure(syntax)}`);
      }
    }

    if (exercise && typeof exercise.starter === "string" && exercise.starter.trim()) {
      writeFileSync(starterPath, exercise.starter, "utf8");
      const starter = runProcess(compiler.command, ["-std=c11", "-Wall", "-Wextra", "-fsyntax-only", starterPath]);
      const starterOutput = diagnostics(starter);
      if (starter.result.error || starter.result.status !== 0 || starterOutput) {
        problems.push(`starter 零告警检查失败：${starterOutput || processFailure(starter)}`);
      }
    }

    if (!problems.length) {
      const build = runProcess(compiler.command, ["-std=c11", "-Wall", "-Wextra", "-o", executable, solutionPath]);
      const buildOutput = diagnostics(build);
      if (build.result.error || build.result.status !== 0 || buildOutput) {
        problems.push(`生成可执行文件失败：${buildOutput || processFailure(build)}`);
      } else {
        const run = runProcess(executable, [], 10000);
        if (run.result.error || run.result.status !== 0) {
          problems.push(`运行失败：${processFailure(run)}${run.stderr.length ? `；${run.stderr.toString("utf8").trim()}` : ""}`);
        } else if (run.stderr.length) {
          problems.push(`运行时 stderr 非空：${run.stderr.toString("utf8").trim()}`);
        } else {
          const actual = normalizeNewlines(run.stdout);
          const expected = normalizeNewlines(Buffer.from(exercise.expectedOutput, "utf8"));
          if (!actual.equals(expected)) {
            problems.push(`stdout 不一致：实际 ${JSON.stringify(actual.toString("utf8"))}；预期 ${JSON.stringify(expected.toString("utf8"))}`);
          }
        }
      }
    }

    if (problems.length) {
      failed += 1;
      console.log(`FAIL ${id}：${problems.join(" | ")}`);
    } else {
      passed += 1;
      console.log(`PASS ${id}`);
    }
  }

  console.log(`通过 ${passed} / 共 ${exercises.length}；失败 ${failed}`);
  cleanup();
  process.removeListener("exit", cleanup);
  process.exitCode = failed === 0 && passed === exercises.length ? 0 : 1;
}
