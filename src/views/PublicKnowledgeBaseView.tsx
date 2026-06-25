import { useState, useEffect, useMemo, useCallback } from "react";
import { Database, Users, ShieldAlert, Shield, FileText, Settings, Plus, Search, ChevronRight, BarChart3, Clock, Lock, Bell, Download, MonitorPlay, X, ArrowLeft, MoreHorizontal, FileArchive, CheckCircle2, Sliders, Globe, Grid, List, Check, ThumbsUp, AlertCircle, RefreshCw, Send, Eye, ShieldCheck, Tag, UserPlus, Trash2, ChevronDown, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { KnowledgeBaseDetail } from "./KnowledgeBaseDetail";
import type { FileNode } from "./KnowledgeBaseDetail";
import { MemberSelectorModal } from "../components/MemberSelectorModal";
import { KnowledgeBaseConsoleLayout, type KbConsoleTab } from "../components/knowledge-base/KnowledgeBaseConsoleLayout";
import { OverviewDetailCard, OverviewInfoCard, OverviewSectionTitle } from "../components/knowledge-base/OverviewCards";

interface PublicKnowledgeBaseViewProps {
  consoleTab?: KbConsoleTab;
  onConsoleTabChange?: (tab: KbConsoleTab) => void;
}

type PublicationStatus = "published" | "offline" | "archived" | "approved";

interface PublicKbPublishedDoc {
  id: string;
  name: string;
  category: string;
  size: string;
  editor: string;
  time: string;
  publishedAt: string;
  publicationStatus: PublicationStatus;
  requiredReading: boolean;
  downloadable: boolean;
  readStats?: { read: number; total?: number };
  downloadStats: { downloads: number; totalEligible: number };
}

// Mock Data for Public Knowledge Bases (aligned with DiscoverView names!)
const initialPublicKbs = [
  {
    id: "pub_hall",
    name: "厅堂服务话术与客诉处理库",
    desc: "网点服务标准、常见客诉口径、客户沟通案例沉淀。由各分支共享，统一审定归档发布。",
    owner: "运营服务中心",
    subs: "2,706",
    files: 183,
    status: "运行中",
    statusTone: "success",
    updatedAt: "今日 11:24",
    creator: "赵云杰",
    category: "方案 / 策划",
    cover: "厅堂\n运营",
    isPinned: true, // Appears in featured list in we search
    folders: 4,
    docs: 120,
    tags: ["客诉应对", "网点标准", "话术训练"],
    pendingApprovals: [
      { id: "app1", title: "2026网点应对多轮提款情绪波动话术补充.docx", department: "华东分行运营组", applicant: "李建刚", time: "2 小时前" },
      { id: "app2", title: "大额存单提前支取争议口径优化版.docx", department: "深圳分行客诉组", applicant: "江明珠", time: "昨日" }
    ],
    documents: [
      {
        id: "d1",
        name: "网点服务标准手册 2026 版.pdf",
        category: "合规话术",
        size: "12.4 MB",
        editor: "王敏",
        time: "3天前",
        publishedAt: "2026-06-08",
        publicationStatus: "published",
        requiredReading: true,
        downloadable: true,
        readStats: { read: 2184, total: 2706 },
        downloadStats: { downloads: 412, totalEligible: 2706 },
      },
      {
        id: "d2",
        name: "高风险投诉应急话术.docx",
        category: "客诉标准",
        size: "4.1 MB",
        editor: "赵云杰",
        time: "昨日",
        publishedAt: "2026-06-10",
        publicationStatus: "published",
        requiredReading: true,
        downloadable: false,
        readStats: { read: 1896, total: 2706 },
        downloadStats: { downloads: 0, totalEligible: 0 },
      },
      {
        id: "d3",
        name: "厅堂排队冲突解决指引方案.pptx",
        category: "运营效率",
        size: "18.2 MB",
        editor: "林珊",
        time: "本周二",
        publishedAt: "2026-06-09",
        publicationStatus: "published",
        requiredReading: false,
        downloadable: true,
        readStats: { read: 1246 },
        downloadStats: { downloads: 186, totalEligible: 2706 },
      },
      {
        id: "d_off1",
        name: "2025 版网点服务标准手册.pdf",
        category: "合规话术",
        size: "10.8 MB",
        editor: "王敏",
        time: "2025-12-20",
        publishedAt: "2025-12-20",
        publicationStatus: "offline",
        requiredReading: false,
        downloadable: false,
        readStats: { read: 2105 },
        downloadStats: { downloads: 892, totalEligible: 0 },
      },
    ]
  },
  {
    id: "pub_complex",
    name: "对公复杂授信案例复盘库",
    desc: "精选近三年重大项目审批逻辑、风控排查要点及投后风险预警复盘报告。供中高级客户经理研习。",
    owner: "授信审批部",
    subs: "892",
    files: 45,
    status: "运行中",
    statusTone: "success",
    updatedAt: "今日 14:05",
    creator: "陈波",
    category: "项目 / 复盘",
    cover: "项目\n复盘",
    isPinned: false,
    folders: 2,
    docs: 45,
    tags: ["授信复盘", "风控案例", "项目闭环"],
    pendingApprovals: [],
    documents: [
      {
        id: "d_r1",
        name: "某新能源头部企业50亿银团贷款复盘报告.pdf",
        category: "项目闭环",
        size: "22.5 MB",
        editor: "陈波",
        time: "1周前",
        publishedAt: "2026-06-04",
        publicationStatus: "published",
        requiredReading: true,
        downloadable: true,
        readStats: { read: 628, total: 892 },
        downloadStats: { downloads: 156, totalEligible: 892 },
      },
    ]
  },
  {
    id: "pub_spring",
    name: "2026 开门红活动运营资料",
    desc: "活动方案、客户分层、触达素材、复盘模板。全辖网点共享调用，覆盖全周期业务流程。",
    owner: "零售运营部",
    subs: "1.5 万",
    files: 740,
    status: "运行中",
    statusTone: "success",
    updatedAt: "今日 09:30",
    creator: "林珊",
    category: "方案 / 策划",
    cover: "活动\n增长",
    isPinned: true,
    folders: 8,
    docs: 412,
    tags: ["活动玩法", "客户触达", "文案素材"],
    pendingApprovals: [
      { id: "app3", title: "开门红定存大转盘分支行配置模板.xlsx", department: "苏南区域管理部", applicant: "郑涛", time: "昨天" }
    ],
    documents: [
      {
        id: "d4",
        name: "2026年开门红活动总体方案.pdf",
        category: "活动玩法",
        size: "8.5 MB",
        editor: "林珊",
        time: "今日 09:12",
        publishedAt: "2026-06-11",
        publicationStatus: "published",
        requiredReading: true,
        downloadable: true,
        readStats: { read: 9820, total: 15000 },
        downloadStats: { downloads: 2340, totalEligible: 15000 },
      },
      {
        id: "d5",
        name: "客户精细分层触达短信大全.docx",
        category: "客户触达",
        size: "1.2 MB",
        editor: "张敏",
        time: "3天前",
        publishedAt: "2026-06-08",
        publicationStatus: "published",
        requiredReading: false,
        downloadable: true,
        readStats: { read: 4320 },
        downloadStats: { downloads: 680, totalEligible: 15000 },
      },
      {
        id: "d_off2",
        name: "2025 开门红活动复盘模板.xlsx",
        category: "活动玩法",
        size: "2.1 MB",
        editor: "林珊",
        time: "2025-03-15",
        publishedAt: "2025-03-15",
        publicationStatus: "offline",
        requiredReading: false,
        downloadable: false,
        readStats: { read: 890 },
        downloadStats: { downloads: 1200, totalEligible: 0 },
      },
    ]
  },
  {
    id: "pub_rules",
    name: "运营制度规范公开索引",
    desc: "制度修订、审批口径、操作规程和合规提醒。全员公开查询、权威指引发布后台。",
    owner: "运营管理部",
    subs: "7,001",
    files: 217,
    status: "运行中",
    statusTone: "success",
    updatedAt: "昨日 17:35",
    creator: "周维",
    category: "制度 / 规范",
    cover: "制度\n规范",
    isPinned: true,
    folders: 3,
    docs: 198,
    tags: ["修订通知", "合规细则", "查询索引"],
    pendingApprovals: [],
    documents: [
      {
        id: "d6",
        name: "重要空白凭证保管操作规程.pdf",
        category: "合规细则",
        size: "6.8 MB",
        editor: "周维",
        time: "5天前",
        publishedAt: "2026-06-06",
        publicationStatus: "published",
        requiredReading: true,
        downloadable: false,
        readStats: { read: 5890, total: 7001 },
        downloadStats: { downloads: 0, totalEligible: 0 },
      },
    ]
  },
  {
    id: "pub_train",
    name: "新员工运营培训课件合集",
    desc: "基础业务、系统操作、风险提示、考试题库。新人极速上手、导师带教全景路径推荐。",
    owner: "培训学院",
    subs: "1,520",
    files: 2120,
    status: "已归档",
    statusTone: "archived",
    updatedAt: "2026-05-28 归档",
    creator: "张艳",
    category: "素材 / 课件",
    cover: "培训\n课件",
    isPinned: false,
    folders: 12,
    docs: 960,
    tags: ["入职必修", "仿真测试", "通关标准"],
    pendingApprovals: [
      { id: "app4", title: "运营系统V3.2最新改造重点考试试题.docx", department: "业务科技部", applicant: "刘星", time: "3天前" }
    ],
    documents: [
      {
        id: "d7",
        name: "新入司柜员岗位学习全景路径图.pdf",
        category: "入职必修",
        size: "3.7 MB",
        editor: "张艳",
        time: "5/28",
        publishedAt: "2026-05-28",
        publicationStatus: "published",
        requiredReading: true,
        downloadable: true,
        readStats: { read: 1280, total: 1520 },
        downloadStats: { downloads: 890, totalEligible: 1520 },
      },
    ]
  }
];

const PUBLIC_KBS_STORAGE_KEY = "public_kbs_data_v3";
const LEGACY_PUBLIC_KBS_STORAGE_KEY = "public_kbs_data_v2";

const MOCK_PUBLISHED_DOC_SEED = new Map(
  initialPublicKbs.flatMap((kb) => kb.documents.map((doc) => [doc.id, doc] as const))
);

function parseSubsCount(subs: string): number {
  const normalized = subs.replace(/,/g, "").trim();
  if (normalized.includes("万")) {
    return Math.round(parseFloat(normalized) * 10000);
  }
  return parseInt(normalized, 10) || 1000;
}

function getFileViewDocuments(documents: PublicKbPublishedDoc[]) {
  return documents.filter(
    (d) =>
      d.publicationStatus === "published" ||
      d.publicationStatus === "approved" ||
      d.publicationStatus === "offline"
  );
}

function getPublicationViewDocuments(documents: PublicKbPublishedDoc[]) {
  return documents.filter((d) => d.publicationStatus === "published" || d.publicationStatus === "offline");
}

function normalizePublishedDoc(doc: Partial<PublicKbPublishedDoc> & { id: string; name: string }, subs: string): PublicKbPublishedDoc {
  const seed = MOCK_PUBLISHED_DOC_SEED.get(doc.id);
  const total = parseSubsCount(subs);
  const requiredReading = doc.requiredReading ?? seed?.requiredReading ?? false;
  const publicationStatus = (doc.publicationStatus ?? seed?.publicationStatus ?? "published") as PublicationStatus;

  let readStats = doc.readStats ?? seed?.readStats;
  if (requiredReading) {
    readStats = {
      read: readStats?.read ?? Math.round(total * 0.72),
      total: readStats?.total ?? total,
    };
  } else if (readStats?.read === undefined) {
    readStats = { read: Math.round(total * 0.15) };
  }

  return {
    id: doc.id,
    name: doc.name,
    category: doc.category ?? "未分类",
    size: doc.size ?? "1.0 MB",
    editor: doc.editor ?? "系统",
    time: doc.time ?? "未知",
    publishedAt: doc.publishedAt ?? "2026-06-01",
    publicationStatus,
    requiredReading,
    downloadable: doc.downloadable ?? true,
    readStats,
    downloadStats: doc.downloadStats ?? { downloads: 0, totalEligible: total },
  };
}

function normalizeKbLifecycleStatus(kb: { status: string; statusTone: string }) {
  if (kb.status === "已归档") {
    return { status: "已归档" as const, statusTone: "archived" as const };
  }
  return { status: "运行中" as const, statusTone: "success" as const };
}

function normalizePublicKbs(data: typeof initialPublicKbs) {
  return data.map((kb) => ({
    ...kb,
    ...normalizeKbLifecycleStatus(kb),
    documents: (kb.documents ?? []).map((doc) =>
      normalizePublishedDoc(doc as Partial<PublicKbPublishedDoc> & { id: string; name: string }, kb.subs)
    ),
  }));
}

function parseDocSize(sizeStr: string): number {
  const match = sizeStr.match(/^([\d.]+)\s*(MB|KB|GB)?/i);
  if (!match) return 1024 * 1024;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "MB").toUpperCase();
  if (unit === "GB") return num * 1024 * 1024 * 1024;
  if (unit === "KB") return num * 1024;
  return num * 1024 * 1024;
}

