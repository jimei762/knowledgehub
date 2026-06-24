import React from 'react';
import { 
  FolderOpen, FileText, Globe, BarChart3, 
  TrendingUp, Activity, Copy, Download, Star, Eye,
  ShieldCheck, LayoutTemplate, MessageSquare, ArrowUpRight,
  Sparkles, CheckCircle2, Bookmark, Flame
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const trendData = [
  { date: '5.20', 新增知识库: 2, 新增文件: 120, 发布资料: 15 },
  { date: '5.22', 新增知识库: 3, 新增文件: 200, 发布资料: 25 },
  { date: '5.24', 新增知识库: 1, 新增文件: 150, 发布资料: 40 },
  { date: '5.26', 新增知识库: 4, 新增文件: 320, 发布资料: 80 },
  { date: '5.28', 新增知识库: 2, 新增文件: 250, 发布资料: 60 },
  { date: '5.30', 新增知识库: 5, 新增文件: 420, 发布资料: 110 },
  { date: '6.01', 新增知识库: 3, 新增文件: 380, 发布资料: 150 },
];

const sourceData = [
  { name: '个人资产', value: 35 },
  { name: '团队资产', value: 45 },
  { name: '公共资产', value: 20 },
];

const fileTypeData = [
  { name: '制度规范', count: 420 },
  { name: '项目资料', count: 850 },
  { name: '培训手册', count: 320 },
  { name: '解决方案', count: 560 },
  { name: '素材模板', count: 280 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#93c5fd', '#3b82f6', '#1d4ed8'];

const hotKbs = [
  { rank: 1, name: '2026产品研发规划图谱', views: '2.4k', type: '团队' },
  { rank: 2, name: '客户成功最佳实践库', views: '1.8k', type: '公共' },
  { rank: 3, name: '新员工入职指南 (2026版)', views: '1.5k', type: '公共' },
  { rank: 4, name: '市场部 Q2 营销物料', views: '1.2k', type: '团队' },
  { rank: 5, name: '技术中台架构设计方案', views: '986', type: '团队' },
];

const hotFiles = [
  { rank: 1, name: '《公司信息安全管理规范》.pdf', downloads: 856 },
  { rank: 2, name: 'Q1季度整体业务复盘总结.pptx', downloads: 642 },
  { rank: 3, name: '新产品线上发布会直播方案.doc', downloads: 521 },
  { rank: 4, name: '报销流程与财务指引 2.0.pdf', downloads: 419 },
  { rank: 5, name: 'API接口对接标准化规范.md', downloads: 388 },
];

export function KnowledgeResultDashboard() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-8 w-full max-w-[1440px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 tracking-normal">知识资产运营看板</h1>
          </div>
          <div className="text-sm font-medium text-slate-400 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
            数据更新时间：今天 09:30
          </div>
        </div>

        {/* 1. 资产总览 */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard title="知识库总数" value="1,248" icon={FolderOpen} color="text-blue-600" bg="bg-blue-50" trend="+12" />
          <StatCard title="文件总数" value="34,201" icon={FileText} color="text-indigo-600" bg="bg-indigo-50" trend="+856" />
          <StatCard title="已发布资料数" value="5,842" icon={Globe} color="text-emerald-600" bg="bg-emerald-50" trend="+124" />
          <StatCard title="知识资产总容量" value="1.8 TB" icon={BarChart3} color="text-amber-600" bg="bg-amber-50" trend="+45 GB" />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 2. 知识沉淀趋势 */}
          <div className="col-span-8 bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-slate-900 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                知识沉淀趋势 (近30日)
              </h2>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="新增文件" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFiles)" />
                  <Area type="monotone" dataKey="发布资料" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPub)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. 知识来源分布 */}
          <div className="col-span-4 bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm flex flex-col">
            <h2 className="text-base font-medium text-slate-900 mb-2 flex items-center gap-1">
              <Activity className="w-4 h-4 text-slate-400" />
              组织知识分布
            </h2>
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 mt-2">
                {sourceData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div>
                    {s.name} {s.value}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 4. 使用成效 */}
          <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm">
            <h2 className="text-base font-medium text-slate-900 mb-5">知识使用成效</h2>
            <div className="space-y-4">
              <MetricItem icon={Eye} label="总预览次数" value="1.2M+" trend="+15%" iconBg="bg-blue-50" iconColor="text-blue-500" />
              <MetricItem icon={Download} label="总下载次数" value="340K+" trend="+8%" iconBg="bg-indigo-50" iconColor="text-indigo-500" />
              <MetricItem icon={Bookmark} label="资料被收藏" value="89K+" trend="+22%" iconBg="bg-amber-50" iconColor="text-amber-500" />
              <MetricItem icon={Star} label="知识库关注" value="12K+" trend="+5%" iconBg="bg-rose-50" iconColor="text-rose-500" />
            </div>
          </div>

          {/* 8. 质量概览 */}
          <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm">
            <h2 className="text-base font-medium text-slate-900 mb-5">知识质量概览</h2>
            <div className="grid gap-3">
              <QualityMetric label="已完成安全治理" value="98.5%" desc="包含脱敏及合规审查" color="emerald" />
              <QualityMetric label="自动打标签覆盖" value="82.4%" desc="AI 智能分类及语义标签" color="blue" />
              <QualityMetric label="智能摘要生成率" value="75.0%" desc="100字以内的核心摘要" color="indigo" />
              <QualityMetric label="知识切片向量化" value="3.2M" desc="可直接用于问答召回的段落片段" color="purple" isCount />
            </div>
          </div>

          {/* 7. 团队共建 */}
          <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm">
            <h2 className="text-base font-medium text-slate-900 mb-5">团队共建活跃度</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">活跃团队知识库</p>
                  <p className="text-2xl font-medium text-slate-800">186 <span className="text-sm text-emerald-500 font-medium ml-1">+12 近30日</span></p>
                </div>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">团队月上传文件</p>
                  <p className="text-2xl font-medium text-slate-800">8,421</p>
                </div>
              </div>
              <div className="flex justify-between items-end pb-1">
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">月度协作互动频次 (评论/编辑)</p>
                  <p className="text-2xl font-medium text-slate-800">45.2K</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 & 6. 排行与发布 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-base font-medium text-slate-900 mb-4 flex items-center gap-1">
              <Flame className="w-4 h-4 text-rose-500" />
              高价值资料 Top 5 (按被下载/借阅)
            </h2>
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50">
                    <th className="py-3 px-4 text-sm font-medium text-slate-500 w-12 text-center">排名</th>
                    <th className="py-3 px-2 text-sm font-medium text-slate-500">资料名称</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500 text-right">热度 (次)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {hotFiles.map((file, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 bg-white hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-center">
                         <span className={`inline-block w-5 h-5 rounded-md leading-5 font-medium text-sm ${i < 3 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                           {file.rank}
                         </span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-700 truncate max-w-[200px]" title={file.name}>
                        {file.name}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500 text-sm">{file.downloads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-base font-medium text-slate-900 mb-4 flex items-center gap-1">
              <Globe className="w-4 h-4 text-blue-500" />
              热门公共知识库 Top 5
            </h2>
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50">
                    <th className="py-3 px-4 text-sm font-medium text-slate-500 w-12 text-center">排名</th>
                    <th className="py-3 px-2 text-sm font-medium text-slate-500">知识库名称</th>
                    <th className="py-3 px-2 text-sm font-medium text-slate-500">来源</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500 text-right">访问量</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {hotKbs.map((kb, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 bg-white hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-center">
                         <span className={`inline-block w-5 h-5 rounded-md leading-5 font-medium text-sm ${i < 3 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                           {kb.rank}
                         </span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-700 truncate max-w-[150px]" title={kb.name}>
                        {kb.name}
                      </td>
                      <td className="py-3 px-2"><span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-sm font-medium">{kb.type}</span></td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500 text-sm">{kb.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pb-12 text-center text-sm font-medium text-slate-400">
          — 知识驱动生产力 —
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, trend }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20 -mr-4 -mt-4 transition-transform group-hover:scale-110 ${bg}`}></div>
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="flex items-baseline gap-3">
             <h3 className="text-3xl font-medium text-slate-900 tracking-normal">{value}</h3>
             {trend && (
               <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                 <ArrowUpRight className="w-3 h-3 mr-0.5" />
                 {trend}
               </span>
             )}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function MetricItem({ icon: Icon, label, value, trend, iconBg, iconColor }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[13.5px] font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-medium text-slate-800">{value}</span>
        <span className="text-sm font-medium text-emerald-500 w-12 text-right">{trend}</span>
      </div>
    </div>
  );
}

function QualityMetric({ label, value, desc, color, isCount }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500'
  };
  const barColor = colorMap[color] || 'bg-slate-500';
  const widthValue = isCount ? '100%' : value;

  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-medium text-slate-900">{value}</span>
      </div>
      {!isCount && (
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: widthValue }}></div>
        </div>
      )}
      <p className="text-sm font-semibold text-slate-400 leading-snug mt-1">{desc}</p>
    </div>
  );
}
