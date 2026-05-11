const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".tak-agent");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function applyConfig() {
  const config = loadConfig();
  Object.entries(config).forEach(([key, value]) => {
    if (!process.env[key] && value) {
      process.env[key] = value;
    }
  });
}

function saveConfig(updates) {
  const existing = loadConfig();
  const merged = { ...existing, ...updates };
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
}

function hasRequiredKeys() {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}

module.exports = { loadConfig, applyConfig, saveConfig, hasRequiredKeys, CONFIG_PATH };
