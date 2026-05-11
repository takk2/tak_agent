#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const readline = require("readline");

// 1. 글로벌 config 적용 (~/.tak-agent/config.json)
const { applyConfig, loadConfig, saveConfig, hasRequiredKeys, CONFIG_PATH } = require("./utils/config");
applyConfig();

// 2. 로컬 .env 가 있으면 오버라이드 (하위 호환)
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { orchestrator } = require("./agents/orchestrator");
const { plannerAgent } = require("./agents/plannerAgent");
const { feAgent } = require("./agents/feAgent");
const { qaAgent } = require("./agents/qaAgent");
const { models } = require("./agents/chatAgent");
const { calculateCost, saveUsageHistory, printUsageHistory, printUsageSummary, printCostReport, checkBudget, printRemainingBudget } = require("./utils/usage");
const { parseFiles, createFiles, resolveOutputDir } = require("./utils/files");
const { scanProjectContext } = require("./utils/projectContext");
const { divider, printRunStart, printFileStart, printComplete, printError, printBanner, printChatBanner, printExit, printHelp, printChatResponse, printInitBanner, printInitDone, printNoConfig } = require("./utils/logger");

async function runAgent(userRequest, projectContext = null) {
  await checkBudget();
  printRunStart(userRequest);

  const usages = [];

  try {
    const plan = await orchestrator(userRequest, projectContext);
    usages.push({ agent: "🎯 Orchestrator", ...plan.usage });

    if (plan.type === "chat") {
      printChatResponse(plan.response);
      return;
    }

    divider();

    const { result: plannerResult, usage: plannerUsage } = await plannerAgent(plan.tasks.planner, projectContext);
    usages.push({ agent: "📋 기획 Agent", ...plannerUsage });
    divider();

    const { result: feResult, usage: feUsage } = await feAgent(plan.tasks.frontend, plannerResult, projectContext);
    usages.push({ agent: "⚛️  FE Agent", ...feUsage });
    divider();

    const { result: qaResult, usage: qaUsage } = await qaAgent(plan.tasks.qa, feResult, projectContext);
    usages.push({ agent: "✅ QA Agent", ...qaUsage });
    divider();

    const outputDir = resolveOutputDir();
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    printFileStart();
    const files = parseFiles(feResult);
    const createdFiles = createFiles(files, outputDir);

    fs.writeFileSync(path.join(outputDir, "QA_REVIEW.md"), qaResult, "utf-8");
    console.log(`   📄 QA_REVIEW.md`);

    fs.writeFileSync(path.join(outputDir, "PLAN.md"), plannerResult, "utf-8");
    console.log(`   📄 PLAN.md`);

    printComplete(outputDir, createdFiles.length);
  } catch (error) {
    printError(error.message);
  } finally {
    if (usages.length > 0) {
      const totalCostUSD = usages.reduce((acc, { model, input, output, cacheRead = 0, cacheWrite = 0 }) => {
        return acc + calculateCost(model, input, output, cacheRead, cacheWrite);
      }, 0);
      await saveUsageHistory(usages, totalCostUSD);
      printCostReport(usages);
      await printRemainingBudget();
    }
  }
}

async function devMode() {
  if (!hasRequiredKeys()) {
    printNoConfig();
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 프로젝트 컨텍스트 최초 1회 스캔
  const { context: projectContext, detected } = scanProjectContext();
  printBanner(detected);

  const ask = () => {
    rl.question("어떤 기능을 만들까요?\n> ", async (input) => {
      const request = input.trim();

      if (request === "exit") {
        printExit();
        rl.close();
        return;
      }

      if (request === "--usage") {
        printUsageHistory();
        ask();
        return;
      }

      if (!request) {
        ask();
        return;
      }

      await runAgent(request, projectContext);
      ask();
    });
  };

  ask();
}

async function initMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  printInitBanner(CONFIG_PATH);

  const current = loadConfig();
  const mask = (val) => (val ? val.slice(0, 8) + "..." : null);

  const promptKey = async (num, total, label, key, defaultVal = "") => {
    const cur = current[key] || process.env[key];
    const curDisplay = cur ? `현재: ${mask(cur)} (엔터로 유지)` : "미설정 (엔터로 건너뜀)";
    console.log(`[${num}/${total}] ${label}`);
    console.log(curDisplay);
    const val = (await question("> ")).trim();
    console.log();
    return val || cur || defaultVal;
  };

  const updates = {};

  updates.ANTHROPIC_API_KEY = await promptKey(1, 6, "Anthropic API Key (Claude)", "ANTHROPIC_API_KEY");
  updates.GEMINI_API_KEY = await promptKey(2, 6, "Google API Key (Gemini)", "GEMINI_API_KEY");
  updates.OPENAI_API_KEY = await promptKey(3, 6, "OpenAI API Key (GPT)", "OPENAI_API_KEY");

  console.log("─".repeat(40));
  console.log("📊 사용량 원격 저장 설정 (선택사항)");
  console.log("   미설정 시 ~/.tak-agent/usage.json 에 로컬 저장됩니다.\n");

  updates.SUPABASE_URL = await promptKey(4, 6, "Supabase URL", "SUPABASE_URL");
  updates.SUPABASE_PUBLISHABLE_KEY = await promptKey(5, 6, "Supabase Publishable Key", "SUPABASE_PUBLISHABLE_KEY");
  updates.DEVICE_NAME = await promptKey(6, 6, "디바이스 이름 (사용량 구분용, 기본값: 컴퓨터 이름)", "DEVICE_NAME");

  // 빈 값 제거
  Object.keys(updates).forEach((k) => {
    if (!updates[k]) delete updates[k];
  });

  saveConfig(updates);
  printInitDone(CONFIG_PATH);
  rl.close();
}

