import React, { useState, useRef, useEffect, useMemo, MouseEvent, ChangeEvent } from "react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, ChevronRight, Search, Plus, 
  Folder, FolderOpen, FileText, FileImage, FileBarChart, 
  MoreHorizontal, Download, Edit3, Save, Pin, Star, 
  MoreVertical, Bot, ShieldAlert, History, MessageSquare, 
  Bell, X, AlertCircle, Trash2, Edit2, Copy, Move, FileArchive, Globe, Users, User, Info, Check, FileVideo, Tags, CheckCircle2,
  UploadCloud, File as FileIcon, RefreshCw, LayoutGrid, List as ListIcon, Maximize2, XCircle, Lock
} from "lucide-react";
import { FilePreprocessView } from "./FilePreprocessView";

// --- Types ---
export interface FileNode {
  id: string;
  parentId: string | null;
  name: string;
  type: 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'archive' | 'image' | 'video' | 'note';
  format?: string;
  size?: number; // bytes
  updatedAt: string;
  governanceStatus: 'success' | 'running' | 'failed' | 'pending';
  preprocessStatus: 'success' | 'running' | 'failed' | 'pending';
  creator?: string;
  content?: string;
  isPinned?: boolean;
  isFavorited?: boolean;
  publishStatus?: 'pending_audit' | 'approved' | 'published' | 'offline' | 'archived';
  isRequiredRead?: boolean;
  materialType?: string;
  fileTags?: string[];
  fileMetadata?: Record<string, string>;
}

// --- Mock Data ---
const MOCK_PUBLIC_NODES: FileNode[] = [
  { id: 'root', parentId: null, name: '全部文件', type: 'folder', updatedAt: '2026-06-11T11:24:00Z', governanceStatus: 'success', preprocessStatus: 'success', creator: '系统' },
  { id: 'f1', parentId: 'root', name: '公开标准件', type: 'folder', updatedAt: '2026-06-11T11:24:00Z', governanceStatus: 'success', preprocessStatus: 'success', creator: 'admin' },
  { id: 'file1', parentId: 'f1', name: '网点服务标准手册 2026 版.pdf', type: 'document', format: 'pdf', size: 12.4 * 1024 * 1024, updatedAt: '2026-06-08T10:00:00Z', governanceStatus: 'success', preprocessStatus: 'success', creator: '张敏', publishStatus: 'published', content: '## 第一章：网点形象与环境要求\n\n1.1 外部形象：网点招牌应保持整洁完好，夜间灯箱准时开启。\n1.2 厅堂环境：保持空气清新，温度适宜，地面光洁，宣传折页摆放有序。\n1.3 柜台设施：防弹玻璃洁净，密码器、评价器运转正常。\n\n## 第二章：柜面服务标准基本礼仪\n\n2.1 仪容仪表：身着分行制服，佩戴工牌，妆容自然得体。\n2.2 站姿迎客：当客户步入柜台窗口，应主动微笑点头，双手接递证件。' },
  { id: 'file2', parentId: 'f1', name: '高风险投诉应急话术.docx', type: 'document', format: 'docx', size: 4.1 * 1024 * 1024, updatedAt: '2026-06-10T15:00:00Z', governanceStatus: 'success', preprocessStatus: 'success', creator: '刘洋', publishStatus: 'approved', content: '# 高风险投诉突发应对话术\n\n适用于网点现场突发激烈投诉、媒体关注事件或客户情绪爆发等场景。\n\n## 一、 首要安抚原则\n1. 控制自身情绪：不与客户针锋相对。\n2. 引入独立安抚地点：及时请客户入座客户关怀室（或行长接待室），送上一杯温水。\n3. 高效聆听：引导客户讲出具体诉求，做好记录。\n\n## 二、 金句/核心应答话术\n> "非常理解您的心情。请您放心，我们行对您的反馈非常重视，一定负责到底。我们借一步沟通，为您专门核查处理。"' },
  { id: 'file3', parentId: 'f1', name: '厅堂排队冲突解决指引方案.pptx', type: 'document', format: 'pptx', size: 18.2 * 1024 * 1024, updatedAt: '2026-06-09T09:00:00Z', governanceStatus: 'success', preprocessStatus: 'success', creator: '陈宁', publishStatus: 'pending_audit', content: '# 厅堂排队冲突极速调处指引 S.O.P.\n\n## 第一阶段：冲突预判与阻断\n- 观察等候区神色：当客户频繁看表、叹气，或等候时间超过15分钟时，大堂经理应靠前迎奉、适度问询。\n- 弹性分配机制：依据多窗智能派单规则，及时开启弹性柜台。\n\n## 第二阶段：核心解释话术\n- "因为当前系统网络核验和企业开户穿透审核需要一定耗时，我们会尽力为您提速。这是一张业务预填单，大家可以先核对基础信息。"' },
  { id: 'file4', parentId: 'f1', name: '大客户理财推介白皮书.pdf', type: 'document', format: 'pdf', size: 8.6 * 1024 * 1024, updatedAt: '2026-06-05T12:00:00Z', governanceStatus: 'success', preprocessStatus: 'success', creator: '王建国', publishStatus: 'offline', content: '# 财富级高净值大客户定制化投顾推进方案\n\n## 一、 客群细分说明\n针对非代发、留存AUM超300万的家族和私行门槛客户设计专属白皮书配置模型。\n\n## 二、 主要销售流程\n1. 财务状况全面测算\n2. 收益底表的精挑上演' }
];

