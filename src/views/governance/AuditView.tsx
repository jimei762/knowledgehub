import { useState } from "react";
import { Shield, Search, Download, Filter, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
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
    <div className="flex-1 flex flex-col h-full overflow-hidden text-left">
      <div className="px-8 py-6 glass-header shrink-0 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-medium text-slate-900 tracking-normal flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Shield className="w-[18px] h-[18px]" />
              </div>
              权限审计
            </h1>
            <p className="text-sm text-slate-500 mt-2 ml-10">授权记录与操作审计轨迹</p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            导出轨迹
          </button>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
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
              "px-3 py-2 border rounded-xl text-sm font-medium flex items-center gap-1.5 transition shadow-sm shrink-0",
              showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            {showFilters ? '收起筛选' : '高级筛选'}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">时间范围</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option>最近 24 小时</option>
                    <option>最近 7 天</option>
                    <option>最近 30 天</option>
                    <option>自定义范围...</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">操作类型</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option>全部动作</option>
                    <option>下载/预览</option>
                    <option>删除/归档</option>
                    <option>权限变更</option>
                    <option>自动治理</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">对象类型</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option>全部类型</option>
                    <option>公共知识库</option>
                    <option>团队知识库</option>
                    <option>源文件/标准件</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">执行结果</label>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-md border border-emerald-100 hover:bg-emerald-100 transition">成功</button>
                    <button className="px-2.5 py-1 bg-rose-50 text-rose-700 text-sm font-medium rounded-md border border-rose-100 hover:bg-rose-100 transition">失败</button>
                    <button className="px-2.5 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-md border border-amber-100 hover:bg-amber-100 transition">拦截</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-white/40 bg-white/30">
                <th className="px-5 py-3 text-sm font-medium text-slate-500 whitespace-nowrap">时间</th>
                <th className="px-5 py-3 text-sm font-medium text-slate-500 whitespace-nowrap">操作人</th>
                <th className="px-5 py-3 text-sm font-medium text-slate-500 whitespace-nowrap">动作</th>
                <th className="px-5 py-3 text-sm font-medium text-slate-500 whitespace-nowrap">操作对象</th>
                <th className="px-5 py-3 text-sm font-medium text-slate-500 whitespace-nowrap">状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.map((log) => (
                <tr key={log.id} className="border-b border-white/30 hover:bg-white/25 transition-colors group">
                  <td className="px-5 py-3 text-sm font-medium text-slate-500 font-mono whitespace-nowrap">{log.time}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{log.user}</td>
                  <td className="px-5 py-3">
                    <span className="inline-block px-2 py-0.5 border border-slate-200 bg-white rounded text-sm font-medium text-slate-600">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">{log.targetType}</span>
                      <span className="text-sm font-medium text-slate-800">{log.targetName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {log.result === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {log.result === 'failed' && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                      {log.result === 'blocked' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className={cn(
                        "text-sm font-medium",
                        log.result === 'success' ? "text-emerald-700" : log.result === 'failed' ? "text-rose-700" : "text-amber-700"
                      )}>
                        {log.result === 'success' ? '成功' : log.result === 'failed' ? '失败' : '安全拦截'}
                      </span>
                    </div>
                    {(log.result === 'failed' || log.result === 'blocked') && log.reason && (
                      <div className="text-sm text-slate-500 mt-1 max-w-[240px] truncate" title={log.reason}>
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
  );
}
