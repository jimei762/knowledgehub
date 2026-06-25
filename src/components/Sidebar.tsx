import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { Search } from "lucide-react";

export const NAV_GROUPS = [
  { id: "workspace", label: "工作空间", hint: "个人使用与日常协作", icon: "工" },
  { id: "asset", label: "知识库管理", hint: "团队与公共知识库维护", icon: "库" },
  { id: "governance", label: "治理运营", hint: "权限、质量与运营管理", icon: "治" }
];

export const MODULES = [
  { id: "personal_space", group: "工作空间", label: "个人知识空间", hint: "个人、共享、订阅", icon: "书" },
  { id: "search", group: "工作空间", label: "发现", hint: "发现公开共享知识库", icon: "发" },
  { id: "notifications", group: "工作空间", label: "协作通知", hint: "评论、订阅、冲突", icon: "铃" },
  
  { id: "team_kbs", group: "知识库管理", label: "团队知识库管理", hint: "成员授权、文档设置、模板", icon: "组", adminOnly: true },
  { id: "public_kbs", group: "知识库管理", label: "公共知识库管理", hint: "审核、发布、受控复用", icon: "公", adminOnly: true },
  
  { id: "audit", group: "治理运营", label: "权限审计", hint: "授权记录与审计轨迹", icon: "审", adminOnly: true },
  { id: "archives", group: "治理运营", label: "归档中心", hint: "历史库、冷数据查询", icon: "档", adminOnly: true },
  { id: "admin", group: "治理运营", label: "运营看板", hint: "资产、成效、增长", icon: "板", adminOnly: true }
];

const PERSONAL_WORKSPACE_NAV_IDS = new Set([
  "personal_space",
  "favorites",
  "pending",
  "recent",
  "search",
  "notifications",
]);

