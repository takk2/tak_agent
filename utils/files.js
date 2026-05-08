const fs = require("fs");
const path = require("path");

function parseFiles(feResult) {
  const files = [];
  const fileRegex =
    /```(?:tsx?|typescript|javascript|jsx?)\n\/\/ (.+?)\n([\s\S]+?)```/g;

  let match;
  while ((match = fileRegex.exec(feResult)) !== null) {
    files.push({
      path: match[1].trim(),
      content: match[2].trim(),
    });
  }
  return files;
}

function createFiles(files, outputDir) {
  const createdFiles = [];

  files.forEach(({ path: filePath, content }) => {
    const fullPath = path.join(outputDir, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, "utf-8");
    createdFiles.push(fullPath);
    console.log(`   📄 ${filePath}`);
  });

  return createdFiles;
}

function resolveOutputDir() {
  const cwd = process.cwd();
  const takDir = path.resolve(path.join(__dirname, ".."));

  if (cwd === takDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return path.join(cwd, "output", timestamp);
  }

  return cwd;
}

module.exports = { parseFiles, createFiles, resolveOutputDir };