const INITIAL_NODES: FileNode[] = [
  { id: 'root', parentId: null, name: '全部文件', type: 'folder', updatedAt: '2026-06-08T10:00:00Z', governanceStatus: 'success', preprocessStatus: 'success' },
  { id: 'f1', parentId: 'root', name: '2026 项目档案', type: 'folder', updatedAt: '2026-06-08T10:00:00Z', governanceStatus: 'success', preprocessStatus: 'success' },
  { id: 'f2', parentId: 'root', name: '设计资产', type: 'folder', updatedAt: '2026-06-01T10:00:00Z', governanceStatus: 'success', preprocessStatus: 'success' },
  { id: 'f3', parentId: 'f1', name: '第一季度材料', type: 'folder', updatedAt: '2026-06-05T10:00:00Z', governanceStatus: 'success', preprocessStatus: 'success' },
  { id: 'file1', parentId: 'f1', name: 'UDA_运营平台PRD_v1.pdf', type: 'document', format: 'pdf', size: 2 * 1024 * 1024, updatedAt: '2026-06-08T18:30:00Z', governanceStatus: 'success', preprocessStatus: 'success' },
  { id: 'file2', parentId: 'f1', name: '营销素材_设计稿.zip', type: 'archive', format: 'zip', size: 14.8 * 1024 * 1024, updatedAt: '2026-06-08T19:00:00Z', governanceStatus: 'failed', preprocessStatus: 'failed' },
  { id: 'file3', parentId: 'f1', name: '会议纪要_0607.docx', type: 'document', format: 'docx', size: 0.5 * 1024 * 1024, updatedAt: '2026-06-08T19:30:00Z', governanceStatus: 'running', preprocessStatus: 'running' },
  { id: 'note1', parentId: 'f1', name: '运营目标草案', type: 'note', format: 'md', size: 0.1 * 1024 * 1024, updatedAt: '2026-06-09T10:00:00Z', governanceStatus: 'success', preprocessStatus: 'success', content: '# 运营目标\n\n1. 渠道重组\n2. 客户分层体系建立\n3. 权益设计与发放\n\n## 下一步计划\n\n确认具体负责人并排期。' },
  { id: 'file4', parentId: 'f2', name: 'Banner_Q3.png', type: 'image', format: 'png', size: 4.2 * 1024 * 1024, updatedAt: '2026-06-05T14:20:00Z', governanceStatus: 'success', preprocessStatus: 'success' },
  { id: 'file5', parentId: 'root', name: '年度预算测算.xlsx', type: 'spreadsheet', format: 'xlsx', size: 1.2 * 1024 * 1024, updatedAt: '2026-06-10T09:15:00Z', governanceStatus: 'success', preprocessStatus: 'success' },
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// --- Helpers ---
function getFileIcon(node: FileNode, className = "w-4 h-4") {
  if (node.type === 'folder') return <Folder className={cn(className, "fill-blue-50 text-blue-500")} />;
  if (node.format === 'pdf') return <FileText className={cn(className, "text-rose-500 fill-rose-50")} />;
  if (node.format === 'docx' || node.format === 'doc') return <FileText className={cn(className, "text-blue-500 fill-blue-50")} />;
  if (node.format === 'xlsx' || node.format === 'xls') return <FileBarChart className={cn(className, "text-emerald-500 fill-emerald-50")} />;
  if (node.format === 'ppt' || node.format === 'pptx') return <FileArchive className={cn(className, "text-orange-500 fill-orange-50")} />;
  if (node.format === 'zip' || node.format === 'rar') return <FileArchive className={cn(className, "text-slate-500 fill-slate-50")} />;
  if (node.type === 'image') return <FileImage className={cn(className, "text-purple-500 fill-purple-50")} />;
  if (node.type === 'video') return <FileVideo className={cn(className, "text-indigo-500 fill-indigo-50")} />;
  if (node.type === 'note') return <FileText className={cn(className, "text-indigo-600")} />;
  return <FileIcon className={cn(className, "text-slate-400")} />;
}

function StatusBadge({ type, status }: { type: 'governance' | 'preprocess', status: string }) {
  const baseClasses = "px-2 py-0.5 rounded-full text-sm font-medium inline-flex items-center gap-1.5 border";
  if (status === 'success') return <span className={cn(baseClasses, "bg-emerald-50 border-emerald-100 text-emerald-600")}><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 已完成</span>;
  if (status === 'running') return <span className={cn(baseClasses, "bg-blue-50 border-blue-100 text-blue-600")}><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> 进行中</span>;
  if (status === 'failed') return <span className={cn(baseClasses, "bg-rose-50 border-rose-100 text-rose-600")}><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 失败</span>;
  return <span className={cn(baseClasses, "bg-slate-50 border-slate-200 text-slate-500")}><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> 待处理</span>;
}

function PublishStatusBadge({ status }: { status: 'pending_audit' | 'approved' | 'published' | 'offline' | 'archived' | string }) {
  const baseClasses = "px-2 py-0.5 rounded-full text-sm font-medium inline-flex items-center gap-1.5 border shrink-0";
  if (status === 'pending_audit') {
    return <span className={cn(baseClasses, "bg-amber-50 border-amber-100 text-amber-600 animate-pulse")}><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 待审核</span>;
  }
  if (status === 'approved') {
    return <span className={cn(baseClasses, "bg-blue-50 border-blue-100 text-blue-600")}><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 待发布</span>;
  }
  if (status === 'published' || !status) {
    return <span className={cn(baseClasses, "bg-emerald-50 border-emerald-100 text-emerald-600")}><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 已发布</span>;
  }
  if (status === 'offline') {
    return <span className={cn(baseClasses, "bg-rose-50 border-rose-100 text-rose-500")}><div className="w-1.5 h-1.5 rounded-full bg-rose-400" /> 已下线</span>;
  }
  if (status === 'archived') {
    return <span className={cn(baseClasses, "bg-slate-50 border-slate-200 text-slate-500")}><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> 已归档</span>;
  }
  return <span className={cn(baseClasses, "bg-slate-50 border-slate-200 text-slate-500")}><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> 未知</span>;
}

export function KnowledgeBaseDetail({ 
  kbId, 
  kbName, 
  kbType, 
  onBack,
  initialNodes,
  initialRole = 'member',
  extraHeaderActions,
  hideHeader = false,
  initialFileId,
  isArchiveView = false,
  onUploadClick,
  fileListDisplayConfig,
}: { 
  kbId: string, 
  kbName: string, 
  kbType: string, 
  onBack: () => void,
  initialNodes?: FileNode[],
  initialRole?: 'member' | 'admin',
  extraHeaderActions?: React.ReactNode,
  hideHeader?: boolean,
  initialFileId?: string,
  isArchiveView?: boolean,
  onUploadClick?: () => boolean | void,
  fileListDisplayConfig?: import("../types").FileListDisplayConfig,
}) {
  const [nodes, setNodes] = useState<FileNode[]>(() => {
    if (initialNodes) return initialNodes;
    if (kbType === 'public') return MOCK_PUBLIC_NODES;
    return INITIAL_NODES;
  });

  useEffect(() => {
    if (initialNodes) {
      setNodes(initialNodes);
    }
  }, [kbId, initialNodes]);

  const fileListExtraColumns = useMemo(() => {
    if (!fileListDisplayConfig) return [];
    const cols: { key: string; label: string; headerClassName: string; cellClassName: string }[] = [];
    if (fileListDisplayConfig.showMaterialType) {
      cols.push({
        key: '__materialType',
        label: '资料类型',
        headerClassName: 'min-w-[96px] whitespace-nowrap',
        cellClassName: 'min-w-[96px]',
      });
    }
    if (fileListDisplayConfig.showFileTags) {
      cols.push({
        key: '__fileTags',
        label: '文件标签',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px]',
      });
    }
    fileListDisplayConfig.metadataFields
      .filter((f) => f.showInFileList)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((f) =>
        cols.push({
          key: f.code,
          label: f.name,
          headerClassName: 'min-w-[88px] max-w-[140px] whitespace-nowrap',
          cellClassName: 'min-w-[88px] max-w-[140px]',
        })
      );
    return cols;
  }, [fileListDisplayConfig]);

  const renderFileListExtraCell = (node: FileNode, colKey: string) => {
    if (node.type === 'folder') {
      return <span className="text-slate-300 text-sm">-</span>;
    }
    if (colKey === '__materialType') {
      return <span className="text-sm text-slate-600">{node.materialType || '-'}</span>;
    }
    if (colKey === '__fileTags') {
      if (!node.fileTags?.length) {
        return <span className="text-slate-300 text-sm">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {node.fileTags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">
              #{tag}
            </span>
          ))}
        </div>
      );
    }
    return <span className="text-sm text-slate-600">{node.fileMetadata?.[colKey] || '-'}</span>;
  };
  const [teamRole, setTeamRole] = useState<'member' | 'admin'>(initialRole);
  const canWrite = kbType === 'personal_own' || ((kbType === 'team' || kbType === 'public') && teamRole === 'admin');

  const visibleNodes = useMemo(() => {
    if (kbType === 'public' && teamRole === 'member') {
      return nodes.filter(n => n.type === 'folder' || n.publishStatus === 'published');
    }
    return nodes;
  }, [nodes, kbType, teamRole]);
  
  // Selection & Navigation
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [listSearch, setListSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'f1']));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [modal, setModal] = useState<{
    type: 'none' | 'create_folder' | 'create_note' | 'rename' | 'move' | 'copy' | 'delete' | 'preview' | 'edit_note' | 'preprocess' | 'escalate_pkb' | 'select_favorite_folder' | 'publish_confirm';
    payload?: any;
  }>({ type: 'none' });
  const [modalInput, setModalInput] = useState('');
  const [editContent, setEditContent] = useState('');
  const [publishAsRequired, setPublishAsRequired] = useState(false);

  // Dropdown Menu State
  const [menuNodeId, setMenuNodeId] = useState<string | null>(null);

  // Detail View State
  const [viewMode, setViewMode] = useState<'list' | 'detail'>(initialFileId ? 'detail' : 'list');
  const [detailDocId, setDetailDocId] = useState<string | null>(initialFileId || null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [sidePanel, setSidePanel] = useState<'none' | 'history' | 'comments'>('none');

  useEffect(() => {
    if (initialFileId) {
      const doc = nodes.find(n => n.id === initialFileId);
      if (doc) {
        setDetailDocId(initialFileId);
        setViewMode('detail');
        setEditContent(doc.content || '');
        
        // Auto-expand folders leading to this node
        const newExpanded = new Set(expandedFolders);
        let curr = doc;
        while (curr && curr.parentId) {
          newExpanded.add(curr.parentId);
          const parent = nodes.find(n => n.id === curr!.parentId);
          curr = parent as FileNode;
        }
        setExpandedFolders(newExpanded);
      }
    }
  }, [initialFileId, nodes]);
  
  // Team Members
  const TEAM_MEMBERS = [
    { name: '张经理', role: '项目经理' },
    { name: '李专员', role: '运营专员' },
    { name: '王总', role: '设计总监' },
    { name: '刘工', role: '研发工程师' }
  ];

  // Real Mock States for Extensions
  const [allComments, setAllComments] = useState<any[]>([
    {
      id: 1,
      fileId: 'note1',
      author: '张经理',
      time: '1小时前',
      text: '这个方案很务实，建议一并考虑第二季度的具体预算指标。',
      replies: [
        { id: 101, author: '我', time: '30分钟前', text: '收到，已经在跟财务团队对接了，会在下个版本更新。' }
      ]
    },
    {
      id: 2,
      fileId: 'note1',
      author: '李专员',
      time: '2小时前',
      text: '第三点里的“客户分层体系”，可以参考之前零售业务的模版。',
      replies: []
    },
    {
      id: 3,
      fileId: 'file1',
      author: '王总',
      time: '昨天 15:30',
      text: 'UDA平台的第一阶段功能已基本确认，此文档作为最终确定的设计稿。',
      replies: []
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Favorite Folders States
  const [favoriteFolders, setFavoriteFolders] = useState<any[]>(() => {
    const saved = localStorage.getItem('my_favorite_folders');
    if (saved) return JSON.parse(saved);
    const initialFs = [
      { id: 'default', name: '默认收藏', createdAt: '2026-01-01' },
      { id: 'f_proj', name: '重点项目资料', createdAt: '2026-05-10' },
      { id: 'f_template', name: '常用公文模板', createdAt: '2026-05-20' },
    ];
    localStorage.setItem('my_favorite_folders', JSON.stringify(initialFs));
    return initialFs;
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);

  useEffect(() => {
    const syncFavFolders = () => {
      const saved = localStorage.getItem('my_favorite_folders');
      if (saved) {
        setFavoriteFolders(JSON.parse(saved));
      }
    };
    window.addEventListener('storage', syncFavFolders);
    return () => window.removeEventListener('storage', syncFavFolders);
  }, []);
  
  // Comment & Reply Editing States
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  // Mentions Menus States
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showReplyMentionId, setShowReplyMentionId] = useState<number | null>(null);

  // Escalation Form States
  const [escalateTarget, setEscalateTarget] = useState("pub_hall");
  const [escalateReason, setEscalateReason] = useState("本季度网点运营指引与实践中梳理的规范材料，已脱敏并具备极高复用价值，特呈报入库。");
  const [escalateCheck1, setEscalateCheck1] = useState(true);
  const [escalateCheck2, setEscalateCheck2] = useState(true);

  // Versions State & Refs
  const [allVersions, setAllVersions] = useState<any[]>([
    {
      id: 1001,
      fileId: 'note1',
      versionName: '版本 1 (初始建档)',
      author: '陈波',
      time: '3天前 10:00',
      fileName: '运营规范标准_v1.md',
      content: '# 厅堂运营规范标准 (V1)\n\n1. 基础仪容仪表要求\n2. 常用开户接待话术流程'
    },
    {
      id: 1002,
      fileId: 'note1',
      versionName: '版本 2 (核心修订)',
      author: '徐丽',
      time: '前天 14:30',
      fileName: '运营规范标准_v2.md',
      content: '# 厅堂运营规范标准 (V2核心修订)\n\n1. 基础仪容仪表与工服合规要求\n2. 增补防诈骗劝阻四步法话术'
    },
    {
      id: 2001,
      fileId: 'file1',
      versionName: '版本 1 (初稿备份)',
      author: '张建军',
      time: '5天前 14:00',
      fileName: '标准手册_基础草稿.pdf',
      content: '# 网点服务标准手册 V1草稿\n\n包含厅堂分区指引，迎客问候一句话标准。'
    },
    {
      id: 2002,
      fileId: 'file1',
      versionName: '版本 2 (第一轮内测版)',
      author: '李明',
      time: '3天前 11:20',
      fileName: '标准手册_征求意见.pdf',
      content: '# 网点服务标准手册 2026 版 V2（内测合规稿）\n\n补充了排队等候超时、多渠道分流及大额反洗钱信息核对标准化流程。'
    },
    {
      id: 3001,
      fileId: 'file2',
      versionName: '版本 1 (原始导入)',
      author: '刘洋',
      time: '4天前 09:15',
      fileName: '高风险投诉应急话术.docx',
      content: '# 高风险投诉应急话术手册 (V1原始草稿)\n\n主要覆盖理财亏损退款、信息泄露举报、异地非授权网银扣款的投诉口径。'
    },
    {
      id: 3002,
      fileId: 'file2',
      versionName: '版本 2 (审计会签修改稿)',
      author: '赵云杰',
      time: '昨天 16:45',
      fileName: '高风险投诉应急话术_已审计.docx',
      content: '# 高风险投诉应急话术手册 (V2合规审计定稿)\n\n已与合规风控部完成会签，细化对公客诉责任界定、个人资金追偿应急补偿上限流程。'
    },
    {
      id: 4001,
      fileId: 'file3',
      versionName: '版本 1 (研讨草案)',
      author: '陈宁',
      time: '本周一 10:30',
      fileName: '厅堂排队冲突解决指引_草案.pptx',
      content: '# 厅堂排队冲突解决指引方案 (V1草案)\n\n提供客户因排队过久争吵时的标准平息术语'
    },
    {
      id: 4002,
      fileId: 'file3',
      versionName: '版本 2 (专家评审版)',
      author: '林珊',
      time: '前天 16:50',
      fileName: '厅堂排队冲突解决指引_评审.pptx',
      content: '# 厅堂排队冲突解决指引方案 (V2专家评审版)\n\n融合大额存折换折客流疏导、自助机刷卡吞卡临时紧急挂失应对方案。'
    }
  ]);
  const [viewingVersionId, setViewingVersionId] = useState<number | null>(null);
  const versionFileInputRef = useRef<HTMLInputElement>(null);

  // Notify Event Helper
  const dispatchNotification = (title: string, content: string, type: string = "comment", objectType: string = "协同交互", targetName: string = "") => {
    const detailDoc = nodes.find(n => n.id === detailDocId);
    const notice = {
      id: `gen-${Date.now()}`,
      type: type,
      title: title,
      content: content,
      objectType: objectType,
      targetName: targetName || (detailDoc ? detailDoc.name : "共享文档"),
      time: "刚刚",
      read: false
    };
    
    // Dispatch custom event to sync live to NotificationCenter
    window.dispatchEvent(new CustomEvent('add-kb-notification', { detail: notice }));
    
    // Update local storage for both workspaces
    try {
      const storedKb = localStorage.getItem('kb_notifications');
      const listKb = storedKb ? JSON.parse(storedKb) : [];
      localStorage.setItem('kb_notifications', JSON.stringify([notice, ...listKb]));
      
      const storedLocal = localStorage.getItem('local_notifications');
      const listLocal = storedLocal ? JSON.parse(storedLocal) : [];
      localStorage.setItem('local_notifications', JSON.stringify([notice, ...listLocal]));
    } catch (e) {
      console.error(e);
    }
  };

  // Safe auto governance queue helper for all incoming uploaded files & versions
  const startAutoGovernanceForFile = (fileId: string, fileName: string, fileFormat: string, fileSize: number) => {
    // 3 seconds simulation of highly efficient intelligent governance parser
    setTimeout(() => {
      const ext = fileFormat ? fileFormat.toLowerCase() : '';
      const hasProblem = ['zip', 'rar', 'tar'].includes(ext) || 
                         fileSize > 8 * 1024 * 1024 || 
                         fileName.toLowerCase().includes('fail') || 
                         fileName.toLowerCase().includes('error') || 
                         fileName.toLowerCase().includes('corrupt') || 
                         fileName.toLowerCase().includes('坏') || 
                         fileName.toLowerCase().includes('错');
      
      if (hasProblem) {
        // Failed governance
        setNodes(prev => prev.map(n => n.id === fileId ? {
          ...n,
          governanceStatus: 'failed',
          preprocessStatus: 'failed',
          updatedAt: new Date().toISOString()
        } : n));
        
        showToast(`⚠️ 文件《${fileName}》智能治理流程异常终止！已向上传人发送通知电报`);
        
        // Detailed error context
        const reason = ['zip', 'rar', 'tar'].includes(ext)
          ? "不支持对压缩包或未解归档的容器进行自动 OCR 抽取与多段智能切片"
          : fileSize > 8 * 1024 * 1024
            ? "文件体积超过 8MB UDA 自动清洗通道限制，导致结构解析溢出失败"
            : "检测到非法字符集、非标准排版对齐特征或数据完整性质检未通过";
        
        dispatchNotification(
          "⚠️ 智能治理预处理异常通知",
          `您提报的文件《${fileName}》在启动 UDA 前置智能治理自动预处理流时异常终止。具体异常：[${reason}]。系统已自动暂缓内容合规激活，需由上传人进行异常申报或重新上传。`,
          "governance",
          "预处理任务",
          fileName
        );
      } else {
        // Successful governance
        setNodes(prev => prev.map(n => n.id === fileId ? {
          ...n,
          governanceStatus: 'success',
          preprocessStatus: 'success',
          updatedAt: new Date().toISOString()
        } : n));
        
        showToast(`✓ 文件《${fileName}》一键智能治理与切片预处理已全自动执行完毕！`);
        
        // No success notification dispatched according to requirements (only abnormal behaviors are notified).
      }
    }, 4000); // 4 seconds delay to give a live feeling to the dashboard
  };

  // Automatically start governance on mount for any files in 'running' state (e.g., initial files)
  useEffect(() => {
    INITIAL_NODES.forEach(node => {
      if (node.governanceStatus === 'running') {
        startAutoGovernanceForFile(node.id, node.name, node.format || '', node.size || 0);
      }
    });
  }, []);

  const handleRetryGovernance = (doc: FileNode) => {
    setNodes(prev => prev.map(n => n.id === doc.id ? {
      ...n,
      governanceStatus: 'running',
      preprocessStatus: 'running',
      updatedAt: new Date().toISOString()
    } : n));
    showToast(`正在重新启动《${doc.name}》的智能治理...`);
    startAutoGovernanceForFile(doc.id, doc.name, doc.format || '', doc.size || 0);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentText = newComment.trim();
    const commentObj = {
      id: Date.now(),
      fileId: detailDocId,
      author: '我',
      time: '刚刚',
      text: commentText,
      replies: []
    };
    
    const updated = [...allComments, commentObj];
    setAllComments(updated);
    setNewComment('');
    showToast('评论发布成功');

    // Simulate automatic user reply response & mention trigger
    setTimeout(() => {
      let respondent = '李专员';
      let autoText = `@我 收到通知，已经看到您的反馈了，新版本里会把这一项着重优化。`;
      
      if (commentText.includes('@张经理')) {
        respondent = '张经理';
        autoText = `@我 建议非常好。我已经看到了对方案的这部分修改，期待之后的进展。`;
      } else if (commentText.includes('@王总')) {
        respondent = '王总';
        autoText = `@我 方案大体方向很对！大家辛苦了，以此版为标准继续落地。`;
      } else if (commentText.includes('@李专员')) {
        respondent = '李专员';
        autoText = `@我 没问题，今天下午我会把最新的客户分层数据表也附在同级目录。`;
      } else if (commentText.includes('@刘工')) {
        respondent = '刘工';
        autoText = `@我 系统配置兼容，刚才我在测试网试跑了一下，已经跑通。`;
      }

      const simulatedReply = {
        id: Date.now() + 1,
        author: respondent,
        time: '刚刚',
        text: autoText
      };

      setAllComments(prev => prev.map(c => {
        if (c.id === commentObj.id) {
          return {
            ...c,
            replies: [...(c.replies || []), simulatedReply]
          };
        }
        return c;
      }));

      // Send to notification center
      dispatchNotification(
        `${respondent} 在评论中回复并艾特了您`,
        autoText
      );

      showToast(`收到来自 ${respondent} 的新消息`);
    }, 1500);
  };

  const handleAddReply = (commentId: number) => {
    if (!replyText.trim()) return;
    const currentReplyText = replyText.trim();
    const targetComment = allComments.find(c => c.id === commentId);

    setAllComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [
            ...(c.replies || []),
            {
              id: Date.now(),
              author: '我',
              time: '刚刚',
              text: currentReplyText
            }
          ]
        };
      }
      return c;
    }));
    
    setReplyText('');
    setReplyingToId(null);
    showToast('回复发表成功');

    // Simulate dynamic automatic reply back
    if (targetComment) {
      setTimeout(() => {
        const respondent = targetComment.author === '我' ? '张经理' : targetComment.author;
        const autoReply = `@我 明白，那本周末前我们先按这套标准推进。如果有变动随时通知。`;

        setAllComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [
                ...(c.replies || []),
                {
                  id: Date.now() + 2,
                  author: respondent,
                  time: '刚刚',
                  text: autoReply
                }
              ]
            };
          }
          return c;
        }));

        dispatchNotification(
          `${respondent} 回复了您的备注通知`,
          autoReply
        );

        showToast(`收到来自 ${respondent} 的回复`);
      }, 1500);
    }
  };

  const handleEditCommentSubmit = (commentId: number, isSubReply = false, parentId?: number) => {
    const draftText = isSubReply ? editReplyText.trim() : editCommentText.trim();
    if (!draftText) return;

    if (isSubReply && parentId !== undefined) {
      setAllComments(allComments.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: (c.replies || []).map((r: any) => r.id === commentId ? { ...r, text: draftText } : r)
          };
        }
        return c;
      }));
      setEditingReplyId(null);
      setEditReplyText('');
    } else {
      setAllComments(allComments.map(c => c.id === commentId ? { ...c, text: draftText } : c));
      setEditingCommentId(null);
      setEditCommentText('');
    }
    showToast('评论修改成功');
  };

  const handleDeleteCommentSubmit = (commentId: number, isSubReply = false, parentId?: number) => {
    if (confirm('确定要删除这条评论吗？')) {
      if (isSubReply && parentId !== undefined) {
        setAllComments(allComments.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).filter((r: any) => r.id !== commentId)
            };
          }
          return c;
        }));
      } else {
        setAllComments(allComments.filter(c => c.id !== commentId));
      }
      showToast('评论已成功删除');
    }
  };

  const handleVersionUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Calculate version number of current content being archived
      const sameFileVersions = allVersions.filter(v => v.fileId === detailDocId);
      const nextVerNum = sameFileVersions.length + 1;
      
      // 1. Get the current active file's metadata and content
      const currentDoc = nodes.find(n => n.id === detailDocId);
      const prevActiveContent = currentDoc?.content || "";
      const prevActiveName = currentDoc?.name || "未命名文件";
      const prevActiveTime = currentDoc?.updatedAt ? format(new Date(currentDoc.updatedAt), 'yyyy-MM-dd HH:mm') : '刚刚';

      // 2. Archive previous active content to historical list
      const oldVersionArchive = {
        id: Date.now() - 1,
        fileId: detailDocId,
        versionName: `版本 ${nextVerNum} (历史版本)`,
        author: '我',
        time: prevActiveTime,
        fileName: prevActiveName,
        content: prevActiveContent
      };

      // 3. Define content for newly uploaded file (to become the new "current latest version")
      const newLatestContent = `# ${file.name} (最新上传)\n\n*这是您于 ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} 上传的最新版本。*\n\n## 内容概要\n该版本已成功加载为当前文档的最新版本，原版本已作为历史版本自动备份至下方列表中。\n\n## 详细段落\n该新文档已完成词法处理和多层次分发审查。建议对相关流程指标继续保持核对。`;

      // 4. Update the active node content and name in nodes state
      setNodes(nodes.map(n => n.id === detailDocId ? {
        ...n,
        name: file.name,
        content: newLatestContent,
        governanceStatus: 'running',
        preprocessStatus: 'running',
        updatedAt: new Date().toISOString()
      } : n));

      // 5. Save archive of preceding content to allVersions
      setAllVersions([...allVersions, oldVersionArchive]);

      // 6. Focus directly on the latest version (which is the current live document, viewingVersionId = null)
      setViewingVersionId(null);
      setEditContent(newLatestContent);

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (detailDocId) {
        startAutoGovernanceForFile(detailDocId, file.name, ext, file.size);
      }

      showToast(`新版本与内容 ${file.name} 已设为当前最新内容！原内容已成功存档至历史记录`);
    }
  };

  // Download Dropdown State
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Toast State
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Derived State ---
  const currentFolder = visibleNodes.find(n => n.id === currentFolderId) || visibleNodes[0];
  const currentChildren = visibleNodes.filter(n => n.parentId === currentFolderId).sort((a, b) => {
    // Folders first
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
  const filteredChildren = listSearch.trim()
    ? currentChildren.filter(n => n.name.toLowerCase().includes(listSearch.trim().toLowerCase()))
    : currentChildren;

  const getAncestors = (folderId: string): FileNode[] => {
    const output = [];
    let curr = visibleNodes.find(n => n.id === folderId);
    while (curr) {
      output.unshift(curr);
      curr = visibleNodes.find(n => n.id === curr!.parentId);
    }
    return output;
  };
  const breadcrumbs = getAncestors(currentFolderId);

  // --- Actions ---
  const closeMenu = () => setMenuNodeId(null);
  const closeModal = () => {
    setModal({ type: 'none' });
    setModalInput('');
    setEditContent('');
  };

  const executeAction = () => {
    if (!canWrite && ['create_folder', 'create_note', 'rename', 'delete', 'move', 'copy', 'edit_note'].includes(modal.type)) {
      showToast('操作锁定：当前订阅库限制为只读，无权执行修改或写入');
      closeModal();
      return;
    }
    switch (modal.type) {
      case 'select_favorite_folder':
        if (modal.payload?.id && modal.payload?.folderId) {
          setNodes(nodes.map(n => n.id === modal.payload.id ? { ...n, isFavorited: true } : n));
          showToast(`已成功收藏至 "${modal.payload.folderName}"`);
          
          // Persistence mock
          const favItem = { 
            id: modal.payload.id, 
            name: modal.payload.name, 
            tag: '文档', 
            time: '刚刚', 
            memo: '', 
            folderId: modal.payload.folderId 
          };
          const existingFavs = JSON.parse(localStorage.getItem('my_favorites') || '[]');
          localStorage.setItem('my_favorites', JSON.stringify([favItem, ...existingFavs]));
        }
        break;
      case 'create_folder':
        if (modalInput.trim()) {
          setNodes([...nodes, {
            id: generateId(),
            parentId: currentFolderId,
            name: modalInput.trim(),
            type: 'folder',
            updatedAt: new Date().toISOString(),
            governanceStatus: 'success',
            preprocessStatus: 'success'
          }]);
        }
        break;
      case 'create_note':
        if (modalInput.trim()) {
          setNodes([...nodes, {
            id: generateId(),
            parentId: currentFolderId,
            name: modalInput.trim().endsWith('.md') ? modalInput.trim() : modalInput.trim() + '.md',
            type: 'note',
            format: 'md',
            size: 0,
            updatedAt: new Date().toISOString(),
            governanceStatus: 'success',
            preprocessStatus: 'success',
            content: '# 新建笔记\n\n开始编写内容...'
          }]);
        }
        break;
      case 'rename':
        if (modalInput.trim() && modal.payload?.id) {
          setNodes(nodes.map(n => n.id === modal.payload.id ? { ...n, name: modalInput.trim() } : n));
        }
        break;
      case 'delete':
        if (modal.payload?.id) {
          // Cascading delete
          const getDescendantIds = (id: string, all: FileNode[]): string[] => {
            const children = all.filter(n => n.parentId === id).map(n => n.id);
            return [...children, ...children.flatMap(cid => getDescendantIds(cid, all))];
          };
          const toDelete = new Set([modal.payload.id, ...getDescendantIds(modal.payload.id, nodes)]);
          setNodes(nodes.filter(n => !toDelete.has(n.id)));
          if (toDelete.has(currentFolderId)) {
            setCurrentFolderId('root');
          }
        }
        break;
      case 'move':
        if (modal.payload?.targetId && modal.payload?.id) {
          setNodes(nodes.map(n => n.id === modal.payload.id ? { ...n, parentId: modal.payload.targetId } : n));
          showToast('移动成功');
        }
        break;
      case 'copy':
        if (modal.payload?.targetId && modal.payload?.id) {
          const srcNode = nodes.find(n => n.id === modal.payload.id);
          if(srcNode) {
            setNodes([...nodes, { ...srcNode, id: generateId(), parentId: modal.payload.targetId, name: srcNode.name + ' 副本', updatedAt: new Date().toISOString() }]);
            showToast('复制成功');
          }
        }
        break;
      case 'edit_note':
        if (modal.payload?.id) {
          setNodes(nodes.map(n => n.id === modal.payload.id ? { ...n, content: editContent, updatedAt: new Date().toISOString() } : n));
        }
        break;
    }
    closeModal();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: FileNode['type'] = 'document';
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) type = 'image';
      else if (['mp4', 'mov'].includes(ext || '')) type = 'video';
      else if (['zip', 'rar', 'tar'].includes(ext || '')) type = 'archive';
      else if (['xls', 'xlsx', 'csv'].includes(ext || '')) type = 'spreadsheet';
      else if (['ppt', 'pptx'].includes(ext || '')) type = 'presentation';

      const newId = generateId();
      setNodes([...nodes, {
        id: newId,
        parentId: currentFolderId,
        name: file.name,
        type: type,
        format: ext,
        size: file.size,
        updatedAt: new Date().toISOString(),
        governanceStatus: 'running',
        preprocessStatus: 'running'
      }]);

      startAutoGovernanceForFile(newId, file.name, ext || '', file.size);
    }
    closeMenu();
  };

  const handleRowClick = (node: FileNode) => {
    if (node.type === 'folder') {
      setCurrentFolderId(node.id);
    } else {
      setDetailDocId(node.id);
      setViewMode('detail');
      setIsEditingDoc(false);
      setEditContent(node.content || '');
    }
  };

  const toggleFolderExpand = (folderId: string, e: MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // --- Renderers ---
  const renderDetailTree = (parentId: string | null = null, depth = 0): any => {
    const childrenNodes = visibleNodes.filter(n => n.parentId === parentId).sort((a,b) => {
      if(a.type === 'folder' && b.type !== 'folder') return -1;
      if(a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
    return childrenNodes.map(node => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = detailDocId === node.id;
      return (
        <div key={node.id}>
           <button 
             onClick={() => {
               if (node.type === 'folder') {
                 setExpandedFolders(prev => { const n = new Set(prev); if(n.has(node.id)) n.delete(node.id); else n.add(node.id); return n; });
               } else {
                 setDetailDocId(node.id);
                 setIsEditingDoc(false);
                 setEditContent(node.content || '');
               }
             }}
             className={cn("w-full flex items-center gap-1.5 px-3 py-1.5 border-0 rounded-lg text-left transition-colors whitespace-nowrap overflow-hidden mt-1", isSelected ? "bg-blue-100 text-blue-700 font-medium" : "bg-transparent text-slate-700 hover:bg-slate-100 font-semibold", depth === 0 ? "" : "ml-4 w-[calc(100%-16px)]")}
           >
             <span className="w-4 h-4 flex items-center justify-center shrink-0">
               {node.type === 'folder' ? (isExpanded ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />) : getFileIcon(node, "w-4 h-4")}
             </span>
             <span className="text-sm truncate flex-1">{node.name}</span>
           </button>
           {node.type === 'folder' && isExpanded && (
             <div className="ml-2 pl-2 border-l border-slate-200 mt-1">
               {renderDetailTree(node.id, depth + 1)}
             </div>
           )}
        </div>
      );
    });
  };

  const renderTreeFolders = (parentId: string | null, depth = 0) => {
    const folders = visibleNodes.filter(n => n.parentId === parentId && n.type === 'folder').sort((a,b) => a.name.localeCompare(b.name));
    return folders.map(folder => {
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = currentFolderId === folder.id;
      const hasChildrenFolders = visibleNodes.some(n => n.parentId === folder.id && n.type === 'folder');

      return (
        <div key={folder.id}>
          <div 
            onClick={() => { setCurrentFolderId(folder.id); setExpandedFolders(prev => new Set(prev).add(folder.id)); }}
            className={cn(
              "group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap",
              isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-100 font-medium",
              depth === 0 ? "pl-2" : `pl-[calc(0.5rem+${depth * 16}px)]`
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <button 
                onClick={(e) => toggleFolderExpand(folder.id, e)}
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 shrink-0"
                style={{ visibility: hasChildrenFolders ? 'visible' : 'hidden' }}
              >
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-90")} />
              </button>
              
              <div className={cn("flex items-center justify-center w-5 h-5 shrink-0 text-amber-500", isSelected ? "text-blue-500" : "")}>
                {isExpanded ? <FolderOpen className="w-4 h-4 fill-current opacity-30" /> : <Folder className="w-4 h-4 fill-current opacity-30" />}
              </div>
              
              <span className="text-sm truncate">
                {folder.name}
              </span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuNodeId(menuNodeId === `sidebar-${folder.id}` ? null : `sidebar-${folder.id}`); }}
              className={cn("w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-opacity ml-1", menuNodeId === `sidebar-${folder.id}` ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
            </button>
            
            {menuNodeId === `sidebar-${folder.id}` && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); closeMenu(); }} />
                <div className="absolute left-[260px] w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1" onClick={(e) => e.stopPropagation()}>
                  {canWrite && (
                    <>
                      <button className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer font-medium" 
                        onClick={() => { setModal({ type: 'create_folder', payload: { parentId: folder.id } }); closeMenu(); }}>
                        <Plus className="w-3.5 h-3.5" /> 新建子文件夹
                      </button>
                      <button className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer font-medium" 
                        onClick={() => { setModalInput(folder.name); setModal({ type: 'rename', payload: folder }); closeMenu(); }}>
                        <Edit2 className="w-3.5 h-3.5" /> 重命名
                      </button>
                    </>
                  )}
                  {folder.id !== 'root' && (
                    <>
                      {canWrite && <div className="h-px bg-slate-100 my-1"/>}
                      <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer" 
                        onClick={() => { 
                          setNodes(nodes.map(n => n.id === folder.id ? { ...n, isFavorited: !n.isFavorited } : n));
                          showToast(folder.isFavorited ? '已取消收藏' : '已添加收藏');
                          closeMenu(); 
                        }}>
                        <Star className={cn("w-3.5 h-3.5", folder.isFavorited && "fill-amber-400 text-amber-400")} /> {folder.isFavorited ? '取消收藏' : '收藏'}
                      </button>
                      {canWrite && (
                        <>
                          <button className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer font-medium" 
                            onClick={() => { setModal({ type: 'move', payload: folder }); closeMenu(); }}>
                            <Move className="w-3.5 h-3.5" /> 移动
                          </button>
                          <button className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer font-medium" 
                            onClick={() => { setModal({ type: 'copy', payload: folder }); closeMenu(); }}>
                            <Copy className="w-3.5 h-3.5" /> 复制
                          </button>
                          <div className="h-px bg-slate-100 my-1"/>
                          <button className="w-full px-3 py-2 text-sm text-left text-rose-600 hover:bg-rose-50 flex items-center gap-1 border-0 bg-transparent cursor-pointer font-medium" 
                            onClick={() => { setModal({ type: 'delete', payload: folder }); closeMenu(); }}>
                            <Trash2 className="w-3.5 h-3.5" /> 彻底删除
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          {isExpanded && hasChildrenFolders && (
            <div>{renderTreeFolders(folder.id, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  const detailDoc = nodes.find(n => n.id === detailDocId);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative text-slate-800">
      
      {viewMode === 'list' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Breadcrumbs */}
          {!hideHeader && (
            <header className="h-14 px-6 flex items-center gap-3 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
              <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 flex-1 min-w-0 overflow-x-auto no-scrollbar">
                {breadcrumbs.map((b, idx) => (
                  <div key={b.id} className="flex items-center gap-1.5 shrink-0">
                    <span 
                      className={cn("cursor-pointer hover:text-blue-600 transition-colors", idx === breadcrumbs.length - 1 && "text-slate-900 font-medium")}
                      onClick={() => setCurrentFolderId(b.id)}
                    >
                      {b.name}
                    </span>
                    {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                  </div>
                ))}
              </div>
              
              {extraHeaderActions && (
                <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 pl-4 ml-auto">
                  {extraHeaderActions}
                </div>
              )}
            </header>
          )}

          <div className="flex-1 flex overflow-hidden">
        
        {/* Left Tree sidebar */}
        <div className="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 shrink-0 border-b border-slate-100">
            <div className="text-sm font-medium uppercase text-slate-400 tracking-widest pl-2 mb-2">目录结构</div>
            {renderTreeFolders(null)}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Custom Permission status banner */}
          {!isArchiveView && kbType !== 'team' && kbType !== 'public' && (
            <div className={cn(
              "px-6 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm shrink-0 select-none",
              kbType === 'personal_own' && "bg-blue-50/50 border-blue-105 text-blue-800",
              kbType === 'personal' && "bg-amber-50/40 border-amber-100 text-amber-900",
              kbType === 'team' && "bg-indigo-50/40 border-indigo-150 text-indigo-900",
              kbType === 'public' && "bg-emerald-50/40 border-emerald-100 text-emerald-950"
            )}>
              <div className="flex items-center gap-1.5 font-medium">
              <span className={cn(
                "w-2 h-2 rounded-full ring-2 shrink-0",
                kbType === 'personal_own' ? "bg-blue-500 ring-blue-100 animate-pulse" :
                kbType === 'personal' ? "bg-amber-500 ring-amber-100" :
                kbType === 'team' ? "bg-indigo-500 ring-indigo-100" : "bg-emerald-500 ring-emerald-100"
              )} />
              <div className="leading-relaxed">
                {kbType === 'personal_own' && (
                  <span>【个人创建】您是此知识库所有者，拥有全部读写、目录调整及共享授权配置权限。</span>
                )}
                {kbType === 'personal' && (
                  <span>【个人来源 ─ 订阅】他人共享协作知识库。按共享规则限制为<b>【只读】</b>，不能新建文件/目录、拖拽重组或修改共享配置。</span>
                )}
                {kbType === 'team' && (
                  <span>
                    【团队来源 ─ 订阅】专属团队口径。当前为 <b>团队管理员</b> ── 您已开放可上传、编辑、重组目录及高阶安全治理全量管理权限。
                  </span>
                )}
                {kbType === 'public' && (
                  <span>
                    【公共来源 ─ 订阅】组织全局发布。当前为 <b>空间超级管理员</b> ── 作为系统管理员，您拥有全量维护、脱敏归档及入库发布审核通过权。
                  </span>
                )}
              </div>
            </div>
          </div>
          )}

          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 gap-3">
             <div className="relative max-w-sm w-full">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="在当前目录下检索..." 
                 value={listSearch}
                 onChange={(e) => setListSearch(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
               />
             </div>
             
             <div className="flex gap-1">
               {canWrite ? (
                 <>
                   <button 
                     onClick={() => setModal({ type: 'create_folder' })}
                     className="px-3 h-8 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-1.5"
                   >
                     <Folder className="w-3.5 h-3.5" /> 新建文件夹
                   </button>
                   <button 
                     onClick={() => setModal({ type: 'create_note' })}
                     className="px-3 h-8 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-1.5"
                   >
                     <Plus className="w-3.5 h-3.5" /> 新建笔记
                   </button>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                   <button 
                     onClick={() => {
                       if (onUploadClick?.() === true) return;
                       fileInputRef.current?.click();
                     }}
                     className="px-4 h-8 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-1.5"
                   >
                     <UploadCloud className="w-3.5 h-3.5" /> 上传文件
                   </button>
                 </>
               ) : (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-[11.5px] font-medium select-none">
                   <Lock className="w-3 h-3 text-slate-400" /> 当前权限只读
                 </div>
               )}
             </div>
          </div>

          <div className="flex-1 overflow-auto">
            {filteredChildren.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-8">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 mb-4">
                   <FolderOpen className="w-8 h-8 text-slate-300 fill-slate-100" />
                 </div>
                 <h3 className="text-sm font-medium text-slate-700 mb-1">{listSearch.trim() ? '未找到匹配项' : '文件夹为空'}</h3>
                 <p className="text-sm font-medium text-slate-400 max-w-sm">
                   {listSearch.trim() ? '请尝试其他关键词，或清空检索条件。' : '您可以点击右上角按钮新建文件夹、笔记，或直接上传文件。'}
                 </p>
               </div>
            ) : (
              <table className="w-full text-left min-w-[960px]">
                <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 after:absolute after:bottom-0 after:left-0 after:right-0 after:border-b after:border-slate-100">
                  <tr className="text-sm font-medium text-slate-500">
                    <th className="py-3 px-6 font-medium min-w-[200px]">文件名称</th>
                    {fileListExtraColumns.map((col) => (
                      <th key={col.key} className={cn("py-3 px-4 font-medium", col.headerClassName)}>{col.label}</th>
                    ))}
                    {isArchiveView ? (
                      <th className="py-3 px-4 font-medium whitespace-nowrap">归档状态</th>
                    ) : kbType === 'public' ? (
                      <th className="py-3 px-4 font-medium whitespace-nowrap">发布状态</th>
                    ) : (
                      <th className="py-3 px-4 font-medium whitespace-nowrap">治理状态</th>
                    )}
                    {kbType !== 'public' && !isArchiveView && (
                      <th className="py-3 px-4 font-medium whitespace-nowrap">处理状态</th>
                    )}
                    <th className="py-3 px-4 font-medium whitespace-nowrap">创建者</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">大小</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">更新时间</th>
                    {kbType === 'public' && teamRole === 'admin' && (
                      <th className="py-3 px-4 font-medium text-center">状态管理</th>
                    )}
                    <th className="py-3 px-4 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredChildren.map(node => (
                    <tr 
                      key={node.id} 
                      className="group hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(node)}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {getFileIcon(node, "w-5 h-5")}
                          <span className={cn("text-sm", node.type === 'folder' ? "font-medium text-slate-800" : "font-medium text-slate-700 group-hover:text-blue-600 transition-colors")}>
                            {node.name}
                          </span>
                        </div>
                      </td>
                      {fileListExtraColumns.map((col) => (
                        <td key={col.key} className={cn("py-3.5 px-4", col.cellClassName)}>
                          {renderFileListExtraCell(node, col.key)}
                        </td>
                      ))}
                      {isArchiveView ? (
                        <td className="py-3.5 px-4"><PublishStatusBadge status="archived" /></td>
                      ) : kbType === 'public' ? (
                        <td className="py-3.5 px-4"><PublishStatusBadge status={node.publishStatus || 'published'} /></td>
                      ) : (
                        <td className="py-3.5 px-4"><StatusBadge type="governance" status={node.governanceStatus} /></td>
                      )}
                      {kbType !== 'public' && !isArchiveView && (
                        <td className="py-3.5 px-4"><StatusBadge type="preprocess" status={node.preprocessStatus} /></td>
                      )}
                      <td className="py-3.5 px-4 text-sm font-semibold text-slate-500 text-right">
                        {node.creator || '系统'}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-slate-500 text-right">
                        {node.size ? (node.size / 1024 / 1024).toFixed(2) + ' MB' : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-slate-500 text-right">
                        {format(new Date(node.updatedAt), 'MM-dd HH:mm')}
                      </td>
                      {kbType === 'public' && teamRole === 'admin' && (
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 justify-center">
                            {node.publishStatus === 'pending_audit' && (
                              <button 
                                onClick={() => {
                                  setNodes(nodes.map(n => n.id === node.id ? { ...n, publishStatus: 'approved' } : n));
                                  showToast('审核通过，文件已进入待发布状态');
                                }}
                                className="px-2 py-0.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer font-medium shrink-0 shadow-sm border-0"
                              >
                                审核通过
                              </button>
                            )}
                            {node.publishStatus === 'approved' && (
                              <button 
                                onClick={() => {
                                  setModal({ type: 'publish_confirm', payload: node });
                                }}
                                className="px-2 py-0.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer font-medium shrink-0 shadow-sm border-0"
                              >
                                正式发布
                              </button>
                            )}
                            {(node.publishStatus === 'published' || !node.publishStatus) && (
                              <button 
                                onClick={() => {
                                  setNodes(nodes.map(n => n.id === node.id ? { ...n, publishStatus: 'offline' } : n));
                                  showToast('文件已撤回下线');
                                }}
                                className="px-2 py-0.5 rounded text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer font-medium shrink-0 shadow-sm"
                              >
                                下线文件
                              </button>
                            )}
                            {node.publishStatus === 'offline' && (
                              <>
                                <button 
                                  onClick={() => {
                                    setModal({ type: 'publish_confirm', payload: node });
                                  }}
                                  className="px-2 py-0.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer font-medium shrink-0 shadow-sm border-0"
                                >
                                  再次发布
                                </button>
                                <button 
                                  onClick={() => {
                                    setNodes(nodes.map(n => n.id === node.id ? { ...n, publishStatus: 'archived' } : n));
                                    showToast('文件已移动至归档中心');
                                  }}
                                  className="px-2 py-0.5 rounded text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer font-medium shrink-0 shadow-sm"
                                >
                                  归档
                                </button>
                              </>
                            )}
                            {node.publishStatus === 'archived' && (
                               <span className="text-sm font-medium text-slate-400 italic">已归档</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-center">
                         <div className="relative">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setMenuNodeId(menuNodeId === `table-${node.id}` ? null : `table-${node.id}`); }}
                             className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <MoreVertical className="w-4 h-4" />
                           </button>
                           {menuNodeId === `table-${node.id}` && (
                             <>
                               <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); closeMenu(); }} />
                               <div className="absolute right-full top-0 mr-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1" onClick={(e) => e.stopPropagation()}>
                                 {['document', 'presentation', 'spreadsheet', 'archive'].includes(node.type) && (
                                   <button className="w-full px-3 py-2 text-sm font-medium text-left text-blue-600 hover:bg-slate-50 flex items-center gap-1"
                                     onClick={() => { setModal({ type: 'preprocess', payload: node }); closeMenu(); }}>
                                     <Bot className="w-3.5 h-3.5" /> 治理结果
                                   </button>
                                 )}
                                 <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                                   onClick={() => { setModalInput(node.name); setModal({ type: 'rename', payload: node }); closeMenu(); }}>
                                   <Edit2 className="w-3.5 h-3.5" /> 重命名
                                 </button>
                                 <div className="h-px bg-slate-100 my-1"/>
                                 <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1" 
                                   onClick={() => { 
                                     if (!node.isFavorited) {
                                       setModal({ type: 'select_favorite_folder', payload: node });
                                     } else {
                                       setNodes(nodes.map(n => n.id === node.id ? { ...n, isFavorited: false } : n));
                                       showToast('已取消收藏');
                                     }
                                     closeMenu(); 
                                   }}>
                                   <Star className={cn("w-3.5 h-3.5", node.isFavorited && "fill-amber-400 text-amber-400")} /> {node.isFavorited ? '取消收藏' : '添加收藏'}
                                 </button>
                                 <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                                   onClick={() => { setModal({ type: 'move', payload: node }); closeMenu(); }}>
                                   <Move className="w-3.5 h-3.5" /> 移动
                                 </button>
                                 <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                                   onClick={() => { setModal({ type: 'copy', payload: node }); closeMenu(); }}>
                                   <Copy className="w-3.5 h-3.5" /> 复制
                                 </button>
                                 <div className="h-px bg-slate-100 my-1"/>
                                 {node.type !== 'folder' && (
                                    node.type === 'note' ? (
                                     <>
                                       <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1" onClick={() => { closeMenu(); showToast('开始下载 PDF 格式...'); }}>
                                         <Download className="w-3.5 h-3.5" /> 下载为 PDF
                                       </button>
                                       <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1" onClick={() => { closeMenu(); showToast('开始下载 Markdown 格式...'); }}>
                                         <Download className="w-3.5 h-3.5" /> 下载为 Markdown
                                       </button>
                                     </>
                                    ) : (
                                     <>
                                       <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1" onClick={() => { closeMenu(); showToast(`开始下载原格式 (${node.format?.toUpperCase()})...`); }}>
                                         <Download className="w-3.5 h-3.5" /> 下载原格式
                                       </button>
                                       <button className="w-full px-3 py-2 text-sm font-medium text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1" onClick={() => { closeMenu(); showToast('开始下载 PDF 转换格式...'); }}>
                                         <Download className="w-3.5 h-3.5" /> 下载为 PDF
                                       </button>
                                     </>
                                    )
                                 )}
                                  <div className="h-px bg-slate-100 my-1"/>
                                  <button className="w-full px-3 py-2 text-sm font-medium text-left text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                                    onClick={() => { setModal({ type: 'delete', payload: node }); closeMenu(); }}>
                                    <Trash2 className="w-3.5 h-3.5" /> 彻底删除
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      </div>
      )}

      {viewMode === 'detail' && detailDoc && (
        <div className="flex-1 flex h-full bg-slate-100 overflow-hidden relative">
           {/* Detailed View Main */}
           <section className="flex-1 flex flex-col min-w-0 bg-white relative shadow-sm border-r border-slate-200">
             <header className="h-14 px-6 flex items-center justify-between border-b border-slate-200 shrink-0 bg-white">
               <div className="flex items-center gap-3 min-w-0">
                 <button onClick={() => { setViewingVersionId(null); if (initialFileId) { onBack(); } else { setViewMode('list'); } }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 shadow-sm border border-slate-200/50"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                 <div className="text-sm font-medium text-slate-500 truncate flex items-center gap-1">
                   {kbName} <ChevronRight className="w-3.5 h-3.5 text-slate-300" /> <span className="text-slate-800">{detailDoc.name}</span>
                    <button 
                      onClick={() => {
                        const favorites = JSON.parse(localStorage.getItem('my_favorites') || '[]');
                        const isFav = favorites.some((f: any) => f.targetId === (detailDoc ? detailDoc.id : '') && f.type === 'file');
                        let newFavorites;
                        if (isFav) {
                          newFavorites = favorites.filter((f: any) => !(f.targetId === (detailDoc ? detailDoc.id : '') && f.type === 'file'));
                          showToast('已从收藏中移除');
                        } else {
                          const newItem = {
                            id: `fav-${Date.now()}`,
                            targetId: detailDoc ? detailDoc.id : '',
                            name: detailDoc ? detailDoc.name : '',
                            type: 'file',
                            folderId: 'default',
                            addedAt: new Date().toISOString(),
                            kbName: kbName,
                            kbType: kbType,
                            format: detailDoc ? detailDoc.format : ''
                          };
                          newFavorites = [newItem, ...favorites];
                          showToast('已添加至我的收藏');
                        }
                        localStorage.setItem('my_favorites', JSON.stringify(newFavorites));
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className={cn(
                        "ml-1 p-1 rounded-md transition-colors",
                        JSON.parse(localStorage.getItem('my_favorites') || '[]').some((f: any) => f.targetId === (detailDoc ? detailDoc.id : '') && f.type === 'file')
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-slate-300 hover:text-amber-500"
                      )}
                    >
                      <Star className={cn("w-3.5 h-3.5", JSON.parse(localStorage.getItem('my_favorites') || '[]').some((f: any) => f.targetId === (detailDoc ? detailDoc.id : '') && f.type === 'file') && "fill-current")} />
                    </button>
                   {isArchiveView ? (
                     <PublishStatusBadge status="archived" />
                   ) : kbType === 'public' && (
                     <PublishStatusBadge status={detailDoc.publishStatus || 'published'} />
                   )}
                 </div>
               </div>
               <div className="flex items-center gap-1 shrink-0">
                 {isEditingDoc ? (
                    <button className="px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm" onClick={() => {
                        setNodes(nodes.map(n => n.id === detailDocId ? { ...n, content: editContent, updatedAt: new Date().toISOString() } : n));
                        setIsEditingDoc(false);
                    }}>保存版本</button>
                 ) : (
                                         <div className="flex items-center gap-1">
                       {detailDoc.type === 'note' && (
                         <button 
                           className={cn("px-3 h-8 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1", !canWrite && "hidden")} 
                           onClick={() => setIsEditingDoc(true)}
                         >
                           <Edit3 className="w-3 h-3" /> 编辑
                         </button>
                       )}
                       
                       <button
                         onClick={() => setSidePanel(sidePanel === 'history' ? 'none' : 'history')}
                         className={cn(
                           "px-2.5 h-8 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors border cursor-pointer",
                           sidePanel === 'history'
                             ? "bg-blue-50 border-blue-400 text-blue-600 font-medium shadow-sm"
                             : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                         )}
                         title="查看/管理历史版本记录"
                       >
                         <History className="w-3.5 h-3.5" />
                         <span>历史记录</span>
                       </button>

                       <button
                         onClick={() => setSidePanel(sidePanel === 'comments' ? 'none' : 'comments')}
                         className={cn(
                           "px-2.5 h-8 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors border cursor-pointer",
                           sidePanel === 'comments'
                             ? "bg-blue-50 border-blue-400 text-blue-600 font-medium shadow-sm"
                             : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                         )}
                         title="查看并发表评论信息"
                       >
                         <MessageSquare className="w-3.5 h-3.5" />
                         <span>评论交流</span>
                       </button>

                       {(kbType === 'personal_own' || (kbType === 'team' && teamRole === 'admin')) && (
                         <button
                           onClick={() => setModal({ type: 'escalate_pkb', payload: detailDoc })}
                           className="px-2.5 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm border-0 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                           title="将此文档呈报提交至全行公共知识库"
                         >
                           <Globe className="w-3.5 h-3.5 text-blue-200" />
                           <span>提交到公共知识库</span>
                         </button>
                       )}
                     </div>
                 )}
                  {kbType === 'public' && teamRole === 'admin' && !isEditingDoc && (
                    <div className="flex items-center gap-1.5 mr-1 border-r border-slate-200 pr-2">
                      {detailDoc.publishStatus === 'pending_audit' && (
                        <button 
                          onClick={() => {
                            setNodes(nodes.map(n => n.id === detailDoc.id ? { ...n, publishStatus: 'approved' } : n));
                            showToast('审核通过，文件已进入待发布状态');
                          }}
                          className="px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 border-0 transition-transform active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> 审核通过
                        </button>
                      )}
                      {detailDoc.publishStatus === 'approved' && (
                        <button 
                          onClick={() => {
                            setModal({ type: 'publish_confirm', payload: detailDoc });
                          }}
                          className="px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 border-0 transition-transform active:scale-95"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-200" /> 正式发布
                        </button>
                      )}
                      {detailDoc.publishStatus === 'published' && (
                        <button 
                          onClick={() => {
                            setNodes(nodes.map(n => n.id === detailDoc.id ? { ...n, publishStatus: 'offline' } : n));
                            showToast('该文件已下线，全行人员将无法在公共知识库中检索到此文件');
                          }}
                          className="px-3 h-8 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
                        >
                          <AlertCircle className="w-3.5 h-3.5" /> 下线文件
                        </button>
                      )}
                      {detailDoc.publishStatus === 'offline' && (
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setModal({ type: 'publish_confirm', payload: detailDoc });
                            }}
                            className="px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 border-0 transition-transform active:scale-95 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> 再次发布
                          </button>
                          <button 
                            onClick={() => {
                              setNodes(nodes.map(n => n.id === detailDoc.id ? { ...n, publishStatus: 'archived' } : n));
                              showToast('文件已归档');
                            }}
                            className="px-3 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 border-0 transition-transform active:scale-95"
                          >
                            <FileArchive className="w-3.5 h-3.5" /> 归档
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                 
                 <div className="relative">
                   <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400" onClick={() => setShowDownloadMenu(!showDownloadMenu)}><Download className="w-4.5 h-4.5" /></button>
                   {showDownloadMenu && (
                     <>
                       <div className="fixed inset-0 z-20" onClick={() => setShowDownloadMenu(false)} />
                       <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-sm font-medium overflow-hidden animate-in fade-in slide-in-from-top-1">
                         {detailDoc.type === 'note' ? (
                           <>
                             <button className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50" onClick={() => { setShowDownloadMenu(false); showToast('开始下载 Markdown 格式...'); }}>下载为 Markdown (.md)</button>
                             <button className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50" onClick={() => { setShowDownloadMenu(false); showToast('开始生成 PDF...'); }}>导出为 PDF</button>
                           </>
                         ) : (
                           <>
                             <button className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50" onClick={() => { setShowDownloadMenu(false); showToast(`开始下载原格式 (${detailDoc.format?.toUpperCase()})...`); }}>下载原格式</button>
                             <button className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50" onClick={() => { setShowDownloadMenu(false); showToast('开始下载 PDF 转换格式...'); }}>下载为 PDF</button>
                           </>
                         )}
                       </div>
                     </>
                   )}
                 </div>
               </div>
             </header>
              <div className="flex-1 overflow-auto relative flex justify-center bg-[#fdfdfd]">
                {['pdf', 'docx', 'xlsx', 'pptx'].includes(detailDoc.format || '') ? (
                   <div className="max-w-[780px] w-full min-h-full bg-white border-x border-slate-100 shadow-sm p-12">
                      {viewingVersionId !== null && (
                         <div className="mb-6 p-4 border rounded-xl flex items-center justify-between font-sans shadow-sm bg-amber-50 border-amber-200 text-amber-900">
                           <div className="flex items-center gap-2">
                             <History className="w-5 h-5 text-amber-500" />
                             <div className="text-left font-sans">
                               <p className="text-sm font-medium">您正在查看历史版本</p>
                               <p className="text-xs text-amber-700/80 mt-0.5">该版本已归档，如果需要，您可以将其恢复为最新版本。</p>
                             </div>
                           </div>
                           {canWrite && (
                             <button 
                               onClick={() => {
                                 const v = allVersions.find(ver => ver.id === viewingVersionId);
                                 if (v && confirm(`确定要恢复到历史版本 ${v.versionName} 吗？`)) {
                                   setNodes(nodes.map(n => n.id === detailDocId ? { ...n, updatedAt: new Date().toISOString() } : n));
                                   setViewingVersionId(null);
                                   showToast('已完成覆盖：恢复至历史版本！');
                                 }
                               }}
                               className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer shadow-sm transition"
                             >
                               恢复此版本
                             </button>
                           )}
                         </div>
                      )}
                      <h1 className="text-[34px] font-medium text-slate-900 mb-4">{detailDoc.name.split('.')[0]}</h1>
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-500 mb-8 border-b border-slate-100 pb-4">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">系</span>
                        <span>管理员</span> <span>|</span> <span>{format(new Date(detailDoc.updatedAt), 'MM月dd日 HH:mm')}</span>
                      </div>
                      <div className="space-y-6">
                         {viewingVersionId !== null ? (
                           <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-left">
                             <div className="text-xs text-slate-400 font-mono mb-2 uppercase tracking-wide">历史版本预览内容</div>
                             <div className="text-[#334155] leading-relaxed font-sans text-[15px] font-medium whitespace-pre-wrap">
                               {allVersions.find(ver => ver.id === viewingVersionId)?.content || "该历史记录为空白"}
                             </div>
                           </div>
                         ) : (
                            <>
                              <div className="h-4 w-full bg-slate-100 rounded-full" />
                              <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                              <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
                              <div className="mt-8 mb-4 border border-blue-100 bg-blue-50 text-blue-700 p-6 rounded-xl font-medium flex flex-col items-center justify-center gap-3">
                                 <Bot className="w-8 h-8 fill-blue-100" />
                                 <p>这是一个模拟的 {detailDoc.format?.toUpperCase()} 预览容器</p>
                              </div>
                            </>
                         )}
                      </div>
                   </div>
                ) : detailDoc.type === 'note' ? (
                   <div className={cn("max-w-[780px] w-full min-h-full p-12 flex flex-col", isEditingDoc ? "bg-[#f8fbff] shadow-inner" : "bg-white border-x border-slate-100")}>
                      {isEditingDoc ? (
                         <textarea
                           value={editContent}
                           onChange={e => setEditContent(e.target.value)}
                           className="flex-1 w-full bg-transparent resize-none outline-none text-sm leading-relaxed text-slate-800 font-medium"
                           placeholder="开始编写笔记..."
                         />
                      ) : (
                       <div className="prose prose-slate prose-sm max-w-none w-full">
                         {(detailDoc.governanceStatus === 'running' || detailDoc.governanceStatus === 'failed') && viewingVersionId === null && (
                           <div className={cn("mb-6 p-3 border rounded-xl flex items-center justify-between font-sans shadow-sm NotProse", detailDoc.governanceStatus === "running" ? "bg-blue-50 border-blue-200" : "bg-rose-50 border-rose-200 text-rose-950")}>
                             <div className="flex items-center gap-1.5">
                               {detailDoc.governanceStatus === "running" ? (
                                 <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                               ) : (
                                 <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                               )}
                               <div className="text-left">
                                 <p className={cn("text-sm font-medium", detailDoc.governanceStatus === "running" ? "text-blue-900" : "text-rose-955")}>{detailDoc.governanceStatus === "running" ? "智能治理全自动预处理中..." : "智能治理流程异常中止"}</p>
                                 <p className={cn("text-[10.5px] font-medium mt-0.5 font-sans", detailDoc.governanceStatus === "running" ? "text-blue-600" : "text-rose-600")}>{detailDoc.governanceStatus === "running" ? "系统正为您全自动进行首轮 OCR 和语义高精度物理切分（耗时3秒），无需手动触发，请稍候。" : "检测到非法字符集、排版冲突特征，您可执行手动重新发起治理或查看原因。"}</p>
                               </div>
                             </div>
                             <button 
                               onClick={() => setModal({ type: 'preprocess', payload: detailDoc })}
                               className={cn("px-3 py-1.5 text-white rounded-lg text-sm font-medium border-0 cursor-pointer shadow-sm transition font-sans", detailDoc.governanceStatus === "running" ? "hidden" : "bg-rose-600 hover:bg-rose-700")}
                             >
                               {detailDoc.governanceStatus === 'failed' ? "立即重试与查看治理 →" : "立即进入治理 →"}
                             </button>
                             {detailDoc.governanceStatus === 'failed' && (
                               <button 
                                 onClick={() => setModal({ type: 'preprocess', payload: detailDoc })}
                                 className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium border-0 cursor-pointer shadow-sm transition font-sans flex items-center gap-1 shrink-0"
                               >
                                 <FileText className="w-3.5 h-3.5" /> 查看文档
                               </button>
                             )}
                           </div>
                         )}
                         {viewingVersionId !== null && (
                            <div className="mb-6 p-4 border rounded-xl flex items-center justify-between font-sans shadow-sm bg-amber-50 border-amber-200 text-amber-900 NotProse">
                              <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-amber-500" />
                                <div>
                                  <p className="text-sm font-medium">您正在查看历史版本</p>
                                  <p className="text-xs text-amber-700/80 mt-0.5">该版本已归档，如果需要，您可以将其恢复为最新版本。</p>
                                </div>
                              </div>
                              {canWrite && (
                                <button 
                                  onClick={() => {
                                    const v = allVersions.find(v => v.id === viewingVersionId);
                                    if (v && confirm(`确定要恢复到历史版本 ${v.versionName} 吗？`)) {
                                      setNodes(nodes.map(n => n.id === detailDocId ? { ...n, content: v.content, updatedAt: new Date().toISOString() } : n));
                                      setEditContent(v.content);
                                      setViewingVersionId(null);
                                      showToast('已完成覆盖：恢复至历史版本！');
                                    }
                                  }}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer shadow-sm transition"
                                >
                                  恢复此版本
                                </button>
                              )}
                            </div>
                          )}
                          <h1 className="text-[34px] font-medium text-slate-900 mb-4">{detailDoc.name.replace('.md', '')}</h1>
                         <div className="flex items-center gap-3 text-sm font-medium text-slate-500 mb-8 border-b border-slate-100 pb-4">
                           <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">我</span>
                           <span>我</span> <span>|</span> <span>{format(new Date(detailDoc.updatedAt), 'MM月dd日 HH:mm')}</span>
                         </div>
                         <div className="text-sm leading-loose text-slate-700 whitespace-pre-wrap font-medium">
                           {viewingVersionId !== null 
                              ? (allVersions.find(v => v.id === viewingVersionId)?.content || "该历史记录为空白") 
                              : (detailDoc.content || "空白笔记")}
                         </div>
                       </div>
                    )}
                  </div>
               ) : detailDoc.type === 'image' ? (
                 <div className="w-full min-h-full p-12 flex items-center justify-center bg-slate-800">
                    <FileImage className="w-32 h-32 text-slate-600" />
                 </div>
               ) : (
                 <div className="w-full min-h-full p-12 flex items-center justify-center">
                    <div className="text-center bg-slate-50 p-12 rounded-2xl border border-slate-200">
                       <FileArchive className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                       <h3 className="text-sm font-medium text-slate-700 mb-2">无法预览此文件</h3>
                       <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg mt-4 shadow-sm" onClick={() => showToast('已启动源文件下载')}>立刻下载源文件</button>
                    </div>
                 </div>
               )}
             </div>

             {/* Right Side Panel */}
             </section>
             <AnimatePresence>
               {sidePanel !== 'none' && (
                   <motion.aside 
                     initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                     className="h-full bg-white z-20 flex flex-col shrink-0 overflow-hidden"
                   >
                    <div className="w-[360px] flex-1 flex flex-col h-full">
                     <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
                       <h3 className="font-medium text-sm text-slate-900">{sidePanel === 'history' ? '历史版本' : '评论'}</h3>
                       <button onClick={() => setSidePanel('none')} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded"><X className="w-4 h-4"/></button>
                     </div>
                     <div className="flex-1 overflow-auto p-5 space-y-4">
                       {sidePanel === 'history' ? (
                         <div className="space-y-4 text-left w-full font-sans">
                           <input 
                             type="file" 
                             ref={versionFileInputRef} 
                             className="hidden" 
                             onChange={handleVersionUpload} 
                           />
                           <button 
                             onClick={() => canWrite ? versionFileInputRef.current?.click() : showToast('当前权限为只读，无法上传新版本')}
                             className={cn("w-full py-2.5 rounded-lg text-sm font-medium shadow-sm mb-4 flex items-center justify-center gap-1 transition", canWrite ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" : "bg-slate-100 text-slate-400 cursor-not-allowed select-none")}
                           >
                             {canWrite ? <UploadCloud className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} {canWrite ? '上传新版本文件' : '只读权限，暂不可用'}
                           </button>
                           
                           {/* Current Active Draft Card */}
                           <div 
                             onClick={() => setViewingVersionId(null)}
                             className={cn(
                               "p-3 bg-slate-50 border rounded-lg cursor-pointer transition flex flex-col text-left",
                               viewingVersionId === null ? "bg-blue-50/70 border-blue-400 shadow-[0_1px_4px_rgba(37,99,235,0.06)]" : "bg-white border-slate-200 hover:border-slate-300"
                             )}
                           >
                             <div className="flex items-center justify-between mb-1">
                               <span className="text-sm font-medium text-slate-800">当前最新版本</span>
                              {viewingVersionId === null && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[8.5px] font-medium">预览中</span>}
                             </div>
                             <div className="text-sm text-slate-400 font-medium mb-1">修改人: 我 · 刚刚</div>
                             <div className="text-[10.5px] text-slate-500 font-semibold truncate bg-white p-1 rounded border border-slate-100">{detailDoc.name}</div>
                           </div>

                           <div className="text-[10.5px] font-medium uppercase text-slate-400 tracking-wider pt-1 flex items-center gap-1">
                             <span>历史版本 ({allVersions.filter(v => v.fileId === detailDocId).length})</span>
                           </div>

                           {/* Old Historical Versions list */}
                           {allVersions.filter(v => v.fileId === detailDocId).length === 0 ? (
                             <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium bg-slate-50">
                               暂无历史版本记录，可通过上方上传
                             </div>
                           ) : (
                             <div className="space-y-2.5">
                               {allVersions.filter(v => v.fileId === detailDocId).slice().reverse().map(v => (
                                 <div 
                                   key={v.id} 
                                   onClick={() => setViewingVersionId(v.id)}
                                   className={cn(
                                     "p-3 border rounded-lg cursor-pointer transition flex flex-col text-left group",
                                     viewingVersionId === v.id ? "bg-amber-50/50 border-amber-400 shadow-[0_1px_4px_rgba(245,158,11,0.06)]" : "bg-white border-slate-200 hover:border-slate-300"
                                   )}
                                 >
                                   <div className="flex items-center justify-between mb-1">
                                     <span className="text-sm font-medium text-slate-800">{v.versionName}</span>
                                     {canWrite && (
                                       <button 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           if (confirm(`确定要恢复到历史版本 ${v.versionName} 吗？`)) {
                                             setNodes(nodes.map(n => n.id === detailDocId ? { ...n, content: v.content, updatedAt: new Date().toISOString() } : n));
                                             setEditContent(v.content);
                                             setViewingVersionId(null);
                                             showToast('已完成覆盖：恢复至历史版本！');
                                           }
                                         }}
                                         className="text-sm font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2 py-1 rounded pointer-events-auto transition cursor-pointer border-0"
                                       >
                                         恢复
                                       </button>
                                     )}
                                   </div>
                                   <div className="text-sm text-slate-500 font-medium mb-1">修改人: {v.author} · {v.time}</div>
                                   <div className="text-[10.5px] text-slate-500 font-semibold truncate bg-slate-50 p-1.5 rounded">关联: {v.fileName}</div>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       ) : (
                         <div className="flex flex-col h-full text-left">
                           <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl relative">
                             <textarea 
                               value={newComment} 
                               onChange={e=>setNewComment(e.target.value)} 
                               className="w-full min-h-[85px] bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-400 resize-none font-semibold text-slate-700" 
                               placeholder="输入评论，可在下方艾特团队成员..." 
                             />
                             <div className="flex justify-between items-center mt-2 relative">
                               <div className="relative">
                                 <button 
                                   onClick={() => setShowMentionMenu(!showMentionMenu)}
                                   className="px-2 py-1 text-sm font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1 shadow-sm transition"
                                 >
                                   @ 成员
                                 </button>
                                 {showMentionMenu && (
                                   <>
                                     <div className="fixed inset-0 z-30" onClick={() => setShowMentionMenu(false)} />
                                     <div className="absolute left-0 bottom-full mb-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1 font-sans text-sm">
                                       <div className="px-2.5 py-1.5 text-sm text-slate-400 border-b border-slate-100 uppercase font-medium tracking-wider">提到的团队成员</div>
                                       {TEAM_MEMBERS.map(m => (
                                         <button 
                                           key={m.name}
                                           onClick={() => {
                                             setNewComment(prev => prev + `@${m.name} `);
                                             setShowMentionMenu(false);
                                           }}
                                           className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                         >
                                           <span className="font-medium">{m.name}</span>
                                           <span className="text-[9px] text-slate-400 font-semibold">{m.role}</span>
                                         </button>
                                       ))}
                                     </div>
                                   </>
                                 )}
                               </div>
                               <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors" onClick={handleAddComment}>发布评论</button>
                             </div>
                           </div>

                           <div className="space-y-3 mt-4 flex-1">
                             {allComments.filter(c => c.fileId === detailDocId).map(c => (
                               <div key={c.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-left">
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-1">
                                     <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-medium text-[10.5px] text-slate-600 shrink-0">
                                       {c.author[0]}
                                     </div>
                                     <div>
                                       <div className="text-sm font-medium text-slate-800">{c.author}</div>
                                       <div className="text-[9px] font-medium text-slate-400">{c.time}</div>
                                     </div>
                                   </div>
                                   <div className="flex gap-1">
                                     {c.author === '我' ? (
                                       <>
                                         <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.text); }} className="text-sm font-medium text-slate-400 hover:text-blue-600 transition">编辑</button>
                                         <button onClick={() => handleDeleteCommentSubmit(c.id, false)} className="text-sm font-medium text-slate-400 hover:text-rose-600 transition">删除</button>
                                       </>
                                     ) : null}
                                     <button onClick={() => { setReplyingToId(replyingToId === c.id ? null : c.id); setReplyText(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">回复</button>
                                   </div>
                                 </div>

                                 {editingCommentId === c.id ? (
                                   <div className="bg-white border border-blue-400 p-2.5 rounded-lg space-y-1.5">
                                     <textarea 
                                       value={editCommentText}
                                       onChange={e => setEditCommentText(e.target.value)}
                                       className="w-full text-sm p-1 outline-none resize-none bg-slate-50 rounded border border-slate-200 font-semibold text-slate-700 min-h-[55px]"
                                     />
                                     <div className="flex justify-end gap-1.5">
                                       <button onClick={() => setEditingCommentId(null)} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9.5px] font-medium">取消</button>
                                       <button onClick={() => handleEditCommentSubmit(c.id, false)} className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-[9.5px] font-medium shadow-xs">保存</button>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="text-sm text-slate-700 font-semibold leading-relaxed pl-1 whitespace-pre-wrap">{c.text}</div>
                                 )}

                                 {/* Sub Replies List */}
                                 {c.replies && c.replies.length > 0 && (
                                   <div className="pl-2 border-l-2 border-slate-200 ml-1.5 mt-2 space-y-1.5 text-left">
                                     {c.replies.map((r: any) => (
                                       <div key={r.id} className="bg-white p-2 rounded-lg border border-slate-100 text-left space-y-1 relative">
                                         <div className="flex items-center justify-between">
                                           <div className="flex items-center gap-1.5">
                                             <span className="text-sm font-medium text-slate-700">{r.author}</span>
                                             <span className="text-[8px] font-medium text-slate-400">{r.time}</span>
                                           </div>
                                           <div className="flex gap-1">
                                             {r.author === '我' ? (
                                               <>
                                                 <button onClick={() => { setEditingReplyId(r.id); setEditReplyText(r.text); }} className="text-[9px] font-medium text-slate-400 hover:text-blue-600 transition">编辑</button>
                                                 <button onClick={() => handleDeleteCommentSubmit(r.id, true, c.id)} className="text-[9px] font-medium text-slate-400 hover:text-rose-600 transition">删除</button>
                                               </>
                                             ) : (
                                               <button onClick={() => { setReplyingToId(c.id); setReplyText(`@${r.author} `); }} className="text-[9px] font-medium text-slate-400 hover:text-blue-600 transition">回复</button>
                                             )}
                                           </div>
                                         </div>

                                         {editingReplyId === r.id ? (
                                           <div className="bg-slate-50 border border-blue-400 p-2 rounded space-y-1.5">
                                             <textarea 
                                               value={editReplyText}
                                               onChange={e => setEditReplyText(e.target.value)}
                                               className="w-full text-sm p-1 outline-none resize-none bg-white rounded border border-slate-100 font-semibold text-slate-700 min-h-[45px]"
                                             />
                                             <div className="flex justify-end gap-1.5">
                                               <button onClick={() => setEditingReplyId(null)} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-medium">取消</button>
                                               <button onClick={() => handleEditCommentSubmit(r.id, true, c.id)} className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-medium shadow-xs">保存</button>
                                             </div>
                                           </div>
                                         ) : (
                                           <div className="text-sm text-slate-600 font-semibold leading-normal pl-0.5 whitespace-pre-wrap">
                                             {r.text}
                                           </div>
                                         )}
                                       </div>
                                     ))}
                                   </div>
                                 )}

                                 {/* Reply Entry Box */}
                                 {replyingToId === c.id && (
                                   <div className="mt-2 text-left bg-white p-2.5 border border-blue-100 rounded-lg space-y-2">
                                     <textarea
                                       value={replyText}
                                       onChange={e => setReplyText(e.target.value)}
                                       className="w-full h-14 p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-blue-300 resize-none font-semibold text-slate-700"
                                       placeholder={`回复 @${c.author}...`}
                                     />
                                     <div className="flex justify-between items-center bg-white">
                                       <div className="relative">
                                         <button 
                                           onClick={() => setShowReplyMentionId(showReplyMentionId === c.id ? null : c.id)}
                                           className="px-1.5 py-0.5 text-[9px] font-medium border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-0.5 transition"
                                         >
                                           @ 成员
                                         </button>
                                         {showReplyMentionId === c.id && (
                                           <>
                                             <div className="fixed inset-0 z-30" onClick={() => setShowReplyMentionId(null)} />
                                             <div className="absolute left-0 bottom-full mb-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-40 py-1 font-sans text-sm">
                                               <div className="px-2.5 py-1 text-[9px] text-slate-400 border-b border-slate-100 uppercase font-medium tracking-wider">选择群组讨论成员</div>
                                               {TEAM_MEMBERS.map(m => (
                                                 <button 
                                                   key={m.name} 
                                                   onClick={() => {
                                                     setReplyText(prev => prev + `@${m.name} `);
                                                     setShowReplyMentionId(null);
                                                   }}
                                                   className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                                                 >
                                                   <span className="font-medium">{m.name}</span>
                                                   <span className="text-[9px] text-slate-400 font-semibold">{m.role}</span>
                                                 </button>
                                               ))}
                                             </div>
                                           </>
                                         )}
                                       </div>
                                       <div className="flex gap-1.5 text-right">
                                         <button 
                                           onClick={() => setReplyingToId(null)}
                                           className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-medium transition"
                                         >
                                           取消
                                         </button>
                                         <button 
                                           onClick={() => handleAddReply(c.id)}
                                           className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-medium transition"
                                         >
                                           提交
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 )}
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                    </div>
                   </motion.aside>
               )}
             </AnimatePresence>
        </div>
      )}

      {/* --- Action Modals --- */}
      <AnimatePresence>
        {['create_folder', 'create_note', 'rename'].includes(modal.type) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
             >
               <h3 className="text-[16px] font-medium text-slate-900 mb-4">
                 {modal.type === 'create_folder' ? '新建文件夹' : modal.type === 'create_note' ? '新建 Markdown 笔记' : '重命名'}
               </h3>
               <input 
                 type="text" 
                 value={modalInput}
                 onChange={e => setModalInput(e.target.value)}
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                 placeholder="请输入名称..."
                 autoFocus
                 onKeyDown={(e) => { if(e.key === 'Enter') executeAction(); }}
               />
               <div className="flex justify-end gap-1">
                 <button onClick={closeModal} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">取消</button>
                 <button onClick={executeAction} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium">确认</button>
               </div>
             </motion.div>
          </div>
        )}

        {modal.type === 'delete' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
             >
               <h3 className="text-[16px] font-medium text-rose-600 flex items-center gap-1 mb-2">
                 <AlertCircle className="w-5 h-5" /> 确认删除
               </h3>
               <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                 您确定要删除 <span className="text-slate-900 font-medium">"{modal.payload?.name}"</span> 吗？
                 {modal.payload?.type === 'folder' && " 这个操作会连同其目录下的所有子文件一并删除，该操作不可逆。"}
               </p>
               <div className="flex justify-end gap-1">
                 <button onClick={closeModal} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">取消</button>
                 <button onClick={executeAction} className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200 rounded-lg text-sm font-medium">确认彻底删除</button>
               </div>
             </motion.div>
          </div>
        )}
        
        {['move', 'copy'].includes(modal.type) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] flex flex-col max-h-[80vh]"
             >
               <h3 className="text-[16px] font-medium text-slate-900 mb-4">{modal.type === 'move' ? '移动' : '复制'} "{modal.payload?.name}" 到</h3>
               <div className="flex-1 overflow-auto border border-slate-200 rounded-lg p-2 mb-6">
                 {/* Simplified tree for move dialog */}
                 {nodes.filter(n => n.type === 'folder' && n.id !== modal.payload.id).map(f => (
                   <div 
                     key={f.id} 
                     onClick={() => setModal({ ...modal, payload: { ...modal.payload, targetId: f.id } })}
                     className={cn("px-3 py-2 rounded flex items-center gap-1 cursor-pointer text-sm font-medium", modal.payload.targetId === f.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700")}
                   >
                     <Folder className="w-4 h-4 fill-current opacity-30" /> {f.name}
                   </div>
                 ))}
               </div>
               <div className="flex justify-end gap-1 shrink-0">
                 <button onClick={closeModal} className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">取消</button>
                 <button 
                   onClick={executeAction} 
                   disabled={!modal.payload.targetId}
                   className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
                 >确认{modal.type === 'move' ? '移动' : '复制'}</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

        {modal.type === 'publish_confirm' && modal.payload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-[420px] relative"
             >
               <h3 className="text-[16px] font-medium text-slate-900 flex items-center gap-1 mb-2">
                 <Globe className="w-5 h-5 text-blue-600" /> 文档发布确认
               </h3>
               
               <div className="text-sm font-medium text-slate-500 mb-6 truncate px-7">
                 即将发布：{modal.payload.name}
               </div>
               
               <div className="mb-8 px-7">
                 <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                   <div className="mt-0.5">
                     <input 
                       type="checkbox" 
                       className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                       checked={publishAsRequired}
                       onChange={(e) => setPublishAsRequired(e.target.checked)}
                     />
                   </div>
                   <div>
                     <div className="text-sm font-medium text-slate-800">将此文件设为“必读要求”</div>
                     <div className="text-sm text-slate-500 mt-1 font-semibold leading-relaxed">
                       勾选后，将在系统所有相关用户的协作通知中心推送提醒，确保其查阅学习。
                     </div>
                   </div>
                 </label>
               </div>

               <div className="flex justify-end gap-1 mt-6">
                  <button 
                    onClick={() => setModal({ type: 'none' })}
                    className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                  >取消</button>
                  <button 
                    onClick={() => {
                       setNodes(nodes.map(n => n.id === modal.payload.id ? { ...n, publishStatus: 'published', isRequiredRead: publishAsRequired } : n));
                       showToast('文件已正式发布');
                       
                       if (publishAsRequired) {
                         const notifications = JSON.parse(localStorage.getItem('local_notifications') || '[]');
                         notifications.unshift({
                           id: `pub_${Date.now()}`,
                           type: 'system',
                           title: '【必读】新文件发布提醒',
                           content: `您有一份新文件被标记为必读：“${modal.payload.name}”，请及时前往查阅。`,
                           objectType: '必读文档',
                           targetName: modal.payload.name,
                           time: '刚刚',
                           read: false,
                           ignored: false,
                           replied: false,
                           kbId: kbId,
                           fileId: modal.payload.id,
                           kbName: kbName,
                           kbType: kbType,
                         });
                         localStorage.setItem('local_notifications', JSON.stringify(notifications));
                         window.dispatchEvent(new Event('storage'));
                       }
                       setModal({ type: 'none' });
                       setPublishAsRequired(false);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors border-0 cursor-pointer"
                  >确认发布</button>
               </div>
             </motion.div>
          </div>
        )}

        {modal.type === 'escalate_pkb' && modal.payload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-2xl p-6 w-[500px] flex flex-col text-left font-sans text-slate-800"
             >
               <div className="flex items-start gap-3 pb-3 border-b border-slate-100 mb-4 shrink-0">
                 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-medium text-lg select-none">
                   公
                 </div>
                 <div>
                   <h3 className="text-sm font-medium text-slate-900">呈报至全行公共知识库</h3>
                   <span className="block text-sm font-medium text-slate-400 mt-0.5">申请全行或跨分行范围级合规受控分发</span>
                 </div>
               </div>

               <div className="space-y-4 flex-1 overflow-auto pr-1">
                 <div>
                   <label className="block text-sm font-medium uppercase text-slate-400 tracking-wider mb-1.5">待提报文件</label>
                   <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                     <FileText className="w-5 h-5 text-blue-600" />
                     <div>
                       <b className="block text-sm font-medium text-slate-900 truncate max-w-[340px]">{modal.payload.name}</b>
                       <span className="block text-sm font-medium text-slate-400 mt-0.5">
                         大小: {modal.payload.size || '3.2 MB'} · 格式: {modal.payload.format ? modal.payload.format.toUpperCase() : 'MD'}
                       </span>
                     </div>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium uppercase text-slate-400 tracking-wider mb-1.5">投递目的公共大类 *</label>
                   <select 
                     value={escalateTarget}
                     onChange={e => setEscalateTarget(e.target.value)}
                     className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                   >
                     <option value="pub_hall">[运营服务中心] 厅堂服务话术与客诉处理库</option>
                     <option value="pub_spring">[零售运营部] 2026 开门红活动运营资料</option>
                     <option value="pub_rules">[运营管理部] 运营制度规范公开索引</option>
                     <option value="pub_train">[培训学院] 新员工运营培训课件合集</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium uppercase text-slate-400 tracking-wider mb-1.5">提报呈审说明 *</label>
                   <textarea
                     rows={3}
                     value={escalateReason}
                     onChange={e => setEscalateReason(e.target.value)}
                     className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                     placeholder="请阐明此文档对全行运营规范、网点应对的复用参考意义..."
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium uppercase text-slate-400 tracking-wider mb-1.5">提报自审及责任人</label>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-medium text-slate-500">
                       提报成员：<span className="text-slate-800 font-medium">我 (张敏)</span>
                     </div>
                     <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-medium text-slate-500">
                       所属部门：<span className="text-slate-800 font-medium">华东分行信贷运营组</span>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-2 pt-2.5 border-t border-slate-100">
                   <label className="flex items-start gap-1 cursor-pointer select-none">
                     <input 
                       type="checkbox" 
                       checked={escalateCheck1} 
                       onChange={e => setEscalateCheck1(e.target.checked)}
                       className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     />
                     <span className="text-sm font-medium text-slate-600 leading-snug">
                       已对该文件开展<b>敏感自审与脱敏处置</b>，确保无真实个人隐私数据（如真实身份证、银行账号等）。
                     </span>
                   </label>
                   <label className="flex items-start gap-1 cursor-pointer select-none">
                     <input 
                       type="checkbox" 
                       checked={escalateCheck2} 
                       onChange={e => setEscalateCheck2(e.target.checked)}
                       className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     />
                     <span className="text-sm font-medium text-slate-600 leading-snug">
                       保证提交内容真实合规，符合辖内法规，愿意配合总行运营管理团队进行合规修订。
                     </span>
                   </label>
                 </div>
               </div>

               <div className="flex justify-end gap-1 pt-4 border-t border-slate-100 mt-5 shrink-0">
                 <button onClick={closeModal} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium cursor-pointer">
                   取消并返回
                 </button>
                 <button 
                   disabled={!escalateCheck1 || !escalateCheck2 || !escalateReason.trim()}
                   onClick={() => {
                     const savedData = localStorage.getItem("public_kbs_data");
                     let currentKbs = savedData ? JSON.parse(savedData) : null;
                     if (!currentKbs) {
                       currentKbs = [
                         {
                           id: "pub_hall",
                           name: "厅堂服务话术与客诉处理库",
                           desc: "网点服务标准、常见客诉口径、客户沟通案例沉淀。由各分支共享，统一审定归档发布。",
                           owner: "运营服务中心",
                           subs: "2,706",
                           files: 183,
                           status: "运行中",
                           statusTone: "success",
                           updatedAt: "今日 11:45",
                           creator: "赵云杰",
                           category: "运营",
                           cover: "厅堂\n运营",
                           isPinned: true,
                           folders: 4,
                           docs: 120,
                           tags: ["客诉应对", "网点标准", "话术训练"],
                           pendingApprovals: [
                             { id: "app1", title: "2026网点应对多轮提款情绪波动话术补充.docx", department: "华东分行运营组", applicant: "李建刚", time: "2 小时前" },
                             { id: "app2", title: "大额存单提前支取争议口径优化版.docx", department: "深圳分行客诉组", applicant: "江明珠", time: "昨日" }
                           ],
                           documents: [
                             { id: "d1", name: "网点服务标准手册 2026 版.pdf", category: "合规话术", size: "12.4 MB", editor: "王敏", time: "3天前" },
                             { id: "d2", name: "高风险投诉应急话术.docx", category: "客诉标准", size: "4.1 MB", editor: "赵云杰", time: "昨日" },
                             { id: "d3", name: "厅堂排队冲突解决指引方案.pptx", category: "运营效率", size: "18.2 MB", editor: "林珊", time: "本周二" }
                           ]
                         },
                         {
                           id: "pub_spring",
                           name: "2026 开门红活动运营资料",
                           desc: "活动方案、客户分层、触达素材、复盘模板。全辖网点共享调用，覆盖全周期业务流程。",
                           owner: "零售运营部",
                           subs: "1.5 万",
                           files: 740,
                           status: "审核中",
                           statusTone: "warning",
                           updatedAt: "今日 09:30",
                           creator: "林珊",
                           category: "零售",
                           cover: "活动\n增长",
                           isPinned: true,
                           folders: 8,
                           docs: 412,
                           tags: ["活动玩法", "客户触达", "文案素材"],
                           pendingApprovals: [
                             { id: "app3", title: "开门红定存大转盘分支行配置模板.xlsx", department: "苏南区域管理部", applicant: "郑涛", time: "昨天" }
                           ],
                           documents: [
                             { id: "d4", name: "2026年开门红活动总体方案.pdf", category: "活动玩法", size: "8.5 MB", editor: "林珊", time: "今日 09:12" },
                             { id: "d5", name: "客户精细分层触达短信大全.docx", category: "客户触达", size: "1.2 MB", editor: "张敏", time: "3天前" }
                           ]
                         },
                         {
                           id: "pub_rules",
                           name: "运营制度规范公开索引",
                           desc: "制度修订、审批口径、操作规程 and 合规提醒。全员公开查询、权威指引发布后台。",
                           owner: "运营管理部",
                           subs: "7,001",
                           files: 217,
                           status: "运行中",
                           statusTone: "success",
                           updatedAt: "昨日 17:35",
                           creator: "周维",
                           category: "合规",
                           cover: "制度\n规范",
                           isPinned: true,
                           folders: 3,
                           docs: 198,
                           tags: ["修订通知", "合规细则", "查询索引"],
                           pendingApprovals: [],
                           documents: [
                             { id: "d6", name: "重要空白凭证保管操作规程.pdf", category: "合规细则", size: "6.8 MB", editor: "周维", time: "5天前" }
                           ]
                         },
                         {
                           id: "pub_train",
                           name: "新员工运营培训课件合集",
                           desc: "基础业务、系统操作、风险提示、考试题库。新人极速上手、导师带教全景路径推荐。",
                           owner: "培训学院",
                           subs: "1,520",
                           files: 2120,
                           status: "治理中",
                           statusTone: "warning",
                           updatedAt: "6月2日",
                           creator: "张艳",
                           category: "培训",
                           cover: "培训\n课件",
                           isPinned: false,
                           folders: 12,
                           docs: 960,
                           tags: ["入职必修", "仿真测试", "通关标准"],
                           pendingApprovals: [
                             { id: "app4", title: "运营系统V3.2最新改造重点考试试题.docx", department: "业务科技部", applicant: "刘星", time: "3天前" }
                           ],
                           documents: [
                             { id: "d7", name: "新入司柜员岗位学习全景路径图.pdf", category: "入职必修", size: "3.7 MB", editor: "张艳", time: "5/28" }
                           ]
                         }
                       ];
                     }

                     const newApprovalItem = {
                       id: "app_esc_" + Date.now(),
                       title: modal.payload?.name || "未知提报文件",
                       department: "华东分行信贷运营组",
                       applicant: "张敏",
                       time: "刚刚呈报"
                     };

                     const updatedKbs = currentKbs.map((kb: any) => {
                       if (kb.id === escalateTarget) {
                         return {
                           ...kb,
                           pendingApprovals: [newApprovalItem, ...(kb.pendingApprovals || [])]
                         };
                       }
                       return kb;
                     });

                     localStorage.setItem("public_kbs_data", JSON.stringify(updatedKbs));

                     const rawNotices = localStorage.getItem("local_notifications");
                     let notices = rawNotices ? JSON.parse(rawNotices) : [
                       {
                         id: "n1",
                         type: "comment",
                         title: "张三 评论了您的文件",
                         content: "这个方案的第二部分需要同步修改一下，特别是关于权限控制的设计。",
                         objectType: "源文件",
                         targetName: "UDA_运营平台PRD_v1.pdf",
                         time: "10分钟前",
                         read: false,
                       }
                     ];

                     const targetKbName = escalateTarget === "pub_hall" ? "厅堂服务话术与客诉处理库" : escalateTarget === "pub_spring" ? "2026 开门红活动运营资料" : escalateTarget === "pub_rules" ? "运营制度规范公开索引" : "新员工运营培训课件合集";

                     const newNoticeItem = {
                       id: "n_esc_" + Date.now(),
                       type: "system",
                       title: "呈审申请提报成功",
                       content: `您已成功发起一笔公网库呈审：将文件「${modal.payload?.name}」推送到「${targetKbName}」进行合规复核。`,
                       objectType: "全行呈报",
                       targetName: modal.payload?.name || "未知呈审文件",
                       time: "刚刚",
                       read: false
                     };

                     notices = [newNoticeItem, ...notices];
                     localStorage.setItem("local_notifications", JSON.stringify(notices));

                     showToast(`已成功呈报，提报单已发送至总行公共审核大厅！`);
                     closeModal();
                   }}
                   className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium shadow-sm cursor-pointer border-0"
                 >
                   呈报至总行审核大厅
                 </button>
               </div>
             </motion.div>
          </div>
        )}

      {/* --- File Full-Screen Viewers (Drawer/Modal) --- */}
      {modal.type === 'preprocess' && modal.payload && (
        <FilePreprocessView 
          file={modal.payload as any} 
          canEdit={kbType === 'team' || kbType === 'personal_own'} 
          onBack={closeModal} 
          onCompleteGovernance={(fileId) => {
            setNodes(prev => prev.map(n => n.id === fileId ? {
              ...n,
              governanceStatus: 'success',
              preprocessStatus: 'success',
              updatedAt: new Date().toISOString()
            } : n));
            showToast('一键自主治理预处理合规质检执行成功！该版本内容已激活入库');
          }}
        />
      )}

      {/* Select Favorite Folder Modal */}
      {modal.type === 'select_favorite_folder' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-[420px] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900">选择收藏夹</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">请选择您想要存放该文件的文件夹</p>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
               >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-3 max-h-[300px] overflow-auto space-y-1">
              {favoriteFolders.map(folder => {
                const IconComp = folder.id === 'default' ? Star : (folder.id === 'f_template' ? FileArchive : Folder);
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      // Update State Node visually
                      setNodes(nodes.map(n => n.id === modal.payload.id ? { ...n, isFavorited: true } : n));
                      
                      // Correct favorite persistence integration to match QuickAccessView state format
                      const favItem = { 
                        id: `fav-${Date.now()}`, 
                        targetId: modal.payload.id,
                        name: modal.payload.name || '未命名文件',
                        type: 'file',
                        addedAt: new Date().toISOString().split('T')[0],
                        memo: '', 
                        folderId: folder.id,
                        kbId: initialFileId ? undefined : (modal.payload.kbId || 'kb-1'),
                        kbName: kbName || '系统知识库',
                        kbType: kbType || 'personal',
                        format: modal.payload.format || 'pdf'
                      };
                      
                      const existingFavs = JSON.parse(localStorage.getItem('my_favorites') || '[]');
                      const filteredFavs = existingFavs.filter((f: any) => !(f.targetId === modal.payload.id && f.type === 'file'));
                      localStorage.setItem('my_favorites', JSON.stringify([favItem, ...filteredFavs]));
                      window.dispatchEvent(new Event('storage'));

                      showToast(`已成功收藏至 "${folder.name}"`);
                      closeModal();
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-all border-0 bg-transparent text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500 transition-colors">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium tracking-normal">{folder.name}</div>
                      {folder.id === 'default' && <div className="text-sm text-slate-400 font-medium">默认存放位置</div>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                  </button>
                );
              })}
            </div>

            {isCreatingFolder ? (
              <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-3 animate-in slide-in-from-bottom duration-200">
                <div className="text-sm font-medium text-slate-700">新建收藏夹</div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => {
                      setNewFolderName(e.target.value);
                      if (createFeedback) setCreateFeedback(null);
                    }}
                    placeholder="请输入新收藏夹名称..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (newFolderName.trim()) {
                          const name = newFolderName.trim();
                          const newFolder = {
                            id: `f_${Date.now()}`,
                            name: name,
                            createdAt: new Date().toISOString()
                          };
                          const updatedFolders = [...favoriteFolders, newFolder];
                          setFavoriteFolders(updatedFolders);
                          localStorage.setItem('my_favorite_folders', JSON.stringify(updatedFolders));
                          window.dispatchEvent(new Event('storage'));
                          setCreateFeedback(`收藏夹 「${name}」 已成功创建！`);
                          showToast(`收藏夹「${name}」创建成功`);
                          setNewFolderName('');
                          setTimeout(() => {
                            setCreateFeedback(null);
                            setIsCreatingFolder(false);
                          }, 2000);
                        }
                      }
                    }}
                  />
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                        setCreateFeedback(null);
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl text-sm font-medium cursor-pointer border-0"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        if (newFolderName.trim()) {
                          const name = newFolderName.trim();
                          const newFolder = {
                            id: `f_${Date.now()}`,
                            name: name,
                            createdAt: new Date().toISOString()
                          };
                          const updatedFolders = [...favoriteFolders, newFolder];
                          setFavoriteFolders(updatedFolders);
                          localStorage.setItem('my_favorite_folders', JSON.stringify(updatedFolders));
                          window.dispatchEvent(new Event('storage'));
                          setCreateFeedback(`收藏夹 「${name}」 已成功创建！`);
                          showToast(`收藏夹「${name}」创建成功`);
                          setNewFolderName('');
                          setTimeout(() => {
                            setCreateFeedback(null);
                            setIsCreatingFolder(false);
                          }, 2000);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer border-0 shadow-sm"
                    >
                      创建
                    </button>
                  </div>
                </div>
                {createFeedback && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-150 p-2 rounded-lg flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{createFeedback}</span>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setIsCreatingFolder(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> 创建新收藏夹（即时创建与反馈）
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
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
    </div>
  );
}
