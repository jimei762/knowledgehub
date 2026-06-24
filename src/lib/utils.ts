import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 他人共享知识库的展示名称：{分享人}的分享资料："知识库名称" */
export function formatPersonalSharedKbName(sharedBy: string, kbName: string) {
  return `${sharedBy}的分享资料："${kbName}"`;
}
