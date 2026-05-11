const os = require("os");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PRICING = {
  Claude: { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
  Gemini: { input: 0.3, cacheWrite: 0.08, cacheRead: 0.03, output: 2.5 },
  GPT: { input: 2.5, cacheWrite: 2.5, cacheRead: 1.25, output: 10 },
};

const BUDGET_KRW = 100_000;
const KRW_RATE = 1500;
const LOCAL_USAGE_PATH = path.join(os.homedir(), ".tak-agent", "usage.json");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function readLocalUsage() {
  if (!fs.existsSync(LOCAL_USAGE_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOCAL_USAGE_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeLocalUsage(rows) {
  const dir = path.dirname(LOCAL_USAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_USAGE_PATH, JSON.stringify(rows, null, 2), "utf-8");
}

function appendLocalUsage(newRows) {
  const existing = readLocalUsage();
  writeLocalUsage([...existing, ...newRows]);
}

function calculateCost(model, inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) {
  const price = PRICING[model];
  return (
    (inputTokens / 1_000_000) * price.input +
    (outputTokens / 1_000_000) * price.output +
    (cacheReadTokens / 1_000_000) * price.cacheRead +
    (cacheWriteTokens / 1_000_000) * price.cacheWrite
  );
}

async function getTotalCostUSD() {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.from("usage_history").select("cost_usd");
    if (error || !data) return 0;
    return data.reduce((sum, row) => sum + row.cost_usd, 0);
  }

  // 로컬 파일에서 합산
  const rows = readLocalUsage();
  return rows.reduce((sum, row) => sum + (row.cost_usd || 0), 0);
}

async function checkBudget() {
  const totalUSD = await getTotalCostUSD();
  const totalKRW = Math.round(totalUSD * KRW_RATE);
  const remainingKRW = BUDGET_KRW - totalKRW;

  if (remainingKRW <= 0) {
    console.log("\n🚫 사용 한도 초과!");
    console.log(`   설정 한도: ₩${BUDGET_KRW.toLocaleString()}`);
    console.log(`   누적 사용: ₩${totalKRW.toLocaleString()}`);
    console.log("   더 이상 사용할 수 없습니다.\n");
    process.exit(1);
  }
}

async function printRemainingBudget() {
  const totalUSD = await getTotalCostUSD();
  const totalKRW = Math.round(totalUSD * KRW_RATE);
  const percent = ((totalKRW / BUDGET_KRW) * 100).toFixed(1);

  console.log(`\n💳 예산 사용량: ${percent}%`);
}

async function saveUsageHistory(usages, totalCostUSD) {
  const device = process.env.DEVICE_NAME || os.hostname();
  const rows = usages.map(({ agent, model, input, output }) => ({
    device,
    agent,
    model,
    input_tokens: input,
    output_tokens: output,
    cost_usd: calculateCost(model, input, output),
    created_at: new Date().toISOString(),
  }));

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("usage_history").insert(rows);
    if (error) {
      console.error("Supabase 저장 실패:", error.message);
      console.log("💾 로컬에 저장합니다...");
      appendLocalUsage(rows);
    }
  } else {
    // 로컬 파일에 저장
    appendLocalUsage(rows);
  }
}

async function printUsageHistory() {
  let data;

  const supabase = getSupabase();
  if (supabase) {
    const { data: remoteData, error } = await supabase
      .from("usage_history")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("조회 실패:", error.message);
      return;
    }
    data = remoteData;
  } else {
    data = readLocalUsage();
    if (data.length > 0) {
      console.log(`💾 로컬 저장 데이터 (${LOCAL_USAGE_PATH})\n`);
    }
  }

  if (!data || data.length === 0) {
    console.log("📊 누적 사용 내역이 없어요!");
    return;
  }

  // 디바이스별 그룹핑
  const byDevice = {};
  data.forEach((row) => {
    const device = row.device || "알 수 없음";
    if (!byDevice[device]) byDevice[device] = [];
    byDevice[device].push(row);
  });

  console.log("\n📊 사용량 리포트");
  console.log("─".repeat(50));

  let grandTotalUSD = 0;

  Object.entries(byDevice).forEach(([device, rows]) => {
    const deviceTotal = rows.reduce((sum, r) => sum + r.cost_usd, 0);
    grandTotalUSD += deviceTotal;

    const chatRows = rows.filter((r) => r.agent === "💬 Chat");
    const devRows = rows.filter((r) => r.agent !== "💬 Chat");

    console.log(`\n💻 ${device}`);
    console.log(`   총 요청: ${rows.length}회 | 비용: $${deviceTotal.toFixed(4)} (₩${Math.round(deviceTotal * KRW_RATE).toLocaleString()})`);

    // 모드별 출력
    [
      { label: "💬 chat", rows: chatRows },
      { label: "⚙️  dev ", rows: devRows },
    ].forEach(({ label, rows: modeRows }) => {
      if (modeRows.length === 0) return;

      const modeCost = modeRows.reduce((sum, r) => sum + r.cost_usd, 0);

      // 모델별 집계
      const byModel = {};
      modeRows.forEach(({ model, input_tokens, output_tokens }) => {
        if (!byModel[model]) byModel[model] = { input: 0, output: 0 };
        byModel[model].input += input_tokens;
        byModel[model].output += output_tokens;
      });

      console.log(`\n   ${label}  $${modeCost.toFixed(4)} (₩${Math.round(modeCost * KRW_RATE).toLocaleString()})`);
      Object.entries(byModel).forEach(([model, { input, output }], i, arr) => {
        const isLast = i === arr.length - 1;
        const cost = calculateCost(model, input, output);
        console.log(`      ${isLast ? "└" : "├"} ${model.padEnd(8)} 입력 ${input.toLocaleString()} / 출력 ${output.toLocaleString()} → $${cost.toFixed(4)}`);
      });
    });
  });

  console.log("\n" + "─".repeat(50));
  const grandTotalKRW = Math.round(grandTotalUSD * KRW_RATE);
  const percent = ((grandTotalKRW / BUDGET_KRW) * 100).toFixed(1);

  console.log(
    `📈 누적 사용량: ₩${grandTotalKRW.toLocaleString()} / ₩${BUDGET_KRW.toLocaleString()} (${percent}%)`,
  );
  console.log("─".repeat(50));
}

function printCostReport(usages) {

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

async function printUsageSummary() {
  const totalUSD = await getTotalCostUSD();
  const totalKRW = Math.round(totalUSD * KRW_RATE);
  const percent = ((totalKRW / BUDGET_KRW) * 100).toFixed(1);

  console.log("\n📊 누적 사용량");
  console.log("─".repeat(50));
  console.log(`   총 비용: $${totalUSD.toFixed(4)} (₩${totalKRW.toLocaleString()})`);
  console.log(`   📈 ₩${totalKRW.toLocaleString()} / ₩${BUDGET_KRW.toLocaleString()} (${percent}%)`);
  console.log("─".repeat(50));
}

module.exports = {
  calculateCost,
  saveUsageHistory,
  printUsageHistory,
  printUsageSummary,
  printCostReport,
  checkBudget,
  printRemainingBudget,
};