async function chatMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printChatBanner();

  // 모델 선택
  const selectedModel = await new Promise((resolve) => {
    const ask = () => {
      rl.question("어떤 AI와 대화할까요?\n1. Claude\n2. Gemini\n3. GPT\n> ", (input) => {
        const map = { "1": "claude", "2": "gemini", "3": "gpt" };
        const model = map[input.trim()];
        if (!model) {
          console.log("❌ 1, 2, 3 중에서 선택해주세요.\n");
          ask();
          return;
        }
        resolve(model);
      });
    };
    ask();
  });

  const modelName = models[selectedModel].label;
  console.log(`\n✅ ${modelName}와 대화를 시작합니다. (종료: exit)\n`);

  const usages = [];
  let messages = [];

  const ask = () => {
    rl.question("무엇이든 물어보세요!\n> ", async (input) => {
      const request = input.trim();

      if (request === "exit") {
        if (usages.length > 0) {
          printCostReport(usages);
        }
        printExit();
        rl.close();
        return;
      }

      if (request === "--usage") {
        await printUsageHistory();
        ask();
        return;
      }

      if (!request) {
        ask();
        return;
      }

      await checkBudget();

      try {
        const { reply, updatedMessages, usage } = await models[selectedModel].chat(messages, request);
        messages = updatedMessages;
        usages.push({ agent: "💬 Chat", ...usage });
        printChatResponse(reply);
        await saveUsageHistory([{ agent: "💬 Chat", ...usage }], calculateCost(usage.model, usage.input, usage.output, usage.cacheRead, usage.cacheWrite));
        await printRemainingBudget();
      } catch (error) {
        printError(error.message);
      }

      ask();
    });
  };

  ask();
}

async function usageMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const afterView = (back) => {
    console.log("\n1. 이전 메뉴  2. 종료");
    rl.question("> ", (input) => {
      const choice = input.trim();
      if (choice === "1") {
        back();
      } else if (choice === "2") {
        rl.close();
      } else {
        console.log("❌ 1 또는 2를 선택해주세요.");
        afterView(back);
      }
    });
  };

  const show = () => {
    console.log("\n📊 사용량 조회");
    console.log("─".repeat(30));
    console.log("1. 누적 사용량");
    console.log("2. 디바이스별 조회");
    console.log("3. 유저별 조회");
    console.log("0. 종료");
    console.log("─".repeat(30));

    rl.question("> ", async (input) => {
      const choice = input.trim();

      if (choice === "1") {
        await printUsageSummary();
        afterView(show);
      } else if (choice === "2") {
        await printUsageHistory();
        afterView(show);
      } else if (choice === "3") {
        console.log("\n🚧 준비중입니다.");
        afterView(show);
      } else if (choice === "0") {
        rl.close();
      } else {
        console.log("❌ 0~3 중에서 선택해주세요.");
        show();
      }
    });
  };

  show();
}

async function main() {
  const args = process.argv[2];

  if (args === "init") {
    await initMode();
    return;
  }

  if (args === "dev") {
    await devMode();
    return;
  }

  if (args === "chat") {
    await chatMode();
    return;
  }

  if (args === "--usage") {
    await usageMenu();
    return;
  }

  printHelp();
  process.exit(1);
}

main();
