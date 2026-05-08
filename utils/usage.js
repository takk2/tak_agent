const fs = require("fs");
const path = require("path");

const USAGE_FILE = path.join(__dirname, "../usage.json");

const PRICING = {
  Claude: { input: 3, output: 15 },
  Gemini: { input: 0.075, output: 0.3 },
  GPT: { input: 2.5, output: 10 },
};

function calculateCost(model, inputTokens, outputTokens) {
  const price = PRICING[model];
  return (
    (inputTokens / 1_000_000) * price.input +
    (outputTokens / 1_000_000) * price.output
  );
}

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

  console.log("─".repeat(30));
  console.log(
    `📊 총 비용: $${totalCostUSD.toFixed(4)} (₩${Math.round(totalCostUSD * KRW_RATE).toLocaleString()})`,
  );
  console.log("─".repeat(50));
}

module.exports = {
  calculateCost,
  loadUsageHistory,
  saveUsageHistory,
  printUsageHistory,
  printCostReport,
};
