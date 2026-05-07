#!/usr/bin/env node

require("dotenv").config();
const { orchestrator } = require("./agents/orchestrator");
const { plannerAgent } = require("./agents/plannerAgent");
const { feAgent } = require("./agents/feAgent");
const { qaAgent } = require("./agents/qaAgent");
const fs = require("fs");
const path = require("path");

const USAGE_FILE = path.join(__dirname, "usage.json");

// 누적 사용량 불러오기
function loadUsageHistory() {
  if (!fs.existsSync(USAGE_FILE)) {
    return { totalCostUSD: 0, history: [] };
  }
  try {
    const content = fs.readFileSync(USAGE_FILE, "utf-8");
    if (!content.trim()) return { totalCostUSD: 0, history: [] };
    return JSON.parse(content);
  } catch {
    return { totalCostUSD: 0, history: [] };
  }
}

// 누적 사용량 저장
function saveUsageHistory(usages, totalCostUSD) {
  const history = loadUsageHistory();
  history.totalCostUSD += totalCostUSD;
  history.history.push({
    date: new Date().toISOString(),
    usages,
    costUSD: totalCostUSD,
  });
  fs.writeFileSync(USAGE_FILE, JSON.stringify(history, null, 2), "utf-8");
}

// 누적 사용량 출력
function printUsageHistory() {
  const history = loadUsageHistory();
  const KRW_RATE = parseFloat(process.env.KRW_RATE) || 1451;

  if (history.history.length === 0) {
    console.log("📊 누적 사용 내역이 없어요!");
    return;
  }

  console.log("\n📊 누적 사용량 리포트");
  console.log("─".repeat(50));
  history.history.forEach((entry, i) => {
    console.log(`\n[${i + 1}] ${new Date(entry.date).toLocaleString("ko-KR")}`);
    entry.usages.forEach(({ agent, model, input, output }) => {
      console.log(
        `   ${agent} (${model}) → 입력 ${input.toLocaleString()} / 출력 ${output.toLocaleString()}`,
      );
    });
    console.log(
      `   💰 $${entry.costUSD.toFixed(4)} (₩${Math.round(entry.costUSD * KRW_RATE).toLocaleString()})`,
    );
  });

  console.log("\n─".repeat(50));
  console.log(
    `💰 총 누적 비용: $${history.totalCostUSD.toFixed(4)} (₩${Math.round(history.totalCostUSD * KRW_RATE).toLocaleString()})`,
  );
  console.log("─".repeat(50));
}

// 비용 계산
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = {
    Claude: { input: 3, output: 15 },
    Gemini: { input: 0.075, output: 0.3 },
    GPT: { input: 2.5, output: 10 },
  };

  const price = pricing[model];
  const cost =
    (inputTokens / 1_000_000) * price.input +
    (outputTokens / 1_000_000) * price.output;
  return cost;
}

// 비용 리포트 출력
function printCostReport(usages) {
  const KRW_RATE = parseFloat(process.env.KRW_RATE) || 1451;

  console.log("\n💰 토큰 사용량 리포트");
  console.log("─".repeat(50));

  let totalCostUSD = 0;

  usages.forEach(({ agent, model, input, output }) => {
    const cost = calculateCost(model, input, output);
    totalCostUSD += cost;
    console.log(`${agent}`);
    console.log(`   모델: ${model}`);
    console.log(`   입력: ${input.toLocaleString()} 토큰`);
    console.log(`   출력: ${output.toLocaleString()} 토큰`);
    console.log(
      `   비용: $${cost.toFixed(4)} (₩${Math.round(cost * KRW_RATE).toLocaleString()})`,
    );
    console.log("");
  });

  console.log("─".repeat(50));
  console.log(
    `📊 총 비용: $${totalCostUSD.toFixed(4)} (₩${Math.round(totalCostUSD * KRW_RATE).toLocaleString()})`,
  );
  console.log("─".repeat(50));
}

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
    console.log('❌ 사용법: tak "만들고 싶은 기능"');
    console.log("📊 사용량 조회: tak --usage");
    process.exit(1);
  }

  // 누적 사용량 조회 모드
  if (userRequest === "--usage") {
    printUsageHistory();
    return;
  }

  console.log("🚀 AI 팀 시작!\n");
  console.log(`📌 요청: ${userRequest}\n`);
  console.log("─".repeat(50));

  const usages = [];

  try {
    // 1. Orchestrator
    const plan = await orchestrator(userRequest);
    usages.push({ agent: "🎯 Orchestrator", ...plan.usage });
    console.log("─".repeat(50));

    // 2. Planner Agent
    const { result: plannerResult, usage: plannerUsage } = await plannerAgent(
      plan.tasks.planner,
    );
    usages.push({ agent: "📋 기획 Agent", ...plannerUsage });
    console.log("─".repeat(50));

    // 3. FE Agent
    const { result: feResult, usage: feUsage } = await feAgent(
      plan.tasks.frontend,
      plannerResult,
    );
    usages.push({ agent: "⚛️  FE Agent", ...feUsage });
    console.log("─".repeat(50));

    // 4. QA Agent
    const { result: qaResult, usage: qaUsage } = await qaAgent(
      plan.tasks.qa,
      feResult,
    );
    usages.push({ agent: "✅ QA Agent", ...qaUsage });
    console.log("─".repeat(50));

    // 타임스탬프 폴더 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join("./output", timestamp);
    fs.mkdirSync(outputDir, { recursive: true });

    // 파일 파싱 및 생성
    console.log("\n📁 파일 생성 중...\n");
    const files = parseFiles(feResult);
    const createdFiles = createFiles(files, outputDir);

    fs.writeFileSync(path.join(outputDir, "QA_REVIEW.md"), qaResult, "utf-8");
    console.log(`   📄 QA_REVIEW.md`);

    fs.writeFileSync(path.join(outputDir, "PLAN.md"), plannerResult, "utf-8");
    console.log(`   📄 PLAN.md`);

    console.log("\n🎉 완료!");
    console.log(`📁 결과물 폴더: ./output/${timestamp}`);
    console.log(`📄 생성된 파일: ${createdFiles.length}개`);
  } catch (error) {
    console.error(`\n❌ 에러 발생: ${error.message}`);
    console.log("⚠️  에러 이전까지 진행된 내용의 비용을 출력합니다.");
  } finally {
    if (usages.length > 0) {
      const totalCostUSD = usages.reduce((acc, { model, input, output }) => {
        return acc + calculateCost(model, input, output);
      }, 0);
      saveUsageHistory(usages, totalCostUSD);
      printCostReport(usages);
    }
  }
}

main();
