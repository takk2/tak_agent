const fs = require("fs");
const path = require("path");

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "out", "coverage", ".turbo", ".cache"]);

function getDirectoryTree(dir, maxDepth = 3, currentDepth = 0, prefix = "") {
  if (currentDepth >= maxDepth) return "";

  let result = "";
  try {
    const items = fs.readdirSync(dir).filter((item) => !item.startsWith(".") && !SKIP_DIRS.has(item));
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const itemPath = path.join(dir, item);
      const isDir = fs.statSync(itemPath).isDirectory();
      result += `${prefix}${connector}${item}${isDir ? "/" : ""}\n`;
      if (isDir) {
        result += getDirectoryTree(itemPath, maxDepth, currentDepth + 1, prefix + (isLast ? "    " : "│   "));
      }
    });
  } catch {}

  return result;
}

function scanProjectContext() {
  const cwd = process.cwd();
  const sections = [];
  const detected = [];

  // package.json → 기술 스택 파악
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const depList = Object.keys(deps).join(", ");
      sections.push(`## 프로젝트 정보\n- 이름: ${pkg.name || "unknown"}\n- 의존성: ${depList}`);
      detected.push(`package.json (${Object.keys(deps).length}개 의존성)`);
    } catch {}
  }

  // 규칙 파일 (CLAUDE.md, AGENTS.md, .cursorrules 등)
  const ruleFiles = ["CLAUDE.md", "AGENTS.md", ".cursorrules", "DEVELOPMENT.md"];
  for (const file of ruleFiles) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8").slice(0, 3000);
        sections.push(`## 프로젝트 규칙 (${file})\n${content}`);
        detected.push(file);
      } catch {}
    }
  }

  // README (첫 500자)
  const readmePath = path.join(cwd, "README.md");
  if (fs.existsSync(readmePath)) {
    try {
      const content = fs.readFileSync(readmePath, "utf-8").slice(0, 500);
      sections.push(`## 프로젝트 개요 (README)\n${content}`);
      detected.push("README.md");
    } catch {}
  }

  // tsconfig.json
  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    try {
      const content = fs.readFileSync(tsconfigPath, "utf-8");
      sections.push(`## TypeScript 설정\n\`\`\`json\n${content}\n\`\`\``);
      detected.push("tsconfig.json");
    } catch {}
  }

  // 디렉토리 구조 (src/ 또는 app/ 우선)
  const candidates = ["src", "app"];
  for (const dirName of candidates) {
    const dirPath = path.join(cwd, dirName);
    if (fs.existsSync(dirPath)) {
      const tree = getDirectoryTree(dirPath, 3);
      sections.push(`## 디렉토리 구조 (${dirName}/)\n${dirName}/\n${tree}`);
      detected.push(`${dirName}/ 구조`);
      break;
    }
  }

  if (sections.length === 0) return { context: null, detected: [] };

  const context = `=== 현재 프로젝트 컨텍스트 ===\n\n${sections.join("\n\n")}`;
  return { context, detected };
}

module.exports = { scanProjectContext };
