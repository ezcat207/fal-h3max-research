// 连通性探测：不需要 FAL_KEY 也能跑。
// 目的：证明 fal 的队列端点活着、H3 Max 模型 slug 正确、我们的请求结构对。
// 判定：拿到 401/403（未授权）= 端点存在且可达（只差 key）；404 = slug 错；网络错 = 不可达。
// 如果设置了 FAL_KEY，会额外做一次带鉴权的最小提交，确认 key 有效（会产生极小额费用）。

const ENDPOINT = "https://queue.fal.run/minimax/h3-max/text-to-video";
const key = process.env.FAL_KEY;

function line() { console.log("─".repeat(56)); }

async function unauthProbe() {
  console.log("① 无鉴权探测（验证端点可达 + slug 正确）");
  console.log("   POST", ENDPOINT);
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "connectivity probe", duration: 5, resolution: "480P" }),
    });
    const status = r.status;
    let verdict;
    if (status === 401 || status === 403) verdict = "✅ 打通：端点存在且可达（返回未授权，只差有效 FAL_KEY）";
    else if (status === 404) verdict = "❌ slug 可能错了：端点返回 404（检查 minimax/h3-max/text-to-video）";
    else if (status === 200 || status === 202) verdict = "✅ 打通：端点接受了请求";
    else verdict = `⚠️ 端点可达，但返回了 HTTP ${status}`;
    console.log("   → HTTP", status, "｜", verdict);
    return status;
  } catch (e) {
    console.log("   → ❌ 网络不可达：", e.message);
    return null;
  }
}

async function authProbe() {
  line();
  console.log("② 鉴权探测（检测到 FAL_KEY，验证 key 有效性）");
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${key}` },
      body: JSON.stringify({ prompt: "a tiny test clip, blue sky", duration: 5, resolution: "480P" }),
    });
    const body = await r.json().catch(() => ({}));
    if (r.status === 200 || r.status === 202) {
      console.log("   → ✅ key 有效，已入队。request_id:", body.request_id || "(见响应)");
      console.log("   （要真正取回视频，运行：npm run generate）");
    } else if (r.status === 401 || r.status === 403) {
      console.log("   → ❌ FAL_KEY 无效或权限不足（HTTP", r.status, "）");
    } else {
      console.log("   → ⚠️ HTTP", r.status, JSON.stringify(body).slice(0, 200));
    }
  } catch (e) {
    console.log("   → ❌ 请求失败：", e.message);
  }
}

line();
console.log("fal H3 Max · 连通性探测");
line();
await unauthProbe();
if (key) await authProbe();
else { line(); console.log("② 未设置 FAL_KEY，跳过鉴权探测。"); console.log("   设置后可跑真调用：export FAL_KEY=... && npm run generate"); }
line();
