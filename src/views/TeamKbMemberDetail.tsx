import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { KnowledgeBaseDetail } from "./KnowledgeBaseDetail";
import type { FileNode } from "./KnowledgeBaseDetail";
import { UploadWithSpecModal } from "../components/UploadWithSpecModal";
import type { CollectionSpec } from "../types";
import type { TeamMemberPerm } from "../lib/teamPermissions";
import {
  buildTeamKbFileListDisplayConfig,
  createFileNodeFromUpload,
  getTeamKbEnabledSpec,
  getTeamKbInitialNodes,
} from "../lib/teamKbMock";

interface TeamKbMemberDetailProps {
  kbId: string;
  kbName: string;
  initialFileId?: string;
  teamMemberPerm?: TeamMemberPerm;
  onBack: () => void;
}

/** 个人空间等成员视角进入团队知识库：无管理入口，保留上传规范 */
export function TeamKbMemberDetail({
  kbId,
  kbName,
  initialFileId,
  teamMemberPerm = "可编辑",
  onBack,
}: TeamKbMemberDetailProps) {
  const [nodes, setNodes] = useState<FileNode[]>(() => getTeamKbInitialNodes(kbId));
  const [activeSpec, setActiveSpec] = useState<CollectionSpec | null>(null);
  const [showUploadSpecModal, setShowUploadSpecModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileListDisplayConfig = useMemo(() => buildTeamKbFileListDisplayConfig(kbId), [kbId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUploadClick = () => {
    const enabledSpec = getTeamKbEnabledSpec(kbId);
    if (enabledSpec) {
      setActiveSpec(enabledSpec);
      setShowUploadSpecModal(true);
      return true;
    }
    return false;
  };

  return (
    <>
      <KnowledgeBaseDetail
        key={`${kbId}-${initialFileId || "list"}`}
        kbId={kbId}
        kbName={kbName}
        kbType="team"
        initialRole="member"
        teamMemberPerm={teamMemberPerm}
        initialFileId={initialFileId}
        onBack={onBack}
        initialNodes={nodes}
        fileListDisplayConfig={fileListDisplayConfig}
        onUploadClick={handleUploadClick}
      />

      {showUploadSpecModal && activeSpec && (
        <UploadWithSpecModal
          spec={activeSpec}
          onClose={() => {
            setShowUploadSpecModal(false);
            setActiveSpec(null);
          }}
          onComplete={(batchMetadata, files) => {
            const storedFiles = files.filter((f) => f.storeStatus === "stored");
            if (storedFiles.length > 0) {
              const newNodes = storedFiles.map((item) => createFileNodeFromUpload(item, batchMetadata));
              setNodes((prev) => [...prev, ...newNodes]);
            }
            showToast(`已成功入库 ${storedFiles.length} 个文件`);
            setShowUploadSpecModal(false);
            setActiveSpec(null);
          }}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium tracking-wide">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
