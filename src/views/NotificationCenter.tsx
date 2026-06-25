import { useState, useEffect } from "react";
import { MessageSquareText, Share2, CheckCircle2, Bot, Info, Clock, Check } from "lucide-react";
import { cn } from "../lib/utils";

type NotificationTab = "all" | "comments" | "system";

type NoticeNavTarget = {
  kbId: string;
  fileId?: string;
  kbName: string;
  kbType: 'personal_own' | 'personal' | 'team' | 'public';
  sharePermission?: 'view' | 'download' | 'comment';
};

const NOTIFICATION_NAV_TARGETS: Record<string, NoticeNavTarget> = {
  'UDA_运营平台PRD_v1.pdf': { kbId: 'kb_1', fileId: 'file1', kbName: '个人整理资料', kbType: 'personal_own' },
  '营销素材_设计稿.zip': { kbId: 'kb_1', fileId: 'file2', kbName: '个人整理资料', kbType: 'personal_own' },
  '2026开门红活动': { kbId: 'kb_2', kbName: '2026开门红活动', kbType: 'team' },
  '设计团队素材库': { kbId: 'kb_4', kbName: '李四的分享资料："设计团队素材库"', kbType: 'personal', sharePermission: 'comment' },
};

function enrichNotification(notice: any) {
  const mapped = NOTIFICATION_NAV_TARGETS[notice.targetName];
  return {
    ...notice,
    kbId: notice.kbId || mapped?.kbId,
    fileId: notice.fileId || mapped?.fileId,
    kbName: notice.kbName || mapped?.kbName,
    kbType: notice.kbType || mapped?.kbType,
  };
}

function resolveNoticeNavigation(notice: any): NoticeNavTarget | null {
  const enriched = enrichNotification(notice);
  if (!enriched.kbId) return null;
  return {
    kbId: enriched.kbId,
    fileId: enriched.fileId,
    kbName: enriched.kbName || '知识库',
    kbType: enriched.kbType || 'personal',
    sharePermission: enriched.sharePermission,
  };
}

const mockNotifications = [
  {
    id: "n1",
    type: "comment",
    title: "张三 评论了您的文件",
    content: "这个方案的第二部分需要同步修改一下，特别是关于权限控制的设计。",
    objectType: "源文件",
    targetName: "UDA_运营平台PRD_v1.pdf",
    kbId: "kb_1",
    fileId: "file1",
    kbName: "个人整理资料",
    kbType: "personal_own",
    time: "10分钟前",
    read: false,
    ignored: false,
    replied: false,
  },
  {
    id: "n3",
    type: "share",
    title: "收到了新的共享授权",
    content: "李四 向您共享了知识库，有效期至 2026-06-30。",
    objectType: "共享知识库",
    targetName: "设计团队素材库",
    kbId: "kb_4",
    kbName: "张三的分享资料",
    kbType: "personal",
    time: "昨天",
    read: true,
    ignored: false,
    replied: false,
  },
  {
    id: "n4",
    type: "comment",
    title: "李四 在批注中提到了您",
    content: "@运营人员 这张配图的版权我们需要再确认一下。",
    objectType: "批注",
    targetName: "营销素材_设计稿.zip",
    kbId: "kb_1",
    fileId: "file2",
    kbName: "个人整理资料",
    kbType: "personal_own",
    time: "昨天",
    read: true,
    ignored: false,
    replied: false,
  },
  {
    id: "n5",
    type: "system",
    title: "知识库订阅更新",
    content: "团队知识库有 3 份新文件上传，1 份文件已更新版本。",
    objectType: "订阅知识库",
    targetName: "2026开门红活动",
    kbId: "kb_2",
    kbName: "2026开门红活动",
    kbType: "team",
    time: "2天前",
    read: true,
    ignored: false,
    replied: false,
  }
];

