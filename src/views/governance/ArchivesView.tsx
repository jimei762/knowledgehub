import { useState } from "react";
import { Archive, Search, Filter, MoreHorizontal, Eye, RotateCcw, Trash2, ShieldCheck, Clock, Users, Globe } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const MOCK_ARCHIVES = [
  { id: 'arc1', name: '2025年零售网点数字化转型方案库', type: 'public', archivedBy: '林杰', archivedAt: '2026-01-15', desc: '包含2025年数字化网点建设的所有标准文案、物料模版。制度已失效，归档查阅。', items: 124, owner: '零售运营中心' },
  { id: 'arc2', name: '深圳分行-普惠金融内测小项', type: 'team', archivedBy: '吴漫妮', archivedAt: '2026-03-22', desc: '项目已完成，相关内测口径与沟通记录归档存档，由分行风控办代管。', items: 45, owner: '深圳分行' },
  { id: 'arc3', name: '2024开门红品牌素材包', type: 'public', archivedBy: '王敏', archivedAt: '2025-12-30', desc: '历史活动素材库，仅供后续活动参考对比。', items: 560, owner: '品牌管理部' }
];

interface ArchivesViewProps {
  onNavigateToKB?: (kbId: string, kbName: string, kbType: 'public' | 'team') => void;
}

export function ArchivesView({ onNavigateToKB }: ArchivesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "public" | "team">("all");
  const [archives, setArchives] = useState(MOCK_ARCHIVES);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = archives.filter(kb => {
    const matchesSearch = kb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          kb.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" ? true : kb.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden text-left">
      <div className="px-8 py-6 border-b border-slate-200 bg-white shrink-0 shadow-sm relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-medium text-slate-900 tracking-normal flex items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shadow-inner">
                <Archive className="w-[18px] h-[18px]" />
              </div>
              归档中心
            </h1>
          </div>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg border border-amber-100 flex items-center gap-1">
             <ShieldCheck className="w-4 h-4" />
             管理权限：有权查看
          </span>
        </div>

        <div className="flex items-center gap-3 mt-6">
           <div className="flex-1 flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索归档知识库..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-none bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400" 
              />
           </div>
           
           <div className="flex items-center gap-1 p-1 bg-slate-100/50 border border-slate-200 rounded-xl shrink-0">
             {(['all', 'public', 'team'] as const).map(t => (
               <button
                 key={t}
                 onClick={() => setFilterType(t)}
                 className={cn(
                   "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                   filterType === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                 )}
               >
                 {t === 'all' ? '全部' : t === 'public' ? '公共归档' : '团队归档'}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                        item.type === 'public' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                      )}>
                        {item.type === 'public' ? <Globe className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                           <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                           <span className={cn(
                             "text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                             item.type === 'public' ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"
                           )}>
                             {item.type === 'public' ? '公共大类' : '团队库'}
                           </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 lines-clamp-2 max-w-[600px] leading-relaxed italic">
                          "{item.desc}"
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm font-medium text-slate-400 uppercase tracking-wide">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 所属：{item.owner}</span>
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><Archive className="w-3.5 h-3.5" /> 归档于：{item.archivedAt}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 处理人：{item.archivedBy}</span>
                          <span className="flex items-center gap-1"><Archive className="w-3.5 h-3.5" /> 包含项：{item.items}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                       <button onClick={() => onNavigateToKB?.(item.id, item.name, item.type as 'public' | 'team')} className="h-9 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-1 cursor-pointer">
                         <Eye className="w-4 h-4" /> 查看归档数据
                       </button>
                       <button
                         onClick={() => setArchives(prev => prev.filter(a => a.id !== item.id))}
                         title="恢复归档"
                         className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                       >
                         <RotateCcw className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                <Archive className="w-16 h-16 opacity-10 mb-4" />
                <span className="font-medium text-sm">暂无符合条件的归档记录</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
