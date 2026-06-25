import { ArrowLeft, Clock, ListTodo, Star, FileText, Database, ChevronRight, AlertCircle, CheckCircle2, ShieldAlert, FileImage, FileArchive, Tags, MessageSquareText, Search, Filter, Check, Trash2, Edit2, Sparkles, FolderHeart, Plus, HelpCircle, RefreshCcw, ThumbsUp, X, CheckSquare, Layers, CornerDownRight, BookOpen, Download, ExternalLink, ShieldCheck, Folder, MoreVertical, Settings, Share2, LayoutGrid } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FavoriteFolder, FavoriteItem } from "../types";
import { TreeSelect } from "../components/TreeSelect";

import { MOCK_RECORDS, ENTITY_TYPE_OPTIONS } from "../constants";

interface QuickAccessViewProps {
  type: 'recent' | 'todo' | 'favorites';
  onBack: () => void;
  onNavigateToKB?: (kbId: string, fileId?: string) => void;
}

// Initial Mock Data with additional features for high interactive experience
const initialTodos = MOCK_RECORDS.todo;

const mockRecents = MOCK_RECORDS.recent;

const initialFavorites = MOCK_RECORDS.favorites.map(f => ({ ...f, targetId: f.id, folderId: 'default' })) as FavoriteItem[];

const MOCK_FOLDERS: FavoriteFolder[] = [
  { id: 'default', name: '默认收藏', createdAt: '2026-01-01' },
  { id: 'f_proj', name: '重点项目资料', createdAt: '2026-05-10' },
  { id: 'f_template', name: '常用公文模板', createdAt: '2026-05-20' },
];