export function NotificationCenter({ onNavigateToKB }: { onNavigateToKB?: (kbId: string, fileId: string | undefined, kbName: string, kbType: string, sharePermission?: 'view' | 'download' | 'comment') => void }) {
  const loadNotifications = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("local_notifications") : null;
    const raw = saved ? JSON.parse(saved).filter((n: any) => n.type !== 'governance') : mockNotifications;
    return raw.map(enrichNotification);
  };

  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState(loadNotifications);

  useEffect(() => {
    const sync = () => setNotifications(loadNotifications());
    window.addEventListener('storage', sync);
    window.addEventListener('add-kb-notification', sync as EventListener);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('add-kb-notification', sync as EventListener);
    };
  }, []);

  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const saveNotifications = (next: any) => {
    setNotifications(next);
    localStorage.setItem("local_notifications", JSON.stringify(next));
  };

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);

  const filtered = notifications.filter((n: any) => {
    if (unreadOnly && n.read) return false;
    if (activeTab === "all") return true;
    if (activeTab === "comments") return n.type === 'comment';
    return n.type === 'system' || n.type === 'share';
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const activeNotice = notifications.find((n: any) => n.id === activeNoticeId);

  const handlePreviewNavigate = (notice: any) => {
    const target = resolveNoticeNavigation(notice);
    if (!target || !onNavigateToKB) return;
    onNavigateToKB(target.kbId, target.fileId, target.kbName, target.kbType, target.sharePermission);
  };

  const activeNoticeTarget = activeNotice ? resolveNoticeNavigation(activeNotice) : null;

  const markAllRead = () => {
    saveNotifications(notifications.map((n: any) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    saveNotifications(notifications.map((n: any) => n.id === id ? { ...n, read: true } : n));
    setActiveNoticeId(id);
  };

  const ignoreNotice = (id: string) => {
    saveNotifications(notifications.map((n: any) => n.id === id ? { ...n, read: true, ignored: true } : n));
  };

  const handleReplySubmit = () => {
    if (!replyTarget || !replyText.trim()) return;
    saveNotifications(notifications.map((n: any) => n.id === replyTarget ? { ...n, read: true, replied: true } : n));
    setReplyTarget(null);
    setReplyText("");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative z-0">
      <div className="p-5 md:p-6 pb-7 w-full max-w-[1440px] mx-auto min-h-full flex flex-col gap-3">
        <div className="flex items-start justify-between py-1">
          <div>
            <h2 className="text-[22px] font-medium text-slate-900 m-0 flex items-center gap-3">
              协作通知中心 
              <span className={cn("px-2.5 py-1 text-sm font-medium rounded-full border", unreadCount > 0 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-500 border-slate-200")}>
                {unreadCount} 未读
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={cn("h-[36px] inline-flex items-center gap-1.5 px-3 border rounded-[9px] text-sm font-medium transition", unreadOnly ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}
            >
              只看未读
            </button>
            <button 
              onClick={markAllRead}
              className="h-[36px] inline-flex items-center justify-center gap-1.5 px-3 border border-transparent rounded-[9px] bg-blue-600 text-white text-sm font-medium shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:bg-blue-700 transition"
            >
              全部标为已读
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[220px_minmax(420px,1fr)] gap-3 flex-1 min-h-0 items-start">
          <aside className="p-3.5 glass-panel rounded-[10px]">
            <h3 className="text-sm font-medium text-slate-900 m-0 mb-3.5">通知分类</h3>
            <div className="grid gap-1.5">
              {[
                { id: "all", label: "全部通知" },
                { id: "comments", label: "评论与交互" },
                { id: "system", label: "系统与权限" }
              ].map(cat => {
                const count = categoryCount(notifications, cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id as NotificationTab)}
                    className={cn(
                      "w-full h-10 flex items-center justify-between px-2.5 rounded-lg text-sm font-medium transition-colors",
                      activeTab === cat.id ? "bg-[#eef4ff] text-blue-700" : "bg-transparent text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <span>{cat.label}</span>
                    <span className={cn("min-w-[22px] px-1.5 rounded-full text-sm font-medium leading-5 text-center font-mono", activeTab === cat.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="glass-panel rounded-[10px] flex flex-col h-full overflow-hidden relative">
            <div className="flex items-center justify-between gap-3 p-3.5 px-4 border-b border-white/40">
              <div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">全部通知</div>
                <h3 className="text-sm font-medium text-slate-900 m-0">协作通知</h3>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-[220px] h-8 flex items-center gap-1.5 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                  <span className="text-sm">⌕</span>
                  <input placeholder="搜索通知、对象、发起人" className="flex-1 bg-transparent border-none text-sm font-medium text-slate-600 outline-none" />
                </div>
                <select className="h-8 px-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm font-medium outline-none cursor-pointer">
                  <option>全部状态</option>
                  <option>未读</option>
                  <option>已处理</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2.5">
              {filtered.map((notification: any) => (
                <div 
                  key={notification.id} 
                  onClick={() => markRead(notification.id)}
                  className={cn(
                    "grid grid-cols-[38px_1fr_auto] gap-3 w-full mb-2 p-3 border rounded-[9px] text-left transition-colors cursor-pointer",
                    !notification.read ? "border-blue-200 bg-[#f8fbff]" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm",
                    activeNoticeId === notification.id && "outline outline-2 outline-blue-200 outline-offset-1"
                  )}
                >
                  <div className={cn(
                    "w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-sm font-medium shrink-0",
                    notification.type === 'comment' ? "bg-indigo-100 text-indigo-600" :
                    notification.type === 'share' ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {notification.type === 'comment' ? "评" : notification.type === 'share' ? "享" : "系"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <b className="text-sm font-medium text-slate-900 truncate">{notification.title}</b>
                      {notification.ignored && (
                        <span className="px-2 py-0.5 text-[9px] font-medium rounded-full border border-slate-200 bg-slate-50 text-slate-500 whitespace-nowrap">
                          已忽略
                        </span>
                      )}
                      {notification.replied && !notification.ignored && (
                        <span className="px-2 py-0.5 text-[9px] font-medium rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap">
                          已回复
                        </span>
                      )}
                      {!notification.ignored && !notification.replied && (
                        <span className={cn("px-2 py-0.5 text-[9px] font-medium rounded-full border whitespace-nowrap", notification.read ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                          {notification.read ? "已阅" : "待处理"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 mb-2.5 text-sm font-semibold text-slate-600 leading-relaxed line-clamp-2">
                      {notification.content}
                    </p>
                    <span className="inline-flex flex-wrap items-center h-6 px-2 bg-slate-50 border border-slate-100 rounded-md text-sm font-medium text-blue-700 max-w-full truncate">
                      {notification.objectType}：{notification.targetName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-medium text-slate-500 whitespace-nowrap">
                    <span>{notification.time}</span>
                    {!notification.read && <i className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="grid place-items-center min-h-[240px] text-sm font-medium text-slate-500 text-center">
                  暂无相关的协作通知记录
                </div>
              )}
            </div>
            
            <aside 
              className={cn(
                "absolute top-0 right-0 bottom-0 z-20 w-[430px] max-w-full bg-white border-l border-slate-200 shadow-[-18px_0_44px_rgba(15,23,42,0.12)] flex flex-col transition-transform duration-200",
                activeNotice ? "translate-x-0" : "translate-x-full border-transparent shadow-none"
              )}
            >
              <div className="p-3 border-b border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">通知详情</div>
                  <h3 className="text-sm font-medium text-slate-900 m-0">{activeNotice ? activeNotice.title : "选择一条通知"}</h3>
                </div>
                <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 text-lg font-medium flex items-center justify-center hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); setActiveNoticeId(null); setReplyTarget(null); }}>×</button>
              </div>
              
              <div className="flex-1 overflow-auto p-3">
                {activeNotice ? (
                  <>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg mb-3">
                      <b className="block text-sm font-medium text-slate-900 mb-1.5">相关对象</b>
                      <p className="m-0 text-sm font-semibold text-slate-600">{activeNotice.objectType}：{activeNotice.targetName}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg mb-4">
                      <b className="block text-sm font-medium text-slate-900 mb-1.5">详细内容</b>
                      <p className="m-0 text-sm font-semibold text-slate-600 leading-relaxed">{activeNotice.content}</p>
                    </div>

                    {activeNotice.ignored && (
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg mb-4 flex items-center gap-1">
                         <span className="w-2 h-2 rounded-full bg-slate-400" />
                         <span className="text-sm font-medium text-slate-500">已忽略此通知</span>
                       </div>
                    )}
                    
                    {!activeNotice.ignored && (
                      <div className="flex flex-wrap gap-1 mb-6">
                        <button 
                          onClick={() => handlePreviewNavigate(activeNotice)}
                          disabled={!activeNoticeTarget}
                          className={cn(
                            "h-8 px-4 rounded-lg text-sm font-medium shadow-sm cursor-pointer border-0",
                            activeNoticeTarget
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          )}
                        >
                          {activeNoticeTarget?.fileId ? '文件预览' : '打开知识库'}
                        </button>
                        
                        {activeNotice.type === 'comment' && !activeNotice.replied && (
                          <button 
                            onClick={() => setReplyTarget(activeNotice.id)}
                            className="h-8 px-4 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 cursor-pointer"
                          >
                            快速回复
                          </button>
                        )}
                        
                        {!activeNotice.read && (
                          <button 
                            className="h-8 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer" 
                            onClick={() => markRead(activeNotice.id)}
                          >
                            标记解决
                          </button>
                        )}
                        
                        <button 
                          onClick={() => ignoreNotice(activeNotice.id)}
                          className="h-8 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
                        >
                          忽略
                        </button>
                      </div>
                    )}

                    {replyTarget === activeNotice.id && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg mb-4">
                        <textarea 
                          className="w-full text-sm font-semibold text-slate-700 border border-slate-200 rounded p-2 focus:border-blue-400 outline-none" 
                          rows={3} 
                          placeholder="请输入回复内容..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex gap-1 justify-end mt-2">
                          <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-sm font-medium hover:bg-slate-200 cursor-pointer" onClick={() => { setReplyTarget(null); setReplyText(''); }}>取消</button>
                          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium shadow-sm hover:bg-blue-700 cursor-pointer" onClick={handleReplySubmit}>发送</button>
                        </div>
                      </div>
                    )}
                    
                    {activeNotice.replied && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">您已回复此评论</span>
                      </div>
                    )}
                    
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <b className="block text-sm font-medium text-slate-900 mb-3">处理时间线</b>
                      <div className="grid gap-1.5">
                        <div className="grid grid-cols-[8px_1fr] gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5" />
                          <div>
                            <p className="m-0 text-sm font-medium text-slate-700">系统发出协作通知</p>
                            <span className="block mt-0.5 text-[9px] font-medium text-slate-400">{activeNotice.time}</span>
                          </div>
                        </div>
                        {activeNotice.read && (
                          <div className="grid grid-cols-[8px_1fr] gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                            <div>
                              <p className="m-0 text-sm font-medium text-slate-700">您已查看或处理</p>
                              <span className="block mt-0.5 text-[9px] font-medium text-slate-400">刚刚</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-sm font-medium text-slate-500 pt-10">
                    在左侧列表中点击通知后查看处理记录。
                  </div>
                )}
              </div>
            </aside>
          </section>

        </div>
      </div>
    </div>
  );
}

function categoryCount(notices: any[], catId: string) {
  if (catId === 'all') return notices.length;
  if (catId === 'comments') return notices.filter((n: any) => n.type === 'comment').length;
  return notices.filter((n: any) => n.type === 'system' || n.type === 'share').length;
}

