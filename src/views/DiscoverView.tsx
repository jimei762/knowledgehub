import { useState, useMemo, useEffect } from "react";
import { Search, Check, Sparkles, Newspaper, Bookmark, Share2, Eye, User, Calendar, ChevronRight, Compass, ArrowRight, Grid3X3, List, BookOpen, Heart, Download, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Official published organization content (组织发布内容: 组织新发布、推荐、必读)
const INITIAL_OFFICIAL_PUBLISHES = [
  { 
    id: 'op1', 
    title: "网点服务标准手册 2026 版.pdf", 
    desc: "关于推进全行网点运营数字化第二阶段转型指导意见。明确了2026年网点智能化运营转型工作的总体路线要求、核心数字化路径及考核配套指标，是全行运营岗二季度业务必读资料。", 
    dept: "运营管理部", 
    label: "必读资料", 
    time: "2小时前发布", 
    size: "12.4 MB", 
    type: "pdf", 
    reads: 1420,
    kbFileId: 'file1'
  },
  { 
    id: 'op2', 
    title: "高风险投诉应急话术.docx", 
    desc: "商业银行零售信贷业务审贷合规与安全边界操作口径。结合行业监管新规，梳理了授信资质审查、影像资料补录、首期双录及交叉非现场监测的标准操作指引。", 
    dept: "信贷风控中心", 
    label: "推荐参考", 
    time: "昨日 14:00", 
    size: "4.1 MB", 
    type: "docx", 
    reads: 890,
    kbFileId: 'file2'
  },
  { 
    id: 'op3', 
    title: "厅堂排队冲突解决指引方案.pptx", 
    desc: "厅堂消保纠纷与极速退赔话术及突发投诉事件 SOP 应急处置手册。汇聚三十余个优秀支行网点的一线客诉实操经验，包含45类典型争议点回复口径。", 
    dept: "客户服务与消保部", 
    label: "最新发布", 
    time: "3天前发布", 
    size: "18.2 MB", 
    type: "pptx", 
    reads: 2150,
    kbFileId: 'file3'
  },
  { 
    id: 'op4', 
    title: "大客户理财推介白皮书.pdf", 
    desc: "第二季度新发零售投资权益产品配置与分层客群推进一览表。二季度我行主推针对中低风险理财、组合定投、代发薪客群精细化专属工具包的测算模型。", 
    dept: "零售金融部", 
    label: "推荐参考", 
    time: "4天前发布", 
    size: "8.6 MB", 
    type: "pdf", 
    reads: 610,
    kbFileId: 'file4'
  }
];

// Personal publicly shared content (个人公开共享内容: 他人设置为组织内公开可见的个人知识库或资料)
const INITIAL_PERSONAL_SHARES = [
  { 
    id: 'ps1', 
    title: "林珊的零售快速信贷开口与高频客诉避坑私房秘籍", 
    desc: "自己在运营一线四年多实战沉淀的微信社群精细化运营套路、陌生高净值客户破冰开口方案、以及合规客诉调处绝活。全部干货大案，已脱敏并标记特征，随手可用。", 
    author: "林珊", 
    dept: "零售运营部", 
    views: 420, 
    followers: 86, 
    isFollowed: false, 
    tags: ["实操话术", "零售增长", "私房笔记"] 
  },
  { 
    id: 'ps2', 
    title: "赵雷：2026年银行数字化敏捷产品经理素养与业务架构蓝图思考", 
    desc: "基于分行远程作业移动站、无人柜面集成柜、系统后台RPA流程自动化的中长期技术规划与真实业务痛点交互原型评测，欢迎系统内同行评议探讨。", 
    author: "赵雷", 
    dept: "数字化产品组", 
    views: 240, 
    followers: 32, 
    isFollowed: true, 
    tags: ["路线图", "PM思考", "敏捷转型"] 
  },
  { 
    id: 'ps3', 
    title: "本外币前台合规填单与开户多维防风险全通关通关要点", 
    desc: "总结对公及中小微开户在视频面审双录、法人真实意愿穿透核验环节最易遗漏的红线禁忌，涵盖最新高频异常开户防弹回口诀及高频特例应急策略。", 
    author: "宋吉美", 
    dept: "越秀数字网点", 
    views: 510, 
    followers: 124, 
    isFollowed: false, 
    tags: ["对公开户", "审贷协作", "网点干货"] 
  }
];

export function DiscoverView({ onSubscribe }: { onSubscribe?: (kb: any) => void }) {
  const [activeTab, setActiveTab] = useState<"official" | "personal">("official");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [officialRecords, setOfficialRecords] = useState(INITIAL_OFFICIAL_PUBLISHES);
  const [personalRecords, setPersonalRecords] = useState(INITIAL_PERSONAL_SHARES);
  
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('personal_kbs_shared_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const customShares: any[] = [];
        Object.entries(parsed).forEach(([kbId, val]: [string, any]) => {
          if (val.isShared && val.shareSettings?.target === 'public') {
            customShares.push({
              id: kbId,
              title: val.shareSettings.name || `共享知识库: ${kbId}`,
              desc: val.shareSettings.description || "暂无描述",
              author: "我自己 (王宇)",
              dept: "数字化创新部",
              views: 12,
              followers: 0,
              isFollowed: false,
              tags: val.shareSettings.tags || ["自主共享"]
            });
          }
        });
        
        setPersonalRecords(prev => {
          const initialFiltered = prev.filter(item => !parsed[item.id]);
          return [...customShares, ...initialFiltered];
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle dynamic follow for personal shares
  const handleToggleFollow = (id: string, name: string) => {
    setPersonalRecords(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.isFollowed;
        showToast(nextState ? `已成功订阅${name}的共享知识库` : `已取消对${name}的订阅`);
        return {
          ...item,
          isFollowed: nextState,
          followers: nextState ? item.followers + 1 : item.followers - 1
        };
      }
      return item;
    }));
  };

  const filteredOfficial = useMemo(() => {
    return officialRecords.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dept.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [officialRecords, searchQuery]);

  const filteredPersonal = useMemo(() => {
    return personalRecords.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [personalRecords, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
      
      {/* Search and Navigation Bar */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-8 py-5 relative z-10">
        <div className="w-full max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <h1 className="text-[20px] font-medium text-slate-900 tracking-normal">知识发现中心</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标题、简介或所属部门..."
                className="w-72 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600")}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="w-full max-w-[1440px] mx-auto mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setActiveTab("official"); }}
              className={cn(
                "h-10 px-5 text-sm font-medium relative transition-all rounded-lg flex items-center gap-1",
                activeTab === "official" ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <Newspaper className="w-4 h-4" />
              组织发布内容
              <span className="text-sm px-1.5 py-0.5 rounded-full bg-blue-200/50 text-blue-700">官方必读/推荐</span>
            </button>
            <button 
              onClick={() => { setActiveTab("personal"); }}
              className={cn(
                "h-10 px-5 text-sm font-medium relative transition-all rounded-lg flex items-center gap-1",
                activeTab === "personal" ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <User className="w-4 h-4" />
              个人公开共享内容
              <span className="text-sm px-1.5 py-0.5 rounded-full bg-blue-200/50 text-blue-700">他人分享/成果</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="w-full max-w-[1440px] mx-auto">
          
          {/* TAB 1: 组织发布内容 */}
          {activeTab === "official" && (
            <div className="space-y-6">

              {filteredOfficial.length === 0 ? (
                <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">没有查找到相关的组织发布内容</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {filteredOfficial.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <span className={cn(
                            "text-[9px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                            item.label === '必读资料' ? "bg-rose-50 text-rose-600 border-rose-100" :
                            item.label === '推荐参考' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            "bg-blue-50 text-blue-600 border-blue-100"
                          )}>{item.label}</span>
                          <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" /> {item.reads} 次阅读
                          </span>
                        </div>

                        <h3 className="text-[14.5px] font-medium text-slate-900 leading-snug mb-2 hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {item.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono text-sm uppercase">{item.type}</span>
                          <span>{item.dept}</span>
                          <span className="text-slate-300">|</span>
                          <span>{item.time}</span>
                        </div>
                        <button 
                          onClick={() => {
                            showToast(`已为您直接打开《${item.title}》`);
                            if (onSubscribe) onSubscribe({ id: 'kb_policy_center', title: '制度规范大类', fileId: item.kbFileId, type: 'public' });
                          }}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1 border-0 cursor-pointer shadow-sm"
                        >
                          立即查阅 <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  {filteredOfficial.map((item, idx) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-3 flex items-center justify-between gap-6 hover:bg-slate-50 transition-colors",
                        idx < filteredOfficial.length - 1 && "border-b border-slate-100"
                      )}
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-medium text-sm uppercase flex flex-col items-center justify-center shrink-0">
                          <span>{item.type}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className={cn(
                              "text-[8.5px] font-medium px-1.5 py-0.2 rounded-md border",
                              item.label === '必读资料' ? "bg-rose-50 text-rose-500 border-rose-100" :
                              item.label === '推荐参考' ? "bg-emerald-50 text-emerald-500 border-emerald-100" :
                              "bg-blue-50 text-blue-500 border-blue-100"
                            )}>{item.label}</span>
                            <span className="text-sm font-medium text-slate-400">{item.dept} · {item.time}</span>
                          </div>
                          <h4 className="text-[13.5px] font-medium text-slate-800 truncate m-0">{item.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium text-slate-400 font-mono">{item.size}</span>
                        <button 
                          onClick={() => {
                            showToast(`已为您直接打开《${item.title}》`);
                            if (onSubscribe) onSubscribe({ id: 'kb_policy_center', title: '制度规范大类', fileId: item.kbFileId, type: 'public' });
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-sm font-medium transition-all border-0 cursor-pointer"
                        >
                          查阅
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 个人公开共享内容 */}
          {activeTab === "personal" && (
            <div className="space-y-6">

              {filteredPersonal.length === 0 ? (
                <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">没有查找到相关的他人公开共享内容</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPersonal.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-medium text-sm flex items-center justify-center shrink-0">
                            {item.author.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 leading-none">{item.author}</div>
                            <div className="text-sm font-medium text-slate-400 mt-1">{item.dept}</div>
                          </div>
                        </div>

                        <h3 className="text-[14px] font-medium text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {item.desc}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {item.tags.map(tag => (
                            <span key={tag} className="text-[9.5px] font-medium px-2 py-0.5 bg-blue-50/70 text-blue-600 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                        <button 
                          onClick={() => handleToggleFollow(item.id, item.author)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs",
                            item.isFollowed 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100/70"
                          )}
                        >
                          {item.isFollowed ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              已订阅
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              订阅
                            </>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => {
                            showToast(`正在转入《${item.title}》共享视图...`);
                            if (onSubscribe) onSubscribe({ id: `kb-${item.id}`, title: item.title, type: 'public' });
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all border-0 cursor-pointer shadow-sm flex items-center gap-0.5"
                        >
                          进入查看
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  {filteredPersonal.map((item, idx) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-3 flex items-center justify-between gap-6 hover:bg-slate-50 transition-colors",
                        idx < filteredPersonal.length - 1 && "border-b border-slate-100"
                      )}
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-medium text-sm flex items-center justify-center shrink-0">
                          {item.author.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[13.5px] font-medium text-slate-800 truncate m-0">{item.title}</h4>
                          <p className="text-sm font-medium text-slate-400 mt-1 m-0">{item.dept} · 已获得 {item.followers} 人订阅 · {item.views} 浏览</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleToggleFollow(item.id, item.author)}
                          className={cn(
                            "px-3 py-1.5 border rounded-lg text-sm font-medium transition flex items-center gap-1 cursor-pointer",
                            item.isFollowed 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                              : "bg-blue-50 border-blue-250 text-blue-600 hover:bg-blue-100/75"
                          )}
                        >
                          {item.isFollowed ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              已订阅
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              订阅
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            showToast(`正在转入《${item.title}》共享视图...`);
                            if (onSubscribe) onSubscribe({ id: `kb-${item.id}`, title: item.title, type: 'public' });
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium border-0 cursor-pointer transition"
                        >
                          进入
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Floating Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium tracking-wide">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
