import { buildPresetSpec } from "../components/CollectionSpecConfig";
import type { FileNode } from "../views/KnowledgeBaseDetail";
import type { CollectionSpec, FileListDisplayConfig, UploadFileItem } from "../types";

/** 团队知识库初始文件树（与知识库管理 mock 一致） */
export const DEFAULT_TEAM_KB_NODES: Record<string, FileNode[]> = {
  kb_credit: [
    { id: "root", parentId: null, name: "全部文件", type: "folder", updatedAt: "2026-06-11T10:12:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "系统" },
    { id: "f1", parentId: "root", name: "授信资料", type: "folder", updatedAt: "2026-06-11T10:12:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "张敏" },
    { id: "f2", parentId: "root", name: "客户经理培训", type: "folder", updatedAt: "2026-06-10T18:02:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "刘洋" },
    { id: "f3", parentId: "root", name: "历史项目复盘", type: "folder", updatedAt: "2026-06-09T14:18:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "陈宁" },
    { id: "file1", parentId: "f1", name: "授信资料补录指引.pdf", type: "document", format: "pdf", size: 3.42 * 1024 * 1024, updatedAt: "2026-06-11T09:40:00Z", governanceStatus: "pending", preprocessStatus: "pending", creator: "刘洋" },
    { id: "file2", parentId: "f2", name: "客户经理培训课件.pptx", type: "document", format: "pptx", size: 18.6 * 1024 * 1024, updatedAt: "2026-06-02T10:00:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "张敏" },
  ],
  kb_retail: [
    { id: "root", parentId: null, name: "全部文件", type: "folder", updatedAt: "2026-06-11T10:12:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "系统" },
  ],
  kb_policy: [
    { id: "root", parentId: null, name: "全部文件", type: "folder", updatedAt: "2026-05-28T16:00:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "系统" },
    { id: "pf1", parentId: "root", name: "制度修订过程稿", type: "folder", updatedAt: "2026-05-27T14:20:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "周维" },
    { id: "pf2", parentId: "root", name: "审批口径与会议纪要", type: "folder", updatedAt: "2026-05-26T11:05:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "赵主管" },
    { id: "pf3", parentId: "root", name: "版本对照材料", type: "folder", updatedAt: "2026-05-25T09:30:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "钱专员" },
    { id: "pfile1", parentId: "pf1", name: "运营客户服务管理办法_v3_征求意见稿.docx", type: "document", format: "docx", size: 1.86 * 1024 * 1024, updatedAt: "2026-05-27T14:20:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "周维", publishStatus: "archived" },
    { id: "pfile2", parentId: "pf1", name: "网点柜面操作规范_v2_修订说明.pdf", type: "document", format: "pdf", size: 2.14 * 1024 * 1024, updatedAt: "2026-05-26T17:45:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "钱专员", publishStatus: "archived" },
    { id: "pfile3", parentId: "pf1", name: "厅堂排队冲突处置指引_过程稿.pptx", type: "presentation", format: "pptx", size: 9.8 * 1024 * 1024, updatedAt: "2026-05-24T10:15:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "赵主管", publishStatus: "archived" },
    { id: "pfile4", parentId: "pf2", name: "制度修订小组_2026Q1会议纪要.docx", type: "document", format: "docx", size: 0.62 * 1024 * 1024, updatedAt: "2026-05-26T11:05:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "赵主管", publishStatus: "archived" },
    { id: "pfile5", parentId: "pf2", name: "合规部审批口径汇总表.xlsx", type: "spreadsheet", format: "xlsx", size: 0.48 * 1024 * 1024, updatedAt: "2026-05-22T15:30:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "周维", publishStatus: "archived" },
    { id: "pfile6", parentId: "pf3", name: "客户服务管理办法_新旧条款对照.xlsx", type: "spreadsheet", format: "xlsx", size: 0.92 * 1024 * 1024, updatedAt: "2026-05-25T09:30:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "钱专员", publishStatus: "archived" },
    { id: "pfile7", parentId: "pf3", name: "制度修订审批记录汇编.pdf", type: "document", format: "pdf", size: 4.6 * 1024 * 1024, updatedAt: "2026-05-20T16:00:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "周维", publishStatus: "archived" },
    { id: "pnote1", parentId: "root", name: "归档前检查清单", type: "note", format: "md", size: 12 * 1024, updatedAt: "2026-05-29T10:00:00Z", governanceStatus: "success", preprocessStatus: "success", creator: "赵主管", publishStatus: "archived" },
  ],
};

/** 已启用资料上传规范的知识库 */
export const TEAM_KB_SPEC_ENABLED_IDS = new Set(["kb_credit"]);

export function getTeamKbInitialNodes(kbId: string): FileNode[] {
  return DEFAULT_TEAM_KB_NODES[kbId] ?? [];
}

export function getTeamKbEnabledSpec(kbId: string, specOverride?: CollectionSpec | null): CollectionSpec | null {
  if (!TEAM_KB_SPEC_ENABLED_IDS.has(kbId)) return null;
  const spec = specOverride ?? buildPresetSpec();
  return spec.enabled ? spec : null;
}

export function buildTeamKbFileListDisplayConfig(
  kbId: string,
  specOverride?: CollectionSpec | null
): FileListDisplayConfig | undefined {
  const spec = getTeamKbEnabledSpec(kbId, specOverride);
  if (!spec) return undefined;
  return {
    showMaterialType: true,
    showFileTags: true,
    metadataFields: spec.metadataFields,
  };
}

export function createFileNodeFromUpload(
  item: UploadFileItem,
  batchMetadata: Record<string, string>,
  parentId = "root"
): FileNode {
  const ext = item.fileName.split(".").pop()?.toLowerCase() || "";
  let type: FileNode["type"] = "document";
  if (["xlsx", "xls"].includes(ext)) type = "spreadsheet";
  else if (["ppt", "pptx"].includes(ext)) type = "presentation";
  else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) type = "image";
  else if (["zip", "rar"].includes(ext)) type = "archive";

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    parentId,
    name: item.fileName,
    type,
    format: ext,
    size: item.file.size,
    updatedAt: new Date().toISOString(),
    governanceStatus: "pending",
    preprocessStatus: "pending",
    creator: "当前用户",
    materialType: item.materialType || undefined,
    fileTags: item.fileTags?.length ? item.fileTags : undefined,
    fileMetadata: { ...batchMetadata, ...item.fieldValues },
  };
}

/** 个人空间订阅区展示用的团队知识库摘要 */
export const PERSONAL_SPACE_TEAM_KB = {
  id: "kb_credit",
  name: "信贷运营团队资料库",
  updatedAt: "2026-06-11T10:12:00Z",
} as const;
