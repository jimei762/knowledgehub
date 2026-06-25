import { useEffect, useState } from "react";
// import { api } from "../api"; // Mock mode: API calls disabled
import { FilePreprocessDetail, SourceFile } from "../types";
import { ArrowLeft, CheckCircle2, Clock, CheckSquare, XSquare, MessageSquareText, Tags, LayoutList, ShieldAlert, Key, FileText, ZoomIn, ZoomOut, Save, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";
import { TreeSelect } from "../components/TreeSelect";
import { ENTITY_TYPE_OPTIONS } from "../constants";

interface FilePreprocessViewProps {
  file: any; // Accept custom nodes as well
  canEdit?: boolean;
  readOnlyHint?: string;
  onBack: () => void;
  onCompleteGovernance?: (fileId: string) => void;
}

type TabType = 'overview' | 'ocr' | 'summary' | 'slices';

export function FilePreprocessView({ file, canEdit = false, readOnlyHint, onBack, onCompleteGovernance }: FilePreprocessViewProps) {
  const [detail, setDetail] = useState<FilePreprocessDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [toast, setToast] = useState<string | null>(null);
  
  // Interactive governance states
  const [govStatus, setGovStatus] = useState<string>(file.governanceStatus || 'success');
  const [prepStatus, setPrepStatus] = useState<string>(file.preprocessStatus || 'success');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<number>(0);

  // --- Editable States ---
  const [isOcrEditing, setIsOcrEditing] = useState(false);
  const [ocrEditText, setOcrEditText] = useState("");
  const [ocrEntityType, setOcrEntityType] = useState("");

  const [isSummaryEditing, setIsSummaryEditing] = useState(false);
  const [summaryEditText, setSummaryEditText] = useState("");

  const [isTagsEditing, setIsTagsEditing] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  const [editingSliceId, setEditingSliceId] = useState<string | null>(null);
  const [sliceEditText, setSliceEditText] = useState("");

  const showLocalToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Mock data instead of API call
    const nameBase = file.name.replace(/\.[^/.]+$/, "");
    const mockDetail: FilePreprocessDetail = {
      fileId: file.id,
      ocrText: `# ${nameBase} (高精度OCR重排结果)\n\n该文档已于刚刚成功通过UDA前置治理器完成高精度文本段落识别。\n\n## 实施原则\n- 经过高置信度语义切分，可供大模型快速参考。\n- 已排除废弃废止条款，内容完全合规，校验分数高达 97分。\n- 该最新上传版本在知识库中完全激活，原版本已沉淀为历史版本供随时回滚。`,
      summary: `对刚刚上传的最新文件《${file.name}》的语义合规抽取结果。总结显示该内容已经消除了废止歧义部分，完成了全面的脱敏与行业实体切片。`,
      tags: ["版本治理", "高置信度", "语义切分", nameBase],
      qualityReport: {
        score: 97,
        readability: "极佳",
        issues: []
      },
      sliceCandidates: [
        { id: "slice_new_1", content: `新上传的文件需要遵循待治理状态，经过一期打标、质检、智能分句切片、比对入库的全量清洗流程，以达到知识保障标准。`, confidence: 0.97, status: 'pending', sourcePosition: "第1页 核心段落" },
        { id: "slice_new_2", content: `同一节点上的多次上传版本均会自动发生无缝叠加并归档，老版本归档为历史版本直接备份储蓄到下方面板。`, confidence: 0.91, status: 'pending', sourcePosition: "第1页 总结段落" }
      ]
    };
    setDetail(mockDetail);
    setOcrEditText(mockDetail.ocrText || "");
    setOcrEntityType(mockDetail.ocrEntityType || "");
    setSummaryEditText(mockDetail.summary || "");
  }, [file.id, file.governanceStatus]);

  useEffect(() => {
    // Keep internal local state aligned with props if props shifts
    if (file.governanceStatus) {
      setGovStatus(file.governanceStatus);
    }
    if (file.preprocessStatus) {
      setPrepStatus(file.preprocessStatus);
    }
  }, [file.governanceStatus, file.preprocessStatus]);

  // Handle trigger
  const startGovernanceProcess = () => {
    setIsProcessing(true);
    setProcessStep(0);

    // Timed step updates
    const t1 = setTimeout(() => setProcessStep(1), 600);
    const t2 = setTimeout(() => setProcessStep(2), 1200);
    const t3 = setTimeout(() => setProcessStep(3), 1800);
    
    const t4 = setTimeout(() => {
      setIsProcessing(false);
      setGovStatus('success');
      setPrepStatus('success');
      
      const nameBase = file.name.replace(/\.[^/.]+$/, "");
      const finalDetail: FilePreprocessDetail = {
        fileId: file.id,
        ocrText: `# ${nameBase} (高精度OCR重排结果)\n\n该文档已于刚刚成功通过UDA前置治理器完成高精度文本段落识别。\n\n## 实施原则\n- 经过高置信度语义切分，可供大模型快速参考。\n- 已排除废弃废止条款，内容完全合规，校验分数高达 97分。\n- 该最新上传版本在知识库中完全激活，原版本已沉淀为历史版本供随时回滚。`,
        summary: `对刚刚上传的最新文件《${file.name}》的语义合规抽取结果。总结显示该内容已经消除了废止歧义部分，完成了全面的脱敏与行业实体切片。`,
        tags: ["版本治理", "高置信度", "语义切分", nameBase],
        qualityReport: {
          score: 97,
          readability: "极佳",
          issues: []
        },
        sliceCandidates: [
          { id: "slice_new_1", content: `新上传的文件需要遵循待治理状态，经过一期打标、质检、智能分句切片、比对入库的全量清洗流程，以达到知识保障标准。`, confidence: 0.97, status: 'pending', sourcePosition: "第1页 核心段落" },
          { id: "slice_new_2", content: `同一节点上的多次上传版本均会自动发生无缝叠加并归档，老版本归档为历史版本直接备份储蓄到下方面板。`, confidence: 0.91, status: 'pending', sourcePosition: "第1页 总结段落" }
        ]
      };
      
      setDetail(finalDetail);
      // Callback to save state back to KnowledgeBaseDetail
      if (onCompleteGovernance) {
        onCompleteGovernance(file.id);
      }
    }, 2400);
  };

  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col h-full z-20 absolute inset-0">
        {/* Header */}
        <header className="h-14 px-6 flex items-center justify-between glass-header shrink-0 relative z-30">
          <div className="flex items-center gap-3">
            <button onClick={onBack} disabled className="p-1.5 text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 font-sans">
              <span className="font-semibold text-slate-400 text-sm">治理结果与原文比对</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-sm">{file.name}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center font-sans">
          <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-800">正在执行一键智能治理预处理...</h3>
              <p className="text-sm text-slate-400 mt-1">UDA 数据合规清洗、OCR 模型重排、语义多维切片切分</p>
            </div>
            
            {/* Steps process */}
            <div className="space-y-3 pt-2 text-left">
              {[
                { label: "1. 激活高精度 OCR 区域排版网格对齐", activeStep: 0 },
                { label: "2. 文本实体过滤与敏感行内句法脱敏", activeStep: 1 },
                { label: "3. 提取人工智能多维标签及核心摘要", activeStep: 2 },
                { label: "4. 基于 RAG 优化算法自动生成语义切片与质检核对", activeStep: 3 },
              ].map((step, idx) => {
                const isCurrent = processStep === step.activeStep;
                const isDone = processStep > step.activeStep;
                return (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 font-medium">
                    <span className={cn(
                      "font-semibold", 
                      isCurrent && "text-blue-600 font-medium", 
                      isDone && "text-emerald-600 line-through decoration-emerald-200", 
                      (!isCurrent && !isDone) && "text-slate-400"
                    )}>
                      {step.label}
                    </span>
                    <span>
                      {isDone ? (
                        <span className="text-emerald-500 font-medium">✓ 已完成</span>
                      ) : isCurrent ? (
                        <span className="text-blue-600 animate-pulse font-medium">处理中...</span>
                      ) : (
                        <span className="text-slate-300">等待中</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Custom Progress Line */}
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-sm flex rounded bg-slate-100">
                <div 
                  style={{ width: `${Math.min(100, (processStep + 1) * 25)}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p>加载预处理结果中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full z-20 absolute inset-0">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl px-6 py-3.5 z-[9999] flex items-center gap-2.5 font-medium text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between glass-header shrink-0 relative z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-sans">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 font-sans">
            <span className="font-semibold text-slate-800 text-sm">治理结果与原文比对</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 text-sm">{file.name}</span>
            {govStatus === 'success' ? (
              <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-sm font-semibold tracking-wide rounded border border-teal-100 flex items-center gap-1 ml-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已入库与激活
              </span>
            ) : govStatus === 'running' ? (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-sm font-semibold tracking-wide rounded border border-blue-100 flex items-center gap-1 ml-2 animate-pulse">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                正在智能预处理...
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-sm font-semibold tracking-wide rounded border border-amber-100 flex items-center gap-1 ml-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                待治理
              </span>
            )}
          </div>
        </div>
        <div>
          {canEdit && (
             <div className="flex items-center gap-1">
               <button 
                 onClick={startGovernanceProcess}
                 className="px-4 py-1.5 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-md shadow-sm transition flex items-center gap-1 border border-slate-200 cursor-pointer font-sans"
               >
                 <RefreshCw className="w-4 h-4 text-slate-500" />
                 重新执行
               </button>
               <button 
                  onClick={async () => {
                    if (detail) {
                      const updatedDetail = {
                        ...detail,
                        ocrText: ocrEditText,
                        ocrEntityType: ocrEntityType,
                        summary: summaryEditText
                      };
                      setDetail(updatedDetail);
                      // Mock: skip API call, just log
                      console.log('Mock save preprocess:', file.id, updatedDetail);
                      if (onCompleteGovernance) {
                        onCompleteGovernance(file.id);
                      }
                      showLocalToast("治理结果修改已成功保存！知识元数据已同步更新。");
                    }
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition flex items-center gap-1 border-0 cursor-pointer font-sans"
                >
                  <Save className="w-4 h-4"/>
                  保存修改
                </button>
             </div>
          )}
        </div>
      </header>

      {readOnlyHint && !canEdit && (
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 text-sm text-amber-800 font-medium shrink-0">
          {readOnlyHint}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Original File Preview */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-100/80 relative z-10 shadow-[inset_-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
           {/* Preview Toolbar */}
           <div className="h-12 border-b border-slate-200 bg-white/60 backdrop-blur px-4 flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-600" />
                源文件预览
              </span>
              <div className="flex bg-white border border-slate-200 rounded-md shadow-sm">
                 <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-l-md border-r border-slate-200 transition-colors"><ZoomOut className="w-4 h-4"/></button>
                 <span className="text-sm text-slate-600 px-3 flex items-center justify-center font-medium min-w-[3.5rem]">100%</span>
                 <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-r-md border-l border-slate-200 transition-colors"><ZoomIn className="w-4 h-4"/></button>
              </div>
           </div>
           
           {/* Preview Content Area (Mocking a PDF/Doc Document) */}
           <div className="flex-1 overflow-auto p-6 md:p-8 flex justify-center pb-20">
              <div className="w-full max-w-2xl bg-white shadow-xl ring-1 ring-slate-200 p-10 md:p-14 text-slate-800 text-sm leading-8 font-sans h-max min-h-[800px]">
                 <h1 className="text-2xl font-medium text-center mb-10 pb-4 border-b border-slate-100">
                   {file.name.replace(/\.[^/.]+$/, "")}
                 </h1>
                 
                 <p className="mb-6 indent-8 relative group">
                    <span className="absolute -left-6 top-1 w-1 h-full bg-transparent group-hover:bg-blue-300 transition-colors rounded-full"></span>
                    <span className={cn(
                      "transition-all", 
                      (activeTab === 'slices' || activeTab === 'ocr') ? "bg-amber-100/40 outline outline-2 outline-amber-200/50 rounded-sm" : ""
                    )}>
                      UDA非结构化数据应用平台当前定位是面向行内生产数据，承接从业务系统进入的非结构化文件，并对其进行采集、存储、管理、预处理、分类、打标、质检、检索、审计等全生命周期治理。
                    </span>
                 </p>
                 
                 <p className="mb-6 indent-8 relative group">
                    <span className="absolute -left-6 top-1 w-1 h-full bg-transparent group-hover:bg-blue-300 transition-colors rounded-full"></span>
                    <span className={cn(
                      "transition-all", 
                      (activeTab === 'slices' || activeTab === 'summary') ? "bg-blue-100/40 outline outline-2 outline-blue-200/50 rounded-sm" : ""
                    )}>
                      本期目标是在UDA中原生建设运营知识管理的前置能力，重点是原始非结构化数据/知识源文件管理。这里的“知识库”不是知识运营社区，也不是只存几句话的切片候选/知识碎片，而是面向运营人员可理解的源文件业务容器。
                    </span>
                 </p>
                 
                 <p className="mb-6 indent-8 relative group">
                     <span className="absolute -left-6 top-1 w-1 h-full bg-transparent group-hover:bg-blue-300 transition-colors rounded-full"></span>
                     <span className={cn(
                       "transition-all", 
                       activeTab === 'overview' ? "bg-blue-50/20 rounded-sm" : ""
                     )}>
                       在进行知识资产分类全生命周期治理过程中，应重点优化切片候选规则，确保多轨道模式下业务流向完全合规、安全高亮。
                     </span>
                  </p>
                 
                 <div className="mt-12 p-3 pt-6 mt-auto border-t border-slate-100 text-slate-400 italic text-center font-medium">
                    -- 文档结束 --
                 </div>
              </div>
           </div>
        </div>

        {/* Right Pane: Governance Results & Editing Panel */}
        <div className="w-[500px] xl:w-[600px] flex flex-col glass-sidebar-panel shrink-0 relative z-20">
           {/* Top Navigation Tabs for Right Panel */}
           <div className="flex items-end px-4 pt-3 border-b border-white/40 glass-header gap-1">
             <button
               onClick={() => setActiveTab('overview')}
               className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-1", activeTab === 'overview' ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50")}
             >
               <Key className="w-4 h-4" /> 治理概览
             </button>
             <button
               onClick={() => setActiveTab('ocr')}
               className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-1", activeTab === 'ocr' ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50")}
             >
               <MessageSquareText className="w-4 h-4" /> OCR解析
             </button>
             <button
               onClick={() => setActiveTab('summary')}
               className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-1", activeTab === 'summary' ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50")}
             >
               <Tags className="w-4 h-4" /> 摘要标签
             </button>
             <button
               onClick={() => setActiveTab('slices')}
               className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-1 relative", activeTab === 'slices' ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50")}
             >
               <LayoutList className="w-4 h-4" /> 智能切片
               {detail.sliceCandidates.filter(s => s.status === 'pending').length > 0 && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-sm font-medium rounded-full flex items-center justify-center shadow-sm">
                   {detail.sliceCandidates.filter(s => s.status === 'pending').length}
                 </span>
               )}
             </button>
           </div>

           {/* Right Panel Main Content */}
           <div className="flex-1 overflow-auto p-6 lg:p-8">
             {/* Error/Running banners are removed */}
             
              {/* === OVERVIEW TAB === */}
              {activeTab === 'overview' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="glass-panel rounded-xl p-5">
                   <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">入库质量评分</h3>
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-1 relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * detail.qualityReport.score) / 100} className="text-blue-500" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                           <span className="text-3xl font-medium text-slate-800 font-mono">{detail.qualityReport.score}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                         <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">可读性状态</span>
                           <span className="font-medium text-slate-900">{detail.qualityReport.readability}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                           <span className="text-slate-500">治理状态</span>
                           {govStatus === 'success' ? (
                             <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-sm font-semibold rounded border border-teal-100">满足标准，已入库</span>
                           ) : govStatus === 'running' ? (
                             <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded border border-blue-100 animate-pulse">进行中...</span>
                           ) : (
                             <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-sm font-semibold rounded border border-amber-100">待治理 (最新提交版本)</span>
                           )}
                         </div>
                      </div>
                   </div>
                 </div>

                 <div className="glass-panel rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      检测报告与异常
                    </h3>
                    {detail.qualityReport.issues.length > 0 ? (
                      <ul className="space-y-3">
                        {detail.qualityReport.issues.map((issue, idx) => (
                          <li key={idx} className="p-3 bg-rose-50/50 text-rose-800 border border-rose-100 text-sm rounded-lg flex items-start gap-3">
                            <XSquare className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 bg-slate-50/50 rounded-lg flex flex-col items-center justify-center text-slate-500 text-sm border border-slate-100 border-dashed">
                        <CheckCircle2 className="w-8 h-8 text-teal-400 mb-2" />
                        未检测到损坏、模糊或乱码等质量问题
                      </div>
                    )}
                  </div>
                </div>
               )}

               {/* === OCR TAB === */}
               {activeTab === 'ocr' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4 shrink-0 relative z-20">
                     <div className="flex items-center justify-between">
                       <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">结构化文档元数据</h3>
                     </div>
                     <div>
                       <div className="text-sm font-medium text-slate-500 mb-1.5">实体类型 (Entity Type)</div>
                       {canEdit ? (
                         <div className="w-full">
                           <TreeSelect 
                             value={ocrEntityType} 
                             onChange={(val) => {
                               setOcrEntityType(val);
                               setDetail(prev => prev ? { ...prev, ocrEntityType: val } : prev);
                             }} 
                             options={ENTITY_TYPE_OPTIONS} 
                             placeholder="例如：合同、研报、公文..." 
                           />
                         </div>
                       ) : (
                         <div className="px-3 py-2 bg-slate-50 rounded-lg border border-transparent text-sm font-medium text-slate-800">
                           {(() => {
                             const val = detail.ocrEntityType;
                             if (!val) return '未指定类型';
                             for (const node of ENTITY_TYPE_OPTIONS) {
                                if (node.value === val) return node.label;
                                if (node.children) {
                                   for (const child of node.children) {
                                      if (child.value === val) return child.label;
                                   }
                                }
                             }
                             return val;
                           })()}
                         </div>
                       )}
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">文本抽取校对</h3>
                   {canEdit && (
                     isOcrEditing ? (
                       <div className="flex items-center gap-1">
                         <button onClick={() => setIsOcrEditing(false)} className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors border-0 cursor-pointer">取消</button>
                         <button onClick={() => {
                           setDetail({ ...detail, ocrText: ocrEditText, ocrEntityType });
                           setIsOcrEditing(false);
                         }} className="px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg shadow-sm transition-colors border-0 cursor-pointer">保存并校对完成</button>
                       </div>
                     ) : (
                       <button onClick={() => {
                         setOcrEditText(detail.ocrText);
                         setOcrEntityType(detail.ocrEntityType || '');
                         setIsOcrEditing(true);
                       }} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors border-0 cursor-pointer">开启编辑</button>
                     )
                   )}
                 </div>
                 <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                   {isOcrEditing ? (
                     <textarea
                       className="w-full flex-1 p-3 bg-slate-50 border-0 outline-none resize-none font-sans text-sm leading-8 text-slate-800"
                       value={ocrEditText}
                       onChange={(e) => setOcrEditText(e.target.value)}
                     />
                   ) : (
                     <div className="flex-1 p-3 overflow-auto">
                       <p className="whitespace-pre-wrap text-slate-700 leading-8 text-sm font-sans">
                         {detail.ocrText}
                       </p>
                     </div>
                   )}
                 </div>
               </div>
              )}

              {/* === SUMMARY & TAGS TAB === */}
              {activeTab === 'summary' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="glass-panel rounded-xl p-5">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1"><Tags className="w-4 h-4 text-blue-500"/> 智能打标</h3>
                     {canEdit && (
                       isTagsEditing ? (
                         <div className="flex items-center gap-1">
                           <button onClick={() => setIsTagsEditing(false)} className="px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 rounded shadow-sm transition border-0 cursor-pointer">完成</button>
                         </div>
                       ) : (
                         <button onClick={() => setIsTagsEditing(true)} className="text-sm font-medium text-blue-600 hover:underline border-0 bg-transparent cursor-pointer">管理</button>
                       )
                     )}
                   </div>
                   <div className="flex flex-wrap gap-1 items-center">
                     {detail.tags.map(tag => (
                       <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-sm font-medium group">
                         {tag}
                         {isTagsEditing && (
                           <button 
                             onClick={() => setDetail({...detail, tags: detail.tags.filter(t => t !== tag)})}
                             className="text-indigo-400 hover:text-rose-500 hover:bg-rose-50 rounded-full p-0.5 border-0 bg-transparent cursor-pointer transition-colors"
                           >
                             <CheckSquare className="w-3 h-3 opacity-0 hidden" />
                             ×
                           </button>
                         )}
                       </span>
                     ))}
                     {isTagsEditing ? (
                        <div className="flex items-center gap-1 ml-1">
                          <input 
                            type="text" 
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTagInput.trim()) {
                                if (!detail.tags.includes(newTagInput.trim())) {
                                  setDetail({...detail, tags: [...detail.tags, newTagInput.trim()]});
                                }
                                setNewTagInput("");
                              }
                            }}
                            placeholder="输入新标签后回车..."
                            className="w-40 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                          />
                        </div>
                     ) : (
                       canEdit && (
                         <button onClick={() => setIsTagsEditing(true)} className="px-2.5 py-1 border border-dashed border-slate-300 text-slate-500 rounded-md text-sm hover:bg-slate-50 transition border-slate-300 cursor-pointer bg-white">
                           + 添加
                         </button>
                       )
                     )}
                   </div>
                 </div>

                 <div className="glass-panel rounded-xl p-5">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1"><MessageSquareText className="w-4 h-4 text-blue-500"/> 文档摘要</h3>
                     {canEdit && (
                       isSummaryEditing ? (
                         <div className="flex items-center gap-1">
                           <button onClick={() => setIsSummaryEditing(false)} className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors border-0 cursor-pointer">取消</button>
                           <button onClick={() => {
                             setDetail({ ...detail, summary: summaryEditText });
                             setIsSummaryEditing(false);
                           }} className="px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 bg-blue-600 rounded-lg shadow-sm transition-colors border-0 cursor-pointer">保存摘要</button>
                         </div>
                       ) : (
                         <button onClick={() => {
                           setSummaryEditText(detail.summary);
                           setIsSummaryEditing(true);
                         }} className="text-sm font-medium text-blue-600 hover:underline border-0 bg-transparent cursor-pointer">修改摘要</button>
                       )
                     )}
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed min-h-[120px]">
                      {isSummaryEditing ? (
                        <textarea
                          className="w-full h-full min-h-[120px] p-2 bg-white border border-blue-200 rounded outline-none resize-y font-sans text-sm leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-100"
                          value={summaryEditText}
                          onChange={(e) => setSummaryEditText(e.target.value)}
                        />
                      ) : (
                        detail.summary
                      )}
                   </div>
                 </div>
               </div>
              )}

              {/* === SLICES TAB === */}
              {activeTab === 'slices' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                     治理切片候选 ({detail.sliceCandidates.length})
                   </h3>
                   {canEdit && (
                     <div className="flex items-center gap-1">
                       <button className="px-2.5 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition">批量审核</button>
                     </div>
                   )}
                 </div>
                 
                 <div className="space-y-3">
                   {detail.sliceCandidates.map((slice) => (
                     <div key={slice.id} className={cn("p-3 border bg-white rounded-xl shadow-sm transition-all relative overflow-hidden group", slice.status === 'pending' ? "border-amber-200" : "border-slate-200")}>
                       {slice.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>}
                       {slice.status === 'confirmed' && <div className="absolute top-0 left-0 w-1 h-full bg-teal-400"></div>}
                       
                       <div className="flex items-start justify-between mb-3 ml-1">
                          <div className="flex items-center gap-3">
                            {slice.status === 'confirmed' && <span className="flex items-center gap-1 text-sm uppercase font-medium tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">已生效</span>}
                            {slice.status === 'pending' && <span className="flex items-center gap-1 text-sm uppercase font-medium tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">待人工确认</span>}
                            <span className="text-sm font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              置信度: {(slice.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {slice.status === 'pending' && (
                                <>
                                  <button onClick={() => setDetail({...detail, sliceCandidates: detail.sliceCandidates.map(s => s.id === slice.id ? {...s, status: 'confirmed'} : s)})} className="p-1 px-2 text-sm font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 rounded border border-teal-200 border-0 cursor-pointer">通过</button>
                                  <button onClick={() => setDetail({...detail, sliceCandidates: detail.sliceCandidates.map(s => s.id === slice.id ? {...s, status: 'rejected'} : s)})} className="p-1 px-2 text-sm font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 border-0 cursor-pointer">驳回</button>
                                </>
                              )}
                              <button onClick={() => {
                                setEditingSliceId(slice.id);
                                setSliceEditText(slice.content);
                              }} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded ml-1 border-0 bg-transparent cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                              </button>
                            </div>
                          )}
                       </div>
                       {editingSliceId === slice.id ? (
                         <div className="pl-1 mt-2">
                            <textarea 
                              className="w-full min-h-[80px] p-2 bg-slate-50 border border-blue-200 rounded outline-none resize-y font-sans text-sm leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-100"
                              value={sliceEditText}
                              onChange={(e) => setSliceEditText(e.target.value)}
                            />
                            <div className="flex justify-end gap-1 mt-2">
                              <button onClick={() => setEditingSliceId(null)} className="px-2.5 py-1 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer border-0">取消</button>
                              <button onClick={() => {
                                setDetail({
                                  ...detail,
                                  sliceCandidates: detail.sliceCandidates.map(s => s.id === slice.id ? {...s, content: sliceEditText} : s)
                                });
                                setEditingSliceId(null);
                              }} className="px-2.5 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer border-0">保存调整</button>
                            </div>
                         </div>
                       ) : (
                         <div className="pl-1 text-sm text-slate-700 leading-relaxed font-sans mt-2">
                           {slice.content}
                         </div>
                       )}
                       {slice.sourcePosition && (
                          <div className="pl-1 mt-3 text-sm text-slate-400 flex items-center gap-1">
                            <span className="inline-block w-3 h-0.5 bg-slate-200 rounded"></span>
                            原文出处: {slice.sourcePosition}
                          </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
