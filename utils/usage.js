const os = require("os");
const { createClient } = require("@supabase/supabase-js");

const PRICING = {
  Claude: { input: 3, output: 15 },
  Gemini: { input: 0.075, output: 0.3 },
  GPT: { input: 2.5, output: 10 },
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function calculateCost(model, inputTokens, outputTokens) {
  const price = PRICING[model];
  return (
    (inputTokens / 1_000_000) * price.input +
    (outputTokens / 1_000_000) * price.output
  );
}

async function saveUsageHistory(usages, totalCostUSD) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("⚠️  Supabase 설정이 없어 사용량이 저장되지 않습니다.");
    return;
  }

  const rows = usages.map(({ agent, model, input, output }) => ({
    device: process.env.DEVICE_NAME || os.hostname(),
    agent,
    model,
    input_tokens: input,
    output_tokens: output,
    cost_usd: calculateCost(model, input, output),
  }));

  const { error } = await supabase.from("usage_history").insert(rows);
  if (error) console.error("Supabase 저장 실패:", error.message);
}

async function printUsageHistory() {
  const supabase = getSupabase();
  if (!supabase) {
    console.log("⚠️  Supabase 설정이 없습니다.");
    return;
  }

  const KRW_RATE = parseFloat(process.env.KRW_RATE) || 1451;

  const { data, error } = await supabase
    .from("usage_history")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("조회 실패:", error.message);
    return;
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

  console.log("\n📊 디바이스별 사용량 리포트");
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
  console.log(
    `💰 전체 누적 비용: $${grandTotalUSD.toFixed(4)} (₩${Math.round(grandTotalUSD * KRW_RATE).toLocaleString()})`,
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

  console.log("─".repeat(50));
  console.log(
    `📊 총 비용: $${totalCostUSD.toFixed(4)} (₩${Math.round(totalCostUSD * KRW_RATE).toLocaleString()})`,
  );
  console.log("─".repeat(50));
}

module.exports = {
  calculateCost,
  saveUsageHistory,
  printUsageHistory,
  printCostReport,
};
