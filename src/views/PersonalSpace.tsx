import React, { useEffect, useState } from "react";
import { api } from "../api";
import { KnowledgeBase, Subscription, FavoriteItem } from "../types";
import { cn, formatPersonalSharedKbName } from "../lib/utils";
import { Share2, Star, Clock, ListTodo, Plus, Edit2, Trash2, ShieldAlert, User, Globe, Eye, Download, MessageSquare, ChevronRight, Database, FileText, Layers, X, FileSpreadsheet, FileImage, UserPlus, Check, Folder, Lock } from "lucide-react";
import { format } from "date-fns";
import { QuickAccessView } from "./QuickAccessView";
import { MemberSelectorModal } from "../components/MemberSelectorModal";
import { motion, AnimatePresence } from "motion/react";
import { MOCK_RECORDS } from "../constants";

const DATA_PIPELINE_ARCHIVED = 1042;
const DATA_PIPELINE_GOVERNING = 244;
const DATA_PIPELINE_TOTAL = DATA_PIPELINE_ARCHIVED + DATA_PIPELINE_GOVERNING;
const DATA_PIPELINE_ARCHIVED_PCT = Math.round((DATA_PIPELINE_ARCHIVED / DATA_PIPELINE_TOTAL) * 100);

const HOME_NOTIFICATIONS = [
  { id: 'n1', user: '张三', action: '评论了您的文件', target: 'UDA_运营平台PRD_v1.pdf', role: '产品经理', time: '10 分钟前', unread: true, avatar: '张' },
  { id: 'n3', user: '李四', action: '向您共享了知识库', target: '设计团队素材库', role: '协作成员', time: '昨天', unread: false, avatar: '李' },
  { id: 'n4', user: '王敏', action: '在批注中提到了您', target: '营销素材_设计稿.zip', role: '设计主管', time: '昨天', unread: false, avatar: '王' },
];

const SUBSCRIPTION_PREVIEW_FILES: Record<string, Array<{ id: string; name: string; format: string; size: string; time: string }>> = {
  kb_1: [
    { id: 'pf1', name: 'UDA_运营平台PRD_v1.pdf', format: 'pdf', size: '2.0 MB', time: '今天' },
    { id: 'pf2', name: '会议纪要_0607.docx', format: 'docx', size: '485 KB', time: '2 天前' },
  ],
  kb_2: [
    { id: 'sf1', name: '部门汇报.pptx', format: 'pptx', size: '2.0 MB', time: '今天' },
    { id: 'sf2', name: '年度汇报.docx', format: 'docx', size: '485 KB', time: '2 天前' },
  ],
  kb_3: [
    { id: 'sf3', name: '制度汇编.pdf', format: 'pdf', size: '3.2 MB', time: '本周' },
    { id: 'sf4', name: '合规检查清单.xlsx', format: 'xlsx', size: '128 KB', time: '昨天' },
  ],
  kb_4: [
    { id: 'sf5', name: '分享资料整理.pdf', format: 'pdf', size: '890 KB', time: '3 天前' },
    { id: 'sf6', name: '参考笔记.md', format: 'md', size: '56 KB', time: '本周' },
  ],
};

type SourceFilter = "all" | "personal" | "team" | "public";
type QuickAccessType = 'recent' | 'todo' | 'favorites' | null;

interface PersonalSpaceProps {
  onSelectKb: (kbId: string, name: string, type: 'personal_own' | 'personal' | 'team' | 'public', fileId?: string) => void;
  onNavigateToNotifications?: () => void;
  onNavigateToDiscover?: () => void;
}

