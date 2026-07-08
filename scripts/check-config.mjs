import 'dotenv/config.js';

const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const apiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
const onlineTestOnly = process.env.ONLINE_TEST_ONLY !== '0';

console.log('Configuration looks valid.');
console.log(`Model: ${model}`);
console.log(`API configured: ${apiConfigured ? 'YES' : 'NO'}`);
console.log(`Online-only mode: ${onlineTestOnly ? 'ON' : 'OFF'}`);

if (!apiConfigured) {
  console.log('Online mode is disabled until ANTHROPIC_API_KEY is configured.');
}
