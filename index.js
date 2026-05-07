require("dotenv").config();
const { orchestrator } = require("./agents/orchestrator");
const { plannerAgent } = require("./agents/plannerAgent");
const { feAgent } = require("./agents/feAgent");
const { qaAgent } = require("./agents/qaAgent");
const fs = require("fs");
const path = require("path");

// FE Agent 결과에서 파일 파싱
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

// 실제 파일 생성
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

async function main() {
  const userRequest = process.argv[2];

  if (!userRequest) {
    console.log('❌ 사용법: node index.js "만들고 싶은 기능"');
    process.exit(1);
  }

  console.log("🚀 AI 팀 시작!\n");
  console.log(`📌 요청: ${userRequest}\n`);
  console.log("─".repeat(50));

  try {
    // 1. Orchestrator
    const plan = await orchestrator(userRequest);
    console.log("─".repeat(50));

    // 2. Planner Agent
    const plannerResult = await plannerAgent(plan.tasks.planner);
    console.log("─".repeat(50));

    // 3. FE Agent
    const feResult = await feAgent(plan.tasks.frontend, plannerResult);
    console.log("─".repeat(50));

    // 4. QA Agent
    const qaResult = await qaAgent(plan.tasks.qa, feResult);
    console.log("─".repeat(50));

    // 타임스탬프 폴더 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join("./output", timestamp);
    fs.mkdirSync(outputDir, { recursive: true });

    // 파일 파싱 및 생성
    console.log("\n📁 파일 생성 중...\n");
    const files = parseFiles(feResult);
    const createdFiles = createFiles(files, outputDir);

    // QA 리뷰 저장
    fs.writeFileSync(path.join(outputDir, "QA_REVIEW.md"), qaResult, "utf-8");
    console.log(`   📄 QA_REVIEW.md`);

    // 기획서 저장
    fs.writeFileSync(path.join(outputDir, "PLAN.md"), plannerResult, "utf-8");
    console.log(`   📄 PLAN.md`);

    console.log("\n🎉 완료!");
    console.log(`📁 결과물 폴더: ./output/${timestamp}`);
    console.log(`📄 생성된 파일: ${createdFiles.length}개`);
    console.log("─".repeat(50));
  } catch (error) {
    console.error("❌ 에러:", error.message);
  }
}

main();