function nodeIdToDocId(nodeId: string): string {
  return nodeId.startsWith("file_") ? nodeId.slice(5) : nodeId;
}

function publishStatusToPublicationStatus(
  status?: FileNode["publishStatus"],
  prev?: PublicKbPublishedDoc,
  isOfflineDraft?: boolean
): PublicationStatus {
  if (isOfflineDraft || (status === "approved" && prev?.publicationStatus === "offline")) {
    return "offline";
  }
  switch (status) {
    case "published":
      return "published";
    case "offline":
      return "offline";
    case "archived":
      return "archived";
    case "approved":
    case "pending_audit":
    default:
      return "approved";
  }
}

function mergePublicKbNodesIntoDocuments(
  existingDocs: PublicKbPublishedDoc[],
  nodes: FileNode[],
  subs: string
): PublicKbPublishedDoc[] {
  const fileNodes = nodes.filter((n) => n.type !== "folder");
  const activeDocIds = new Set(fileNodes.map((n) => nodeIdToDocId(n.id)));

  const fromNodes: PublicKbPublishedDoc[] = fileNodes.map((node) => {
    const docId = nodeIdToDocId(node.id);
    const prev = existingDocs.find((d) => d.id === docId);
    const publicationStatus = publishStatusToPublicationStatus(
      node.publishStatus,
      prev,
      node.isOfflineDraft
    );
    const today = new Date().toISOString().slice(0, 10);

    return normalizePublishedDoc(
      {
        id: docId,
        name: node.name,
        category: prev?.category ?? "未分类",
        size: node.size ? `${(node.size / 1024 / 1024).toFixed(1)} MB` : prev?.size ?? "0 MB",
        editor: node.creator ?? prev?.editor ?? "管理员",
        time: prev?.time ?? "刚刚",
        publishedAt:
          publicationStatus === "published"
            ? prev?.publishedAt && prev.publishedAt !== "-"
              ? prev.publishedAt
              : today
            : prev?.publishedAt ?? "-",
        publicationStatus,
        requiredReading: node.isRequiredRead ?? prev?.requiredReading ?? false,
        downloadable: node.downloadable ?? prev?.downloadable ?? true,
        readStats: prev?.readStats,
        downloadStats: prev?.downloadStats,
      },
      subs
    );
  });

  const preserved = existingDocs.filter(
    (d) =>
      !activeDocIds.has(d.id) &&
      (d.publicationStatus === "offline" || d.publicationStatus === "archived")
  );

  return [...fromNodes, ...preserved];
}

