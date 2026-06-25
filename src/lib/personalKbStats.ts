/** 各个人知识库内文件的治理状态（与 KnowledgeBaseDetail 演示数据对齐） */
export const PERSONAL_KB_FILE_GOVERNANCE: Record<string, Array<"success" | "running" | "failed" | "pending">> = {
  kb_1: ["success", "failed", "running", "success", "success", "success"],
};

export function getPersonalKbFileStats(kbIds: string[]) {
  let total = 0;
  let archived = 0;
  let governing = 0;

  for (const id of kbIds) {
    for (const status of PERSONAL_KB_FILE_GOVERNANCE[id] ?? []) {
      total++;
      if (status === "success") archived++;
      else governing++;
    }
  }

  return {
    total,
    archived,
    governing,
    archivedPct: total > 0 ? Math.round((archived / total) * 100) : 0,
  };
}
