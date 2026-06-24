import { useState } from "react";
import { Sidebar, MODULES } from "./components/Sidebar";
import { PersonalSpace } from "./views/PersonalSpace";
import { KnowledgeBaseDetail } from "./views/KnowledgeBaseDetail";
import { NotificationCenter } from "./views/NotificationCenter";
import { TeamKnowledgeBaseView } from "./views/TeamKnowledgeBaseView";
import { DiscoverView } from "./views/DiscoverView";
import { PublicKnowledgeBaseView } from "./views/PublicKnowledgeBaseView";
import { QuickAccessView } from "./views/QuickAccessView";
import { KnowledgeResultDashboard } from "./views/KnowledgeResultDashboard";
import { AuditView } from "./views/governance/AuditView";
import { ArchivesView } from "./views/governance/ArchivesView";

export default function App() {
  const [activeNav, setActiveNav] = useState("personal_space");
  const [activeKb, setActiveKb] = useState<{ id: string; name: string; type: 'personal_own' | 'personal' | 'team' | 'public'; fileId?: string; sourceMenu?: string } | null>(null);

  const activeModuleMeta = MODULES.find(m => m.id === activeNav) || MODULES[0];

  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] overflow-hidden font-sans text-[#222222] isolate">
      <Sidebar activeNav={activeNav} setActiveNav={(nav) => {
        setActiveNav(nav);
        // Reset KB view if navigating away
        if (nav !== 'personal_space' && nav !== 'favorites' && nav !== 'pending' && nav !== 'recent' && nav !== 'search' && nav !== 'archives') {
          setActiveKb(null);
        }
      }} />
      
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative z-10">
        <div className="flex-1 min-h-0 overflow-auto flex flex-col relative w-full">
          {activeNav === "personal_space" ? (
            activeKb ? (
              <KnowledgeBaseDetail 
                kbId={activeKb.id} 
                kbName={activeKb.name}
                kbType={activeKb.type}
                initialFileId={activeKb.fileId}
                onBack={() => {
                  if (activeKb.sourceMenu) {
                    setActiveNav(activeKb.sourceMenu);
                  }
                  setActiveKb(null);
                }} 
              />
            ) : (
              <PersonalSpace 
                onSelectKb={(id, name, type, fileId) => setActiveKb({ id, name, type, fileId, sourceMenu: 'personal_space' })}
                onNavigateToNotifications={() => setActiveNav('notifications')}
                onNavigateToDiscover={() => setActiveNav('search')}
              />
            )
          ) : activeNav === "favorites" ? (
            <QuickAccessView 
              type="favorites" 
              onBack={() => setActiveNav('personal_space')}
              onNavigateToKB={(kbId, fileId) => {
                setActiveNav('personal_space');
                setActiveKb({ id: kbId, name: '知识库', type: 'personal', fileId, sourceMenu: 'favorites' });
              }}
            />
          ) : activeNav === "pending" ? (
            <QuickAccessView 
              type="todo" 
              onBack={() => setActiveNav('personal_space')}
              onNavigateToKB={(kbId, fileId) => {
                setActiveNav('personal_space');
                setActiveKb({ id: kbId, name: '任务关联库', type: 'personal', fileId, sourceMenu: 'pending' });
              }}
            />
          ) : activeNav === "recent" ? (
            <QuickAccessView 
              type="recent" 
              onBack={() => setActiveNav('personal_space')}
              onNavigateToKB={(kbId, fileId) => {
                setActiveNav('personal_space');
                setActiveKb({ id: kbId, name: '知识库', type: 'personal', fileId, sourceMenu: 'recent' });
              }}
            />
          ) : activeNav === "search" ? (
            <DiscoverView 
              onSubscribe={(kb) => {
                setActiveNav('personal_space');
                setActiveKb({ 
                  id: kb.id, 
                  name: kb.title, 
                  type: kb.type || 'public', 
                  fileId: kb.fileId,
                  sourceMenu: 'search'
                });
              }}
            />
          ) : activeNav === "notifications" ? (
            <NotificationCenter 
              onNavigateToKB={(kbId, fileId, kbName, kbType) => {
                setActiveNav('personal_space');
                setActiveKb({ id: kbId, name: kbName, type: kbType as any, fileId, sourceMenu: 'notifications' });
              }}
            />
          ) : activeNav === "team_kbs" ? (
            <TeamKnowledgeBaseView />
          ) : activeNav === "public_kbs" ? (
            <PublicKnowledgeBaseView />
          ) : activeNav === "audit" ? (
            <AuditView />
          ) : activeNav === "archives" ? (
            activeKb ? (
              <KnowledgeBaseDetail 
                kbId={activeKb.id} 
                kbName={activeKb.name}
                kbType={activeKb.type}
                initialFileId={activeKb.fileId}
                isArchiveView={activeKb.sourceMenu === 'archives'}
                onBack={() => {
                  setActiveKb(null);
                }} 
              />
            ) : (
              <ArchivesView 
                onNavigateToKB={(kbId, kbName, kbType) => {
                  setActiveKb({ id: kbId, name: kbName, type: kbType, sourceMenu: 'archives' });
                }}
              />
            )
          ) : activeNav === "admin" ? (
            <KnowledgeResultDashboard />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-sm font-medium text-slate-400">
              模块开发中...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
