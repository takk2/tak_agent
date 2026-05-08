#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const { orchestrator } = require("./agents/orchestrator");
const { plannerAgent } = require("./agents/plannerAgent");
const { feAgent } = require("./agents/feAgent");
const { qaAgent } = require("./agents/qaAgent");
const { calculateCost, saveUsageHistory, printUsageHistory, printCostReport } = require("./utils/usage");
const { parseFiles, createFiles, resolveOutputDir } = require("./utils/files");
const { divider, printRunStart, printFileStart, printComplete, printError, printBanner, printExit, printHelp } = require("./utils/logger");

async function runAgent(userRequest) {
  printRunStart(userRequest);

  const usages = [];

  try {
    const plan = await orchestrator(userRequest);
    usages.push({ agent: "🎯 Orchestrator", ...plan.usage });
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

async function interactiveMode() {
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

async function main() {
  const args = process.argv[2];

  if (args === "start") {
    await interactiveMode();
    return;
  }

  if (args === "--usage") {
    printUsageHistory();
    return;
  }

  if (!args) {
    printHelp();
    process.exit(1);
  }

  await runAgent(args);
}

main();
