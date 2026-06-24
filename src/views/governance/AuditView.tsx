import { useState } from "react";
import { Shield, Search, FileText, Download, Filter, Eye, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const MOCK_AUDITS = [
  { id: '1', time: '2026-06-11 10:15:32', user: '林珊 (linshan)', action: '下载文件', targetType: '源文件', targetName: '2026年业务规划草案.pdf', result: 'success', ip: '192.168.1.101' },
  { id: '2', time: '2026-06-11 09:42:15', user: '吴明 (wuming)', action: '共享知识库', targetType: '个人知识库', targetName: '渠道营销素材', result: 'success', ip: '10.2.45.12' },
  { id: '3', time: '2026-06-11 09:30:00', user: '张伟 (zhangwei)', action: '删除文件', targetType: '源文件', targetName: '无效的测试档.docx', result: 'success', ip: '10.2.45.88' },
  { id: '4', time: '2026-06-10 18:20:11', user: '系统 (system)', action: '自动治理', targetType: '入库批次', targetName: '批量导入_0610_A', result: 'failed', ip: '-', reason: '存在12个格式无法解析文件' },
  { id: '5', time: '2026-06-10 16:45:00', user: '李娜 (lina)', action: '发布文件', targetType: '源文件', targetName: '合规检查标准要求.pdf', result: 'success', ip: '192.168.1.134' },
  { id: '6', time: '2026-06-10 15:12:08', user: '陈杰 (chenjie)', action: '试图下载', targetType: '源文件', targetName: '高阶主管汇报演示.pptx', result: 'blocked', ip: '192.168.1.205', reason: '无下载权限，已阻断' }
];

export function AuditView() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAudits = MOCK_AUDITS.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.user.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.targetName.toLowerCase().includes(q) ||
      a.targetType.toLowerCase().includes(q);
  });

  const handleExport = () => {
    const header = '时间,操作人,动作,对象类型,对象名称,结果,IP\n';
    const rows = filteredAudits.map(a =>
      [a.time, a.user, a.action, a.targetType, a.targetName, a.result, a.ip].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-trail.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-200 bg-white shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-medium text-slate-900 tracking-normal flex items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                <Shield className="w-[18px] h-[18px]" />
              </div>
              权限与审计
            </h1>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={handleExport} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:bg-indigo-700 transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
               <Download className="w-4 h-4" />
               导出轨迹
             </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6">
          <button
            className="pb-3 text-sm font-medium relative transition-colors border-0 bg-transparent cursor-pointer text-indigo-700"
          >
            操作审计记录
            <motion.div layoutId="audit_tabs" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-sm" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 relative">
        <div className="space-y-6">
          {/* Expandable Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索操作人、对象或动作..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-none bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-3 py-2 border rounded-xl text-sm font-medium flex items-center gap-1.5 transition shadow-sm",
                  showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter className="w-3.5 h-3.5" /> 
                {showFilters ? '锁定筛选' : '高级筛选'}
              </button>
            </div>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 border-t border-slate-100 bg-slate-50/30"
                >
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-400 uppercase">时间范围</label>
                      <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500">
                        <option>最近 24 小时</option>
                        <option>最近 7 天</option>
                        <option>最近 30 天</option>
                        <option>自定义范围...</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-400 uppercase">操作类型</label>
                      <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500">
                        <option>全部动作</option>
                        <option>下载/预览</option>
                        <option>删除/归档</option>
                        <option>权限变更</option>
                        <option>自动治理</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-400 uppercase">对象类型</label>
                      <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500">
                        <option>全部类型</option>
                        <option>公共知识库</option>
                        <option>团队知识库</option>
                        <option>源文件/标准件</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-400 uppercase">执行结果</label>
                      <div className="flex items-center gap-1 pt-1 h-8">
                        <button className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-md border border-emerald-100">成功</button>
                        <button className="px-2.5 py-1 bg-rose-50 text-rose-700 text-sm font-medium rounded-md border border-rose-100">失败</button>
                        <button className="px-2.5 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-md border border-amber-100">拦截</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-5 py-3 text-sm font-medium tracking-widest text-slate-400 uppercase">时间</th>
                      <th className="px-5 py-3 text-sm font-medium tracking-widest text-slate-400 uppercase">操作人</th>
                      <th className="px-5 py-3 text-sm font-medium tracking-widest text-slate-400 uppercase">动作</th>
                      <th className="px-5 py-3 text-sm font-medium tracking-widest text-slate-400 uppercase">操作对象</th>
                      <th className="px-5 py-3 text-sm font-medium tracking-widest text-slate-400 uppercase">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudits.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3 text-sm font-medium text-slate-500 font-mono">{log.time}</td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-700">{log.user}</td>
                        <td className="px-5 py-3">
                          <span className="inline-block px-2 py-0.5 border border-slate-200 bg-white rounded text-sm font-medium text-slate-600">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide bg-slate-100 px-1.5 rounded">{log.targetType}</span>
                            <span className="text-sm font-medium text-slate-800">{log.targetName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            {log.result === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {log.result === 'failed' && <XCircle className="w-4 h-4 text-rose-500" />}
                            {log.result === 'blocked' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                            <span className={cn(
                              "text-sm font-medium",
                              log.result === 'success' ? "text-emerald-700" : log.result === 'failed' ? "text-rose-700" : "text-amber-700"
                            )}>
                              {log.result === 'success' ? '成功' : log.result === 'failed' ? '失败' : '安全拦截'}
                            </span>
                          </div>
                          {(log.result === 'failed' || log.result === 'blocked') && (
                            <div className="text-sm font-medium text-slate-500 mt-1 max-w-[200px] truncate" title={log.reason}>
                              {log.reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
      </div>
    </div>
  );
}
