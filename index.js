#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const { orchestrator } = require("./agents/orchestrator");
const { plannerAgent } = require("./agents/plannerAgent");
const { feAgent } = require("./agents/feAgent");
const { qaAgent } = require("./agents/qaAgent");
const { models } = require("./agents/chatAgent");
const { calculateCost, saveUsageHistory, printUsageHistory, printCostReport } = require("./utils/usage");
const { parseFiles, createFiles, resolveOutputDir } = require("./utils/files");
const { divider, printRunStart, printFileStart, printComplete, printError, printBanner, printChatBanner, printExit, printHelp, printChatResponse } = require("./utils/logger");

async function runAgent(userRequest) {
  printRunStart(userRequest);

  const usages = [];

  try {
    const plan = await orchestrator(userRequest);
    usages.push({ agent: "🎯 Orchestrator", ...plan.usage });

    if (plan.type === "chat") {
      printChatResponse(plan.response);
      return;
    }

    divider();

    const { result: plannerResult, usage: plannerUsage } = await plannerAgent(plan.tasks.planner);
    usages.push({ agent: "📋 기획 Agent", ...plannerUsage });
    divider();

    const { result: feResult, usage: feUsage } = await feAgent(plan.tasks.frontend, plannerResult);
    usages.push({ agent: "⚛️  FE Agent", ...feUsage });
    divider();

    const { result: qaResult, usage: qaUsage } = await qaAgent(plan.tasks.qa, feResult);
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
      const totalCostUSD = usages.reduce((acc, { model, input, output }) => {
        return acc + calculateCost(model, input, output);
      }, 0);
      saveUsageHistory(usages, totalCostUSD);
      printCostReport(usages);
    }
  }
}

async function devMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printBanner();

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

      await runAgent(request);
      ask();
    });
  };

  ask();
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

      try {
        const { reply, updatedMessages, usage } = await models[selectedModel].chat(messages, request);
        messages = updatedMessages;
        usages.push({ agent: "💬 Chat", ...usage });
        printChatResponse(reply);
        await saveUsageHistory([{ agent: "💬 Chat", ...usage }], calculateCost(usage.model, usage.input, usage.output));
      } catch (error) {
        printError(error.message);
      }

      ask();
    });
  };

  ask();
}

async function main() {
  const args = process.argv[2];

  if (args === "dev") {
    await devMode();
    return;
  }

  if (args === "chat") {
    await chatMode();
    return;
  }

  if (args === "--usage") {
    await printUsageHistory();
    return;
  }

  printHelp();
  process.exit(1);
}

main();