function buildPublicKbNodes(documents: PublicKbPublishedDoc[]): FileNode[] {
  const activeDocs = getFileViewDocuments(documents);
  const now = new Date().toISOString();
  return [
    {
      id: "root",
      parentId: null,
      name: "全部文件",
      type: "folder",
      updatedAt: now,
      governanceStatus: "success",
      preprocessStatus: "success",
      creator: "系统",
    },
    {
      id: "f1",
      parentId: "root",
      name: "公开标准件",
      type: "folder",
      updatedAt: now,
      governanceStatus: "success",
      preprocessStatus: "success",
      creator: "admin",
    },
    ...activeDocs.map((doc) => {
      const ext = doc.name.split(".").pop()?.toLowerCase() || "pdf";
      let type: FileNode["type"] = "document";
      if (["ppt", "pptx"].includes(ext)) type = "presentation";
      else if (["xlsx", "xls"].includes(ext)) type = "spreadsheet";

      const publishStatus: FileNode["publishStatus"] =
        doc.publicationStatus === "published"
          ? "published"
          : doc.publicationStatus === "archived"
            ? "archived"
            : doc.publicationStatus === "offline"
              ? "approved"
              : "approved";

      return {
        id: `file_${doc.id}`,
        parentId: "f1",
        name: doc.name,
        type,
        format: ext,
        size: parseDocSize(doc.size),
        updatedAt: now,
        governanceStatus: "success" as const,
        preprocessStatus: "success" as const,
        creator: doc.editor,
        publishStatus,
        isRequiredRead: doc.requiredReading,
        downloadable: doc.downloadable,
        isOfflineDraft: doc.publicationStatus === "offline",
      };
    }),
  ];
}