export function QuickAccessView({ type, onBack, onNavigateToKB }: QuickAccessViewProps) {
  const [toast, setToast] = useState<string | null>(null);
  
  // Favorites States & Enhancements
  const [folders, setFolders] = useState<FavoriteFolder[]>(() => {
    const saved = localStorage.getItem('my_favorite_folders');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('my_favorite_folders', JSON.stringify(MOCK_FOLDERS));
    return MOCK_FOLDERS;
  });
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('my_favorites');
    if (saved) {
      return JSON.parse(saved);
    }
    return initialFavorites as FavoriteItem[];
  });

  const saveFavorites = (newFavorites: FavoriteItem[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('my_favorites', JSON.stringify(newFavorites));
    window.dispatchEvent(new Event('storage'));
  };

  const saveFolders = (newFolders: FavoriteFolder[]) => {
    setFolders(newFolders);
    localStorage.setItem('my_favorite_folders', JSON.stringify(newFolders));
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    const syncFavsAndFolders = () => {
      const savedFavs = localStorage.getItem('my_favorites');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedFolders = localStorage.getItem('my_favorite_folders');
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
      }
    };
    window.addEventListener('storage', syncFavsAndFolders);
    return () => window.removeEventListener('storage', syncFavsAndFolders);
  }, []);

  const [selectedFavIds, setSelectedFavIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [favCategory, setFavCategory] = useState<string>('全部');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editMemoText, setEditMemoText] = useState('');
  const [editTagText, setEditTagText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Folder Management State
  const [showFolderModal, setShowFolderModal] = useState<{type: 'create' | 'rename' | 'delete' | 'move_item' | 'none', payload?: any}>({ type: 'none' });
  const [folderInput, setFolderInput] = useState('');

  // To-Do States & Workbench Drawer
  const [todos, setTodos] = useState(initialTodos);
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const [todoCategory, setTodoCategory] = useState<string>('全部');
  
  // Interactive Slice Task States
  const [sliceEdits, setSliceEdits] = useState<Record<string, string>>({});
  const [sliceScoreFilters, setSliceScoreFilters] = useState<number>(0.7);

  // Interactive Summary Task States
  const [summaryEditText, setSummaryEditText] = useState('');
  const [summaryTagsText, setSummaryTagsText] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Interactive OCR Task States
  const [ocrEditText, setOcrEditText] = useState('');
  const [ocrEntityType, setOcrEntityType] = useState('');

  // Daily Metrics & Fun Achievements
  const [dailyReviewedCount, setDailyReviewedCount] = useState(4);
  const [scoreThresh, setScoreThresh] = useState(94.2);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getHeader = () => {
    switch (type) {
      case 'recent': return { title: '最近访问', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'todo': return { title: '待办事项', icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'favorites': return { title: '我的收藏', icon: Star, color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const header = getHeader();
  const Icon = header.icon;

  // Favorite categories grouping
  const getFavoriteCategories = () => {
    const categories = ['全部'];
    favorites.forEach(f => {
      if (f.tag && !categories.includes(f.tag)) {
        categories.push(f.tag);
      }
    });
    return categories;
  };

  // Filter & Search favorites
  const [favTypeFilter, setFavTypeFilter] = useState<'all' | 'folder' | 'file'>('all');

  const filteredFavorites = favorites.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (f.memo && f.memo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = activeFolderId === 'all' ? true : (f.folderId === activeFolderId || (!f.folderId && activeFolderId === 'default'));
    const matchesType = favTypeFilter === 'all' ? true : (favTypeFilter === 'folder' ? f.type === 'kb' : f.type === 'file');
    return matchesSearch && matchesFolder && matchesType;
  });

  const handleCreateFolder = () => {
    if (!folderInput.trim()) return;
    const newFolder: FavoriteFolder = {
      id: `f_${Date.now()}`,
      name: folderInput.trim(),
      createdAt: new Date().toISOString()
    };
    saveFolders([...folders, newFolder]);
    setFolderInput('');
    setShowFolderModal({ type: 'none' });
    showToast(`收藏夹 "${newFolder.name}" 创建成功`);
  };

  const handleRenameFolder = () => {
    if (!folderInput.trim() || !showFolderModal.payload) return;
    saveFolders(folders.map(f => f.id === showFolderModal.payload.id ? { ...f, name: folderInput.trim() } : f));
    setFolderInput('');
    setShowFolderModal({ type: 'none' });
    showToast('重命名成功');
  };

  const handleDeleteFolder = () => {
    if (!showFolderModal.payload) return;
    saveFolders(folders.filter(f => f.id !== showFolderModal.payload.id));
    // Move items back to default
    setFavorites(favorites.map(fav => fav.folderId === showFolderModal.payload.id ? { ...fav, folderId: 'default' } : fav));
    if (activeFolderId === showFolderModal.payload.id) setActiveFolderId('all');
    setShowFolderModal({ type: 'none' });
    showToast('收藏夹已删除，内容已移至默认收藏');
  };

  // Handle singular favorite toggle
  const toggleFavoriteSelection = (id: string) => {
    if (selectedFavIds.includes(id)) {
      setSelectedFavIds(selectedFavIds.filter(i => i !== id));
    } else {
      setSelectedFavIds([...selectedFavIds, id]);
    }
  };

  // Handle Select All
  const handleSelectAllFavs = () => {
    if (selectedFavIds.length === filteredFavorites.length) {
      setSelectedFavIds([]);
    } else {
      setSelectedFavIds(filteredFavorites.map(f => f.id));
    }
  };

  // Bulk Cancel Favorites
  const handleBulkUnfavorite = () => {
    if (selectedFavIds.length === 0) return;
    saveFavorites(favorites.filter(f => !selectedFavIds.includes(f.id)));
    setSelectedFavIds([]);
    setIsBulkMode(false);
    showToast(`成功取消收藏 ${selectedFavIds.length} 项内容`);
  };

  // Bulk Export Notes
  const handleBulkExportMemos = () => {
    if (selectedFavIds.length === 0) return;
    showToast(`已生成并导出 ${selectedFavIds.length} 个收藏条目的备忘文本！`);
  };

  // Save Inline Memo Edit
  const handleSaveMemo = (id: string) => {
    saveFavorites(favorites.map(f => f.id === id ? { ...f, memo: editMemoText.trim() } : f));
    setEditingMemoId(null);
    showToast('收藏资料卡备忘更新成功');
  };

  const handleStartEditingMemo = (f: any) => {
    setEditingMemoId(f.id);
    setEditMemoText(f.memo || '');
  };

  // Filter Todos
  const filteredTodos = todos.filter(t => {
    if (todoCategory === '全部') return true;
    if (todoCategory === 'OCR 解析' && t.type === 'ocr') return true;
    if (todoCategory === '切片治理' && t.type === 'slice') return true;
    if (todoCategory === '摘要审核' && t.type === 'summary') return true;
    if (todoCategory === '异常规整' && t.type === 'governance') return true;
    return false;
  });

  // Open task workbench
  const handleOpenTodoWorkbench = (todo: any) => {
    setActiveTodoId(todo.id);
    if (todo.type === 'summary') {
      setSummaryEditText(todo.detail.proposedSummary);
      setSummaryTagsText(todo.detail.tags);
    } else if (todo.type === 'ocr') {
      setOcrEditText(todo.detail.ocrText);
      setOcrEntityType(todo.detail.ocrEntityType || '');
    }
  };

  // Complete/Approve a ToDo Task
  const handleApproveTodoTask = (id: string, customMessage?: string) => {
    setTodos(todos.filter(t => t.id !== id));
    setActiveTodoId(null);
    setDailyReviewedCount(prev => prev + 1);
    setScoreThresh(prev => parseFloat((prev + 0.3).toFixed(1)));
    showToast(customMessage || '任务已成功审计、通过，关联的知识已被智能写入底层数据库');
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
      
      {/* Header Bar */}
      <header className="h-16 px-6 flex items-center justify-between glass-header shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className={cn("p-1.5 rounded-lg", header.bg, header.color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-[16px] font-medium text-slate-900">{header.title}</h1>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider block leading-snug">
                {type === 'todo' && 'AI 协同智能审批治理'}
                {type === 'favorites' && '差异备忘录与高智分类'}
                {type === 'recent' && '个人最近访问痕迹存档'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`在 ${header.title} 内执行检索匹配...`} 
              className="w-full pl-9 pr-4 py-1.5 glass-input rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400/80"
            />
          </div>
          
          {type === 'favorites' && (
            <button 
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedFavIds([]);
              }}
              className={cn(
                "h-[30px] px-3.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all text-slate-600 glass-card hover:bg-white/50",
                isBulkMode && "glass-card-active text-blue-600"
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {isBulkMode ? "取消管理" : "批量操作"}
            </button>
          )}

          <button 
            onClick={() => showToast('已成功拉取最新异动状态并重新对齐数据')}
            className="p-1.5 text-slate-500 glass-card rounded-lg hover:bg-white/50 transition-colors"
            title="刷新数据"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Responsive Canvas Layout */}
      <div className="flex-1 overflow-hidden flex relative z-10 w-full">
        
        {/* Left Side Content - Lists */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="w-full max-w-[1440px] mx-auto space-y-6">
            
            {/* 1. TO-DO SECTION (待办事项) */}
            {type === 'todo' && (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                
                {/* Todo sidebar filters */}
                <div className="space-y-4">
                  <div className="glass-panel rounded-xl p-3 space-y-3">
                    <div className="text-sm font-medium uppercase text-slate-400 tracking-wider">治理工作台分类</div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { label: '全部待办', id: '全部', count: todos.length, color: 'bg-slate-100 text-slate-500' },
                        { label: 'OCR 解析', id: 'OCR 解析', count: todos.filter(t => t.type==='ocr').length, color: 'bg-slate-100 text-slate-500' },
                        { label: '切片治理', id: '切片治理', count: todos.filter(t => t.type==='slice').length, color: 'bg-slate-100 text-slate-500' },
                        { label: '摘要审核', id: '摘要审核', count: todos.filter(t => t.type==='summary').length, color: 'bg-slate-100 text-slate-500' },
                        { label: '异常规整', id: '异常规整', count: todos.filter(t => t.type==='governance').length, color: 'bg-slate-100 text-slate-500' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setTodoCategory(tab.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors border-0 text-left",
                            todoCategory === tab.id ? "glass-card-active text-blue-700" : "text-slate-600 hover:bg-white/40 border border-transparent"
                          )}
                        >
                          <span>{tab.label}</span>
                          <span className={cn("px-1.5 py-0.5 rounded-full text-sm", todoCategory === tab.id ? "bg-blue-600 text-white" : tab.color)}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>


                </div>

                {/* Todo Main Area */}
                <div className="space-y-4">

                  {/* Clear state */}
                  {filteredTodos.length === 0 ? (
                    <div className="border border-dashed border-white/60 glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8" />
                      </div>
                      <h3 className="font-medium text-slate-900 text-[16px]">🎉 暂无待处理任务</h3>
                      <p className="text-sm text-slate-500 font-medium mt-2">所有的文件拦截、智能抽取与编码异常已全部治理并归档完毕！</p>
                      <button 
                        onClick={() => {
                          setTodos(initialTodos);
                          showToast('测试数据已还原供重新体验');
                        }} 
                        className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition"
                      >
                        重置状态
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTodos.map((todo) => {
                        const isActive = activeTodoId === todo.id;
                        return (
                          <div 
                            key={todo.id} 
                            onClick={() => handleOpenTodoWorkbench(todo)}
                            className={cn(
                              "p-3 glass-card rounded-xl cursor-pointer hover:shadow-md transition-all text-left group flex items-center gap-3",
                              isActive && "glass-card-active ring-2 ring-blue-400/50"
                            )}
                          >
                            <div className={cn("p-2.5 rounded-xl shrink-0", 
                              (todo.type === 'slice' || todo.type === 'summary' || todo.type === 'ocr') ? "bg-blue-50 text-blue-600" : 
                              "bg-rose-50 text-rose-600"
                            )}>
                              {todo.type === 'slice' && <MessageSquareText className="w-5 h-5" />}
                              {todo.type === 'summary' && <Tags className="w-5 h-5" />}
                              {todo.type === 'ocr' && <LayoutGrid className="w-5 h-5" />}
                              {todo.type === 'governance' && <ShieldAlert className="w-5 h-5" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-medium text-[14px] text-slate-900 group-hover:text-blue-600 transition-colors truncate">{todo.title}</h4>
                                <span className="text-sm text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded shrink-0">{todo.time}</span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-1 text-sm font-medium text-slate-500">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{todo.fileName}</span>
                                <span className="text-slate-300 shrink-0">•</span>
                                <span className="truncate max-w-[150px] text-slate-400">{todo.kbName}</span>
                              </div>
                            </div>
                            
                            <div className="shrink-0 flex items-center gap-3">
                              <span className={cn("text-[8.5px] uppercase font-medium tracking-widest px-2 py-1 rounded-full border shrink-0", 
                                todo.urgency === 'high' ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-blue-50 border-blue-200 text-blue-700"
                              )}>
                                {todo.urgency === 'high' ? '需尽快处理' : '建议处理'}
                              </span>
                              <button 
                                className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center text-slate-500 transition-all font-medium"
                              >
                                ➔
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. RECENT SECTION (最近访问) - Enhanced & Structured Footprint */}
            {type === 'recent' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Section: Today's High-Frequency Highlights */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      最近处理足迹
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {mockRecents.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          if (item.kbId && onNavigateToKB) onNavigateToKB(item.kbId, item.id);
                        }}
                        className="group relative glass-card rounded-2xl p-3 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col"
                      >
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 text-[9px] font-medium uppercase tracking-tighter text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity">
                          {item.time}
                        </div>

                        <div className="flex items-start gap-3 mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300",
                            item.type === 'kb' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {item.type === 'kb' ? <Database className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                          </div>
                          <div className="min-w-0 pr-12">
                            <h4 className="font-medium text-[14px] text-slate-900 leading-snug group-hover:text-blue-700 transition-colors break-words">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-1 mt-2">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-medium border uppercase tracking-wider",
                                item.kbType === 'team' ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                                item.kbType === 'public' ? "bg-purple-50 border-purple-100 text-purple-600" :
                                "bg-emerald-50 border-emerald-100 text-emerald-600"
                              )}>
                                {item.kbType === 'team' ? '团队协作' : item.kbType === 'public' ? '公共制度' : '个人私有'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto space-y-3">
                          <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-1.5 group-hover:bg-blue-50/30 transition-colors">
                            <div className="flex items-center gap-1 text-sm text-slate-400 font-medium">
                              <Folder className="w-3 h-3" />
                              <span className="truncate">{item.kbName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-400 font-medium">
                              <BookOpen className="w-3 h-3" />
                              <span>上浮相关推荐：3 条</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            <div className="flex items-center gap-1">
                              <button 
                                className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors" 
                                title="快速收藏"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showToast(`文件《${item.name}》已添加至默认收藏夹`);
                                }}
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.kbId && onNavigateToKB) onNavigateToKB(item.kbId, item.id);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all font-mono"
                            >
                              立即查阅 <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 flex justify-center border-t border-slate-100">
                  <span className="text-xs text-slate-400/80 font-medium">*仅展示30天内访问的文件</span>
                </div>
              </div>
            )}

            {/* 3. FAVORITES SECTION (我的收藏 - 精细化升级) */}
            {type === 'favorites' && (
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
                
                {/* Favorites Sidebar: Folders */}
                <div className="space-y-4 sticky top-0">
                  <div className="glass-panel rounded-2xl p-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium uppercase text-slate-400 tracking-wider">我的收藏夹</div>
                      <button 
                        onClick={() => { setFolderInput(''); setShowFolderModal({ type: 'create' }); }}
                        className="p-1 hover:bg-slate-100 rounded-md transition text-blue-600"
                        title="新建收藏夹"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => setActiveFolderId('all')}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all border-0 text-left",
                          activeFolderId === 'all' ? "bg-slate-900/90 text-white shadow-md" : "text-slate-600 hover:bg-white/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 opacity-70" />
                          <span>全部内容</span>
                        </div>
                        <span className={cn("text-sm font-medium px-1.5 py-0.5 rounded-full", activeFolderId === 'all' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                          {favorites.length}
                        </span>
                      </button>

                      <div className="h-px bg-slate-100 my-1 mx-2" />

                      {folders.map(folder => {
                        const itemCount = favorites.filter(f => f.folderId === folder.id).length;
                        return (
                          <div key={folder.id} className="group/folder relative">
                            <button 
                              onClick={() => setActiveFolderId(folder.id)}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all border-0 text-left",
                                activeFolderId === folder.id ? "glass-card-active text-blue-700" : "text-slate-600 hover:bg-white/40"
                              )}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Folder className={cn("w-4 h-4 shrink-0 opacity-70", activeFolderId === folder.id ? "text-blue-600" : "text-slate-400")} />
                                <span className="truncate">{folder.name}</span>
                              </div>
                              <span className={cn("text-sm font-medium px-1.5 py-0.5 rounded-full", activeFolderId === folder.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
                                {itemCount}
                              </span>
                            </button>
                            
                            {folder.id !== 'default' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderInput(folder.name);
                                  setShowFolderModal({ type: 'rename', payload: folder });
                                }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover/folder:opacity-100 transition-opacity bg-transparent border-0 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                             {folder.id !== 'default' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowFolderModal({ type: 'delete', payload: folder });
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover/folder:opacity-100 transition-opacity bg-transparent border-0 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Category Filtering Chips & Bulk Alert */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* 双维度过滤器：区分文件夹与文件 */}
                    <div className="flex glass-card p-0.5 rounded-lg items-center shrink-0 select-none">
                      <button
                        onClick={() => setFavTypeFilter('all')}
                        className={cn(
                          "px-3 py-1 text-sm font-medium rounded-md transition-all border-0 cursor-pointer",
                          favTypeFilter === 'all'
                            ? "glass-card-active text-slate-950"
                            : "text-slate-600 hover:text-slate-800 bg-transparent"
                        )}
                        type="button"
                      >
                        全部类型
                      </button>
                      <button
                        onClick={() => setFavTypeFilter('folder')}
                        className={cn(
                          "px-3 py-1 text-sm font-medium rounded-md transition-all border-0 cursor-pointer flex items-center gap-1",
                          favTypeFilter === 'folder'
                            ? "glass-card-active text-indigo-750"
                            : "text-slate-600 hover:text-indigo-600 bg-transparent"
                        )}
                        type="button"
                      >
                        <Folder className="w-3 h-3 text-indigo-505" />
                        文件夹
                      </button>
                      <button
                        onClick={() => setFavTypeFilter('file')}
                        className={cn(
                          "px-3 py-1 text-sm font-medium rounded-md transition-all border-0 cursor-pointer flex items-center gap-1",
                          favTypeFilter === 'file'
                            ? "glass-card-active text-blue-750"
                            : "text-slate-600 hover:text-blue-600 bg-transparent"
                        )}
                        type="button"
                      >
                        <FileText className="w-3 h-3 text-blue-505" />
                        单个文件
                      </button>
                    </div>
                  </div>

                  {/* Bulk management bar */}
                  {isBulkMode && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in zoom-in-95">
                      <span className="text-sm font-medium text-blue-800">已选择 {selectedFavIds.length} / {filteredFavorites.length} 项</span>
                      <div className="w-px h-4 bg-blue-200 mx-1"></div>
                      <button 
                        onClick={handleSelectAllFavs}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        {selectedFavIds.length === filteredFavorites.length ? "取消全选" : "全选"}
                      </button>
                      <button 
                        onClick={handleBulkUnfavorite}
                        disabled={selectedFavIds.length === 0}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3 h-3" /> 批量移除
                      </button>
                      <button 
                        onClick={handleBulkExportMemos}
                        disabled={selectedFavIds.length === 0}
                        className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3 h-3" /> 导出备注
                      </button>
                    </div>
                  )}
                </div>

                {/* Favorites Grid with Memo Field, Custom Notes, and Selection Indicator */}
                {filteredFavorites.length === 0 ? (
                  <div className="border border-dashed border-white/60 glass-panel rounded-2xl p-16 text-center">
                    <FolderHeart className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-800 text-base">暂未搜索到相匹配的收藏资料</h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">您可在知识库详情页内，将重要、高频的文件一键拉入我的收藏。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredFavorites.map((item) => {
                      const isSelected = selectedFavIds.includes(item.id);
                      const isEditing = editingMemoId === item.id;
                      
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            if (isBulkMode) {
                              toggleFavoriteSelection(item.id);
                            } else if (onNavigateToKB) {
                              if (item.type === 'kb') {
                                const finalKbId = item.targetId || item.kbId || item.id;
                                onNavigateToKB(finalKbId, undefined);
                              } else {
                                const finalKbId = item.kbId || 'kb-1';
                                const finalFileId = item.targetId || item.id;
                                onNavigateToKB(finalKbId, finalFileId);
                              }
                            }
                          }}
                          className={cn(
                            "glass-card rounded-xl hover:shadow-md cursor-pointer transition-all flex flex-col group relative overflow-hidden",
                            isSelected ? "glass-card-active ring-1 ring-blue-300" : "border-slate-200/70 ring-1 ring-slate-200/40 hover:border-blue-200/70",
                            isBulkMode && "pointer-events-auto"
                          )}
                        >
                          {/* Banner background decor based on type */}
                          <div className={cn("h-1.5 w-full shrink-0", item.type === 'kb' ? 'bg-indigo-500' : 'bg-blue-500')} />

                          {/* Top row with details */}
                          <div className="p-3 flex-1 flex flex-col text-left">
                            <div className="flex items-start justify-between gap-1">
                              {/* Selection checkbox or custom visual type icon */}
                              {isBulkMode ? (
                                <div 
                                  className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-1",
                                    isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300"
                                  )}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              ) : (
                                <div className={cn("p-2 rounded-lg flex items-center justify-center shrink-0",
                                  item.type === 'kb' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                                )}>
                                  {item.type === 'kb' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5 shrink-0 select-none" onClick={e => e.stopPropagation()}>
                                {!isBulkMode && (
                                  <>
                                    <button 
                                       onClick={(e) => { 
                                         e.stopPropagation(); 
                                         setShowFolderModal({ type: 'move_item', payload: item });
                                       }}
                                       className="text-slate-300 hover:text-blue-500 transition-colors p-1 bg-transparent border-0 cursor-pointer"
                                       title="移动到文件夹"
                                     >
                                       <FolderHeart className="w-4 h-4" />
                                     </button>
                                     <button 
                                       onClick={(e) => { 
                                         e.stopPropagation(); 
                                         saveFavorites(favorites.filter(fav => fav.id !== item.id));
                                         showToast('已取消收藏'); 
                                       }}
                                       className="text-slate-300 hover:text-blue-500 transition-colors p-1 bg-transparent border-0 cursor-pointer"
                                       title="取消收藏"
                                     >
                                       <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
                                     </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Middle name & source */}
                            <div className="mt-3.5 flex-1">
                              <div className="flex items-center gap-1.5 mb-1.5 select-none">
                                <span className={cn(
                                  "px-1.5 py-0.5 text-[9px] font-medium rounded shrink-0 uppercase tracking-widest",
                                  item.type === 'kb' 
                                    ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium shadow-3xs" 
                                    : "bg-blue-50 border border-blue-200 text-blue-700 font-medium shadow-3xs"
                                )}>
                                  {item.type === 'kb' ? "文件夹" : "单个文件"}
                                </span>
                              </div>
                              <h4 className="font-medium text-[13.5px] text-slate-900 leading-snug break-words group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h4>
                              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-400 font-semibold select-none">
                                <span className="truncate text-slate-505">{item.kbName}</span>
                                <span>•</span>
                                <span>{item.addedAt}</span>
                              </div>
                            </div>

                            {/* Highly customized Feature: Interactive Sticky Note Memo */}
                            <div 
                              className="mt-4 pt-3.5 border-t border-slate-100/90"
                              onClick={e => e.stopPropagation()}
                            >
                              {isEditing ? (
                                <div className="space-y-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between text-[9.5px] text-blue-800 font-medium">
                                    <span>编辑我的自用备注</span>
                                  </div>
                                  <textarea 
                                    value={editMemoText}
                                    onChange={e => setEditMemoText(e.target.value)}
                                    className="w-full text-sm p-2 outline-none resize-none bg-white rounded border border-slate-200 font-semibold text-slate-700 min-h-[50px] leading-relaxed"
                                    placeholder="输入该收藏对您的特殊参考意义或备忘细节..."
                                  />
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => setEditingMemoId(null)} className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[9.5px] font-medium border-0 cursor-pointer">取消</button>
                                    <button onClick={() => handleSaveMemo(item.id)} className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-medium border-0 cursor-pointer">保存</button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => handleStartEditingMemo(item)}
                                  className="p-2.5 bg-blue-50/50 hover:bg-blue-100/60 transition border border-blue-100/70 rounded-lg flex items-start gap-1 w-full text-left group/memo"
                                >
                                  <Edit2 className="w-3 h-3 text-blue-600 mt-0.5 shrink-0 opacity-40 group-hover/memo:opacity-100 transition-opacity" />
                                  <p className="text-sm text-blue-900 font-semibold leading-relaxed line-clamp-2">
                                    {item.memo || <span className="text-slate-400 font-medium italic">点击为此资料快捷添加个性化备忘...</span>}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Right Side Content Drawer Panel - Interactive Intelligent Audit Workbench for ToDos */}
        <AnimatePresence>
          {type === 'todo' && activeTodoId && (
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="w-[440px] border-l border-white/50 glass-flyout relative z-40 flex flex-col shrink-0 h-full animate-in slide-in-from-right-8 duration-300"
            >
              {/* Drawer header */}
              <div className="p-5 border-b border-white/40 glass-header shrink-0 flex items-start justify-between text-left">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium uppercase text-blue-600 tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>AI 协同人机交互治理工作台</span>
                  </div>
                  <h3 className="text-base font-medium text-slate-900 mt-1">
                    处理：{(todos.find(t=>t.id === activeTodoId))?.fileName}
                  </h3>
                  <p className="text-sm text-slate-500 font-semibold mt-0.5">
                    修改、精细校正其在入库链路中触发的低置信度数据
                  </p>
                  {/* Removed preview button from header, moved to actions */}
                </div>
                <button 
                  onClick={() => setActiveTodoId(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer interactive workbench elements */}
              <div className="flex-1 overflow-auto p-5 space-y-6">
                {(() => {
                  const activeTodo = todos.find(t => t.id === activeTodoId);
                  if (!activeTodo) return null;

                  /* COMPONENT 1: Chunks / Slices Audit ("slice") */
                  if (activeTodo.type === 'slice') {
                    return (
                      <div className="space-y-4 text-left">
                        {/* Task Context Card */}
                        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-left">
                          <label className="text-sm font-medium uppercase text-blue-800 tracking-wider block mb-1">源文件上下文段落</label>
                          <p className="text-[11.5px] text-slate-700 font-semibold leading-relaxed max-h-[85px] overflow-auto border-l-2 border-blue-400 pl-2 bg-white/70 p-2 rounded">
                            {activeTodo.detail.rawText}
                          </p>
                        </div>

                        {/* Interactive Slice sliders or edit fields */}
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-900 flex items-center gap-1">
                              <span>AI 自动精确定向分片 ({activeTodo.detail.slices.length})</span>
                            </label>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                              <span>置信度过滤门槛:</span>
                              <span className="text-blue-600 font-medium font-mono">{(sliceScoreFilters * 100).toFixed(0)}%</span>
                            </div>
                          </div>

                          {/* Dynamic score slider filter */}
                          <input 
                            type="range"
                            min="0.6"
                            max="0.95"
                            step="0.05"
                            value={sliceScoreFilters}
                            onChange={(e) => setSliceScoreFilters(parseFloat(e.target.value))}
                            className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />

                          {/* Editable candidates */}
                          <div className="space-y-3 pt-2">
                            {activeTodo.detail.slices
                              .filter(sl => sl.score >= sliceScoreFilters)
                              .map((sl, index) => {
                                const currentText = sliceEdits[sl.id] ?? sl.text;
                                return (
                                  <div key={sl.id} className="p-3.5 border border-slate-200 hover:border-blue-200 rounded-xl bg-white space-y-2">
                                    <div className="flex justify-between items-center text-left">
                                      <span className="text-[10.5px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">子切片 #{index+1}</span>
                                      <span className={cn("text-[9.5px] font-medium", sl.score >= 0.85 ? "text-emerald-600" : "text-blue-600")}>
                                        匹配得分: {(sl.score * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                    <textarea 
                                      value={currentText}
                                      onChange={(e) => setSliceEdits({ ...sliceEdits, [sl.id]: e.target.value })}
                                      className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:bg-white focus:border-blue-400 outline-none"
                                      rows={2}
                                    />
                                    <div className="flex justify-between items-center text-sm text-slate-400 font-medium">
                                      <span>推荐嵌入向量图腾</span>
                                      <span className="text-blue-600">已推荐 2 个实体关联标记</span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Submit audit */}
                        <div className="pt-4 flex gap-3">
                          {activeTodo.kbId && activeTodo.fileId && onNavigateToKB && (
                            <button
                              onClick={() => {
                                onNavigateToKB(activeTodo.kbId, activeTodo.fileId);
                              }}
                              className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-1.5 transition border-0 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" /> 立即打开源文件预览
                            </button>
                          )}
                          <button 
                            onClick={() => handleApproveTodoTask(activeTodo.id, '切片结构完成复核，已生成完美索引块入库！')}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md flex items-center justify-center gap-1.5 transition border-0 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> 批准：批量修正切片并入库
                          </button>
                        </div>
                      </div>
                    );
                  }

                  /* COMPONENT 2: Summary / Tags low-confidence Review ("summary") */
                  if (activeTodo.type === 'summary') {
                    return (
                      <div className="space-y-5 text-left">
                        {/* Error info */}
                        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                          <div className="flex items-center gap-1 text-blue-800 text-sm font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>算法置信度未达标: {activeTodo.detail.confidenceScore}</span>
                          </div>
                          <p className="text-sm text-blue-700 font-medium leading-normal">
                            该摘要部分未通过文本语义逻辑检验系统，可能是摘要内容存在概括偏移，请核对并手动微调：
                          </p>
                        </div>

                        {/* Document summary editable field */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-800">编辑智能生成的描述与概要</label>
                          <textarea 
                            value={summaryEditText}
                            onChange={(e) => setSummaryEditText(e.target.value)}
                            className="w-full text-sm p-3 border border-slate-200 focus:border-blue-400 rounded-xl font-semibold text-slate-700 leading-relaxed outline-none"
                            rows={5}
                          />
                        </div>

                        {/* Tag badges cloud */}
                        <div className="space-y-2.5">
                          <label className="text-sm font-medium text-slate-800">核对并修正提取的关键字实体 (Tags)</label>
                          <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-xl bg-slate-50 min-h-[46px]">
                            {summaryTagsText.map((tag) => (
                              <span key={tag} className="flex items-center gap-1 bg-white border border-slate-200 text-blue-700 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium shadow-2xs">
                                <span>{tag}</span>
                                <button 
                                  onClick={() => setSummaryTagsText(summaryTagsText.filter(t => t !== tag))} 
                                  className="text-slate-400 hover:text-rose-600 font-medium w-3 h-3 flex items-center justify-center leading-none"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          
                          {/* Add manual tags */}
                          <div className="flex gap-1">
                            <input 
                              type="text" 
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              placeholder="新标签、业务分类，按回车添加"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newTagInput.trim()) {
                                  if (!summaryTagsText.includes(newTagInput.trim())) {
                                    setSummaryTagsText([...summaryTagsText, newTagInput.trim()]);
                                  }
                                  setNewTagInput('');
                                }
                              }}
                              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg font-medium"
                            />
                            <button 
                              onClick={() => {
                                if (newTagInput.trim() && !summaryTagsText.includes(newTagInput.trim())) {
                                  setSummaryTagsText([...summaryTagsText, newTagInput.trim()]);
                                  setNewTagInput('');
                                }
                              }}
                              className="px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                            >
                              添加
                            </button>
                          </div>
                        </div>

                        {/* Confirm Submit */}
                        <div className="pt-4 flex gap-3">
                          {activeTodo.kbId && activeTodo.fileId && onNavigateToKB && (
                            <button
                              onClick={() => {
                                onNavigateToKB(activeTodo.kbId, activeTodo.fileId);
                              }}
                              className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-1.5 transition border-0 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" /> 立即打开源文件预览
                            </button>
                          )}
                          <button 
                            onClick={() => handleApproveTodoTask(activeTodo.id, '摘要及标识实体修正通过，已被成功固化入库！')}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md flex items-center justify-center gap-1.5 transition border-0 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> 确认并通过此摘要
                          </button>
                        </div>
                      </div>
                    );
                  }

                  /* COMPONENT 4: OCR Entity type and content edit ("ocr") */
                  if (activeTodo.type === 'ocr') {
                    return (
                      <div className="space-y-5 text-left">
                        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                          <div className="flex items-center gap-1 text-blue-800 text-sm font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>OCR 解析及实体类型判定</span>
                          </div>
                          <p className="text-sm text-blue-700 font-medium leading-normal">
                            系统已提取文档的 OCR 内容，但在提取文件实体类型（合同、研报、公文等）时未能自动判定高置信度。请补充实体类型并校对内容：
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-800">实体类型 (Entity Type)</label>
                          <TreeSelect 
                            value={ocrEntityType}
                            onChange={setOcrEntityType}
                            options={ENTITY_TYPE_OPTIONS}
                            placeholder="搜索或选择实体类型..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-800">OCR 抽取内容校对</label>
                          <textarea 
                            value={ocrEditText}
                            onChange={(e) => setOcrEditText(e.target.value)}
                            className="w-full text-sm p-3 border border-slate-200 focus:border-blue-400 rounded-xl font-semibold text-slate-700 leading-relaxed outline-none"
                            rows={8}
                          />
                        </div>

                        <div className="pt-4 flex gap-3">
                          {activeTodo.kbId && activeTodo.fileId && onNavigateToKB && (
                            <button
                              onClick={() => {
                                onNavigateToKB(activeTodo.kbId, activeTodo.fileId);
                              }}
                              className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-1.5 transition border-0 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" /> 立即打开源文件预览
                            </button>
                          )}
                          <button 
                            onClick={() => handleApproveTodoTask(activeTodo.id, '实体分类及 OCR 校对完善，顺利入库！')}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md flex items-center justify-center gap-1.5 transition border-0 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> 保存修改
                          </button>
                        </div>
                      </div>
                    );
                  }

                  /* COMPONENT 3: Governance / Format / Encoding Conflict Repair ("governance") */
                  if (activeTodo.type === 'governance') {
                    return (
                      <div className="space-y-4 text-left">
                        {/* Error info cards */}
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-sm">
                          <div className="flex items-center gap-1.5 text-rose-800 font-medium text-sm">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>异常代码: {activeTodo.detail.errorCode}</span>
                          </div>
                          <p className="text-slate-700 font-semibold leading-relaxed">
                            {activeTodo.detail.errorMessage}
                          </p>
                          <div className="h-px bg-rose-100 my-1"></div>
                          <div className="text-sm text-slate-500 font-medium mb-2">压缩包大小: {activeTodo.detail.fileSize}</div>
                          
                          {activeTodo.kbId && activeTodo.fileId && onNavigateToKB && (
                            <button
                              onClick={() => {
                                onNavigateToKB(activeTodo.kbId, activeTodo.fileId);
                              }}
                              className="w-full mt-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 border-0 cursor-pointer shadow-sm transition"
                            >
                              <FileText className="w-3.5 h-3.5" /> 查看文档
                            </button>
                          )}
                        </div>

                        {/* Interactive choices remediation options */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-slate-400 uppercase tracking-widest block">推荐修复应对预案</label>
                          {activeTodo.detail.remediations.map((rem, idx) => (
                            <button 
                              key={rem.id}
                              onClick={() => {
                                if (rem.id === 'rem1') {
                                  showToast('运行自动智能转码...');
                                  setTimeout(() => {
                                    handleApproveTodoTask(activeTodo.id, '字符集已成功通过智能字节流算法转为标准 UTF-8，完成全部数据归纳入库。');
                                  }, 1200);
                                } else if (rem.id === 'rem2') {
                                  showToast('触发 OCR 智能图片层级识别...');
                                  setTimeout(() => {
                                    handleApproveTodoTask(activeTodo.id, '图片已由后端进行全量 OCR 分析，图纸与素材已被有效归档检索！');
                                  }, 1200);
                                } else {
                                  handleApproveTodoTask(activeTodo.id, '本条任务已驳回，自检说明已定向群发至林珊的邮箱及协作通知中。');
                                }
                              }}
                              className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-rose-300 rounded-xl transition text-left flex gap-3 group"
                            >
                              <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-rose-100 group-hover:text-rose-600 text-[10.5px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <div>
                                <b className="block text-sm font-medium text-slate-900 group-hover:text-rose-700 transition-colors leading-snug">{rem.title}</b>
                                <span className="block text-[10.5px] text-slate-400 font-medium leading-relaxed mt-1">{rem.desc}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {['create', 'rename'].includes(showFolderModal.type) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center glass-overlay">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="glass-modal rounded-2xl p-6 w-[400px]"
             >
               <h3 className="text-[16px] font-medium text-slate-900 mb-4">
                 {showFolderModal.type === 'create' ? '新建收藏夹' : '重命名收藏夹'}
               </h3>
               <input 
                 type="text" 
                 value={folderInput}
                 onChange={e => setFolderInput(e.target.value)}
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                 placeholder="请输入收藏夹名称..."
                 autoFocus
                 onKeyDown={(e) => { 
                   if (e.key === 'Enter') {
                     showFolderModal.type === 'create' ? handleCreateFolder() : handleRenameFolder();
                   } 
                 }}
               />
               <div className="flex justify-end gap-1">
                 <button 
                  onClick={() => setShowFolderModal({ type: 'none' })} 
                  className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium cursor-pointer border-0"
                 >
                   取消
                 </button>
                 <button 
                  onClick={showFolderModal.type === 'create' ? handleCreateFolder : handleRenameFolder} 
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium cursor-pointer border-0"
                 >
                   确认
                 </button>
               </div>
             </motion.div>
          </div>
        )}

        {showFolderModal.type === 'delete' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center glass-overlay">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="glass-modal rounded-2xl p-6 w-[400px]"
             >
               <h3 className="text-[16px] font-medium text-blue-600 flex items-center gap-1 mb-2">
                 确认删除此收藏夹
               </h3>
               <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                 您确定要删除收藏夹 <span className="text-slate-900 font-medium">"{showFolderModal.payload?.name}"</span> 吗？
                 收藏夹内的项目将不会被删除，而是移动回到 <span className="text-slate-900 font-medium">默认收藏</span> 中。
               </p>
               <div className="flex justify-end gap-1">
                 <button onClick={() => setShowFolderModal({ type: 'none' })} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium cursor-pointer border-0">取消</button>
                 <button onClick={handleDeleteFolder} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 rounded-lg text-sm font-medium cursor-pointer border-0">确认删除</button>
               </div>
             </motion.div>
          </div>
        )}

        {showFolderModal.type === 'move_item' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center glass-overlay">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="glass-modal rounded-2xl p-6 w-[400px]"
             >
               <h3 className="text-[16px] font-medium text-slate-900 mb-2 flex items-center gap-1">
                 <FolderHeart className="w-4 h-4 text-blue-500" />
                 移动项目至文件夹
               </h3>
               <p className="text-sm font-medium text-slate-400 mb-4 truncate italic">
                 正在移动：{showFolderModal.payload?.name}
               </p>
               
               <div className="space-y-1 mb-6 max-h-[240px] overflow-auto pr-1">
                 {folders.map(folder => (
                   <button
                     key={folder.id}
                     onClick={() => {
                       setFavorites(favorites.map(f => f.id === showFolderModal.payload.id ? { ...f, folderId: folder.id } : f));
                       setShowFolderModal({ type: 'none' });
                       showToast(`成功移动至 "${folder.name}"`);
                     }}
                     className={cn(
                       "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-0 text-left cursor-pointer",
                       showFolderModal.payload?.folderId === folder.id ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-50"
                     )}
                   >
                     <div className="flex items-center gap-1.5">
                       <Folder className={cn("w-4 h-4 opacity-70", showFolderModal.payload?.folderId === folder.id ? "text-blue-600" : "text-slate-400")} />
                       <span>{folder.name}</span>
                     </div>
                     {showFolderModal.payload?.folderId === folder.id && <Check className="w-3.5 h-3.5" />}
                   </button>
                 ))}
               </div>

               <div className="flex justify-end gap-1">
                 <button onClick={() => setShowFolderModal({ type: 'none' })} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium border-0 cursor-pointer">取消</button>
               </div>
             </motion.div>
          </div>
        )}

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
    </div>
  );
}
