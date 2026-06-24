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
  
  { id: "team_kbs", group: "知识库管理", label: "团队知识库管理", hint: "成员授权、文档设置、模板", icon: "组" },
  { id: "public_kbs", group: "知识库管理", label: "公共知识库管理", hint: "审核、发布、受控复用", icon: "公" },
  
  { id: "audit", group: "治理运营", label: "权限审计", hint: "授权记录与审计轨迹", icon: "审" },
  { id: "archives", group: "治理运营", label: "归档中心", hint: "历史库、冷数据查询", icon: "档", adminOnly: true },
  { id: "admin", group: "治理运营", label: "运营看板", hint: "资产、成效、增长", icon: "板" }
];

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export function Sidebar({ activeNav, setActiveNav }: SidebarProps) {
  const [flyoutGroupId, setFlyoutGroupId] = useState<string | null>(null);
  const [activeFlyoutModule, setActiveFlyoutModule] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  
  const hideTimer = useRef<number | null>(null);

  const visibleModules = MODULES.filter(m => !(m as any).adminOnly || isAdmin);

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
    const actM = MODULES.find(m => m.id === activeNav);
    if (!isAdmin && actM && (actM as any).adminOnly) {
       setActiveNav("personal_space");
    }
  }, [isAdmin, activeNav, setActiveNav]);

  const currentGroupMeta = NAV_GROUPS.find(g => g.id === flyoutGroupId) || NAV_GROUPS[0];
  const groupModules = MODULES.filter(m => m.group === currentGroupMeta.label);
  const currentHoveredModule = MODULES.find(m => m.id === activeFlyoutModule) || groupModules[0];

  return (
    <>
      <aside 
        className="w-[72px] bg-[#eef4ff] border-r border-[#dbeafe] flex flex-col items-center shrink-0 relative z-30 shadow-[3px_0_18px_rgba(37,99,235,0.06)]"
        onMouseEnter={cancelHideFlyout}
        onMouseLeave={scheduleHideFlyout}
      >
        <div className="w-full flex justify-center py-[18px] px-3 pb-[22px]">
          <div className="w-[42px] h-[42px] rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-medium shadow-[0_10px_24px_rgba(37,99,235,0.18)]">
            U
          </div>
        </div>
        
        <nav className="w-full flex-1 flex flex-col items-center gap-[18px] px-2.5 py-4">
          {NAV_GROUPS.map(group => {
            const isRailActive = activeRailGroupId === group.id;
            const isHovering = flyoutGroupId === group.id;
            return (
              <button
                key={group.id}
                onMouseEnter={() => showFlyout(group.id)}
                onClick={() => showFlyout(group.id)}
                className={cn(
                  "w-[60px] min-h-[60px] flex flex-col items-center justify-center gap-1 rounded-[14px] transition-all duration-150 relative",
                  isRailActive && !flyoutGroupId && "bg-white text-blue-600 shadow-[0_10px_28px_rgba(37,99,235,0.14)]",
                  !isRailActive && !isHovering && "text-slate-700 hover:bg-white hover:text-blue-600 hover:shadow-[0_10px_28px_rgba(37,99,235,0.14)]",
                  isHovering && "bg-white text-blue-600 shadow-[0_10px_28px_rgba(37,99,235,0.14)]"
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
            title={isAdmin ? "切换为普通成员视图" : "切换为管理员视图"}
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
          className="fixed left-[72px] top-0 bottom-0 z-25 w-[min(760px,calc(100vw-128px))] flex flex-col bg-white/98 rounded-r-[14px] shadow-[20px_0_46px_rgba(15,23,42,0.18)] border-r border-slate-200 overflow-hidden"
          onMouseEnter={cancelHideFlyout}
          onMouseLeave={scheduleHideFlyout}
        >
          <div className="h-[74px] flex items-center justify-between px-[22px] border-b border-slate-200 shrink-0">
             <div>
               <div className="text-[22px] font-medium text-slate-900">运营AI门户</div>
               <div className="text-sm font-medium text-slate-400 tracking-widest uppercase">{currentGroupMeta.hint}</div>
             </div>
             <div className="w-[260px] h-[34px] flex items-center gap-1 px-3 border border-slate-300 rounded-[10px] bg-white text-slate-400">
               <Search className="w-3.5 h-3.5" />
               <input placeholder="搜索菜单..." className="flex-1 bg-transparent border-none text-sm font-medium text-slate-600 placeholder:text-slate-400 outline-none" />
             </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
             <div className="w-[220px] p-6 border-r border-slate-200 bg-[#fbfdff] shrink-0 border-r-slate-200">
                {groupModules.map(item => (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActiveFlyoutModule(item.id)}
                    onClick={() => setActiveFlyoutModule(item.id)}
                    className={cn(
                      "w-full h-[42px] flex items-center justify-between px-3 mb-2 rounded-lg text-sm font-medium text-left transition-colors",
                      activeFlyoutModule === item.id ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-blue-100 hover:text-blue-700"
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
             
             <div className="flex-1 overflow-auto p-7" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.92)), radial-gradient(circle at 80% 75%, rgba(219,234,254,0.72), transparent 34%)'}}>
                <div className="flex items-center justify-between mb-4 hidden">
                  {/* Top area can be toggled if needed */}
                </div>
                
                <div className="flex flex-col gap-3">
                  {activeFlyoutModule === 'personal_space' ? (
                    <div className="p-3 border border-slate-200 rounded-[10px] bg-white/80 w-full box-border">
                       <div className="flex items-center gap-1 mb-3 text-sm font-medium text-slate-900 before:content-[''] before:w-1 before:h-[18px] before:rounded-full before:bg-blue-600">
                         个人知识空间
                       </div>
                       <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-1.5">
                         {[
                           {id:'home', label: '知识库首页', hint: '快速看板、最近打开'},
                           {id:'favorites', label: '我的收藏', hint: '收藏内容'},
                           {id:'recent', label: '最近打开', hint: '浏览历史记录'},
                           {id:'pending', label: '待我处理', hint: '审核、订阅治理'}
                         ].map(sub => (
                           <button 
                             key={sub.id} 
                             onClick={() => { 
                               setActiveNav(sub.id === 'home' ? 'personal_space' : sub.id); 
                               setFlyoutGroupId(null); 
                             }}
                             className="min-h-[58px] flex items-center gap-1.5 p-3 border border-slate-200 rounded-[10px] bg-white text-left hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
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
                    <div className="p-3 border border-slate-200 rounded-[10px] bg-white/80 w-full box-border">
                       <div className="flex items-center gap-1 mb-3 text-sm font-medium text-slate-900 before:content-[''] before:w-1 before:h-[18px] before:rounded-full before:bg-blue-600">
                         {currentHoveredModule.label}
                       </div>
                       <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-1.5">
                          <button 
                            onClick={() => { setActiveNav(currentHoveredModule.id); setFlyoutGroupId(null); }}
                            className="min-h-[58px] flex items-center gap-1.5 p-3 border border-slate-200 rounded-[10px] bg-white text-left hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
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

