import express from "express";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Mock Database Arrays ---
const knowledgeBases = [
  { id: "kb_1", name: "个人整理资料", ownerType: "personal", visibility: "private", status: "active", updatedAt: "2026-06-08T10:00:00Z" },
  { id: "kb_2", name: "2026开门红活动", ownerType: "team", visibility: "team", status: "active", updatedAt: "2026-06-07T14:30:00Z" },
  { id: "kb_3", name: "运营制度规范", ownerType: "public", visibility: "public", status: "active", updatedAt: "2026-06-01T09:00:00Z" },
];

const subscriptions = [
  { id: "sub_1", kbId: "kb_2", sourceLabel: "team", canCancel: false, canEdit: true },
  { id: "sub_2", kbId: "kb_3", sourceLabel: "public", canCancel: false, canEdit: false },
  { id: "sub_3", kbId: "kb_4", sourceLabel: "personal", canCancel: true, canEdit: false },
];

const mockSourceFiles = [
  {
    id: "f_1",
    kbId: "kb_1",
    name: "UDA_运营平台PRD_v1.pdf",
    format: "pdf",
    size: 2048576,
    version: "v1.0",
    lifecycleStatus: "published",
    governanceStatus: "success",
    preprocessStatus: "processed",
    sliceCandidateCount: 12,
    downstreamSyncStatus: "synced",
    ownerId: "user_1",
    updatedAt: "2026-06-08T10:30:00Z",
  },
  {
    id: "f_2",
    kbId: "kb_1",
    name: "营销素材_设计稿.zip",
    format: "zip",
    size: 15485760,
    version: "v1.0",
    lifecycleStatus: "pending_confirm",
    governanceStatus: "failed",
    preprocessStatus: "failed",
    sliceCandidateCount: 0,
    downstreamSyncStatus: "not_synced",
    ownerId: "user_1",
    updatedAt: "2026-06-08T11:00:00Z",
  },
  {
    id: "f_3",
    kbId: "kb_1",
    name: "会议纪要_0607.docx",
    format: "docx",
    size: 485760,
    version: "v2.1",
    lifecycleStatus: "governing",
    governanceStatus: "running",
    preprocessStatus: "processing",
    sliceCandidateCount: 0,
    downstreamSyncStatus: "not_synced",
    ownerId: "user_1",
    updatedAt: "2026-06-08T11:30:00Z",
  }
];

const mockPreprocessDetails: Record<string, any> = {
  "f_1": {
    fileId: "f_1",
    ocrText: "UDA非结构化数据应用平台当前定位是面向行内生产数据，承接从业务系统进入的非结构化文件，并对其进行采集、存储、管理、预处理、分类、打标、质检、检索、审计等全生命周期治理。\n\n本期目标是在UDA中原生建设运营知识管理的前置能力，重点是原始非结构化数据/知识源文件管理。这里的“知识库”不是知识运营社区，也不是只存几句话的切片候选/知识碎片，而是面向运营人员可理解的源文件业务容器。",
    summary: "本文档主要阐述了UDA运营知识管理一期建设的背景、目标、定义以及核心设计原则，强调了以“源文件管理”为核心。",
    tags: ["UDA", "知识管理", "PRD", "核心制度"],
    qualityReport: {
      score: 98,
      readability: "优秀",
      issues: []
    },
    sliceCandidates: [
      { id: "slice_1", content: "UDA非结构化数据应用平台当前定位是面向行内生产数据，承接从业务系统进入的非结构化文件，并对其进行全生命周期治理。", confidence: 0.98, status: "confirmed", sourcePosition: "第1页 第一段" },
      { id: "slice_2", content: "本期目标是在UDA中原生建设运营知识管理的前置能力，重点是原始非结构化数据/知识源文件管理。", confidence: 0.85, status: "pending", sourcePosition: "第1页 第二段" }
    ]
  }
};

// --- API Routes ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.get("/api/knowledge-bases", (req, res) => {
  res.json(knowledgeBases);
});