export function PersonalSpace({ onSelectKb, onNavigateToNotifications, onNavigateToDiscover }: PersonalSpaceProps) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeQuickAccess, setActiveQuickAccess] = useState<QuickAccessType>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  
  // Local states for dashboard lists to support delete interactions
  const [recentList, setRecentList] = useState<any[]>(() => {
    const saved = localStorage.getItem('my_recent_access');
    if (saved) return JSON.parse(saved);
    return MOCK_RECORDS.recent;
  });

  const [todoList, setTodoList] = useState<any[]>(() => {
    const saved = localStorage.getItem('my_todo_list');
    if (saved) return JSON.parse(saved);
    return MOCK_RECORDS.todo;
  });

  const handleDeleteRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentList.filter(item => item.id !== id);
    setRecentList(updated);
    localStorage.setItem('my_recent_access', JSON.stringify(updated));
    showToast('已成功移除该最近访问记录');
  };

  const handleDeleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = todoList.filter(item => item.id !== id);
    setTodoList(updated);
    localStorage.setItem('my_todo_list', JSON.stringify(updated));
    showToast('该待办项已移除/归档');
  };

  const handleRemoveFavoriteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('my_favorites', JSON.stringify(updated));
    showToast('已取消该收藏项');
    window.dispatchEvent(new Event('storage'));
  };
  
  useEffect(() => {
    const saved = localStorage.getItem('my_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    } else {
      const initial = MOCK_RECORDS.favorites.map(f => ({ ...f, targetId: f.id, folderId: 'default' })) as FavoriteItem[];
      setFavorites(initial);
      localStorage.setItem('my_favorites', JSON.stringify(initial));
    }
    
    // Listen to storage sync events
    const syncFavs = () => {
      const current = localStorage.getItem('my_favorites');
      if (current) setFavorites(JSON.parse(current));
    };
    window.addEventListener('storage', syncFavs);
    return () => window.removeEventListener('storage', syncFavs);
  }, []);

  const toggleFavorite = (kb: KnowledgeBase) => {
    const isFav = favorites.some(f => f.targetId === kb.id && f.type === 'kb');
    let newFavorites;
    if (isFav) {
      newFavorites = favorites.filter(f => !(f.targetId === kb.id && f.type === 'kb'));
    } else {
      const newItem: FavoriteItem = {
        id: `fav-${Date.now()}`,
        targetId: kb.id,
        name: kb.name,
        type: 'kb',
        folderId: 'default',
        addedAt: new Date().toISOString(),
        kbName: kb.name,
        kbType: kb.ownerType as any
      };
      newFavorites = [newItem, ...favorites];
    }
    setFavorites(newFavorites);
    localStorage.setItem('my_favorites', JSON.stringify(newFavorites));
    showToast(isFav ? '已取消收藏' : '已添加至收藏');
  };
    
  // Real Mock States
  const [modal, setModal] = useState<{type: 'none' | 'create_kb' | 'edit_kb' | 'delete_kb' | 'share_kb', payload?: any}>({ type: 'none' });
  const [modalInput, setModalInput] = useState('');
  const [kbDescription, setKbDescription] = useState('');
  const [kbTags, setKbTags] = useState<string[]>([]);
  const [menuKbId, setMenuKbId] = useState<string | null>(null);
  
  // Share Settings States
  const [shareTarget, setShareTarget] = useState<'user' | 'public'>('user');
  const [sharePermission, setSharePermission] = useState<'view' | 'download' | 'comment'>('view');
  const [shareExpires, setShareExpires] = useState<'7d' | '30d' | 'permanent' | 'custom'>('permanent');
  const [customDate, setCustomDate] = useState('2026-07-10');
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [isShareActive, setIsShareActive] = useState(true);
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [shareMembers, setShareMembers] = useState<any[]>([]);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Mock data for knowledge bases
  const mockKnowledgeBases: KnowledgeBase[] = [
    { id: "kb_1", name: "个人整理资料", ownerType: "personal", visibility: "private", status: "active", updatedAt: "2026-06-08T10:00:00Z" },
    { id: "kb_2", name: "2026开门红活动", ownerType: "team", visibility: "team", status: "active", updatedAt: "2026-06-07T14:30:00Z" },
    { id: "kb_3", name: "运营制度规范", ownerType: "public", visibility: "public", status: "active", updatedAt: "2026-06-01T09:00:00Z" },
  ];

  const mockSubscriptions: Subscription[] = [
    { id: "sub_1", kbId: "kb_2", sourceLabel: "team", canCancel: false, canEdit: true, knowledgeBase: mockKnowledgeBases[1] },
    { id: "sub_2", kbId: "kb_3", sourceLabel: "public", canCancel: false, canEdit: false, knowledgeBase: mockKnowledgeBases[2] },
    { id: "sub_3", kbId: "kb_4", sourceLabel: "personal", sharedBy: "李四", canCancel: true, canEdit: false, knowledgeBase: { id: "kb_4", name: "设计团队素材库", ownerType: "personal", visibility: "private", status: "active", updatedAt: "2026-06-05T00:00:00Z" } },
  ];

  useEffect(() => {
    // Use mock data instead of API
    const saved = localStorage.getItem('personal_kbs_shared_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updated = mockKnowledgeBases.map(k => {
          if (parsed[k.id]) {
            return {
              ...k,
              isShared: parsed[k.id].isShared,
              shareSettings: parsed[k.id].shareSettings
            };
          }
          return k;
        });
        setKbs(updated);
      } catch (e) {
        console.error(e);
        setKbs(mockKnowledgeBases);
      }
    } else {
      setKbs(mockKnowledgeBases);
    }
    setSubscriptions(mockSubscriptions);
  }, []);

  const saveShareSettingsToLocalStorage = (updatedKbs: KnowledgeBase[]) => {
    try {
      const settingsMap: Record<string, any> = {};
      updatedKbs.forEach(k => {
        if (k.isShared) {
          settingsMap[k.id] = {
            isShared: k.isShared,
            shareSettings: k.shareSettings
          };
        }
      });
      localStorage.setItem('personal_kbs_shared_settings', JSON.stringify(settingsMap));
    } catch (e) {
      console.error(e);
    }
  };

  const resetKbForm = () => {
    setModalInput('');
    setKbDescription('');
    setKbTags([]);
  };

  const openCreateKbModal = () => {
    resetKbForm();
    setModal({ type: 'create_kb' });
  };

  const openEditKbModal = (kb: KnowledgeBase) => {
    setModalInput(kb.name);
    setKbDescription(kb.description ?? '');
    setKbTags(kb.tags ?? []);
    setModal({ type: 'edit_kb', payload: kb });
    setMenuKbId(null);
  };

  const openShareModal = (kb: KnowledgeBase) => {
    const settings = kb.shareSettings;
    setIsShareActive(kb.isShared ?? false);
    const savedTarget = settings?.target;
    setShareTarget(savedTarget === 'public' ? 'public' : 'user');
    setSharePermission(settings?.permission ?? 'view');
    setShareExpires(settings?.expires ?? 'permanent');
    setCustomDate(settings?.customDate ?? '2026-07-10');
    setShareMembers(
      settings?.emails?.map((email: string, idx: number) => ({ id: `m_${idx}`, name: email })) ?? []
    );
    setModal({ type: 'share_kb', payload: kb });
    setMenuKbId(null);
  };

  const handleSaveShareSettings = () => {
    if (modal.type === 'share_kb' && modal.payload?.id) {
      const kbId = modal.payload.id;
      const updated = kbs.map(k => {
        if (k.id === kbId) {
          const emails = shareMembers.map((m: any) => m.name);
          return {
            ...k,
            isShared: isShareActive,
            shareSettings: {
              target: shareTarget,
              permission: sharePermission,
              expires: shareExpires,
              customDate: shareExpires === 'custom' ? customDate : undefined,
              emails: shareTarget === 'user' ? emails : undefined,
              description: k.description,
              tags: k.tags,
              name: k.name
            },
            updatedAt: new Date().toISOString()
          };
        }
        return k;
      });
      setKbs(updated);
      saveShareSettingsToLocalStorage(updated);
      
      const targetLabel = shareTarget === 'user' ? '指定用户' : '系统内公开';
      if (isShareActive) {
        showToast(`知识库《${modal.payload.name}》已成功启用并设置为 [${targetLabel}] 共享状态`);
      } else {
        showToast(`已成功取消《${modal.payload.name}》的所有共享授权`);
      }
      setModal({ type: 'none' });
    }
  };

  const personalKbs = kbs.filter(k => k.ownerType === "personal");
  
  const filteredSubscriptions = subscriptions.filter(s => 
    sourceFilter === "all" ? true : s.sourceLabel === sourceFilter
  );

  const overviewStats = {
    personalKb: personalKbs.length,
    subscribedKb: subscriptions.length,
    recentFiles: recentList.length,
    pendingTodo: todoList.length,
    sharedKb: personalKbs.filter(k => k.isShared).length,
    totalKb: personalKbs.length + subscriptions.length,
    unreadNotifs: HOME_NOTIFICATIONS.filter(n => n.unread).length,
  };

  const getKbTypeForSub = (label: Subscription['sourceLabel']): 'personal' | 'team' | 'public' =>
    label === 'personal' ? 'personal' : label;

  const getSubscriptionDisplayName = (sub: Subscription) =>
    sub.sourceLabel === 'personal' && sub.sharedBy
      ? formatPersonalSharedKbName(sub.sharedBy, sub.knowledgeBase.name)
      : sub.knowledgeBase.name;

  const sourceLabelText = (label: Subscription['sourceLabel'] | 'all' | 'own') => {
    if (label === 'all') return '全部';
    if (label === 'own') return '个人';
    if (label === 'personal') return '他人共享';
    if (label === 'team') return '团队';
    return '公共';
  };

  const formatFileIcon = (format?: string) => {
    if (format === 'xlsx' || format === 'xls') return { label: 'XLS', className: 'bg-emerald-100 text-emerald-700' };
    if (format === 'pdf') return { label: 'PDF', className: 'bg-rose-100 text-rose-700' };
    if (format === 'pptx') return { label: 'PPT', className: 'bg-orange-100 text-orange-700' };
    if (format === 'docx' || format === 'doc') return { label: 'DOC', className: 'bg-blue-100 text-blue-700' };
    return { label: 'DOC', className: 'bg-slate-100 text-slate-600' };
  };

  const renderKbSpaceCard = (opts: {
    cardKey: string;
    name: string;
    badgeLabel: string;
    badgeClassName?: string;
    updatedAt: string;
    previewKbId: string;
    onOpenKb: () => void;
    onOpenFile: (fileId: string) => void;
    personalKb?: KnowledgeBase;
  }) => {
    const previewFiles = SUBSCRIPTION_PREVIEW_FILES[opts.previewKbId] || SUBSCRIPTION_PREVIEW_FILES.kb_3;
    const badgeClass = opts.badgeClassName ?? 'bg-blue-100 text-blue-700';

    return (
      <div key={opts.cardKey} className="relative group border border-slate-200 rounded-2xl p-4 bg-slate-50/40 hover:border-blue-200 transition-colors">
        <div className="flex items-start gap-3 mb-3">
          <div className={cn('min-w-0 flex-1', opts.personalKb && 'pr-12')}>
            <button
              onClick={opts.onOpenKb}
              className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate block text-left border-0 bg-transparent p-0 cursor-pointer"
            >
              {opts.name}
            </button>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-medium', badgeClass)}>
                {opts.badgeLabel}
              </span>
              <span className="text-[10px] text-slate-400">
                更新于 {format(new Date(opts.updatedAt), 'MM-dd HH:mm')}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {previewFiles.slice(0, 2).map(file => {
            const icon = formatFileIcon(file.format);
            return (
              <button
                key={file.id}
                onClick={() => opts.onOpenFile(file.id)}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden text-left hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200/80 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <div className="p-2.5 flex items-center gap-2">
                  <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', icon.className)}>{icon.label}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-800 truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-400">{file.size} · {file.time}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {opts.personalKb && (
          <div className="absolute top-3 right-3 flex items-center gap-0.5 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(opts.personalKb!); }}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center border-0 bg-white/90 cursor-pointer text-sm shadow-sm transition-opacity",
                favorites.some(f => f.targetId === opts.personalKb!.id && f.type === 'kb') ? "text-amber-500 opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-500"
              )}
            >
              ★
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuKbId(menuKbId === opts.personalKb!.id ? null : opts.personalKb!.id); }}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center border-0 bg-white/90 cursor-pointer text-slate-400 hover:text-blue-600 shadow-sm transition-opacity",
                menuKbId === opts.personalKb!.id ? "opacity-100 text-blue-600" : "opacity-0 group-hover:opacity-100"
              )}
            >
              ⋮
            </button>
            {menuKbId === opts.personalKb.id && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuKbId(null)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1">
                  <button className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                    onClick={() => openEditKbModal(opts.personalKb!)}>
                    <Edit2 className="w-3.5 h-3.5" /> 编辑信息
                  </button>
                  <button className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                    onClick={() => openShareModal(opts.personalKb!)}>
                    <Share2 className="w-3.5 h-3.5" /> 共享
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button className="w-full px-3 py-2 text-sm text-left text-rose-600 hover:bg-rose-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                    onClick={() => { setModal({ type: 'delete_kb', payload: opts.personalKb }); setMenuKbId(null); }}>
                    <Trash2 className="w-3.5 h-3.5" /> 删除
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderOverviewRing = () => {
    const r = 42;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (DATA_PIPELINE_ARCHIVED_PCT / 100) * circumference;
    return (
      <svg width="112" height="112" viewBox="0 0 100 100" className="shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e8eef5" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="#3b82f6" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-blue-600 text-[15px] font-semibold" style={{ fontSize: 15, fontWeight: 600 }}>
          {DATA_PIPELINE_ARCHIVED_PCT}%
        </text>
        <text x="50" y="60" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 8 }}>
          已入库
        </text>
      </svg>
    );
  };

  const executeAction = () => {
    if (modal.type === 'create_kb') {
      if (!modalInput.trim()) {
        showToast('请填写知识库名称');
        return;
      }
      const newKb: KnowledgeBase = {
        id: `kb-${Date.now()}`,
        name: modalInput.trim(),
        ownerType: 'personal',
        description: kbDescription.trim() || undefined,
        tags: kbTags.length > 0 ? kbTags : undefined,
        updatedAt: new Date().toISOString()
      };
      setKbs([newKb, ...kbs]);
      showToast('知识库创建成功');
    } else if (modal.type === 'edit_kb') {
      if (!modalInput.trim()) {
        showToast('请填写知识库名称');
        return;
      }
      if (!modal.payload?.id) return;
      const updated = kbs.map(k => {
        if (k.id !== modal.payload.id) return k;
        const updatedKb: KnowledgeBase = {
          ...k,
          name: modalInput.trim(),
          description: kbDescription.trim() || undefined,
          tags: kbTags.length > 0 ? kbTags : undefined,
          updatedAt: new Date().toISOString(),
        };
        if (updatedKb.isShared && updatedKb.shareSettings) {
          updatedKb.shareSettings = {
            ...updatedKb.shareSettings,
            name: updatedKb.name,
            description: updatedKb.description,
            tags: updatedKb.tags,
          };
        }
        return updatedKb;
      });
      setKbs(updated);
      saveShareSettingsToLocalStorage(updated);
      showToast('知识库信息已更新');
    } else if (modal.type === 'delete_kb' && modal.payload?.id) {
      setKbs(kbs.filter(k => k.id !== modal.payload.id));
      showToast('知识库已删除');
    }
    setModal({ type: 'none' });
    resetKbForm();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative">
      {activeQuickAccess && (
        <QuickAccessView 
          type={activeQuickAccess} 
          onBack={() => setActiveQuickAccess(null)} 
          onNavigateToKB={(kbId, fileId) => {
            onSelectKb(kbId, '知识库说明', 'personal', fileId);
            setActiveQuickAccess(null);
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 md:p-6 w-full max-w-[1480px] mx-auto">
          <div className="mb-5">
            <h2 className="text-[24px] font-medium text-slate-900 leading-snug m-0">个人知识空间</h2>
            <p className="text-sm text-slate-500 mt-1">总览、个人库与订阅协作一览</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(420px,480px)_minmax(0,1fr)] gap-5 items-start">
            {/* 左侧栏 */}
            <div className="flex flex-col gap-4">
              {/* 知识库总览 — 保留当前环形 + 分类格 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 m-0">知识库总览</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    {renderOverviewRing()}
                    <div className="text-xs text-slate-500 mt-1 tabular-nums">
                      {DATA_PIPELINE_ARCHIVED.toLocaleString()} / {DATA_PIPELINE_TOTAL.toLocaleString()} 件
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                    {[
                      { label: '个人库', value: overviewStats.personalKb, icon: Folder, iconBg: 'bg-blue-50 text-blue-500' },
                      { label: '订阅库', value: overviewStats.subscribedKb, icon: Layers, iconBg: 'bg-violet-50 text-violet-500' },
                      { label: '已入库', value: DATA_PIPELINE_ARCHIVED, icon: Database, iconBg: 'bg-emerald-50 text-emerald-500' },
                      { label: '治理中', value: DATA_PIPELINE_GOVERNING, icon: FileText, iconBg: 'bg-amber-50 text-amber-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.iconBg)}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-900 tabular-nums">{item.value.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {[
                    { label: '最近访问', icon: Clock, action: () => setActiveQuickAccess('recent'), count: overviewStats.recentFiles },
                    { label: '我的收藏', icon: Star, action: () => setActiveQuickAccess('favorites'), count: favorites.length },
                    { label: '待办事项', icon: ListTodo, action: () => setActiveQuickAccess('todo'), count: overviewStats.pendingTodo },
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors cursor-pointer"
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                      {item.count > 0 && (
                        <span className="px-1 py-px rounded bg-white text-[10px] text-slate-400 font-normal">{item.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 个人知识库 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900 m-0">个人知识库</h3>
                  <button
                    onClick={openCreateKbModal}
                    className="h-8 inline-flex items-center gap-1 px-2.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition border-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> 新建
                  </button>
                </div>
                <div className="p-3 space-y-4 max-h-[560px] overflow-y-auto">
                  {personalKbs.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">暂无个人知识库，点击新建</div>
                  ) : (
                    personalKbs.map(kb =>
                      renderKbSpaceCard({
                        cardKey: kb.id,
                        name: kb.name,
                        badgeLabel: kb.isShared ? '已共享' : sourceLabelText('own'),
                        badgeClassName: kb.isShared ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700',
                        updatedAt: kb.updatedAt,
                        previewKbId: kb.id,
                        onOpenKb: () => onSelectKb(kb.id, kb.name, 'personal_own'),
                        onOpenFile: (fileId) => onSelectKb(kb.id, kb.name, 'personal_own', fileId),
                        personalKb: kb,
                      })
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 右侧栏 */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* 订阅的知识库 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 m-0">订阅的知识库</h3>
                    <p className="text-xs text-slate-400 mt-0.5">协作共享与组织订阅空间</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToDiscover?.()}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1 bg-white cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> 浏览发现
                  </button>
                </div>
                <div className="px-5 py-3 flex items-center gap-1.5 overflow-x-auto">
                  {(['all', 'personal', 'team', 'public'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setSourceFilter(f)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border-0 transition-colors cursor-pointer',
                        sourceFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      )}
                    >
                      {f === 'all' ? '全部' : sourceLabelText(f)}
                    </button>
                  ))}
                </div>
                <div className="p-5 pt-2 space-y-4 max-h-[420px] overflow-y-auto">
                  {filteredSubscriptions.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">暂无订阅的知识库</div>
                  ) : (
                    filteredSubscriptions.map(sub => {
                      const displayName = getSubscriptionDisplayName(sub);
                      return renderKbSpaceCard({
                        cardKey: sub.id,
                        name: displayName,
                        badgeLabel: sourceLabelText(sub.sourceLabel),
                        updatedAt: sub.knowledgeBase.updatedAt,
                        previewKbId: sub.kbId,
                        onOpenKb: () => onSelectKb(sub.knowledgeBase.id, displayName, getKbTypeForSub(sub.sourceLabel)),
                        onOpenFile: (fileId) => onSelectKb(sub.knowledgeBase.id, displayName, getKbTypeForSub(sub.sourceLabel), fileId),
                      });
                    })
                  )}
                </div>
              </div>

              {/* 最近访问的文件 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900 m-0">最近访问</h3>
                  <button
                    onClick={() => setActiveQuickAccess('recent')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5 border-0 bg-transparent cursor-pointer"
                  >
                    查看全部 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5 flex gap-3 overflow-x-auto">
                  {recentList.slice(0, 6).map(item => {
                    const icon = formatFileIcon(item.format);
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectKb(item.kbId || 'kb-1', item.kbName || '知识库', item.kbType || 'personal', item.type === 'file' ? item.id : undefined)}
                        className="w-[180px] shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden text-left hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div className="h-28 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
                          {item.type === 'kb' ? (
                            <Database className="w-10 h-10 text-blue-300" />
                          ) : (
                            <FileText className="w-10 h-10 text-blue-300" />
                          )}
                          <span className={cn('absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold', icon.className)}>
                            {item.type === 'kb' ? 'KB' : icon.label}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-medium text-slate-900 truncate group-hover:text-blue-600">{item.name}</div>
                          <div className="text-[10px] text-slate-400 mt-1 truncate">{item.kbName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.time}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 协作通知 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-900 m-0">协作通知</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-medium">
                      {HOME_NOTIFICATIONS.filter(n => n.unread).length} 未读
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateToNotifications?.()}
                    className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-0.5 border-0 bg-transparent cursor-pointer"
                  >
                    查看更多 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {HOME_NOTIFICATIONS.map(item => (
                    <div key={item.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-xs font-medium flex items-center justify-center shrink-0">
                        {item.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 leading-snug m-0">
                          <span className="font-medium text-slate-900">{item.user}</span> {item.action}{' '}
                          <span className="text-blue-600 font-medium">{item.target}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">{item.time}</span>
                          {item.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 pt-0.5">{item.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <AnimatePresence>
        {['create_kb', 'edit_kb'].includes(modal.type) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[480px]"
             >
               <h3 className="text-[16px] font-medium text-slate-900 mb-4">
                 {modal.type === 'create_kb' ? '新建个人知识库' : '编辑知识库信息'}
               </h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1.5">
                     知识库名称 <span className="text-rose-500">*</span>
                   </label>
                   <input 
                     type="text" 
                     value={modalInput}
                     onChange={e => setModalInput(e.target.value)}
                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="请输入知识库名称..."
                     autoFocus
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1.5">知识库描述</label>
                   <textarea
                     value={kbDescription}
                     onChange={e => setKbDescription(e.target.value)}
                     rows={3}
                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                     placeholder="简要说明该知识库的用途、内容范围等..."
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1.5">知识库标签</label>
                   <div className="w-full flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 min-h-[38px] items-center">
                     {kbTags.map((tag, idx) => (
                       <span
                         key={idx}
                         className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
                       >
                         <span>#{tag}</span>
                         <button
                           type="button"
                           onClick={() => setKbTags(prev => prev.filter((_, i) => i !== idx))}
                           className="hover:bg-blue-100 text-blue-500 hover:text-blue-700 rounded-full w-3.5 h-3.5 flex items-center justify-center border-0 bg-transparent cursor-pointer p-0"
                         >
                           ×
                         </button>
                       </span>
                     ))}
                     <input
                       type="text"
                       placeholder={kbTags.length === 0 ? "输入后敲击回车、空格或逗号添加..." : ""}
                       onKeyDown={(e) => {
                         if (e.key === "Enter" || e.key === " " || e.key === "," || e.key === "，" || e.key === ";" || e.key === "；") {
                           e.preventDefault();
                           const val = e.currentTarget.value.trim().replace(/[,，;；]/g, '');
                           if (val && !kbTags.includes(val)) {
                             setKbTags([...kbTags, val]);
                           }
                           e.currentTarget.value = "";
                         } else if (e.key === "Backspace" && !e.currentTarget.value) {
                           setKbTags(prev => prev.slice(0, -1));
                         }
                       }}
                       className="flex-1 min-w-[80px] bg-transparent outline-none border-0 text-sm font-medium text-slate-800 p-0.5"
                     />
                   </div>
                   <p className="text-xs text-slate-400 mt-1">选填，便于后续检索与共享展示</p>
                 </div>
               </div>
               <div className="flex justify-end gap-1 mt-6">
                 <button onClick={() => { setModal({ type: 'none' }); resetKbForm(); }} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium cursor-pointer bg-transparent border-0">取消</button>
                 <button onClick={executeAction} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium cursor-pointer border-0">确认</button>
               </div>
             </motion.div>
          </div>
        )}

        {modal.type === 'delete_kb' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
             >
               <h3 className="text-[16px] font-medium text-rose-600 flex items-center gap-1 mb-2">
                 确认删除知识库
               </h3>
               <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                 您确定要删除 <span className="text-slate-900 font-medium">"{modal.payload?.name}"</span> 吗？知识库内的所有文件都将被移除，该操作不可恢复。
               </p>
               <div className="flex justify-end gap-1">
                 <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium cursor-pointer bg-transparent border-0">取消</button>
                 <button onClick={executeAction} className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200 rounded-lg text-sm font-medium cursor-pointer border-0">确认删除</button>
               </div>
             </motion.div>
          </div>
        )}

        {modal.type === 'share_kb' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[500px] text-left border border-slate-150/80 my-8 shadow-slate-200"
             >
               {/* Header */}
               <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                 <div>
                   <h3 className="text-[16px] font-medium text-slate-900">
                     共享《{modal.payload?.name}》知识库
                   </h3>
                 </div>
                 {/* Share toggle switch */}
                 <button 
                   onClick={() => setIsShareActive(!isShareActive)}
                   className={cn(
                     "px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer border bg-transparent",
                     isShareActive 
                       ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                       : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                   )}
                 >
                   <span className={cn("w-2 h-2 rounded-full", isShareActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                   {isShareActive ? '已开启共享' : '未开启共享'}
                 </button>
               </div>

               {isShareActive ? (
                 <div className="space-y-4 font-sans text-sm">
                   {/* 共享对象 */}
                   <div>
                     <div className="grid grid-cols-2 gap-2">
                       <button
                         onClick={() => setShareTarget('user')}
                         className={cn(
                           "p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all bg-white cursor-pointer",
                           shareTarget === 'user'
                             ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm font-medium"
                             : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                         )}
                       >
                         <User className="w-4 h-4 text-indigo-500" />
                         <span className="text-sm">指定用户</span>
                       </button>

                       <button
                         onClick={() => setShareTarget('public')}
                         className={cn(
                           "p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all bg-white cursor-pointer",
                           shareTarget === 'public'
                             ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm font-medium"
                             : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                         )}
                       >
                         <Globe className="w-4 h-4 text-emerald-500" />
                         <span className="text-sm">全系统公开</span>
                       </button>
                     </div>
                   </div>

                   {/* Sub-inputs based on target selection */}
                   {shareTarget === 'user' && (
                     <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-3">
                       <div className="flex gap-1 flex-wrap">
                         {shareMembers.map(m => (
                           <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                             {m.name}
                             <button onClick={() => setShareMembers(shareMembers.filter(sm => sm.id !== m.id))} className="text-slate-400 hover:text-red-500">
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                         ))}
                       </div>
                       <button
                         onClick={() => setShowMemberSelector(true)}
                         disabled={!isShareActive}
                         className="flex items-center justify-center gap-1 w-full py-2 bg-white border border-slate-200 border-dashed rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 cursor-pointer"
                       >
                         <Plus className="w-4 h-4" /> 添加指定用户
                       </button>
                     </div>
                   )}



                   {/* 权限设置 */}
                   <div>
                     <div className="grid grid-cols-3 gap-1">
                       <button
                         onClick={() => setSharePermission('view')}
                         className={cn(
                           "py-2 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all text-sm bg-white cursor-pointer",
                           sharePermission === 'view'
                             ? "border-amber-500 bg-amber-50/50 text-amber-900 shadow-xs font-medium"
                             : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                         )}
                       >
                         <Eye className="w-3.5 h-3.5 text-amber-500" />
                         <span>仅查看</span>
                       </button>

                       <button
                         onClick={() => setSharePermission('download')}
                         className={cn(
                           "py-2 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all text-sm bg-white cursor-pointer",
                           sharePermission === 'download'
                             ? "border-amber-500 bg-amber-50/50 text-amber-900 shadow-xs font-medium"
                             : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                         )}
                       >
                         <Download className="w-3.5 h-3.5 text-blue-500" />
                         <span>可下载</span>
                       </button>

                       <button
                         onClick={() => setSharePermission('comment')}
                         className={cn(
                           "py-2 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all text-sm bg-white cursor-pointer",
                           sharePermission === 'comment'
                             ? "border-amber-500 bg-amber-50/50 text-amber-900 shadow-xs font-medium"
                             : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                         )}
                       >
                         <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                         <span>可评论</span>
                       </button>
                     </div>
                   </div>

                   {/* Option 3: 有效期 Selection */}
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">共享有效期限制</label>
                     <div className="grid grid-cols-4 gap-1.5">
                       {([`7d`, `30d`, `permanent`, `custom`] as const).map(exp => (
                         <button
                           key={exp}
                           onClick={() => setShareExpires(exp)}
                           className={cn(
                             "py-2 rounded-lg border text-center text-[10.5px] transition-all bg-white cursor-pointer",
                             shareExpires === exp
                               ? "border-teal-500 bg-teal-50/50 text-teal-900 shadow-xs font-medium"
                               : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                           )}
                         >
                           {exp === '7d' ? '7 天' : exp === '30d' ? '30 天' : exp === 'permanent' ? '永久有效' : '自定义日期'}
                         </button>
                       ))}
                     </div>

                     {shareExpires === 'custom' && (
                       <div className="p-3 bg-teal-50/40 border border-teal-100 rounded-xl mt-2 flex items-center gap-3 animate-in fade-in">
                         <span className="text-sm font-medium text-teal-800 whitespace-nowrap">截止有效期 :</span>
                         <input 
                           type="date"
                           value={customDate}
                           onChange={e => setCustomDate(e.target.value)}
                           className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
                         />
                       </div>
                     )}
                   </div>
                 </div>
               ) : (
                 <div className="py-8 text-center text-slate-500 space-y-2 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                   <Lock className="w-10 h-10 mx-auto text-slate-300" />
                   <p className="text-sm font-medium text-slate-700">当前共享通道已关闭</p>
                   <p className="text-sm text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed">
                     关闭后，所有之前领取的、在组织中激活的、或指定分配的协作者均将即刻失效，恢复并锁定为您的独占私有状态。
                   </p>
                 </div>
               )}

               <div className="flex justify-end gap-1 border-t border-slate-100 pt-4 mt-6">
                 <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium cursor-pointer border-0">取消</button>
                 <button onClick={handleSaveShareSettings} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium cursor-pointer border-0">确认并保存</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      <MemberSelectorModal
        isOpen={showMemberSelector}
        onClose={() => setShowMemberSelector(false)}
        onConfirm={(members) => setShareMembers(members)}
        title="选择指定用户"
        mode="member"
      />
    </div>
  );
}
