import { useEffect, useState } from "react";
import { TeamKnowledgeBaseView } from "./TeamKnowledgeBaseView";
import { PublicKnowledgeBaseView } from "./PublicKnowledgeBaseView";
import type { KbConsoleTab } from "../components/knowledge-base/KnowledgeBaseConsoleLayout";

interface KnowledgeBaseManagementViewProps {
  initialTab: KbConsoleTab;
  onTabChange?: (tab: KbConsoleTab) => void;
  isTeamKbAdmin?: boolean;
}

export function KnowledgeBaseManagementView({ initialTab, onTabChange, isTeamKbAdmin = true }: KnowledgeBaseManagementViewProps) {
  const [activeTab, setActiveTab] = useState<KbConsoleTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: KbConsoleTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  if (activeTab === "team") {
    return <TeamKnowledgeBaseView consoleTab={activeTab} onConsoleTabChange={handleTabChange} isKbAdmin={isTeamKbAdmin} />;
  }

  return <PublicKnowledgeBaseView consoleTab={activeTab} onConsoleTabChange={handleTabChange} />;
}
