// 最小真调用：用官方 @fal-ai/client 调 H3 Max 文生视频，取回并保存 mp4，打印耗时与成本估算。
// 用法：
//   cd demo && npm install
//   export FAL_KEY=你的key
//   npm run generate -- "a neon cyberpunk cat DJ on a rooftop, cinematic"
//
// 成本：480P 约 $0.05/秒、768P 约 $0.08/秒（首发促销期 768P 约 $0.04/秒）。
// 每天前 5 条网站免费额度不适用于 API。默认 5 秒 480P，成本约 $0.25（最小化验证花费）。

import { fal } from "@fal-ai/client";
import { writeFile } from "node:fs/promises";

const key = process.env.FAL_KEY;
if (!key) { console.error("❌ 请先 export FAL_KEY=你的key"); process.exit(1); }
fal.config({ credentials: key });

const prompt = process.argv.slice(2).join(" ") ||
  "a friendly virtual host waving at the camera, colorful studio background, upbeat";
const RESOLUTION = process.env.RES || "480P";     // 480P 省钱；768P 更清晰
const DURATION = Number(process.env.DUR || 5);
const RATE = RESOLUTION === "768P" ? 0.08 : 0.05; // $/秒（正常价）

console.log("── H3 Max 文生视频 ──");
console.log("prompt   :", prompt);
console.log("res/dur  :", RESOLUTION, DURATION + "s", `｜预估成本 ~$${(RATE * DURATION).toFixed(2)}`);
console.log("提交中…（快于实时，通常几秒返回）\n");

const t0 = Date.now();
const result = await fal.subscribe("minimax/h3-max/text-to-video", {
  input: { prompt, prompt_expansion_mode: "balanced", duration: DURATION, resolution: RESOLUTION, aspect_ratio: "16:9" },
  logs: true,
  onQueueUpdate: (u) => {
    if (u.status === "IN_PROGRESS") (u.logs || []).forEach((l) => console.log("  ·", l.message));
  },
});
const wall = ((Date.now() - t0) / 1000).toFixed(1);

const video = result.data?.video;
if (!video?.url) { console.error("❌ 未拿到视频，原始返回：", JSON.stringify(result.data).slice(0, 300)); process.exit(1); }

console.log("\n✅ 生成完成");
console.log("墙钟耗时 :", wall + "s", "（可对比 FAL「快于实时」宣称）");
console.log("视频 URL :", video.url);
console.log("大小     :", video.file_size ? (video.file_size / 1e6).toFixed(2) + " MB" : "n/a");
if (result.data?.expanded_prompt) console.log("扩写prompt:", result.data.expanded_prompt.slice(0, 160));

// 下载保存
try {
  const buf = Buffer.from(await (await fetch(video.url)).arrayBuffer());
  const out = `h3max_${RESOLUTION}_${DURATION}s.mp4`;
  await writeFile(out, buf);
  console.log("已保存   :", out);
} catch (e) { console.log("（下载失败，可直接用上面的 URL）", e.message); }