export function isAdminOnlyNav(navId: string) {
  if (PERSONAL_WORKSPACE_NAV_IDS.has(navId)) return false;
  const module = MODULES.find((m) => m.id === navId);
  return Boolean(module && (module as { adminOnly?: boolean }).adminOnly);
}

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export function Sidebar({ activeNav, setActiveNav, isAdmin, setIsAdmin }: SidebarProps) {
  const [flyoutGroupId, setFlyoutGroupId] = useState<string | null>(null);
  const [activeFlyoutModule, setActiveFlyoutModule] = useState<string | null>(null);
  
  const hideTimer = useRef<number | null>(null);

  const visibleModules = MODULES.filter(m => isAdmin || !(m as { adminOnly?: boolean }).adminOnly);
  const visibleNavGroups = NAV_GROUPS.filter(g => visibleModules.some(m => m.group === g.label));

  const activeModuleMeta = visibleModules.find(m => m.id === activeNav) || 
                           (activeNav === 'favorites' || activeNav === 'pending' || activeNav === 'recent' ? visibleModules.find(m => m.id === 'personal_space') : null) || 
                           visibleModules[0];
  const activeRailGroupId = NAV_GROUPS.find(g => g.label === activeModuleMeta?.group)?.id || NAV_GROUPS[0].id;

  const showFlyout = (groupId: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setFlyoutGroupId(groupId);
    
    // Set active flyout module to something in this group
    const groupMeta = NAV_GROUPS.find(g => g.id === groupId);
    if (groupMeta) {
      const groupModules = visibleModules.filter(m => m.group === groupMeta.label);
      if (!groupModules.some(m => m.id === activeFlyoutModule)) {
         setActiveFlyoutModule(groupModules.some(m => m.id === activeNav) ? activeNav : groupModules[0]?.id);
      }
    }
  };

  const scheduleHideFlyout = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setFlyoutGroupId(null);
    }, 150);
  };

  const cancelHideFlyout = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  useEffect(() => {
    if (!isAdmin && isAdminOnlyNav(activeNav)) {
      setActiveNav("personal_space");
    }
  }, [isAdmin, activeNav, setActiveNav]);

  const currentGroupMeta = NAV_GROUPS.find(g => g.id === flyoutGroupId) || visibleNavGroups[0] || NAV_GROUPS[0];
  const groupModules = visibleModules.filter(m => m.group === currentGroupMeta.label);
  const currentHoveredModule = visibleModules.find(m => m.id === activeFlyoutModule) || groupModules[0];

  return (
    <>
      <aside 
        className="w-[72px] glass-sidebar-rail flex flex-col items-center shrink-0 relative z-30"
        onMouseEnter={cancelHideFlyout}
        onMouseLeave={scheduleHideFlyout}
      >
        <div className="w-full flex justify-center py-[18px] px-3 pb-[22px]">
          <div className="w-[42px] h-[42px] rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-medium shadow-[0_10px_24px_rgba(37,99,235,0.18)]">
            U
          </div>
        </div>
        
        <nav className="w-full flex-1 flex flex-col items-center gap-[18px] px-2.5 py-4">
          {visibleNavGroups.map(group => {
            const isRailActive = activeRailGroupId === group.id;
            const isHovering = flyoutGroupId === group.id;
            return (
              <button
                key={group.id}
                onMouseEnter={() => showFlyout(group.id)}
                onClick={() => showFlyout(group.id)}
                className={cn(
                  "w-[60px] min-h-[60px] flex flex-col items-center justify-center gap-1 rounded-[14px] transition-all duration-150 relative",
                  isRailActive && !flyoutGroupId && "glass-card text-blue-600 shadow-[0_10px_28px_rgba(37,99,235,0.14)]",
                  !isRailActive && !isHovering && "text-slate-700 hover:glass-card hover:text-blue-600 hover:shadow-[0_10px_28px_rgba(37,99,235,0.14)]",
                  isHovering && "glass-card text-blue-600 shadow-[0_10px_28px_rgba(37,99,235,0.14)]"
                )}
              >
                <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-blue-100 to-white text-blue-600 flex items-center justify-center text-sm font-medium shadow-sm">
                  {group.icon}
                </div>
                <div className="text-sm font-medium truncate max-w-[70px] leading-snug">
                  {group.label}
                </div>
              </button>
            )
          })}
        </nav>

        <div className="flex flex-col items-center gap-3 mb-[18px]">
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className="w-[48px] h-[48px] rounded-full bg-slate-800 text-slate-100 flex items-center justify-center font-medium text-sm shadow-[0_8px_22px_rgba(37,99,235,0.12)] cursor-pointer hover:bg-slate-700"
            title={isAdmin ? "切换为普通员工视图（仅个人工作空间）" : "切换为管理员视图"}
          >
            {isAdmin ? "管" : "员"}
          </button>
        </div>
      </aside>

      {/* Flyout Scrim */}
      {flyoutGroupId && (
        <div 
          className="fixed inset-0 left-[72px] bg-slate-900/30 z-[18]"
          onMouseEnter={scheduleHideFlyout}
        />
      )}

      {/* Flyout */}
      {flyoutGroupId && (
        <section 
          className="fixed left-[72px] top-0 bottom-0 z-25 w-[min(760px,calc(100vw-128px))] flex flex-col glass-flyout rounded-r-[14px] overflow-hidden"
          onMouseEnter={cancelHideFlyout}
          onMouseLeave={scheduleHideFlyout}
        >
          <div className="h-[74px] flex items-center justify-between px-[22px] border-b border-white/40 shrink-0">
             <div>
               <div className="text-[22px] font-medium text-slate-900">运营AI门户</div>
               <div className="text-sm font-medium text-slate-400 tracking-widest uppercase">{currentGroupMeta.hint}</div>
             </div>
             <div className="w-[260px] h-[34px] flex items-center gap-1 px-3 glass-input rounded-[10px] text-slate-400">
               <Search className="w-3.5 h-3.5" />
               <input placeholder="搜索菜单..." className="flex-1 bg-transparent border-none text-sm font-medium text-slate-600 placeholder:text-slate-400 outline-none" />
             </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
             <div className="w-[220px] p-6 border-r border-white/40 glass-sidebar-panel shrink-0">
                {groupModules.map(item => (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActiveFlyoutModule(item.id)}
                    onClick={() => setActiveFlyoutModule(item.id)}
                    className={cn(
                      "w-full h-[42px] flex items-center justify-between px-3 mb-2 rounded-lg text-sm font-medium text-left transition-colors",
                      activeFlyoutModule === item.id ? "glass-card-active text-blue-700" : "text-slate-600 hover:glass-card hover:text-blue-700"
                    )}
                  >
                    <span className="flex items-center gap-1 truncate">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_0_3px_#dbeafe] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="text-slate-400 font-medium shrink-0">›</span>
                  </button>
                ))}
             </div>
             
             <div className="flex-1 overflow-auto p-7 relative">
                <div className="flex flex-col gap-3">
                  {activeFlyoutModule === 'personal_space' ? (
                    <div className="p-3 glass-panel rounded-[10px] w-full box-border">
                       <div className="flex items-center gap-1 mb-3 text-sm font-medium text-slate-900 before:content-[''] before:w-1 before:h-[18px] before:rounded-full before:bg-blue-600">
                         个人知识空间
                       </div>
                       <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-1.5">
                         {[
                           {id:'home', label: '知识库首页', hint: '快速看板、最近访问'},
                           {id:'favorites', label: '我的收藏', hint: '收藏内容'},
                           {id:'recent', label: '最近访问', hint: '浏览历史记录'},
                           {id:'pending', label: '待办事项', hint: '审核、订阅治理'}
                         ].map(sub => (
                           <button 
                             key={sub.id} 
                             onClick={() => { 
                               setActiveNav(sub.id === 'home' ? 'personal_space' : sub.id); 
                               setFlyoutGroupId(null); 
                             }}
                             className="min-h-[58px] flex items-center gap-1.5 p-3 glass-card rounded-[10px] text-left hover:border-blue-200/60 hover:bg-white/50 transition-colors"
                           >
                             <span className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_0_3px_#dbeafe] shrink-0" />
                             <span className="min-w-0">
                               <span className="block text-sm font-medium text-slate-900 leading-snug whitespace-normal">{sub.label}</span>
                               <span className="block text-sm font-medium text-slate-500 mt-1 leading-snug whitespace-normal">{sub.hint}</span>
                             </span>
                           </button>
                         ))}
                       </div>
                    </div>
                  ) : (
                    <div className="p-3 glass-panel rounded-[10px] w-full box-border">
                       <div className="flex items-center gap-1 mb-3 text-sm font-medium text-slate-900 before:content-[''] before:w-1 before:h-[18px] before:rounded-full before:bg-blue-600">
                         {currentHoveredModule.label}
                       </div>
                       <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-1.5">
                          <button 
                            onClick={() => { setActiveNav(currentHoveredModule.id); setFlyoutGroupId(null); }}
                            className="min-h-[58px] flex items-center gap-1.5 p-3 glass-card rounded-[10px] text-left hover:border-blue-200/60 hover:bg-white/50 transition-colors"
                          >
                            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_0_3px_#dbeafe] shrink-0" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-900 leading-snug whitespace-normal">{currentHoveredModule.label} 首页</span>
                              <span className="block text-sm font-medium text-slate-500 mt-1 leading-snug whitespace-normal">{currentHoveredModule.hint}</span>
                            </span>
                          </button>
                       </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </section>
      )}
    </>
  );
}

