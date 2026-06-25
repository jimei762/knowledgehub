import { useState, useEffect } from "react";
import { Sidebar, isAdminOnlyNav } from "./components/Sidebar";
import { PersonalSpace } from "./views/PersonalSpace";
import { KnowledgeBaseDetail } from "./views/KnowledgeBaseDetail";
import { TeamKbMemberDetail } from "./views/TeamKbMemberDetail";
import { NotificationCenter } from "./views/NotificationCenter";
import { DiscoverView } from "./views/DiscoverView";
import { KnowledgeBaseManagementView } from "./views/KnowledgeBaseManagementView";
import { QuickAccessView } from "./views/QuickAccessView";
import { KnowledgeResultDashboard } from "./views/KnowledgeResultDashboard";
import { AuditView } from "./views/governance/AuditView";
import { ArchivesView } from "./views/governance/ArchivesView";

export default function App() {
  const [activeNav, setActiveNav] = useState("personal_space");
  const [isAdmin, setIsAdmin] = useState(true);
  const [activeKb, setActiveKb] = useState<{
    id: string;
    name: string;
    type: 'personal_own' | 'personal' | 'team' | 'public';
    fileId?: string;
    sourceMenu?: string;
    sharePermission?: 'view' | 'download' | 'comment';
  } | null>(null);

  const canAccessActiveNav = isAdmin || !isAdminOnlyNav(activeNav);

  useEffect(() => {
    if (!isAdmin && isAdminOnlyNav(activeNav)) {
      setActiveNav("personal_space");
      setActiveKb(null);
    }
  }, [isAdmin, activeNav]);

  const personalSpaceNavProps = {
    onNavigateToNotifications: () => setActiveNav('notifications'),
    onNavigateToDiscover: () => setActiveNav('search'),
    onNavigateToRecent: () => setActiveNav('recent'),
    onNavigateToFavorites: () => setActiveNav('favorites'),
    onNavigateToTodo: () => setActiveNav('pending'),
  };

  const renderMainContent = () => {
    if (!canAccessActiveNav) {
      return (
        <PersonalSpace
          onSelectKb={(id, name, type, fileId, sharePermission) => setActiveKb({ id, name, type, fileId, sourceMenu: 'personal_space', sharePermission })}
          {...personalSpaceNavProps}
        />
      );
    }

    if (activeNav === "personal_space") {
      return activeKb ? (
        activeKb.type === "team" ? (
          <TeamKbMemberDetail
            key={`${activeKb.id}-${activeKb.fileId || "list"}`}
            kbId={activeKb.id}
            kbName={activeKb.name}
            initialFileId={activeKb.fileId}
            onBack={() => {
              if (activeKb.sourceMenu) {
                setActiveNav(activeKb.sourceMenu);
              }
              setActiveKb(null);
            }}
          />
        ) : (
          <KnowledgeBaseDetail
            key={`${activeKb.id}-${activeKb.fileId || 'list'}`}
            kbId={activeKb.id}
            kbName={activeKb.name}
            kbType={activeKb.type}
            initialFileId={activeKb.fileId}
            sharePermission={activeKb.sharePermission}
            onBack={() => {
              if (activeKb.sourceMenu) {
                setActiveNav(activeKb.sourceMenu);
              }
              setActiveKb(null);
            }}
          />
        )
      ) : (
        <PersonalSpace
          onSelectKb={(id, name, type, fileId, sharePermission) => setActiveKb({ id, name, type, fileId, sourceMenu: 'personal_space', sharePermission })}
          {...personalSpaceNavProps}
        />
      );
    }

    if (activeNav === "favorites") {
      return (
        <QuickAccessView
          type="favorites"
          onBack={() => setActiveNav('personal_space')}
          onNavigateToKB={(kbId, fileId) => {
            setActiveNav('personal_space');
            setActiveKb({ id: kbId, name: '知识库', type: 'personal', fileId, sourceMenu: 'favorites' });
          }}
        />
      );
    }

    if (activeNav === "pending") {
      return (
        <QuickAccessView
          type="todo"
          onBack={() => setActiveNav('personal_space')}
          onNavigateToKB={(kbId, fileId) => {
            setActiveNav('personal_space');
            setActiveKb({ id: kbId, name: '任务关联库', type: 'personal', fileId, sourceMenu: 'pending' });
          }}
        />
      );
    }

    if (activeNav === "recent") {
      return (
        <QuickAccessView
          type="recent"
          onBack={() => setActiveNav('personal_space')}
          onNavigateToKB={(kbId, fileId, kbName, kbType) => {
            if (!fileId) return;
            setActiveNav('personal_space');
            setActiveKb({ id: kbId, name: kbName || '知识库', type: kbType || 'personal_own', fileId, sourceMenu: 'recent' });
          }}
        />
      );
    }

    if (activeNav === "search") {
      return (
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
      );
    }

    if (activeNav === "notifications") {
      return (
        <NotificationCenter
          onNavigateToKB={(kbId, fileId, kbName, kbType, sharePermission) => {
            setActiveNav('personal_space');
            setActiveKb({ id: kbId, name: kbName, type: kbType as any, fileId, sourceMenu: 'notifications', sharePermission });
          }}
        />
      );
    }

    if (activeNav === "team_kbs" || activeNav === "public_kbs") {
      return (
        <KnowledgeBaseManagementView
          initialTab={activeNav === "team_kbs" ? "team" : "public"}
          isTeamKbAdmin={isAdmin}
          onTabChange={(tab) => setActiveNav(tab === "team" ? "team_kbs" : "public_kbs")}
        />
      );
    }

    if (activeNav === "audit") {
      return <AuditView />;
    }

    if (activeNav === "archives") {
      return activeKb ? (
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
      );
    }

    if (activeNav === "admin") {
      return <KnowledgeResultDashboard />;
    }

    return (
      <div className="flex-1 flex items-center justify-center p-8 text-sm font-medium text-slate-400">
        模块开发中...
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full glass-shell overflow-hidden font-sans text-[#222222] isolate">
      <Sidebar
        activeNav={activeNav}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        setActiveNav={(nav) => {
          setActiveNav(nav);
          if (nav !== 'personal_space' && nav !== 'favorites' && nav !== 'pending' && nav !== 'recent' && nav !== 'search' && nav !== 'archives') {
            setActiveKb(null);
          }
        }}
      />

      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="glass-ambient-blob absolute -left-24 top-8 size-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="glass-ambient-blob absolute right-0 top-1/3 size-80 rounded-full bg-indigo-300/15 blur-3xl" />
          <div className="glass-ambient-blob absolute bottom-0 left-1/3 size-64 rounded-full bg-sky-300/20 blur-3xl" />
        </div>
        <div className="flex-1 min-h-0 overflow-auto scrollbar-subtle flex flex-col relative z-10 w-full">
          {renderMainContent()}
        </div>
      </main>
    </div>
  );
}