export function PublicKnowledgeBaseView({ consoleTab = "public", onConsoleTabChange }: PublicKnowledgeBaseViewProps = {}) {
  const [publicKbs, setPublicKbs] = useState(() => {
    if (typeof window === "undefined") return normalizePublicKbs(initialPublicKbs);
    const saved = localStorage.getItem(PUBLIC_KBS_STORAGE_KEY);
    if (saved) return normalizePublicKbs(JSON.parse(saved));
    const legacy = localStorage.getItem(LEGACY_PUBLIC_KBS_STORAGE_KEY);
    if (legacy) return normalizePublicKbs(JSON.parse(legacy));
    return normalizePublicKbs(initialPublicKbs);
  });

  const savePublicKbs = (nextValue: typeof initialPublicKbs) => {
    const normalized = normalizePublicKbs(nextValue);
    setPublicKbs(normalized);
    localStorage.setItem(PUBLIC_KBS_STORAGE_KEY, JSON.stringify(normalized));
  };

  useEffect(() => {
    if (!localStorage.getItem(PUBLIC_KBS_STORAGE_KEY)) {
      const legacy = localStorage.getItem(LEGACY_PUBLIC_KBS_STORAGE_KEY);
      const raw = legacy ? JSON.parse(legacy) : initialPublicKbs;
      localStorage.setItem(PUBLIC_KBS_STORAGE_KEY, JSON.stringify(normalizePublicKbs(raw)));
    }
  }, []);

  const [selectedKbId, setSelectedKbId] = useState("pub_hall");
  const [detailVisibility, setDetailVisibility] = useState("enterprise");
  const [selectorPurpose, setSelectorPurpose] = useState<'visibility' | 'admin' | 'collaborator' | null>(null);
  const [configuredOrgs, setConfiguredOrgs] = useState<string[]>(['华东分行', '总行数智部']);
  const [configuredRoles, setConfiguredRoles] = useState<string[]>(['普通员工', '部门主管']);
  const [configuredPositions, setConfiguredPositions] = useState<string[]>(['对公客户经理']);
  const [viewMode, setViewMode] = useState<"list" | "workbench" | "create">("list");
  const [workbenchMode, setWorkbenchMode] = useState<"detail" | "manage">("detail");
  const [detailFileId, setDetailFileId] = useState<string | undefined>(undefined);
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [authorizedMembers, setAuthorizedMembers] = useState([
    { id: 'm1', name: '张益达', dept: '法务部', role: '可管理', desc: '拥有所有权限', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Legal', type: 'user' },
    { id: 'm2', name: '王漫妮', dept: '市场部', role: '可评论', desc: '查看, 复制, 打印, 下载, 评论', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marketing', type: 'user' },
    { id: 'm3', name: '运营团队', dept: '全员', role: '可评论', desc: '查看, 复制, 打印, 下载, 评论', type: 'group' }
  ]);
  const [administrators, setAdministrators] = useState([
    { id: 'user_1', name: '张益达', dept: '法务部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Legal', type: 'user' }
  ]);
  const [newKbData, setNewKbData] = useState({ 
    name: "", 
    desc: "", 
    type: "方案 / 策划", 
    watermark: true, 
    encrypt: true,
    visibility: "enterprise" as "enterprise" | "department" | "role" | "position",
    targetOrgs: [] as string[],
    targetRoles: [] as string[],
    targetPositions: [] as string[]
  });
  const [workbenchTab, setWorkbenchTab] = useState<"approvals" | "publications" | "security" | "history">("approvals");
  const [publicationStatusFilter, setPublicationStatusFilter] = useState<"all" | "published" | "offline">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [toast, setToast] = useState<string | null>(null);
  const [showArchiveKbConfirm, setShowArchiveKbConfirm] = useState(false);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const selectedKb = publicKbs.find(kb => kb.id === selectedKbId) || publicKbs[0];
  const selectedKbArchived = selectedKb.status === "已归档";

  useEffect(() => {
    if (viewMode === "workbench" && selectedKbArchived) {
      setViewMode("list");
      showToast("该知识库已归档，不可进入或执行操作");
    }
  }, [viewMode, selectedKbId, selectedKbArchived]);

  const publicKbNodes = useMemo(
    () => buildPublicKbNodes(selectedKb.documents),
    [selectedKb.documents]
  );

  const handlePublicKbNodesChange = useCallback(
    (nodes: FileNode[]) => {
      setPublicKbs((prev) => {
        const kb = prev.find((k) => k.id === selectedKbId);
        if (!kb) return prev;
        const nextDocs = mergePublicKbNodesIntoDocuments(kb.documents, nodes, kb.subs);
        if (JSON.stringify(nextDocs) === JSON.stringify(kb.documents)) {
          return prev;
        }
        const next = prev.map((k) =>
          k.id === selectedKbId ? { ...k, documents: nextDocs } : k
        );
        const normalized = normalizePublicKbs(next);
        localStorage.setItem(PUBLIC_KBS_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      });
    },
    [selectedKbId]
  );

  const publicationDocs = useMemo(() => {
    let docs = getPublicationViewDocuments(selectedKb.documents);
    if (publicationStatusFilter === "published") {
      docs = docs.filter((d) => d.publicationStatus === "published");
    } else if (publicationStatusFilter === "offline") {
      docs = docs.filter((d) => d.publicationStatus === "offline");
    }
    return [...docs].sort((a, b) => {
      if (a.requiredReading !== b.requiredReading) {
        return a.requiredReading ? -1 : 1;
      }
      return b.publishedAt.localeCompare(a.publishedAt);
    });
  }, [selectedKb.documents, publicationStatusFilter]);

  const activePublishedCount = useMemo(
    () => getFileViewDocuments(selectedKb.documents).length,
    [selectedKb.documents]
  );

  useEffect(() => {
    setDetailFileId(undefined);
    setPublicationStatusFilter("all");
  }, [selectedKbId]);

  const handleResendReadingReminder = (doc: PublicKbPublishedDoc) => {
    if (!doc.requiredReading || !doc.readStats?.total) return;
    const unread = doc.readStats.total - doc.readStats.read;
    showToast(`已向 ${unread} 位未读成员再次下发「${doc.name}」阅读提示`);
  };

  const getStatusColor = (tone: string) => {
    switch (tone) {
      case 'success': return 'bg-[#ecfdf5] text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-[#fffbeb] text-amber-700 border-amber-200';
      case 'info': return 'bg-[#eff6ff] text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-205';
    }
  };

  // Filtering kbs
  const filteredKbs = publicKbs.filter(kb => {
    const matchesSearch = kb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          kb.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          kb.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "全部" ? true : kb.category === categoryFilter;
    return matchesSearch && matchesCat;
  });


  // Accept a file publication request
  const handleApprovePublication = (kbId: string, appId: string) => {
    savePublicKbs(publicKbs.map(kb => {
      if (kb.id === kbId) {
        const approvedItem = kb.pendingApprovals.find(app => app.id === appId);
        if (approvedItem) {
          // Push to documents and increase file count
          const newDoc: PublicKbPublishedDoc = {
            id: `approved_${Date.now()}`,
            name: approvedItem.title,
            category: "分行呈审",
            size: "3.2 MB",
            editor: approvedItem.applicant,
            time: "刚刚审核通过",
            publishedAt: "-",
            publicationStatus: "approved",
            requiredReading: false,
            downloadable: true,
            readStats: { read: 0 },
            downloadStats: { downloads: 0, totalEligible: parseSubsCount(kb.subs) },
          };
          return {
            ...kb,
            // We don't increment total files yet if it's strictly "published" count,
            // but for mock simplicity let's keep it or just update the list.
            pendingApprovals: kb.pendingApprovals.filter(a => a.id !== appId),
            documents: [newDoc, ...kb.documents]
          };
        }
      }
      return kb;
    }));
    showToast('审核通过，文件已进入待发布状态，请前往文件视图手动发布');
  };

  // Reject publication request
  const handleRejectPublication = (kbId: string, appId: string) => {
    savePublicKbs(publicKbs.map(kb => {
      if (kb.id === kbId) {
        return {
          ...kb,
          pendingApprovals: kb.pendingApprovals.filter(a => a.id !== appId)
        };
      }
      return kb;
    }));
    showToast('呈报已被退回。退回原因：文件涉敏或格式不规范。已通知申请人。');
  };

  const handleArchivePublicKb = () => {
    const archiveLabel = `${new Date().toISOString().slice(0, 10)} 归档`;
    savePublicKbs(
      publicKbs.map((kb) =>
        kb.id === selectedKbId
          ? {
              ...kb,
              status: "已归档",
              statusTone: "archived",
              updatedAt: archiveLabel,
              pendingApprovals: [],
            }
          : kb
      )
    );
    setShowArchiveKbConfirm(false);
    showToast(`「${selectedKb.name}」已归档，不可再执行任何操作`);
    setViewMode("list");
    setWorkbenchMode("detail");
    setWorkbenchTab("security");
  };

  // Security Policy variables
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [logDownloadRequired, setLogDownloadRequired] = useState(true);
  const [roleVerifyRequired, setRoleVerifyRequired] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full font-sans">
      {viewMode === "create" ? (
        <div className="p-6 md:p-12 w-full flex flex-col items-center overflow-auto min-h-0">
          <div className="w-full max-w-[800px] glass-panel rounded-2xl flex flex-col my-8 shrink-0">
            <div className="px-10 pt-10 pb-4 text-left">
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => {
                    if (createStep > 1) setCreateStep(createStep - 1);
                    else { setViewMode('list'); setCreateStep(1); }
                  }}
                  className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 transition bg-white shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-xl font-medium text-slate-900 tracking-normal">新建公共知识库</h1>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      {createStep === 1 ? '步骤 01' : createStep === 2 ? '步骤 02' : createStep === 3 ? '步骤 03' : createStep === 4 ? '步骤 04' : '完成'}
                    </span>
                    <p className="text-sm font-medium text-slate-500">
                      {createStep === 1 ? '基础信息配置' : createStep === 2 ? '适用范围配置' : createStep === 3 ? '管理员与审核权限' : createStep === 4 ? '下载与安全策略' : '知识库初始化成功'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-10 pb-10">
              <div className="w-full text-left">
                <AnimatePresence mode="wait">
                  {createStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2.5">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">知识库名称</label>
                        <input type="text" placeholder="例：2026 年度运营资料库" value={newKbData.name} onChange={(e) => setNewKbData({...newKbData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none transition-all" />
                        <p className="text-sm text-slate-400 font-medium">简洁明了的名称有助于其他部门在“发现”频道进行订阅</p>
                      </div>
                      <div className="space-y-2.5">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">简介描述</label>
                        <textarea rows={3} placeholder="简要描述知识库用途、覆盖范围及更新频率..." value={newKbData.desc} onChange={(e) => setNewKbData({...newKbData, desc: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none resize-none transition-all" />
                      </div>
                      <div className="space-y-2.5">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">资料类型归类</label>
                        <div className="relative group">
                          <select value={newKbData.type} onChange={(e) => setNewKbData({...newKbData, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer pr-10">
                            <option>方案 / 策划</option>
                            <option>制度 / 规范</option>
                            <option>素材 / 课件</option>
                            <option>项目 / 复盘</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {createStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">知识库发布及可见范围</label>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'enterprise', title: '全组织可见', desc: '全行全辖公开，全员可订阅检索', icon: Globe },
                            { id: 'department', title: '指定部门可见', desc: '选定的分行、中心或部门可见', icon: Users },
                            { id: 'role', title: '指定角色可见', desc: '如：仅限“客户经理”或“审核员”可见', icon: ShieldCheck },
                            { id: 'position', title: '指定岗位可见', desc: '如：仅限“行长”、“主管”等岗位可见', icon: UserPlus }
                          ].map((item) => (
                            <button 
                              key={item.id}
                              onClick={() => setNewKbData({...newKbData, visibility: item.id as any})}
                              className={cn(
                                "relative p-5 rounded-2xl border-2 text-left transition-all group",
                                newKbData.visibility === item.id 
                                ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-100" 
                                : "border-slate-100 bg-slate-50 hover:border-slate-200"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                                newKbData.visibility === item.id ? "bg-blue-600 text-white" : "bg-white text-slate-400"
                              )}>
                                <item.icon className="w-5 h-5" />
                              </div>
                              <div className="text-sm font-medium text-slate-900 mb-1">{item.title}</div>
                              <div className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</div>
                              {newKbData.visibility === item.id && (
                                <div className="absolute top-4 right-4 text-blue-600">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {newKbData.visibility !== 'enterprise' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4 pt-4 border-t border-slate-100"
                        >
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">
                              {newKbData.visibility === 'department' ? '选择可见组织架构' : newKbData.visibility === 'role' ? '配置可见角色' : '设定可见岗位'}
                            </label>
                            <button 
                              onClick={() => {
                                setSelectorPurpose('visibility');
                                setShowMemberSelector(true);
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {newKbData.visibility === 'department' ? '添加部门' : '添加范围'}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {(newKbData.visibility === 'department' ? newKbData.targetOrgs : 
                               newKbData.visibility === 'role' ? newKbData.targetRoles : 
                               newKbData.targetPositions).length > 0 ? (
                                (newKbData.visibility === 'department' ? newKbData.targetOrgs : 
                                 newKbData.visibility === 'role' ? newKbData.targetRoles : 
                                 newKbData.targetPositions).map((item, i) => (
                                <div key={i} className="pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-1 group hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
                                  {item}
                                  <button className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"><X className="w-3 h-3" /></button>
                                </div>
                              ))
                            ) : (
                              <div className="w-full py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                                {newKbData.visibility === 'department' ? <Users className="w-6 h-6 mb-2 opacity-20" /> : 
                                 newKbData.visibility === 'role' ? <ShieldCheck className="w-6 h-6 mb-2 opacity-20" /> : 
                                 <UserPlus className="w-6 h-6 mb-2 opacity-20" />}
                                <span className="text-sm font-medium">暂无已配置范围，请点击上方按钮添加</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800/80 font-medium leading-relaxed">
                          <span className="text-amber-900 block mb-0.5">关于公共库访问权限：</span>
                          发布范围内的人员仅拥有“查看”及根据安全策略设定的“下载”权限。管理员、审核员等经营管理权限需在下一步手动指定。
                        </div>
                      </div>
                    </motion.div>
                  )}
 
                  {createStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">设定知识库管理员</label>
                        <div className="flex gap-1">
                           <div className="relative flex-1 text-left">
                             <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input type="text" placeholder="搜索并指定管理员..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-all font-sans" />
                           </div>
                           <button 
                            onClick={() => {
                              setSelectorPurpose('admin');
                              setShowMemberSelector(true);
                            }}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition shadow-sm flex items-center gap-1"
                           >
                             <UserPlus className="w-4 h-4" /> 选择成员
                           </button>
                        </div>

                        {administrators.length > 0 ? (
                          <div className="grid grid-cols-1 gap-1">
                            {administrators.map((admin) => (
                              <div key={admin.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                                <div className="flex items-center gap-3">
                                  <img src={(admin as any).avatar} className="w-8 h-8 rounded-lg bg-orange-100" />
                                  <div className="text-left">
                                    <div className="text-sm font-medium text-slate-900">{admin.name}</div>
                                    <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{admin.dept}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">库管理员</span>
                                  <button 
                                    onClick={() => setAdministrators(prev => prev.filter(a => a.id !== admin.id))}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                             <UserPlus className="w-6 h-6 mb-2 opacity-20" />
                             <span className="text-sm font-medium">请指定至少一名知识库管理员</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">流程与审核机制</label>
                        <div className="flex items-center justify-between p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                               <span className="text-sm font-medium text-amber-900 block mb-0.5">启用发布预审查机制</span>
                               <span className="text-sm text-amber-700/60 font-medium leading-relaxed block">
                                 开启后，所有拟入库的文件必须经由上方指定的管理员在线审核通过后方可正式发布至公共视阅读。
                               </span>
                            </div>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer group">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 shadow-inner"></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {createStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">全局下载控制</label>
                          <div className="relative group">
                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none transition-all appearance-none cursor-pointer pr-10">
                              <option>禁止所有人下载</option>
                              <option>仅可管理及编辑者下载</option>
                              <option>所有人可下载 (受控模式)</option>
                              <option>全开放自由下载</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">安全增强选项</label>
                        <div className="grid grid-cols-1 gap-3">
                           {[
                             { title: '强制动态水印', desc: '查看及下载时自动打上访问人姓名、IP及时间戳水印', icon: Shield, enabled: watermarkEnabled, toggle: setWatermarkEnabled },
                             { title: '入库件敏感词校验', desc: '利用 AI 引擎对拟发布的文档进行合规性、保密性自动扫描', icon: ShieldAlert, enabled: true },
                             { title: '文件流加密存储', desc: '后端存储采用 AES-256 位加密，防止物理介质泄密', icon: Lock, enabled: true },
                             { title: '下载行为离线归档', desc: '在操作日志中详细记录具体到每一页的浏览与下载量', icon: BarChart3, enabled: logDownloadRequired, toggle: setLogDownloadRequired }
                           ].map((policy, i) => (
                             <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-blue-200 transition-all group">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                   <policy.icon className="w-4 h-4" />
                                 </div>
                                 <div className="text-left">
                                   <div className="text-sm font-medium text-slate-900">{policy.title}</div>
                                   <div className="text-sm text-slate-400 font-medium">{policy.desc}</div>
                                 </div>
                               </div>
                               <div 
                                onClick={() => policy.toggle?.(!policy.enabled)}
                                className={cn(
                                 "w-10 h-5 px-1 rounded-full flex items-center transition-all cursor-pointer shadow-inner",
                                 policy.enabled ? "bg-blue-600" : "bg-slate-300"
                                )}>
                                  <div className={cn("w-3 h-3 bg-white rounded-full transition-all shadow-sm", policy.enabled ? "translate-x-5" : "translate-x-0")} />
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {createStep === 5 && (
                    <motion.div 
                      key="step5"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 text-center"
                    >
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-medium text-slate-900 tracking-normal">知识库：创建成功！</h2>
                      <p className="text-sm font-medium text-slate-500 mt-2 max-w-[340px] mx-auto leading-relaxed">
                        公共知识库 <span className="text-blue-600">"{newKbData.name}"</span> 已经完成基础设施配置，现在可以开始管理呈报件及制定安全策略。
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="px-10 py-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-1">
                <div className={cn("h-1.5 rounded-full transition-all duration-300", createStep === 1 ? "w-10 bg-blue-600" : "w-3 bg-slate-200")} />
                <div className={cn("h-1.5 rounded-full transition-all duration-300", createStep === 2 ? "w-10 bg-blue-600" : "w-3 bg-slate-200")} />
                <div className={cn("h-1.5 rounded-full transition-all duration-300", createStep === 3 ? "w-10 bg-blue-600" : "w-3 bg-slate-200")} />
                <div className={cn("h-1.5 rounded-full transition-all duration-300", createStep === 4 ? "w-10 bg-blue-600" : "w-3 bg-slate-200")} />
                <div className={cn("h-1.5 rounded-full transition-all duration-300", createStep === 5 ? "w-10 bg-blue-600" : "w-3 bg-slate-200")} />
              </div>
              <div className="flex items-center gap-3">
                {createStep !== 5 && (
                  <button onClick={() => { setViewMode('list'); setCreateStep(1); }} className="px-5 py-2 text-slate-500 font-medium text-sm hover:text-slate-800 transition">取消</button>
                )}
                <button 
                  onClick={() => {
                    if (createStep < 5) setCreateStep(createStep + 1);
                    else { setViewMode('list'); setCreateStep(1); }
                  }}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  {createStep === 5 ? '进入工作台' : '继续下一步'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <KnowledgeBaseConsoleLayout
          activeTab={consoleTab}
          onTabChange={(tab) => onConsoleTabChange?.(tab)}
          onCreate={() => setViewMode("create")}
          createLabel="新建"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="搜索公共库..."
          galleryToolbar={
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto max-w-[320px]">
              {["全部", "方案 / 策划", "制度 / 规范", "素材 / 课件", "项目 / 复盘"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition",
                    categoryFilter === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          }
          galleryItems={filteredKbs.map((kb) => ({
            id: kb.id,
            name: kb.name,
            desc: kb.desc,
            status: kb.status,
            statusTone: kb.statusTone,
            isArchived: kb.status === "已归档",
          }))}
          selectedId={selectedKbId}
          onSelect={setSelectedKbId}
          onEnterKb={(id) => {
            const kb = publicKbs.find((k) => k.id === id);
            if (kb?.status === "已归档") {
              showToast("该知识库已归档，不可进入或执行操作");
              return;
            }
            setSelectedKbId(id);
            setDetailFileId(undefined);
            setViewMode("workbench");
            setWorkbenchMode("detail");
          }}
          selectedTitle={selectedKb.name}
          selectedDesc={selectedKb.desc}
          selectedStatus={selectedKb.status}
          selectedStatusTone={selectedKb.statusTone}
          metrics={{
            docCount: selectedKb.files,
            authorizedCount: selectedKb.subs,
            authorizedLabel: "订阅人员",
            recentUpdates: activePublishedCount,
            anomalyTasks: selectedKb.pendingApprovals?.length ?? 0,
          }}
          detailContent={
            <div className="space-y-4">
              <OverviewSectionTitle>库内详情</OverviewSectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <OverviewInfoCard label="发布主体" themeIndex={0}>
                  @{selectedKb.owner}
                </OverviewInfoCard>
                <OverviewInfoCard label="资料分类" themeIndex={1}>
                  {selectedKb.category}
                </OverviewInfoCard>
                <OverviewInfoCard label="主发布人" themeIndex={2}>
                  {selectedKb.creator}
                </OverviewInfoCard>
                <OverviewInfoCard label="最近更新" themeIndex={3}>
                  {selectedKb.updatedAt}
                </OverviewInfoCard>
              </div>

              {selectedKb.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedKb.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {selectedKb.pendingApprovals?.length > 0 && !selectedKbArchived && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-amber-600">待审核呈报 ({selectedKb.pendingApprovals.length})</div>
                  {selectedKb.pendingApprovals.slice(0, 3).map((app, idx) => (
                    <OverviewDetailCard
                      key={app.id}
                      title={app.title}
                      description={`${app.department} · ${app.applicant} · ${app.time}`}
                      themeIndex={idx}
                    />
                  ))}
                </div>
              )}

              {getPublicationViewDocuments(selectedKb.documents).length > 0 && (
                <div className="space-y-2">
                  <OverviewSectionTitle className="text-xs font-medium text-slate-500">
                    文件发布情况
                  </OverviewSectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <OverviewInfoCard label="已发布" themeIndex={0}>
                      {selectedKb.documents.filter((d) => d.publicationStatus === "published").length} 份
                    </OverviewInfoCard>
                    <OverviewInfoCard label="已下线" themeIndex={1}>
                      {selectedKb.documents.filter((d) => d.publicationStatus === "offline").length} 份
                    </OverviewInfoCard>
                  </div>
                  {selectedKb.documents
                    .filter((d) => d.publicationStatus === "published" && d.requiredReading && d.readStats?.total)
                    .slice(0, 2)
                    .map((doc, idx) => {
                      const percent = Math.round((doc.readStats!.read / doc.readStats!.total!) * 100);
                      return (
                        <OverviewDetailCard
                          key={doc.id}
                          title={doc.name}
                          description={`必读 · 已读 ${percent}%（${doc.readStats!.read}/${doc.readStats!.total}）`}
                          themeIndex={idx + 2}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          }
          panelFooter={
            selectedKbArchived ? (
              <button
                type="button"
                disabled
                className="w-full py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium text-sm cursor-not-allowed select-none"
              >
                已归档，不可操作
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setViewMode("workbench");
                  setWorkbenchMode("manage");
                }}
                className="w-full py-2.5 bg-blue-600 border border-blue-600 rounded-xl text-white font-medium text-sm hover:bg-blue-700 transition shadow-md shadow-blue-100"
              >
                进入工作台
              </button>
            )
          }
          emptyGalleryMessage="没有找到匹配的公共知识库"
        />
      ) : (
        /* WORKBENCH & REVIEW CENTER MODE */
        <div className="p-6 md:p-8 w-full max-w-[1440px] mx-auto h-full flex flex-col">
          <div className="glass-panel rounded-2xl flex flex-col overflow-hidden h-full relative text-left">
            {selectedKbArchived && (
              <div className="shrink-0 px-5 py-3 bg-amber-50/80 border-b border-amber-200/50 flex items-center gap-2 text-sm text-amber-900 backdrop-blur-sm">
                <FileArchive className="w-4 h-4 shrink-0 text-amber-600" />
                <span>该知识库已归档，当前为<strong className="font-medium mx-1">只读查阅</strong>模式，不可上传、发布、审核或变更配置。</span>
              </div>
            )}
            
            {/* Workbench Header */}
            <div className="px-6 py-5 border-b border-white/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 glass-header">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setViewMode('list')} 
                   className="w-9 h-9 flex items-center justify-center glass-card rounded-xl hover:bg-white/50 transition"
                 >
                   <ArrowLeft className="w-4 h-4 text-slate-600" />
                 </button>
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-medium text-sm shadow-md">
                   公
                 </div>
                 <div>
                   <h3 className="text-base font-medium text-slate-900 flex items-center gap-1">
                     {selectedKb.name}
                     <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-medium rounded-full select-none">公共知识库</span>
                   </h3>
                   <p className="text-sm text-slate-500 mt-1 line-clamp-1">{selectedKb.desc}</p>
                 </div>
               </div>
               
                {/* Tab toggling tools */}
                <div className="flex items-center gap-1 glass-card p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => {
                      setDetailFileId(undefined);
                      setWorkbenchMode("detail");
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-medium transition border-0",
                      workbenchMode === "detail" 
                        ? "glass-card-active text-slate-900" 
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                    )}
                  >
                    文件视图
                  </button>
                  <button
                    onClick={() => { setWorkbenchMode("manage"); setWorkbenchTab("approvals"); }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-medium transition border-0",
                      workbenchMode === "manage" 
                        ? "glass-card-active text-slate-900" 
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                    )}
                  >
                    管理工作台 {selectedKb.pendingApprovals.length > 0 && <span className={cn("ml-1 px-1 rounded-full text-[9px]", workbenchMode === "manage" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600")}>{selectedKb.pendingApprovals.length}</span>}
                  </button>
                </div>
            </div>

            {/* Workbench Body */}
            <div className="flex-1 overflow-auto p-0 flex flex-col">
              <AnimatePresence mode="wait">
                
                {workbenchMode === "detail" ? (
                  <motion.div 
                    key={`detail-${selectedKbId}-${detailFileId ?? "list"}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-hidden"
                  >
                    <KnowledgeBaseDetail
                      kbId={selectedKbId}
                      kbName={selectedKb.name}
                      kbType="public"
                      initialRole="admin"
                      isArchiveView={selectedKbArchived}
                      onBack={() => setViewMode('list')}
                      initialNodes={publicKbNodes}
                      initialFileId={detailFileId}
                      hideHeader
                      onNodesChange={selectedKbArchived ? undefined : handlePublicKbNodesChange}
                    />
                  </motion.div>
                ) : (
                  <div className="p-6 h-full overflow-auto">
                    {/* Management Sub Tabs */}
                    <div className="flex items-center gap-6 border-b border-white/40 mb-6 pb-2">
                       {['approvals', 'publications', 'security', 'history'].map(tab => (
                         <button 
                            key={tab}
                            onClick={() => setWorkbenchTab(tab as typeof workbenchTab)}
                            className={cn(
                              "pb-2 text-sm font-medium transition-all relative",
                              workbenchTab === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                            )}
                         >
                           {tab === 'approvals' ? '审核大厅' : tab === 'publications' ? '文件发布情况' : tab === 'security' ? '配置管理' : '操作历史'}
                           {tab === 'approvals' && selectedKb.pendingApprovals.length > 0 && (
                             <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">{selectedKb.pendingApprovals.length}</span>
                           )}
                           {workbenchTab === tab && (
                             <motion.div layoutId="wbSubTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                           )}
                         </button>
                       ))}
                    </div>

                    {workbenchTab === 'approvals' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                    {selectedKb.pendingApprovals.length === 0 ? (
                      <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-16 text-center flex flex-col items-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                        <b className="text-slate-800 text-sm font-medium">恭喜，审核大厅已全部清零</b>
                        <p className="text-sm text-slate-400 font-semibold mt-1">没有未处理的入库及发布审核需求。</p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-left">
                        {selectedKb.pendingApprovals.map((app) => (
                          <div 
                            key={app.id} 
                            className="p-3 border border-white/50 hover:border-blue-200/60 hover:shadow-xs rounded-xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                          >
                            <div className="flex items-start gap-3.5">
                              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
                                <FileArchive className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 text-sm leading-snug">{app.title}</h4>
                                <div className="flex flex-wrap gap-1 text-[10.5px] font-medium text-slate-500 mt-1.5">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/50">提寄单位：{app.department}</span>
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/50">填报人：{app.applicant}</span>
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Clock className="w-3 h-3" /> {app.time}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button 
                                onClick={() => handleRejectPublication(selectedKb.id, app.id)}
                                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 hover:text-rose-600 text-slate-600 font-medium text-sm rounded-lg transition"
                              >
                                驳回/打回修改
                              </button>
                              <button 
                                onClick={() => handleApprovePublication(selectedKb.id, app.id)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center gap-1 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> 审核通过
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                  {workbenchTab === 'publications' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">
                          查看文件发布后的阅读反馈与下载情况，已归档文件不在此展示。
                        </p>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                          {(
                            [
                              { id: "all" as const, label: "全部" },
                              { id: "published" as const, label: "已发布" },
                              { id: "offline" as const, label: "已下线" },
                            ] as const
                          ).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setPublicationStatusFilter(item.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition",
                                publicationStatusFilter === item.id
                                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                                  : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {publicationDocs.length === 0 ? (
                        <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-16 text-center">
                          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-slate-500">暂无符合条件的发布记录</p>
                        </div>
                      ) : (
                        publicationDocs.map((doc) => {
                          const readTotal = doc.readStats?.total;
                          const readCount = doc.readStats?.read ?? 0;
                          const readPercent =
                            doc.requiredReading && readTotal
                              ? Math.round((readCount / readTotal) * 100)
                              : null;
                          const unreadCount =
                            doc.requiredReading && readTotal ? readTotal - readCount : 0;

                          return (
                            <div
                              key={doc.id}
                              className="p-5 border border-white/50 rounded-2xl glass-card space-y-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <h4 className="font-medium text-slate-900 text-sm leading-snug">{doc.name}</h4>
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 text-[11px] font-medium rounded-full border",
                                        doc.publicationStatus === "published"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      )}
                                    >
                                      {doc.publicationStatus === "published" ? "已发布" : "已下线"}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded">{doc.category}</span>
                                    <span>发布：{doc.publishedAt}</span>
                                    <span>发布人：{doc.editor}</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                  {doc.requiredReading ? (
                                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                      必读
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                                      非必读
                                    </span>
                                  )}
                                  {doc.downloadable ? (
                                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                      可下载
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                                      不可下载
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Eye className="w-4 h-4 text-violet-600" />
                                    <span className="text-sm font-medium text-slate-800">已读情况</span>
                                  </div>
                                  {doc.requiredReading ? (
                                    <>
                                      <div className="flex items-end justify-between gap-2 mb-2">
                                        <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                                          {readPercent}%
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          {readCount} / {readTotal} 人已读
                                        </span>
                                      </div>
                                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                                          style={{ width: `${readPercent}%` }}
                                        />
                                      </div>
                                      {doc.publicationStatus === "published" && unreadCount > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleResendReadingReminder(doc)}
                                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                                        >
                                          <Bell className="w-3.5 h-3.5" />
                                          再次下发提示（{unreadCount} 人未读）
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-2xl font-semibold text-slate-900 tabular-nums mb-1">
                                        {readCount.toLocaleString()}
                                      </div>
                                      <p className="text-xs text-slate-500">累计已读次数</p>
                                    </>
                                  )}
                                </div>

                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Download className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-slate-800">下载情况</span>
                                  </div>
                                  {doc.downloadable ? (
                                    <>
                                      <div className="text-2xl font-semibold text-slate-900 tabular-nums mb-1">
                                        {doc.downloadStats.downloads}
                                      </div>
                                      <p className="text-xs text-slate-500">
                                        累计下载次数
                                        {doc.downloadStats.totalEligible > 0 && (
                                          <> · 可下载范围 {doc.downloadStats.totalEligible} 人</>
                                        )}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-slate-500">发布时设置为不可下载，不开放下载统计</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}

                  {workbenchTab === 'history' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {[
                        { action: '审核通过', target: '2026网点应对多轮提款情绪波动话术补充.docx', user: '赵云杰', time: '2026-06-11 10:30' },
                        { action: '配置更新', target: '下载水印策略', user: '系统管理员', time: '2026-06-10 16:20' },
                        { action: '发布文档', target: '网点服务标准手册 2026 版.pdf', user: '王敏', time: '2026-06-08 09:15' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-white flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.action} · {item.target}</div>
                            <div className="text-xs text-slate-500 mt-1">{item.user} · {item.time}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Enhanced Configuration Center */}
                  {workbenchTab === 'security' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8 pb-12 text-left"
                    >
                      {/* Section 1: Basic Info */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-slate-900">基础信息设置</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">知识库名称</label>
                            <input 
                              type="text" 
                              defaultValue={selectedKb.name} 
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none transition-all" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">资料类型归类</label>
                            <div className="relative group">
                              <select defaultValue={selectedKb.category} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer pr-10">
                                <option>方案 / 策划</option>
                                <option>制度 / 规范</option>
                                <option>素材 / 课件</option>
                                <option>项目 / 复盘</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                            </div>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">简介描述</label>
                            <textarea 
                              rows={2} 
                              defaultValue={selectedKb.desc} 
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none resize-none transition-all" 
                            />
                          </div>
                        </div>
                      </section>

                      {/* Section 2: Visibility */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-slate-900">发布可见范围</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { id: 'enterprise', title: '全组织可见', desc: '全行公开', icon: Globe },
                            { id: 'department', title: '指定部门', desc: '选定部门可见', icon: Users },
                            { id: 'role', title: '指定角色', desc: '特定业务角色', icon: ShieldCheck },
                            { id: 'position', title: '指定岗位', desc: '管理职级限制', icon: UserPlus }
                          ].map((item) => (
                            <button 
                              key={item.id}
                              onClick={() => {
                                setDetailVisibility(item.id);
                              }}
                              className={cn(
                                "flex flex-col p-3 rounded-2xl border-2 text-left transition-all",
                                (item.id === detailVisibility)
                                ? "border-blue-600 bg-blue-50 ring-1 ring-blue-100" 
                                : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors",
                                (item.id === detailVisibility) ? "bg-blue-600 ml-0 text-white" : "bg-white text-slate-400"
                              )}>
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div className="text-sm font-medium text-slate-900 mb-0.5">{item.title}</div>
                              <div className="text-sm text-slate-400 font-medium">{item.desc}</div>
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">当前已配置范围</span>
                          <button 
                            onClick={() => {
                              setSelectorPurpose('visibility');
                              setShowMemberSelector(true);
                            }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-1.5"
                          >
                            <Plus className="w-3 h-3" /> 修改范围
                          </button>
                        </div>
                        {detailVisibility === 'enterprise' && (
                          <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 border border-slate-100 rounded-xl min-h-[60px] items-center">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 shadow-sm font-sans">
                              全组织公开 (全员可见)
                            </span>
                            <span className="text-sm text-slate-400 font-medium ml-2 font-sans">(全员公开可见模式，本层级不限特殊角色、部门或岗位)</span>
                          </div>
                        )}

                        {detailVisibility === 'department' && (
                          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/50 border border-slate-100 rounded-xl min-h-[60px] items-center">
                            {configuredOrgs.length > 0 ? (
                              configuredOrgs.map((org, i) => (
                                <div key={i} className="pl-3 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-1.5 group shadow-sm hover:border-rose-200 hover:text-rose-600 transition-all font-sans">
                                  {org}
                                  <button 
                                    onClick={() => setConfiguredOrgs(prev => prev.filter(o => o !== org))}
                                    className="text-slate-300 hover:text-rose-500 transition-colors border-0 bg-transparent p-0 cursor-pointer flex items-center justify-center align-middle"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-slate-400 font-medium font-sans">(未配置部门，点击“修改范围”添加)</span>
                            )}
                          </div>
                        )}

                        {detailVisibility === 'role' && (
                          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/50 border border-slate-100 rounded-xl min-h-[60px] items-center">
                            {configuredRoles.length > 0 ? (
                              configuredRoles.map((role, i) => (
                                <div key={i} className="pl-3 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-1.5 group shadow-sm hover:border-rose-200 hover:text-rose-600 transition-all font-sans">
                                  {role}
                                  <button 
                                    onClick={() => setConfiguredRoles(prev => prev.filter(r => r !== role))}
                                    className="text-slate-300 hover:text-rose-500 transition-colors border-0 bg-transparent p-0 cursor-pointer flex items-center justify-center align-middle"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-slate-400 font-medium font-sans">(未配置可见角色，点击“修改范围”添加)</span>
                            )}
                          </div>
                        )}

                        {detailVisibility === 'position' && (
                          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/50 border border-slate-100 rounded-xl min-h-[60px] items-center">
                            {configuredPositions.length > 0 ? (
                              configuredPositions.map((pos, i) => (
                                <div key={i} className="pl-3 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-1.5 group shadow-sm hover:border-rose-200 hover:text-rose-600 transition-all font-sans">
                                  {pos}
                                  <button 
                                    onClick={() => setConfiguredPositions(prev => prev.filter(p => p !== pos))}
                                    className="text-slate-300 hover:text-rose-500 transition-colors border-0 bg-transparent p-0 cursor-pointer flex items-center justify-center align-middle"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-slate-400 font-medium font-sans">(未配置岗位限制，点击“修改范围”添加)</span>
                            )}
                          </div>
                        )}
                      </section>

                      {/* Section 3: Permissions & Workflow */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-slate-900">权限与流程控制</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-3">
                             <label className="text-sm font-medium text-slate-400 uppercase tracking-widest block">知识库管理员</label>
                             <div className="space-y-2">
                                {administrators.map(admin => (
                                   <div key={admin.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                                     <div className="flex items-center gap-3">
                                       <img src={(admin as any).avatar} className="w-7 h-7 rounded-lg bg-orange-100" />
                                       <div>
                                         <div className="text-sm font-medium text-slate-900">{admin.name}</div>
                                         <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{admin.dept}</div>
                                       </div>
                                     </div>
                                     <button className="p-1 px-2 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded transition">移除</button>
                                   </div>
                                ))}
                                <button 
                                  onClick={() => {
                                    setSelectorPurpose('admin');
                                    setShowMemberSelector(true);
                                  }}
                                  className="w-full py-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:bg-white hover:text-blue-600 transition"
                                >
                                  + 添加库管理员
                                </button>
                             </div>
                           </div>
                           
                           <div className="space-y-3">
                             <label className="text-sm font-medium text-slate-400 uppercase tracking-widest block">入库审核机制</label>
                             <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
                               <div className="max-w-[200px]">
                                 <span className="text-sm font-medium text-amber-900 block mb-0.5">启用发布预审查</span>
                                 <span className="text-sm text-amber-700/60 font-medium leading-relaxed block">所有入库文档必须由管理员审核通过方可对外发布</span>
                               </div>
                               <div className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" defaultChecked />
                                 <div className="w-10 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 shadow-inner"></div>
                               </div>
                             </div>
                           </div>
                        </div>
                      </section>

                      {/* Section 4: Security (Consolidated from previous code) */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                          <Lock className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-slate-900">安全与受控策略</h3>
                        </div>
                        
                        <div className="pt-2">
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">全局下载控制</label>
                             <div className="relative group">
                               <select defaultValue="所有人可下载 (受控模式)" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none transition-all appearance-none cursor-pointer pr-10">
                                 <option>禁止所有人下载</option>
                                 <option>仅可管理及编辑者下载</option>
                                 <option>所有人可下载 (受控模式)</option>
                                 <option>全开放自由下载</option>
                               </select>
                               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                             </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                <Shield className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">强制动态水印</div>
                                <div className="text-sm text-slate-400 font-medium">自动附加“姓名+IP+时间”</div>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={watermarkEnabled}
                              onChange={(e) => { setWatermarkEnabled(e.target.checked); showToast('动态水印配置已更新'); }}
                              className="w-4 h-4 text-blue-600 accent-blue-600" 
                            />
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors">
                                <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">敏感词自动校验</div>
                                <div className="text-sm text-slate-400 font-medium">拟发布件合规性扫描</div>
                              </div>
                            </div>
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 accent-blue-600" />
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">文件流加密存储</div>
                                <div className="text-sm text-slate-400 font-medium">后端 AES-256 位加密存储</div>
                              </div>
                            </div>
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 accent-blue-600" />
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                <Download className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">受控下载审计</div>
                                <div className="text-sm text-slate-400 font-medium">跨部门下载强制申报原因</div>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={logDownloadRequired}
                              onChange={(e) => { setLogDownloadRequired(e.target.checked); showToast('下载审计策略已更新'); }}
                              className="w-4 h-4 text-blue-600 accent-blue-600" 
                            />
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">操作行为离线归档</div>
                                <div className="text-sm text-slate-400 font-medium">详细记录页面浏览热力轨迹</div>
                              </div>
                            </div>
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 accent-blue-600" />
                          </div>
                        </div>
                      </section>

                      {/* Section 5: Lifecycle */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                          <FileArchive className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-slate-900">知识库生命周期</h3>
                        </div>
                        {selectedKbArchived ? (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                            <FileArchive className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-slate-800">该公共知识库已归档</div>
                              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                归档时间：{selectedKb.updatedAt}。库内内容只读留存，不可再上传、发布、审核或修改配置。
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900">归档整个知识库</div>
                              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                归档后该公共知识库将变为「已归档」状态，停止一切写入与配置变更，仅保留只读查阅能力。
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowArchiveKbConfirm(true)}
                              className="shrink-0 px-4 py-2 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-sm font-medium rounded-xl transition shadow-sm"
                            >
                              归档知识库
                            </button>
                          </div>
                        )}
                      </section>

                      {/* Footer Actions */}
                      <footer className="pt-8 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-400 italic">
                          {selectedKbArchived
                            ? "该知识库已归档，配置项不可再修改。"
                            : "注意：上述配置保存后将立即对该公共知识库生效，系统将自动核算存量数据是否需补填配置。"}
                        </div>
                        <div className="flex items-center gap-3">
                           <button
                            disabled={selectedKbArchived}
                            className="px-6 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                           >
                            重置
                           </button>
                           <button 
                            disabled={selectedKbArchived}
                            onClick={() => showToast('配置已持久化保存至中心数据库')}
                            className="px-10 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                           >
                              保存配置变更
                           </button>
                        </div>
                      </footer>
                    </motion.div>
                  )}

</div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Archive KB Confirm Modal */}
      <AnimatePresence>
        {showArchiveKbConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowArchiveKbConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="fixed left-1/2 top-1/2 z-[91] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-900">确认归档公共知识库？</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    归档「{selectedKb.name}」后，该库将变为只读留存状态，不可再上传、发布、审核或修改配置。此操作不可撤销。
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchiveKbConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleArchivePublicKb}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition border-0 cursor-pointer"
                >
                  确认归档
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Member Selector Modal */}
      <MemberSelectorModal 
        isOpen={showMemberSelector}
        onClose={() => setShowMemberSelector(false)}
        mode={viewMode === 'create' ? (createStep === 2 ? (newKbData.visibility as any) : 'member') : (selectorPurpose === 'visibility' ? (detailVisibility === 'enterprise' ? 'member' : detailVisibility) : 'member')}
        onConfirm={(selected) => {
          if (viewMode === 'create') {
            if (createStep === 2) {
              // Updating visibility targets in step 2
              const names = selected.map(item => item.name);
              setNewKbData(prev => {
                if (prev.visibility === 'department') {
                  return { ...prev, targetOrgs: Array.from(new Set([...prev.targetOrgs, ...names])) };
                } else if (prev.visibility === 'role') {
                  return { ...prev, targetRoles: Array.from(new Set([...prev.targetRoles, ...names])) };
                } else if (prev.visibility === 'position') {
                  return { ...prev, targetPositions: Array.from(new Set([...prev.targetPositions, ...names])) };
                }
                return prev;
              });
            } else if (createStep === 3) {
              // Step 3 handles Admin selection (Member mode)
              const newAdmins = selected.map(item => ({
                id: item.id,
                name: item.name,
                dept: item.dept || '未知部门',
                avatar: (item as any).avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`,
                type: item.type
              }));
              setAdministrators(prev => {
                const existingIds = prev.map(a => a.id);
                const filteredNew = newAdmins.filter(n => !existingIds.includes(n.id));
                return [...prev, ...filteredNew];
              });
            } else {
              // Handling individual members for Step 3 or other roles
              const newMembers = selected.map(item => ({
                id: item.id,
                name: item.name,
                dept: item.dept || '未知部门',
                role: '可评论', // Default for public KB collaborators
                desc: '查看, 复制, 打印, 下载, 评论',
                avatar: (item as any).avatar,
                type: item.type
              }));
              
              setAuthorizedMembers(prev => {
                const existingIds = prev.map(m => m.id);
                const filteredNew = newMembers.filter(n => !existingIds.includes(n.id));
                return [...prev, ...filteredNew];
              });
            }
          } else {
            // Configuration mode edits!
            if (selectorPurpose === 'visibility') {
              const names = selected.map(item => item.name);
              if (detailVisibility === 'department') {
                setConfiguredOrgs(prev => Array.from(new Set([...prev, ...names])));
              } else if (detailVisibility === 'role') {
                setConfiguredRoles(prev => Array.from(new Set([...prev, ...names])));
              } else if (detailVisibility === 'position') {
                setConfiguredPositions(prev => Array.from(new Set([...prev, ...names])));
              }
            } else if (selectorPurpose === 'admin') {
              const newAdmins = selected.map(item => ({
                id: item.id,
                name: item.name,
                dept: item.dept || '未知部门',
                avatar: (item as any).avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`,
                type: item.type
              }));
              setAdministrators(prev => {
                const existingIds = prev.map(a => a.id);
                const filteredNew = newAdmins.filter(n => !existingIds.includes(n.id));
                return [...prev, ...filteredNew];
              });
            } else {
              // Collaborators etc.
              const newMembers = selected.map(item => ({
                id: item.id,
                name: item.name,
                dept: item.dept || '未知部门',
                role: '可评论',
                desc: '查看, 复制, 打印, 下载, 评论',
                avatar: (item as any).avatar,
                type: item.type
              }));
              setAuthorizedMembers(prev => {
                const existingIds = prev.map(m => m.id);
                const filteredNew = newMembers.filter(n => !existingIds.includes(n.id));
                return [...prev, ...filteredNew];
              });
            }
          }
        }}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-blue-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium tracking-wide">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