app.get("/api/subscriptions", (req, res) => {
  // Join subscriptions with KD data for the UI
  const populated = subscriptions.map((sub) => {
    let kb = knowledgeBases.find((k) => k.id === sub.kbId);
    if (!kb) {
      kb = { id: sub.kbId, name: "张三的分享资料", ownerType: "personal", visibility: "private", status: "active", updatedAt: "2026-06-05T00:00:00Z" };
    }
    return { ...sub, knowledgeBase: kb };
  });
  res.json(populated);
});

app.get("/api/files", (req, res) => {
  const kbId = req.query.kbId;
  if (kbId) {
    res.json(mockSourceFiles.filter(f => f.kbId === kbId));
  } else {
    res.json(mockSourceFiles);
  }
});

app.get("/api/files/:id/preprocess", (req, res) => {
  const detail = mockPreprocessDetails[req.params.id];
  if (detail) {
    res.json(detail);
  } else {
    // Generate dynamic mock data based on the ID for a completed file
    res.json({
      fileId: req.params.id,
      ocrText: "【智能感知】根据您的文件流分析，本文件已于过去完成治理...\n\n# 治理详情 \n当前文件已进行脱敏，包含核心知识点识别，未发现合规异常。\n此为治理引擎基于预处理规范产出的重排版内容，消除了多余空行、无效字符和不可见水印。\n\n## 主要信息片段\n本文档包含了运营规范、操作指引等关键字段，结构清晰，可直接作为大模型检索增强检索基库。",
      summary: "系统已全自动完成该类别文档的结构化解析，确认无敏感财务数据泄漏，并且识别出了相关的行业实体，成功建立了标准索引与切分。",
      tags: ["智能解析", "自动脱敏", "知识入库", "合规达标"],
      qualityReport: { score: 95, readability: "极佳", issues: [] },
      sliceCandidates: [
        { id: `slice_${Date.now()}_1`, content: "操作指引要求所有参与测试的用户必须在安全网络环境下登录主备用管理系统进行验证。", confidence: 0.96, status: "confirmed", sourcePosition: "第1页 第三段" },
        { id: `slice_${Date.now()}_2`, content: "合规审查包含自动的关键词拦截以及二次数据模糊化，以保证客户信息100%安全落地。", confidence: 0.92, status: "confirmed", sourcePosition: "第2页 第一段" }
      ]
    });
  }
});

app.post("/api/files/:id/preprocess", (req, res) => {
  const id = req.params.id;
  const updated = req.body;
  
  if (!mockPreprocessDetails[id]) {
    mockPreprocessDetails[id] = {
      fileId: id,
      ocrText: "【智能感知】根据您的文件流分析，本文件已于过去完成治理...\n\n# 治理详情 \n当前文件已进行脱敏，包含核心知识点识别，未发现合规异常。\n此为治理引擎基于预处理规范产出的重排版内容，消除了多余空行、无效字符和不可见水印。\n\n## 主要信息片段\n本文档包含了运营规范、操作指引等关键字段，结构清晰，可直接作为大模型检索增强检索基库。",
      summary: "系统已全自动完成该类别文档的结构化解析，确认无敏感财务数据泄漏，并且识别出了相关的行业实体，成功建立了标准索引与切分。",
      tags: ["智能解析", "自动脱敏", "知识入库", "合规达标"],
      qualityReport: { score: 95, readability: "极佳", issues: [] },
      sliceCandidates: [
        { id: `slice_${Date.now()}_1`, content: "操作指引要求所有参与测试的用户必须在安全网络环境下登录主备用管理系统进行验证。", confidence: 0.96, status: "confirmed", sourcePosition: "第1页 第三段" },
        { id: `slice_${Date.now()}_2`, content: "合规审查包含自动的关键词拦截以及二次数据模糊化，以保证客户信息100%安全落地。", confidence: 0.92, status: "confirmed", sourcePosition: "第2页 第一段" }
      ]
    };
  }
  
  mockPreprocessDetails[id] = {
    ...mockPreprocessDetails[id],
    ...updated
  };
  
  res.json({ success: true, detail: mockPreprocessDetails[id] });
});

// --- Boot Server ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: false,
      server: { middlewareMode: true },
      appType: "spa",
      plugins: [react(), tailwindcss()],
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
