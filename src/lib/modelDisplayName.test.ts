import { formatModelDisplayName } from "./modelDisplayName";

const cases: Array<{ id: string; expected: string }> = [
  { id: "google/gemma-3-4b", expected: "Gemma 3" },
  { id: "openai/gpt-oss-20b", expected: "GPT" },
  { id: "google/gemini-2.0-flash-exp", expected: "Gemini 2.0" },
  { id: "meta-llama/llama-3.1-8b-instruct", expected: "Llama 3.1" },
  { id: "mistralai/mistral-7b-instruct", expected: "Mistral" },
  { id: "Qwen/Qwen2.5-7B-Instruct", expected: "Qwen 2.5" },
  { id: "deepseek/deepseek-r1", expected: "DeepSeek R1" },
  { id: "some-vendor/custom-model-v2", expected: "Custom Model V2" },
];

let failed = 0;
for (const { id, expected } of cases) {
  const got = formatModelDisplayName(id);
  if (got !== expected) {
    console.error(`FAIL: ${id}\n  expected: ${expected}\n  got:      ${got}`);
    failed++;
  }
}

if (failed > 0) {
  throw new Error(`${failed} model display name test(s) failed`);
}

console.log(`All ${cases.length} model display name tests passed.`);
