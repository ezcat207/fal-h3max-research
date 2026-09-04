# H3 Max API 最小 demo

验证 fal 的 H3 Max 文生视频 API 能否打通，并做最小真调用。

## 现状
- ✅ 连通性已验证：`probe.mjs` 无鉴权返回 **HTTP 401**（端点存在、slug 正确，只差 key）。
- ✅ 真调用代码就绪：`generate.mjs`（官方 `@fal-ai/client`）。

## 用法
```bash
npm install

# 1) 连通性探测（不需要 key）
npm run probe

# 2) 真生成（需要 key，480P/5s 约 $0.25/片）
export FAL_KEY=你的key            # fal.ai 注册后领
npm run probe                    # 带 key 会额外验证 key 有效性
npm run generate -- "a cyberpunk cat DJ hosting a late-night tech news show"

# 可选：换清晰度/时长
RES=768P DUR=10 npm run generate -- "your prompt"
```

## 文件
- `probe.mjs` — 连通性/鉴权探测（判定 401=打通 / 404=slug错 / 网络错=不可达）
- `generate.mjs` — 文生视频真调用，保存 mp4，打印墙钟耗时与成本估算

## API 规格（来自 fal.ai 文档）
- 端点：`minimax/h3-max/text-to-video` ｜ REST：`https://queue.fal.run/...`
- 鉴权：`Authorization: Key <FAL_KEY>` 或环境变量 `FAL_KEY`
- 入参：`prompt`(必填) · `prompt_expansion_mode`(balanced/quality) · `duration`(默认5) · `resolution`(480P/768P) · `aspect_ratio`(16:9 等) · `seed` · `enable_safety_checker`
- 出参：`video.url` / `video.file_size` / `expanded_prompt`
- 价格：480P ~$0.05/秒 · 768P ~$0.08/秒（首发 14 天促销 768P ~$0.04/秒）
