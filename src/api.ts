import { KnowledgeBase, SourceFile, Subscription, FilePreprocessDetail } from "./types";

export const api = {
  getKnowledgeBases: async (): Promise<KnowledgeBase[]> => {
    const res = await fetch("/api/knowledge-bases");
    return res.json();
  },
  getSubscriptions: async (): Promise<Subscription[]> => {
    const res = await fetch("/api/subscriptions");
    return res.json();
  },
  getFiles: async (kbId?: string): Promise<SourceFile[]> => {
    const res = await fetch(`/api/files${kbId ? `?kbId=${kbId}` : ''}`);
    return res.json();
  },
  getFilePreprocess: async (fileId: string): Promise<FilePreprocessDetail> => {
    const res = await fetch(`/api/files/${fileId}/preprocess`);
    return res.json();
  },
  updateFilePreprocess: async (fileId: string, data: Partial<FilePreprocessDetail>): Promise<any> => {
    const res = await fetch(`/api/files/${fileId}/preprocess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
