import { useState, useEffect, useMemo, useRef } from "react";
import { Check, Database, Users, ShieldAlert, FileText, Settings, Plus, Search, ChevronRight, BarChart3, Clock, Lock, Bell, Download, MonitorPlay, X, ArrowLeft, MoreHorizontal, FileArchive, CheckCircle2, HelpCircle, ExternalLink, Crown, Sparkles, Eye, Trash2, Upload, Globe, ShieldCheck, Shield, AlertCircle, UserPlus, ChevronDown, Folder, ListChecks, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { KnowledgeBaseDetail } from "./KnowledgeBaseDetail";
import { MemberSelectorModal } from "../components/MemberSelectorModal";
import { UploadWithSpecModal } from "../components/UploadWithSpecModal";
import { buildPresetSpec } from "../components/CollectionSpecConfig";
import { KnowledgeBaseConsoleLayout, type KbConsoleTab } from "../components/knowledge-base/KnowledgeBaseConsoleLayout";
import { OverviewDetailCard, OverviewInfoCard, OverviewSectionTitle } from "../components/knowledge-base/OverviewCards";
import { CollectionSpec, MetadataField, MaterialTypeRule } from "../types";
import type { FileNode } from "./KnowledgeBaseDetail";
import {
  PERMISSION_OPTIONS,
  getPermissionDesc,
  type TeamMemberPerm,
} from "../lib/teamPermissions";
import {
  DEFAULT_TEAM_KB_NODES,
  buildTeamKbFileListDisplayConfig,
  createFileNodeFromUpload,
  getTeamKbEnabledSpec,
  TEAM_KB_SPEC_ENABLED_IDS,
} from "../lib/teamKbMock";

interface TeamKnowledgeBaseViewProps {
  consoleTab?: KbConsoleTab;
  onConsoleTabChange?: (tab: KbConsoleTab) => void;
  isKbAdmin?: boolean;
}

const WATERMARK_VAR_OPTIONS = [
  { key: "username", label: "用户名", token: "{用户名}" },
  { key: "employeeId", label: "工号", token: "{工号}" },
  { key: "accessTime", label: "访问时间", token: "{访问时间}" },
  { key: "kbName", label: "知识库名称", token: "{知识库名称}" },
] as const;

type WatermarkVarKey = (typeof WATERMARK_VAR_OPTIONS)[number]["key"];

function buildWatermarkTemplate(selected: WatermarkVarKey[]) {
  return WATERMARK_VAR_OPTIONS.filter((o) => selected.includes(o.key))
    .map((o) => o.token)
    .join(" · ");
}

const mockTeamKbs = [
  {
    id: "kb_credit",
    type: "team",
    name: "信贷运营团队资料库",
    desc: "授信资料、补录指引、客户经理培训和历史项目复盘。",
    scope: "知识库成员 + 指定协作人",
    members: 36,
    files: 842,
    recentUpdates: 15,
    anomalyTasks: 2,
    status: "运行中",
    statusTone: "success",
    updatedAt: "今日 10:12",
    creator: "宋吉美",
    folders: 3,
    docs: 2,
    tags: ["成员授权", "授信资料", "文档设置"],
    policies: [
      { label: "文件治理", value: "1 份待人工确认，1 份已治理并写入 MinIO。" },
      { label: "文档设置", value: "文档水印已开启、导出控制未开启。" },
      { label: "团队文档模板", value: "暂未上传团队模板，可从本地或我的知识库上传。" },
      { label: "资料上传规范", value: "已启用资料上传规范。" },
      { label: "归档状态", value: "未归档，可继续新增、导入和维护源文件。" }
    ]
  },
  {
    id: "kb_retail",
    type: "team",
    name: "零售运营活动共建库",
    desc: "开门红、客户分层、触达素材和活动复盘。",
    scope: "零售运营组 + 网点运营岗",
    members: 52,
    files: 516,
    recentUpdates: 8,
    anomalyTasks: 5,
    status: "运行中",
    statusTone: "success",
    updatedAt: "今日 08:45",
    creator: "林珊",
    folders: 3,
    docs: 2,
    tags: ["活动专题", "共享范围", "复盘沉淀"],
    policies: [
      { label: "文件治理", value: "3 份治理中，2 份待人工确认，已入库文件可检索复用。" },
      { label: "文档设置", value: "文档水印已开启，下载需要负责人确认。" },
      { label: "团队文档模板", value: "已维护活动方案、复盘报告 2 个团队模板。" },
      { label: "归档状态", value: "未归档，可继续新增、导入和维护源文件。" }
    ]
  },
  {
    id: "kb_policy",
    type: "team",
    name: "运营制度修订协作库",
    desc: "制度修订过程稿、审批口径、会议纪要和版本对照材料。",
    scope: "制度修订小组",
    members: 18,
    files: 238,
    recentUpdates: 0,
    anomalyTasks: 0,
    status: "已归档",
    statusTone: "archived",
    updatedAt: "2026-05-30 归档",
    creator: "周维",
    folders: 3,
    docs: 8,
    tags: ["制度修订", "版本对照", "审批口径"],
    policies: [
      { label: "文件治理", value: "归档前治理已全部完成，内容只读留存。" },
      { label: "文档设置", value: "文档水印已开启，过程稿不允许下载。" },
      { label: "团队文档模板", value: "已维护制度修订说明、审批记录 2 个团队模板。" },
      { label: "归档状态", value: "已于 2026-05-30 完成归档，不可再执行任何操作。" }
    ]
  }
];

interface OrgNode {
  id: string;
  name: string;
  children?: OrgNode[];
}

/** 当前登录用户所在组织（mock） */
const CURRENT_USER_ORG_ID = "org_hq_digital_ops";

const ORG_TREE: OrgNode[] = [
  {
    id: "org_hq",
    name: "总行",
    children: [
      {
        id: "org_hq_digital",
        name: "数字化发展部",
        children: [
          { id: "org_hq_digital_ops", name: "数字化运营部" },
          { id: "org_hq_digital_product", name: "数字化产品组" },
        ],
      },
      {
        id: "org_hq_ops",
        name: "运营管理部",
        children: [
          { id: "org_hq_ops_center", name: "运营服务中心" },
          { id: "org_hq_ops_policy", name: "制度管理室" },
        ],
      },
      { id: "org_hq_credit", name: "信贷风控中心" },
      { id: "org_hq_retail", name: "零售金融部" },
    ],
  },
  {
    id: "org_east",
    name: "华东分行",
    children: [
      { id: "org_east_ops", name: "华东分行运营组" },
      { id: "org_east_credit", name: "华东分行信贷运营组" },
      { id: "org_east_retail", name: "华东分行零售运营组" },
    ],
  },
  {
    id: "org_south",
    name: "华南分行",
    children: [
      { id: "org_south_ops", name: "华南分行运营组" },
      { id: "org_south_service", name: "华南分行客户服务部" },
    ],
  },
];

function findOrgById(nodes: OrgNode[], id: string): OrgNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findOrgById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function flattenOrgTree(nodes: OrgNode[], depth = 0): Array<{ id: string; name: string; depth: number }> {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...(node.children ? flattenOrgTree(node.children, depth + 1) : []),
  ]);
}

function collectOrgSubtree(node: OrgNode, depth = 0): Array<{ id: string; name: string; depth: number }> {
  return [
    { id: node.id, name: node.name, depth },
    ...(node.children?.flatMap((child) => collectOrgSubtree(child, depth + 1)) ?? []),
  ];
}

function getOrgName(orgId: string) {
  return findOrgById(ORG_TREE, orgId)?.name ?? "";
}

function getSelectableOrgs(isAdmin: boolean, userOrgId: string) {
  if (isAdmin) {
    return flattenOrgTree(ORG_TREE);
  }
  const userOrg = findOrgById(ORG_TREE, userOrgId);
  return userOrg ? collectOrgSubtree(userOrg) : [];
}

function createInitialKbData() {
  return {
    name: "",
    desc: "",
    organizationId: CURRENT_USER_ORG_ID,
    organizationName: getOrgName(CURRENT_USER_ORG_ID),
    scope: "restricted" as const,
    autoWatermark: true,
    autoEncrypt: false,
  };
}

interface OrgOption {
  id: string;
  name: string;
  depth: number;
}

function OrgSearchSelect({
  options,
  valueId,
  onChange,
  placeholder = "搜索并选择所属组织...",
}: {
  options: OrgOption[];
  valueId: string;
  onChange: (id: string, name: string) => void;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((item) => item.id === valueId);

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (org: OrgOption) => {
    onChange(org.id, org.name);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
      <input
        type="text"
        value={open ? query : selected?.name ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-300 outline-none transition-all"
      />
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) setQuery("");
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="展开组织列表"
      >
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">未找到匹配组织</div>
            ) : (
              filteredOptions.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelect(org)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2",
                    org.id === valueId
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                  style={{ paddingLeft: `${16 + org.depth * 16}px` }}
                >
                  {org.depth > 0 && <span className="text-slate-300 shrink-0">└</span>}
                  <span className="truncate">{org.name}</span>
                  {org.id === valueId && <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-blue-600" />}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export function TeamKnowledgeBaseView({ consoleTab = "team", onConsoleTabChange, isKbAdmin = true }: TeamKnowledgeBaseViewProps = {}) {
  const [selectedKbId, setSelectedKbId] = useState("kb_credit");
  const [activeTab, setActiveTab] = useState<"team" | "personal">("team");
  const [viewMode, setViewMode] = useState<"list" | "workbench" | "create">("list");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [workbenchMode, setWorkbenchMode] = useState<"detail" | "manage">("detail");
  const [workbenchTab, setWorkbenchTab] = useState<"members" | "settings" | "status">("members");
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [memberSelectorContext, setMemberSelectorContext] = useState<'create' | 'members'>('create');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSelectedName, setTransferSelectedName] = useState<string | null>(null);
  const [authorizedMembersForCreate, setAuthorizedMembersForCreate] = useState([
    { id: 'm1', name: '陈也', dept: '设计中心', role: '可编辑', desc: getPermissionDesc('可编辑'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', type: 'user' },
    { id: 'm2', name: '项目一组', dept: '协作团队', role: '可查看', desc: getPermissionDesc('可查看'), type: 'group' }
  ]);

  // Creation State
  const [createStep, setCreateStep] = useState(1);
  const [newKbData, setNewKbData] = useState(createInitialKbData);

  const selectableOrgs = useMemo(
    () => getSelectableOrgs(isKbAdmin, CURRENT_USER_ORG_ID),
    [isKbAdmin]
  );

  const resetCreateForm = () => {
    setCreateStep(1);
    setNewKbData(createInitialKbData());
  };

  const handleStartCreate = () => {
    resetCreateForm();
    setViewMode("create");
  };

  const selectedKb = mockTeamKbs.find(kb => kb.id === selectedKbId) || mockTeamKbs[0];
  const selectedKbArchived = selectedKb.status === "已归档";

  // Dynamic state for members scoped to active KB
  const [kbMembers, setKbMembers] = useState<Record<string, Array<{ name: string; role: string; perm: string; select: boolean }>>>({
    kb_credit: [
      { name: '宋吉美', role: '知识库创建者', perm: '拥有所有权限', select: false },
      { name: '张敏', role: '', perm: '可编辑', select: true },
      { name: '刘洋', role: '', perm: '可编辑', select: true }
    ],
    kb_retail: [
      { name: '林珊', role: '知识库创建者', perm: '拥有所有权限', select: false },
      { name: '王敏', role: '', perm: '可查看', select: true },
      { name: '李经理', role: '', perm: '可评论', select: true }
    ],
    kb_policy: [
      { name: '周维', role: '知识库创建者', perm: '拥有所有权限', select: false },
      { name: '赵主管', role: '', perm: '可管理', select: true },
      { name: '钱专员', role: '', perm: '仅查看', select: true }
    ]
  });

  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  // Local Toast notification
  const [toast, setToast] = useState<string | null>(null);

  // Sub-tabs for Settings Modal (团队设置, 文档设置, 团队文档模板, AI服务, 知识库视图)
  
  // Document Security Settings Toggles
  const [docWatermark, setDocWatermark] = useState<boolean>(true);
  const [watermarkSelectedVars, setWatermarkSelectedVars] = useState<WatermarkVarKey[]>([
    "username",
    "employeeId",
    "accessTime",
  ]);
  const [watermarkVarDropdownOpen, setWatermarkVarDropdownOpen] = useState(false);
  const watermarkVarDropdownRef = useRef<HTMLDivElement>(null);
  const watermarkContent = useMemo(
    () => buildWatermarkTemplate(watermarkSelectedVars),
    [watermarkSelectedVars]
  );
  const [docExportControl, setDocExportControl] = useState<boolean>(false);

  // Scoped templates state
  const [kbTemplates, setKbTemplates] = useState<Record<string, Array<{ id: string; name: string; type: string; size: string; uploader: string; date: string }>>>({
    kb_credit: [
      { id: 't1', name: '2026信贷风控审查标准模板.docx', type: 'doc', size: '145KB', uploader: '宋吉美', date: '今日 10:12' },
      { id: 't2', name: '客户授信评估财务分析模板.xlsx', type: 'excel', size: '254KB', uploader: '宋吉美', date: '昨日 15:40' }
    ],
    kb_retail: [], // Starts empty to show Image 2's empty state exactly!
    kb_policy: [
      { id: 't3', name: '制度修订说明模板.docx', type: 'doc', size: '112KB', uploader: '周维', date: '2026-04-12' },
      { id: 't4', name: '制度审批记录模板.xlsx', type: 'excel', size: '86KB', uploader: '赵主管', date: '2026-04-18' },
    ]
  });

  // State for template source selection
  const [showTemplateSourceModal, setShowTemplateSourceModal] = useState(false);
  const [templateSource, setTemplateSource] = useState<'local' | 'personal'>('local');
  const [showPersonalKbPicker, setShowPersonalKbPicker] = useState(false);

  // 资料上传规范配置
  // 规范上传弹窗
  const [activeSpec, setActiveSpec] = useState<CollectionSpec | null>(null);
  const [showUploadSpecModal, setShowUploadSpecModal] = useState(false);
  
  // 当前知识库的资料上传规范（每个知识库只有一份）
  const [spec, setSpec] = useState<CollectionSpec>(buildPresetSpec());
  const [specEnabled, setSpecEnabled] = useState(true);
  const [teamKbNodes, setTeamKbNodes] = useState<Record<string, FileNode[]>>(DEFAULT_TEAM_KB_NODES);

  const fileListDisplayConfig = useMemo(
    () => {
      if (!specEnabled || !TEAM_KB_SPEC_ENABLED_IDS.has(selectedKbId)) return undefined;
      return buildTeamKbFileListDisplayConfig(selectedKbId, spec);
    },
    [selectedKbId, spec, specEnabled]
  );

  useEffect(() => {
    if (!watermarkVarDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (watermarkVarDropdownRef.current && !watermarkVarDropdownRef.current.contains(e.target as Node)) {
        setWatermarkVarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [watermarkVarDropdownOpen]);
  
  // 字段编辑状态
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldDraft, setEditingFieldDraft] = useState<MetadataField | null>(null);
  
  // 规则编辑状态
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleDraft, setEditingRuleDraft] = useState<MaterialTypeRule | null>(null);
  
  // 字段类型标签映射
  const FIELD_TYPE_LABELS: Record<string, string> = {
    single_text: '文本框',
    number: '数字',
    date: '日期',
    radio: '单选框',
    checkbox: '多选框',
  };
  
  // 当前知识库已启用的规范
  const getEnabledSpec = (kbId: string): CollectionSpec | null => {
    if (!specEnabled) return null;
    return getTeamKbEnabledSpec(kbId, spec);
  };
  
  // 字段操作函数
  const handleAddField = () => {
    const newField: MetadataField = {
      id: Math.random().toString(36).slice(2, 10),
      name: '',
      code: '',
      inputType: 'single_text',
      required: false,
      scope: 'file',
      sortOrder: spec.metadataFields.length + 1,
    };
    setSpec({
      ...spec,
      metadataFields: [...spec.metadataFields, newField],
    });
    setEditingFieldId(newField.id);
    setEditingFieldDraft({ ...newField });
  };
  
  const handleStartEditField = (field: MetadataField) => {
    setEditingFieldId(field.id);
    setEditingFieldDraft({ ...field });
  };
  
  const handleSaveField = () => {
    if (!editingFieldId || !editingFieldDraft) return;
    setSpec({
      ...spec,
      metadataFields: spec.metadataFields.map(f => 
        f.id === editingFieldId ? editingFieldDraft! : f
      ),
    });
    setEditingFieldId(null);
    setEditingFieldDraft(null);
    showToast('字段已保存');
  };
  
  const handleCancelFieldEdit = () => {
    setEditingFieldId(null);
    setEditingFieldDraft(null);
  };
  
  const handleDeleteField = (fieldId: string) => {
    setSpec({
      ...spec,
      metadataFields: spec.metadataFields.filter(f => f.id !== fieldId),
    });
    showToast('字段已删除');
  };
  
  // 规则操作函数
  const handleAddRule = () => {
    const newRule: MaterialTypeRule = {
      id: Math.random().toString(36).slice(2, 10),
      materialType: '',
      requiredFields: [],
      fileTypes: [],
      excelRequiredHeaders: [],
      validationMessage: '',
    };
    setSpec({
      ...spec,
      materialTypeRules: [...spec.materialTypeRules, newRule],
    });
    setEditingRuleId(newRule.id);
    setEditingRuleDraft({ ...newRule });
  };
  
  const handleStartEditRule = (rule: MaterialTypeRule) => {
    setEditingRuleId(rule.id);
    setEditingRuleDraft({ ...rule });
  };
  
  const handleSaveRule = () => {
    if (!editingRuleId || !editingRuleDraft) return;
    setSpec({
      ...spec,
      materialTypeRules: spec.materialTypeRules.map(r => 
        r.id === editingRuleId ? editingRuleDraft! : r
      ),
    });
    setEditingRuleId(null);
    setEditingRuleDraft(null);
    showToast('规则已保存');
  };
  
  const handleCancelRuleEdit = () => {
    setEditingRuleId(null);
    setEditingRuleDraft(null);
  };
  
  const handleDeleteRule = (ruleId: string) => {
    setSpec({
      ...spec,
      materialTypeRules: spec.materialTypeRules.filter(r => r.id !== ruleId),
    });
    showToast('规则已删除');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleEnterTeamKb = (id: string) => {
    const kb = mockTeamKbs.find((k) => k.id === id);
    if (kb?.status === "已归档" && !isKbAdmin) {
      showToast("该知识库已归档，仅管理员可查看归档内容");
      return;
    }
    setSelectedKbId(id);
    setWorkbenchMode("detail");
    setWorkbenchTab("members");
    setViewMode("workbench");
  };

  const updatePermission = (index: number, newPerm: string) => {
    const currentMembers = [...(kbMembers[selectedKbId] || [])];
    if (currentMembers[index]) {
      const oldPerm = currentMembers[index].perm;
      currentMembers[index] = { ...currentMembers[index], perm: newPerm };
      setKbMembers({
        ...kbMembers,
        [selectedKbId]: currentMembers
      });
      showToast(`✓ 已成功将 ${currentMembers[index].name} 的权限更新为【${newPerm}】`);
    }
  };

  const removeMember = (index: number) => {
    const currentMembers = [...(kbMembers[selectedKbId] || [])];
    if (currentMembers[index]) {
      const removedUser = currentMembers[index].name;
      const filtered = currentMembers.filter((_, idx) => idx !== index);
      setKbMembers({
        ...kbMembers,
        [selectedKbId]: filtered
      });
      showToast(`✓ 已成功从授权列表中移除成员 ${removedUser}`);
    }
  };

  const transferCandidates = useMemo(
    () => (kbMembers[selectedKbId] || []).filter((m) => m.role !== "知识库创建者"),
    [kbMembers, selectedKbId]
  );

  const openTransferModal = () => {
    setTransferSelectedName(null);
    setShowTransferModal(true);
  };

  const handleConfirmTransfer = () => {
    if (!transferSelectedName) return;
    const currentMembers = [...(kbMembers[selectedKbId] || [])];
    const creatorIndex = currentMembers.findIndex((m) => m.role === "知识库创建者");
    const targetIndex = currentMembers.findIndex((m) => m.name === transferSelectedName);
    if (creatorIndex === -1 || targetIndex === -1) return;

    const oldCreator = currentMembers[creatorIndex];
    const newCreator = currentMembers[targetIndex];

    currentMembers[creatorIndex] = {
      ...oldCreator,
      role: "",
      perm: "可管理",
      select: true,
    };
    currentMembers[targetIndex] = {
      ...newCreator,
      role: "知识库创建者",
      perm: "拥有所有权限",
      select: false,
    };

    setKbMembers({ ...kbMembers, [selectedKbId]: currentMembers });
    setShowTransferModal(false);
    setTransferSelectedName(null);
    showToast(`✓ 已将团队管理权转让给 ${newCreator.name}`);
  };

  const getStatusColor = (tone: string) => {
    switch (tone) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const displayPolicies = useMemo(() => {
    const nodes = teamKbNodes[selectedKbId] ?? [];
    const fileNodes = nodes.filter((n) => n.type !== "folder");
    const pendingCount = fileNodes.filter(
      (n) => n.governanceStatus === "pending" || n.preprocessStatus === "pending"
    ).length;
    const successCount = fileNodes.filter((n) => n.governanceStatus === "success").length;
    const templates = kbTemplates[selectedKbId] ?? [];

    return selectedKb.policies
      .filter((p) => p.label !== "资料上传规范" || selectedKbId === "kb_credit")
      .map((p) => {
        if (p.label === "团队文档模板") {
          if (templates.length === 0) {
            return { label: p.label, value: "暂未上传团队模板，可从本地或我的知识库上传。" };
          }
          const preview = templates
            .slice(0, 2)
            .map((t) => t.name.replace(/\.[^.]+$/, ""))
            .join("、");
          const suffix =
            templates.length > 2
              ? ` 等 ${templates.length} 个团队模板。`
              : ` ${templates.length} 个团队模板。`;
          return { label: p.label, value: `已维护 ${preview}${suffix}` };
        }
        if (p.label === "资料上传规范") {
          if (!specEnabled) {
            return { label: p.label, value: "未启用资料上传规范。" };
          }
          return { label: p.label, value: "已启用资料上传规范。" };
        }
        if (p.label === "文档设置" && selectedKbId === "kb_credit") {
          const watermarkText = docWatermark ? "文档水印已开启" : "文档水印未开启";
          const exportText = docExportControl ? "导出控制已开启" : "导出控制未开启";
          return { label: p.label, value: `${watermarkText}、${exportText}。` };
        }
        if (p.label === "文件治理" && fileNodes.length > 0) {
          const parts: string[] = [];
          if (pendingCount > 0) parts.push(`${pendingCount} 份待人工确认`);
          if (successCount > 0) parts.push(`${successCount} 份已治理并写入 MinIO`);
          if (parts.length > 0) {
            return { label: p.label, value: `${parts.join("，")}。` };
          }
        }
        return p;
      });
  }, [selectedKb, selectedKbId, teamKbNodes, kbTemplates, specEnabled, docWatermark, docExportControl]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
      {viewMode === "list" ? (
        <KnowledgeBaseConsoleLayout
          activeTab={consoleTab}
          onTabChange={(tab) => onConsoleTabChange?.(tab)}
          onCreate={handleStartCreate}
          createLabel="新建"
          searchQuery={teamSearchQuery}
          onSearchChange={setTeamSearchQuery}
          searchPlaceholder="搜索团队库..."
          galleryItems={mockTeamKbs
            .filter(
              (kb) =>
                kb.type === "team" &&
                (!teamSearchQuery.trim() ||
                  kb.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                  kb.desc.toLowerCase().includes(teamSearchQuery.toLowerCase()))
            )
            .map((kb) => ({
              id: kb.id,
              name: kb.name,
              desc: kb.desc,
              status: kb.status,
              statusTone: kb.statusTone,
              isArchived: kb.status === "已归档",
            }))}
          selectedId={selectedKbId}
          onSelect={setSelectedKbId}
          onEnterKb={handleEnterTeamKb}
          allowArchivedEntry={isKbAdmin}
          selectedTitle={selectedKb.name}
          selectedDesc={selectedKb.desc}
          selectedStatus={selectedKb.status}
          selectedStatusTone={selectedKb.statusTone}
          metrics={{
            docCount: selectedKb.files,
            authorizedCount: selectedKb.members,
            recentUpdates: selectedKb.recentUpdates,
            anomalyTasks: selectedKb.anomalyTasks,
          }}
          detailContent={
            <div className="space-y-3">
              <OverviewSectionTitle>库内配置与状态</OverviewSectionTitle>
              <div className="space-y-2">
                {displayPolicies.map((p, idx) => (
                  <OverviewDetailCard key={idx} title={p.label} description={p.value} themeIndex={idx} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <OverviewInfoCard label="共享范围" themeIndex={0}>
                  {selectedKb.scope}
                </OverviewInfoCard>
                <OverviewInfoCard label="创建者" themeIndex={1}>
                  {selectedKb.creator}
                </OverviewInfoCard>
                <OverviewInfoCard label="文件夹" themeIndex={2}>
                  {selectedKb.folders} 个
                </OverviewInfoCard>
                <OverviewInfoCard label="最近更新" themeIndex={3}>
                  {selectedKb.updatedAt}
                </OverviewInfoCard>
              </div>
            </div>
          }
          panelFooter={
            selectedKbArchived ? (
              isKbAdmin ? (
                <button
                  type="button"
                  onClick={() => handleEnterTeamKb(selectedKbId)}
                  className="w-full py-2.5 bg-slate-800 border border-slate-800 rounded-xl text-white font-medium text-sm hover:bg-slate-700 transition shadow-md"
                >
                  查看归档内容
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium text-sm cursor-not-allowed select-none"
                >
                  已归档，不可操作
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => handleEnterTeamKb(selectedKbId)}
                className="w-full py-2.5 bg-blue-600 border border-blue-600 rounded-xl text-white font-medium text-sm hover:bg-blue-700 transition shadow-md shadow-blue-100"
              >
                进入工作台
              </button>
            )
          }
          emptyGalleryMessage="没有找到匹配的团队知识库"
        />
      ) : viewMode === 'create' ? (
        /* CREATE KNOWLEDGE BASE VIEW */
        <div className="p-6 md:p-12 w-full flex flex-col items-center overflow-auto min-h-0">
          <div className="w-full max-w-[800px] glass-panel rounded-2xl flex flex-col my-8 shrink-0">
            <div className="px-10 pt-10 pb-4 text-left">
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => {
                    if (createStep > 1) setCreateStep(createStep - 1);
                    else { resetCreateForm(); setViewMode('list'); }
                  }}
                  className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 transition bg-white shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-xl font-medium text-slate-900 tracking-normal">新建团队知识库</h1>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      {createStep === 1 ? 'STEP 01' : createStep === 2 ? 'STEP 02' : 'COMPLETE'}
                    </span>
                    <p className="text-sm font-medium text-slate-500">
                      {createStep === 1 ? '基础架构与归属配置' : createStep === 2 ? '协作范围与成员授权' : '知识库初始化成功'}
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
                      </div>
                      <div className="space-y-2.5">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">所属组织</label>
                        <p className="text-sm text-slate-400 font-medium">
                          {isKbAdmin
                            ? "默认为您所在组织，可调整为任意组织"
                            : "默认为您所在组织，可调整为下级组织"}
                        </p>
                        <OrgSearchSelect
                          options={selectableOrgs}
                          valueId={newKbData.organizationId}
                          onChange={(organizationId, organizationName) =>
                            setNewKbData({ ...newKbData, organizationId, organizationName })
                          }
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">简介描述</label>
                        <textarea rows={2} placeholder="简要描述该团队知识库的协作目标..." value={newKbData.desc} onChange={(e) => setNewKbData({...newKbData, desc: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none" />
                      </div>
                      <div className="space-y-2.5">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">资料类型</label>
                        <div className="relative group">
                          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer pr-10">
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
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">组织权限继承</label>
                        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-blue-900 block">默认继承所属组织团队成员</span>
                                <span className="text-sm text-blue-700/60 font-medium">团队成员默认自动授权 “可查看”</span>
                            </div>
                          </div>
                          <input type="checkbox" className="w-5 h-5 text-blue-600 rounded-lg border-blue-200 focus:ring-blue-500 cursor-pointer" defaultChecked />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">添加其他协作成员</label>
                        <div className="flex gap-1">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="输入姓名或账号进行模糊搜索..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none transition-all" />
                          </div>
                          <button 
                            onClick={() => {
                              setMemberSelectorContext('create');
                              setShowMemberSelector(true);
                            }}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition shadow-sm flex items-center gap-1 whitespace-nowrap"
                          >
                            <UserPlus className="w-4 h-4" />
                            从组织架构选择
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-400 uppercase tracking-widest">已授权协作列表 ({authorizedMembersForCreate.length})</label>
                        <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                          <div className="divide-y divide-slate-100">
                            {authorizedMembersForCreate.map((item, i) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50/80 transition-colors">
                                <div className="flex items-center gap-3 text-left">
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">{item.name}</div>
                                    <div className="text-sm text-slate-400 font-medium">{item.dept}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right flex flex-col items-end">
                                    <div className="relative group/sel">
                                      <select 
                                        className="text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-200 outline-none cursor-pointer transition-all appearance-none pr-8 text-left min-w-[100px] shadow-sm"
                                        value={item.role}
                                        onChange={(e) => {
                                          const newRole = e.target.value;
                                          setAuthorizedMembersForCreate(prev => prev.map(m => m.id === item.id ? { ...m, role: newRole } : m));
                                        }}
                                      >
                                        <option value="仅查看">仅查看</option>
                                        <option value="可查看">可查看</option>
                                        <option value="可评论">可评论</option>
                                        <option value="可编辑">可编辑</option>
                                        <option value="可管理">可管理</option>
                                      </select>
                                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover/sel:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="text-sm text-slate-400 font-medium mt-1.5 px-1 truncate max-w-[180px]">
                                      {getPermissionDesc(item.role)}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setAuthorizedMembersForCreate(prev => prev.filter(m => m.id !== item.id))}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {createStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 text-center"
                    >
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-medium text-slate-900 tracking-normal">创建成功！</h2>
                      <p className="text-sm font-medium text-slate-500 mt-2 max-w-[340px] mx-auto leading-relaxed">
                        团队知识库 <span className="text-blue-600">"{newKbData.name}"</span> 已成功创建并完成初始化配置。现在可以开始上传文档并邀请协作人。
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
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { resetCreateForm(); setViewMode('list'); }} className="px-5 py-2 text-slate-500 font-medium text-sm hover:text-slate-800 transition">取消</button>
                <button 
                  onClick={() => {
                    if (createStep < 3) setCreateStep(createStep + 1);
                    else { resetCreateForm(); setViewMode('list'); }
                  }}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  {createStep === 3 ? '完成并进入' : '继续下一步'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-8 w-full max-w-[1440px] mx-auto h-full flex flex-col">
          <div className="glass-panel rounded-2xl flex flex-col overflow-hidden h-full relative text-left">
            {selectedKbArchived && (
              <div className="shrink-0 px-5 py-3 bg-amber-50/80 border-b border-amber-200/50 flex items-center gap-2 text-sm text-amber-900 backdrop-blur-sm">
                <FileArchive className="w-4 h-4 shrink-0 text-amber-600" />
                <span>该知识库已归档，当前为<strong className="font-medium mx-1">只读查阅</strong>模式，不可上传、编辑或变更配置。</span>
              </div>
            )}

            {/* Workbench Header — 与公共知识库工作台一致 */}
            <div className="px-6 py-5 border-b border-white/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 glass-header">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="w-9 h-9 flex items-center justify-center glass-card rounded-xl hover:bg-white/50 transition shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 text-white flex items-center justify-center font-medium text-sm shadow-md shrink-0">
                  团
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-slate-900 flex items-center gap-1 flex-wrap">
                    {selectedKb.name}
                    <span className="px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-700 text-[9px] font-medium rounded-full select-none">团队知识库</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{selectedKb.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 glass-card p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setWorkbenchMode("detail")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition border-0",
                    workbenchMode === "detail" ? "glass-card-active text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                  )}
                >
                  文件视图
                </button>
                {!selectedKbArchived && (
                  <button
                    type="button"
                    onClick={() => { setWorkbenchMode("manage"); setWorkbenchTab("members"); }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-medium transition border-0",
                      workbenchMode === "manage" ? "glass-card-active text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                    )}
                  >
                    管理工作台
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-0 flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                {workbenchMode === "detail" ? (
                  <motion.div
                    key={`team-detail-${selectedKbId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-hidden min-h-0"
                  >
                    <KnowledgeBaseDetail
                      kbId={selectedKbId}
                      kbName={selectedKb.name}
                      kbType="team"
                      initialRole={isKbAdmin ? "admin" : "member"}
                      teamMemberPerm={isKbAdmin ? "可管理" : "可编辑"}
                      isArchiveView={selectedKbArchived}
                      onBack={() => setViewMode('list')}
                      initialNodes={teamKbNodes[selectedKbId] ?? DEFAULT_TEAM_KB_NODES[selectedKbId] ?? []}
                      fileListDisplayConfig={fileListDisplayConfig}
                      hideHeader
                      onUploadClick={() => {
                        if (selectedKbArchived) return true;
                        const enabledSpec = getEnabledSpec(selectedKbId);
                        if (enabledSpec && enabledSpec.enabled) {
                          setActiveSpec(enabledSpec);
                          setShowUploadSpecModal(true);
                          return true;
                        }
                        return false;
                      }}
                      exportControlEnabled={docExportControl}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`team-manage-${selectedKbId}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-6 h-full overflow-auto"
                  >
                    <div className="flex items-center gap-6 border-b border-white/40 mb-6 pb-2">
                      {([
                        { id: 'members' as const, label: '成员管理' },
                        { id: 'settings' as const, label: '知识库管理' },
                        { id: 'status' as const, label: '团队动态' },
                      ]).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setWorkbenchTab(tab.id)}
                          className={cn(
                            "pb-2 text-sm font-medium transition-all relative border-0 bg-transparent cursor-pointer",
                            workbenchTab === tab.id ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {tab.label}
                          {workbenchTab === tab.id && (
                            <motion.div layoutId="teamWbSubTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    {workbenchTab === 'members' && (
                      <div className="space-y-6">
                        <button
                          type="button"
                          onClick={() => {
                            setMemberSelectorContext('members');
                            setShowMemberSelector(true);
                          }}
                          className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50 w-full hover:bg-slate-100 hover:border-blue-200 transition cursor-pointer text-left"
                        >
                          <Plus className="w-5 h-5 text-slate-400 ml-1 shrink-0" />
                          <span className="flex-1 text-sm font-medium text-slate-400">点击从组织架构选择成员</span>
                          <span className="text-sm font-medium text-blue-600 whitespace-nowrap mr-2">添加</span>
                        </button>
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 mb-3">授权列表</h4>
                          <div className="space-y-2">
                            {(kbMembers[selectedKbId] || []).map((m, i) => (
                              <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">{m.name.slice(0,1)}</div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">{m.name} {m.role && <span className="text-blue-500 text-sm font-normal">({m.role})</span>}</div>
                                  </div>
                                </div>
                                {m.select ? (
                                  <div className="relative">
                                    <button 
                                      onClick={() => setActiveDropdownIndex(activeDropdownIndex === i ? null : i)}
                                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition shadow-2xs"
                                    >
                                      {m.perm} <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400" />
                                    </button>

                                    {activeDropdownIndex === i && (
                                      <>
                                        <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setActiveDropdownIndex(null); }} />
                                        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200/80 rounded-[16px] shadow-[0_12px_32px_rgba(15,23,42,0.12)] py-2.5 z-50 overflow-hidden transform duration-200 ease-out origin-top-right">
                                          {PERMISSION_OPTIONS.map((opt) => {
                                            const isSelected = m.perm === opt.value;
                                            return (
                                              <button
                                                key={opt.value}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  updatePermission(i, opt.value);
                                                  setActiveDropdownIndex(null);
                                                }}
                                                className={cn(
                                                  "w-full flex items-start gap-3.5 px-4 py-2.5 transition-colors text-left border-none cursor-pointer",
                                                  isSelected 
                                                    ? "bg-[#3b82f6]/5 text-blue-600" 
                                                    : "bg-transparent text-slate-700 hover:bg-slate-50"
                                                )}
                                              >
                                                <span className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                                                  {isSelected && <Check className="w-4 h-4 text-blue-600 font-medium" />}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                  <span className={cn(
                                                    "block text-[13.5px] tracking-normal leading-snug mb-1",
                                                    isSelected ? "text-blue-600 font-medium" : "text-slate-800 font-semibold"
                                                  )}>
                                                    {opt.label}
                                                  </span>
                                                  <span className="block text-sm leading-normal text-slate-400 font-medium">
                                                    {opt.desc}
                                                  </span>
                                                </div>
                                              </button>
                                            );
                                          })}
                                          
                                          <div className="h-px bg-slate-100 my-2" />
                                          
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeMember(i);
                                              setActiveDropdownIndex(null);
                                            }}
                                            className="w-full py-2.5 text-center text-rose-600 hover:bg-rose-50 text-[13.5px] font-medium tracking-wide transition-colors border-none bg-transparent cursor-pointer flex justify-center items-center"
                                          >
                                            移除
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mr-2">
                                    <span className="text-sm font-medium text-slate-500">{m.perm}</span>
                                    {m.role === "知识库创建者" && !selectedKbArchived && (
                                      <button
                                        type="button"
                                        onClick={openTransferModal}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 border-0 bg-transparent cursor-pointer px-0"
                                      >
                                        转让
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {workbenchTab === 'settings' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8 pb-12 text-left"
                      >
                        {/* 团队知识库设置 */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                            <Settings className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-medium text-slate-900">团队知识库设置</h3>
                          </div>
                          <div className="space-y-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">团队知识库名称</label>
                                  <input type="text" value={selectedKb.name} readOnly className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 focus:bg-white outline-none transition-all" placeholder="团队知识库名称" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">简介描述</label>
                                  <textarea rows={2} value={selectedKb.desc} readOnly className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 focus:bg-white outline-none resize-none transition-all" placeholder="团队知识库描述"></textarea>
                                </div>
                              </div>
                          </div>
                        </section>

                        {/* 文档设置 */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-medium text-slate-900">文档设置</h3>
                          </div>
                          <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 group hover:border-blue-200 transition-all md:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                        <Shield className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-slate-900">开启明文水印</h4>
                                        <p className="text-sm text-slate-400 mt-0.5">成员查看、打印时注入带有 ID 的水印。</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => setDocWatermark(!docWatermark)}
                                      className={cn("w-10 h-5 rounded-full relative transition-colors shrink-0", docWatermark ? "bg-blue-600" : "bg-slate-200")}
                                    >
                                      <div className={cn("absolute top-0.5 bg-white w-4 h-4 rounded-full transition-all", docWatermark ? "right-0.5" : "left-0.5")} />
                                    </button>
                                  </div>
                                  {docWatermark && (
                                    <div className="pt-3 border-t border-slate-200/80 space-y-3">
                                    <div ref={watermarkVarDropdownRef} className="relative">
                                      <label className="block text-xs font-medium text-slate-500 mb-1.5">水印内容模板</label>
                                      <button
                                        type="button"
                                        onClick={() => setWatermarkVarDropdownOpen((v) => !v)}
                                        className={cn(
                                          "w-full min-h-[40px] px-3 py-2 bg-white border rounded-lg text-sm text-left flex items-center justify-between gap-2 transition",
                                          watermarkVarDropdownOpen
                                            ? "border-blue-400 ring-2 ring-blue-500/20"
                                            : "border-slate-200 hover:border-slate-300"
                                        )}
                                      >
                                        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                          {watermarkSelectedVars.length === 0 ? (
                                            <span className="text-slate-400">请选择水印变量</span>
                                          ) : (
                                            watermarkSelectedVars.map((key) => {
                                              const opt = WATERMARK_VAR_OPTIONS.find((o) => o.key === key);
                                              return (
                                                <span
                                                  key={key}
                                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                                                >
                                                  {opt?.label}
                                                </span>
                                              );
                                            })
                                          )}
                                        </div>
                                        <ChevronDown
                                          className={cn(
                                            "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                                            watermarkVarDropdownOpen && "rotate-180"
                                          )}
                                        />
                                      </button>
                                      <AnimatePresence>
                                        {watermarkVarDropdownOpen && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
                                          >
                                            {WATERMARK_VAR_OPTIONS.map((opt) => {
                                              const checked = watermarkSelectedVars.includes(opt.key);
                                              return (
                                                <button
                                                  key={opt.key}
                                                  type="button"
                                                  onClick={() => {
                                                    setWatermarkSelectedVars((prev) =>
                                                      checked
                                                        ? prev.filter((k) => k !== opt.key)
                                                        : [...prev, opt.key]
                                                    );
                                                  }}
                                                  className={cn(
                                                    "w-full px-3 py-2.5 text-sm text-left flex items-center gap-2.5 hover:bg-slate-50 transition border-0 bg-transparent cursor-pointer",
                                                    checked && "bg-blue-50/50"
                                                  )}
                                                >
                                                  <span
                                                    className={cn(
                                                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition",
                                                      checked
                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                        : "border-slate-300 bg-white"
                                                    )}
                                                  >
                                                    {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                                                  </span>
                                                  <span className="font-medium text-slate-800">{opt.label}</span>
                                                  <span className="text-xs text-slate-400 ml-auto font-mono">{opt.token}</span>
                                                </button>
                                              );
                                            })}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                      {watermarkSelectedVars.length > 0 && (
                                        <p className="text-xs text-slate-400 mt-2">
                                          预览：<span className="text-slate-600 font-mono">{watermarkContent}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  )}
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                      <Download className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-slate-900">导出控制</h4>
                                      <p className="text-sm text-slate-400 mt-0.5">限制成员批量导出团队文档。</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setDocExportControl(!docExportControl)}
                                    className={cn("w-10 h-5 rounded-full relative transition-colors shrink-0", docExportControl ? "bg-blue-600" : "bg-slate-200")}
                                  >
                                    <div className={cn("absolute top-0.5 bg-white w-4 h-4 rounded-full transition-all", docExportControl ? "right-0.5" : "left-0.5")} />
                                  </button>
                                </div>
                              </div>
                          </div>
                        </section>

                        {/* 模板设置 */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                            <FileArchive className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-medium text-slate-900">模板设置</h3>
                          </div>
                          <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-slate-900">团队专用模板</h4>
                                <button 
                                  onClick={() => setShowTemplateSourceModal(true)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" /> 上传模板
                                </button>
                              </div>

                              {kbTemplates[selectedKbId]?.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                  <FileArchive className="w-12 h-12 text-slate-200 mb-3" />
                                  <b className="text-slate-400 text-sm">暂未上传团队模板</b>
                                  <p className="text-sm text-slate-400 mt-1 max-w-[200px] text-center font-medium">您可以上传标准化的 Word、Excel 或 PPT 模板，供团队成员快速参考复用。</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {kbTemplates[selectedKbId]?.map((t) => (
                                    <div key={t.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium text-sm",
                                          t.type === 'doc' ? "bg-blue-500" : "bg-emerald-500"
                                        )}>
                                          {t.type === 'doc' ? 'W' : 'X'}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600">{t.name}</div>
                                          <div className="text-sm text-slate-400 font-medium mt-0.5">
                                            {t.size} · 由 {t.uploader} 上传于 {t.date}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => showToast(`正在下载模板「${t.name}」`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><Download className="w-4 h-4"/></button>
                                        <button
                                          onClick={() => {
                                            setKbTemplates(prev => ({
                                              ...prev,
                                              [selectedKbId]: (prev[selectedKbId] || []).filter(x => x.id !== t.id)
                                            }));
                                            showToast(`已删除模板「${t.name}」`);
                                          }}
                                          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500"
                                        ><Trash2 className="w-4 h-4"/></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </section>

                        {/* 资料上传规范 */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                            <ListChecks className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-medium text-slate-900">资料上传规范</h3>
                          </div>
                          <div className="space-y-6">
                              {/* 启用状态开关 */}
                              <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
                                <div>
                                  <h4 className="text-sm font-medium text-slate-900">资料上传规范</h4>
                                  <p className="text-sm text-slate-400 mt-1">配置上传时的元数据字段和资料类型校验规则。</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      const next = !specEnabled;
                                      setSpecEnabled(next);
                                      if (!next) {
                                        setEditingFieldId(null);
                                        setEditingFieldDraft(null);
                                        setEditingRuleId(null);
                                        setEditingRuleDraft(null);
                                      }
                                    }}
                                    className={cn("w-12 h-6 rounded-full relative transition-colors", specEnabled ? "bg-blue-600" : "bg-slate-200")}
                                  >
                                    <div className={cn("absolute top-1 bg-white w-4 h-4 rounded-full transition-all shadow-sm", specEnabled ? "left-7" : "left-1")} />
                                  </button>
                                </div>
                              </div>

                              <div className={cn("space-y-6 transition-opacity", !specEnabled && "opacity-45 pointer-events-none select-none")}>
                              {/* 元数据字段配置 */}
                              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                  <div className="flex items-center gap-2">
                                    <ListChecks className="w-4 h-4 text-blue-600" />
                                    <h3 className="text-sm font-medium text-slate-800">元数据字段配置</h3>
                                    <span className="text-xs text-slate-400 font-medium">
                                      ({spec.metadataFields.length} 个字段)
                                    </span>
                                  </div>
                                  <button
                                    onClick={handleAddField}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> 新增
                                  </button>
                                </div>
                                {spec.metadataFields.length === 0 ? (
                                  <div className="py-8 text-center">
                                    <ListChecks className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400 font-medium">暂无元数据字段</p>
                                    <p className="text-xs text-slate-300 mt-1">点击「新增」开始配置</p>
                                  </div>
                                ) : (
                                  <>
                                    {/* 列表式查看模式 */}
                                    <div className={cn("overflow-x-auto", editingFieldId && "hidden")}>
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b border-slate-100 bg-slate-50/30">
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">字段名称</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">字段编码</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">输入类型</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-16">必填</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">文件列表展示</th>
                                            <th className="px-2 py-2.5 text-center text-xs font-medium text-slate-500 whitespace-nowrap w-16">排序</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {spec.metadataFields.sort((a, b) => a.sortOrder - b.sortOrder).map((field) => (
                                            <tr key={field.id} className="hover:bg-slate-50/50">
                                              <td className="px-4 py-3">
                                                <span className="text-sm text-slate-800 font-medium">{field.name}</span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <span className="text-sm text-slate-600 font-mono">{field.code}</span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <span className="text-sm text-slate-600">{FIELD_TYPE_LABELS[field.inputType] || field.inputType}</span>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className={cn("text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap", field.required ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500")}>
                                                  {field.required ? '必填' : '选填'}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className={cn("text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap", field.showInFileList ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>
                                                  {field.showInFileList ? '展示' : '不展示'}
                                                </span>
                                              </td>
                                              <td className="px-2 py-3 text-center whitespace-nowrap">
                                                <span className="text-sm text-slate-600">{field.sortOrder}</span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                  <button onClick={() => handleStartEditField(field)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Pencil className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={() => handleDeleteField(field.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* 卡片式编辑模式 */}
                                    <div className={cn("p-4 space-y-3", !editingFieldId && "hidden")}>
                                      {spec.metadataFields.filter(f => f.id === editingFieldId).map((field) => (
                                        <div key={field.id} className="border border-blue-300 bg-blue-50/30 rounded-xl p-4">
                                          {/* 字段名称 */}
                                          <div className="mb-4">
                                            <label className="text-xs text-slate-500 block mb-1.5">字段名称</label>
                                            <input
                                              type="text"
                                              value={editingFieldDraft?.name || ''}
                                              onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft!, name: e.target.value })}
                                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="请输入字段名称"
                                            />
                                          </div>

                                          {/* 字段编码、必填、文件列表展示 */}
                                          <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">字段编码</label>
                                              <input
                                                type="text"
                                                value={editingFieldDraft?.code || ''}
                                                onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft!, code: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="field_code"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">是否必填</label>
                                              <button
                                                onClick={() => setEditingFieldDraft({ ...editingFieldDraft!, required: !editingFieldDraft?.required })}
                                                className={cn("w-full px-3 py-2 rounded-lg text-sm font-medium transition", editingFieldDraft?.required ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-50 text-slate-600 border border-slate-200")}
                                              >
                                                {editingFieldDraft?.required ? '必填' : '选填'}
                                              </button>
                                            </div>
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">是否在文件列表展示</label>
                                              <button
                                                onClick={() => setEditingFieldDraft({ ...editingFieldDraft!, showInFileList: !editingFieldDraft?.showInFileList })}
                                                className={cn("w-full px-3 py-2 rounded-lg text-sm font-medium transition", editingFieldDraft?.showInFileList ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200")}
                                              >
                                                {editingFieldDraft?.showInFileList ? '展示' : '不展示'}
                                              </button>
                                            </div>
                                          </div>

                                          {/* 输入类型、默认值、排序号 */}
                                          <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">输入类型</label>
                                              <select
                                                value={editingFieldDraft?.inputType || 'single_text'}
                                                onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft!, inputType: e.target.value as any })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              >
                                                <option value="single_text">文本框</option>
                                                <option value="number">数字</option>
                                                <option value="date">日期</option>
                                                <option value="radio">单选框</option>
                                                <option value="checkbox">多选框</option>
                                              </select>
                                            </div>
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">默认值</label>
                                              <input
                                                type="text"
                                                value={editingFieldDraft?.defaultValue || ''}
                                                onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft!, defaultValue: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="默认值"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">排序号</label>
                                              <input
                                                type="number"
                                                value={editingFieldDraft?.sortOrder || ''}
                                                onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft!, sortOrder: parseInt(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="排序号"
                                              />
                                            </div>
                                          </div>

                                          {/* 提示说明 */}
                                          <div className="mb-4">
                                            <label className="text-xs text-slate-500 block mb-1.5">提示说明</label>
                                            <textarea
                                              rows={2}
                                              value={editingFieldDraft?.placeholder || ''}
                                              onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft!, placeholder: e.target.value })}
                                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                              placeholder="输入提示说明..."
                                            />
                                          </div>

                                          {/* 候选选项 - 根据输入类型动态显示 */}
                                          {(['radio', 'checkbox'] as const).includes(editingFieldDraft?.inputType || 'single_text') && (
                                            <div className="mb-4">
                                              <label className="text-xs text-slate-500 block mb-1.5">候选选项</label>
                                              <div className="flex flex-wrap gap-1 mb-2">
                                                {(editingFieldDraft?.options || []).map((opt, idx) => (
                                                  <span key={idx} className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded flex items-center gap-1">
                                                    {opt.label}
                                                    <button
                                                      onClick={() => {
                                                        const options = [...(editingFieldDraft?.options || [])];
                                                        options.splice(idx, 1);
                                                        setEditingFieldDraft({ ...editingFieldDraft!, options });
                                                      }}
                                                      className="hover:text-purple-800"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                  </span>
                                                ))}
                                              </div>
                                              <input
                                                type="text"
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                                    e.preventDefault();
                                                    setEditingFieldDraft({
                                                      ...editingFieldDraft!,
                                                      options: [...(editingFieldDraft?.options || []), { label: e.target.value.trim(), value: e.target.value.trim() }]
                                                    });
                                                    e.target.value = '';
                                                  }
                                                }}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="输入选项，按回车添加"
                                              />
                                            </div>
                                          )}

                                          {/* 操作按钮 */}
                                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                            <button onClick={() => handleSaveField()} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                                              保存
                                            </button>
                                            <button onClick={() => handleCancelFieldEdit()} className="px-3 py-1.5 bg-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-300 transition">
                                              取消
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* 资料类型配置 */}
                              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <h3 className="text-sm font-medium text-slate-800">资料类型配置</h3>
                                    <span className="text-xs text-slate-400 font-medium">
                                      ({spec.materialTypeRules.length} 条规则)
                                    </span>
                                  </div>
                                  <button
                                    onClick={handleAddRule}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> 新增
                                  </button>
                                </div>
                                {spec.materialTypeRules.length === 0 ? (
                                  <div className="py-8 text-center">
                                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400 font-medium">暂无资料类型规则</p>
                                    <p className="text-xs text-slate-300 mt-1">点击「新增」开始配置</p>
                                  </div>
                                ) : (
                                  <>
                                    {/* 列表式查看模式 */}
                                    <div className={cn("overflow-x-auto", editingRuleId && "hidden")}>
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b border-slate-100 bg-slate-50/30">
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">材料类型</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">登记文件简述</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">文件类型限制</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]">excel表头校验</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">校验提示</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {spec.materialTypeRules.map((rule) => (
                                            <tr key={rule.id} className="hover:bg-slate-50/50">
                                              <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-slate-800">{rule.materialType}</span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <input
                                                  type="checkbox"
                                                  checked={rule.requiredFields.includes('file_description')}
                                                  readOnly
                                                  disabled
                                                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                                />
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                  {rule.fileTypes.slice(0, 4).map((ft, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
                                                      {ft}
                                                    </span>
                                                  ))}
                                                  {rule.fileTypes.length > 4 && (
                                                    <span className="text-xs text-slate-400">+{rule.fileTypes.length - 4}</span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3">
                                                {!rule.excelRequiredHeaders || rule.excelRequiredHeaders.length === 0 ? (
                                                  <span className="text-xs text-slate-400">-</span>
                                                ) : (
                                                  <span className="text-xs text-slate-600" title={rule.excelRequiredHeaders.join('、')}>
                                                    {rule.excelRequiredHeaders.join('、')}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-4 py-3">
                                                <p className="text-xs text-slate-500 line-clamp-1 max-w-[120px]">{rule.validationMessage || '-'}</p>
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                  <button onClick={() => handleStartEditRule(rule)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Pencil className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* 卡片式编辑模式 */}
                                    <div className={cn("p-4 space-y-3", !editingRuleId && "hidden")}>
                                      {spec.materialTypeRules.filter(r => r.id === editingRuleId).map((rule) => (
                                        <div key={rule.id} className="border border-blue-300 bg-blue-50/30 rounded-xl p-4">
                                          {/* 材料类型名称 */}
                                          <div className="mb-4">
                                            <label className="text-xs text-slate-500 block mb-1.5">材料类型名称</label>
                                            <input
                                              type="text"
                                              value={editingRuleDraft?.materialType || ''}
                                              onChange={(e) => setEditingRuleDraft({ ...editingRuleDraft!, materialType: e.target.value })}
                                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="请输入材料类型名称"
                                            />
                                          </div>

                                          {/* 配置项网格 */}
                                          <div className="grid grid-cols-2 gap-4">
                                            {/* 登记文件简述 */}
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">登记文件简述</label>
                                              <input
                                                type="checkbox"
                                                checked={(editingRuleDraft?.requiredFields || []).includes('file_description')}
                                                onChange={(e) => {
                                                  const fields = [...(editingRuleDraft?.requiredFields || [])];
                                                  if (e.target.checked) {
                                                    if (!fields.includes('file_description')) {
                                                      fields.push('file_description');
                                                    }
                                                  } else {
                                                    const idx = fields.indexOf('file_description');
                                                    if (idx > -1) {
                                                      fields.splice(idx, 1);
                                                    }
                                                  }
                                                  setEditingRuleDraft({ ...editingRuleDraft!, requiredFields: fields });
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                              />
                                            </div>

                                            {/* 文件类型限制 - 改为勾选框 */}
                                            <div>
                                              <label className="text-xs text-slate-500 block mb-1.5">文件类型限制</label>
                                              <div className="flex flex-wrap gap-2">
                                                {['doc', 'docx', 'pdf', 'md', 'xlsx', 'xls', 'txt', 'ppt', 'pptx', 'zip', 'rar'].map(type => (
                                                  <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                      type="checkbox"
                                                      checked={(editingRuleDraft?.fileTypes || []).includes(type)}
                                                      onChange={(e) => {
                                                        const types = [...(editingRuleDraft?.fileTypes || [])];
                                                        if (e.target.checked) {
                                                          if (!types.includes(type)) {
                                                            types.push(type);
                                                          }
                                                        } else {
                                                          const idx = types.indexOf(type);
                                                          if (idx > -1) {
                                                            types.splice(idx, 1);
                                                          }
                                                        }
                                                        setEditingRuleDraft({ ...editingRuleDraft!, fileTypes: types });
                                                      }}
                                                      className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs text-slate-600 font-mono">{type}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            </div>

                                            {/* excel表头校验 - 只有选择了表格类文件才显示 */}
                                            {['xlsx', 'xls'].some(t => (editingRuleDraft?.fileTypes || []).includes(t)) && (
                                              <div className="col-span-2">
                                                <label className="text-xs text-slate-500 block mb-1.5">excel表头校验</label>
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                  {(editingRuleDraft?.excelRequiredHeaders || []).map((header, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded flex items-center gap-1">
                                                      {header}
                                                      <button
                                                        onClick={() => {
                                                          const headers = [...(editingRuleDraft?.excelRequiredHeaders || [])];
                                                          headers.splice(idx, 1);
                                                          setEditingRuleDraft({ ...editingRuleDraft!, excelRequiredHeaders: headers });
                                                        }}
                                                        className="hover:text-green-800"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    </span>
                                                  ))}
                                                </div>
                                                <input
                                                  type="text"
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                      e.preventDefault();
                                                      setEditingRuleDraft({
                                                        ...editingRuleDraft!,
                                                        excelRequiredHeaders: [...(editingRuleDraft?.excelRequiredHeaders || []), e.target.value.trim()]
                                                      });
                                                      e.target.value = '';
                                                    }
                                                  }}
                                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                  placeholder="输入表头名称，按回车添加"
                                                />
                                              </div>
                                            )}

                                            {/* 校验不通过提示 */}
                                            <div className={cn('', ['xlsx', 'xls'].some(t => (editingRuleDraft?.fileTypes || []).includes(t)) ? 'col-span-1' : 'col-span-2')}>
                                              <label className="text-xs text-slate-500 block mb-1.5">校验不通过提示</label>
                                              <textarea
                                                rows={3}
                                                value={editingRuleDraft?.validationMessage || ''}
                                                onChange={(e) => setEditingRuleDraft({ ...editingRuleDraft!, validationMessage: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                placeholder="输入校验不通过时的提示信息"
                                              />
                                            </div>
                                          </div>

                                          {/* 操作按钮 */}
                                          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                                            <button onClick={() => handleSaveRule()} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                                              保存
                                            </button>
                                            <button onClick={() => handleCancelRuleEdit()} className="px-3 py-1.5 bg-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-300 transition">
                                              取消
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                              </div>
                          </div>
                        </section>

                        {/* 知识库生命周期 */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                            <FileArchive className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-medium text-slate-900">知识库生命周期</h3>
                          </div>
                          {selectedKbArchived ? (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                              <FileArchive className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-slate-800">该团队知识库已归档</div>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                  归档时间：{selectedKb.updatedAt}。库内内容只读留存，不可再上传、编辑或变更配置。
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-slate-900">归档整个知识库</div>
                                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                    归档后该团队知识库将变为「已归档」状态，停止一切写入与配置变更，仅保留只读查阅能力。
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => showToast(`「${selectedKb.name}」已进入归档流程（演示）`)}
                                  className="shrink-0 px-4 py-2 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-sm font-medium rounded-xl transition shadow-sm"
                                >
                                  归档知识库
                                </button>
                              </div>
                              <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-slate-900">转让团队</div>
                                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                    将团队知识库的管理权转让给其他成员，转让后您将失去管理员权限。
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={openTransferModal}
                                  className="shrink-0 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition shadow-sm"
                                >
                                  转让团队
                                </button>
                              </div>
                            </div>
                          )}
                        </section>
                      </motion.div>
                    )}

                    {workbenchTab === 'status' && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">团队公告</h4>
                          <div className="rounded-xl p-4 border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/80 shadow-sm">
                            <p className="text-sm font-medium text-amber-900 leading-relaxed">
                              低置信度治理结果需在今日 18:00 前确认。
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-4">成员操作动态</h4>
                          <div className="space-y-5 relative py-1 before:absolute before:inset-y-0 before:left-[5px] before:-translate-x-px md:before:left-1/2 md:before:-translate-x-1/2 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-blue-200/40 before:via-blue-300/80 before:to-blue-200/40 before:rounded-full">
                            {[
                              { t: '张敏 更新了文档设置', time: '今日 10:12' },
                              { t: '刘洋 上传了授信资料补录指引.pdf', time: '今日 09:40' },
                              { t: '陈宁 确认了 3 条标签推荐', time: '昨日 18:02' },
                              { t: '系统生成 7 条低置信摘要待确认', time: '待处理', highlight: true },
                            ].map((act, i) => (
                              <div
                                key={i}
                                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                              >
                                <div
                                  className={cn(
                                    "w-3.5 h-3.5 absolute left-0 md:left-1/2 -translate-x-[7px] md:-translate-x-1/2 rounded-full border-[3px] border-white shadow-sm z-10",
                                    act.highlight
                                      ? "bg-blue-600 ring-2 ring-blue-200/80"
                                      : "bg-slate-400 ring-2 ring-slate-200/80"
                                  )}
                                />
                                <div className="ml-7 md:ml-0 md:w-[calc(50%-1.75rem)] md:group-even:-translate-x-3 md:group-odd:translate-x-3">
                                  <div className={cn(
                                    "p-3.5 rounded-xl border shadow-sm transition-colors",
                                    act.highlight
                                      ? "bg-blue-50/70 border-blue-200/80 hover:border-blue-300/80"
                                      : "bg-white/90 border-slate-200/80 hover:border-blue-200/60"
                                  )}>
                                    <div className="text-sm font-medium text-slate-800 leading-snug">{act.t}</div>
                                    <div className={cn(
                                      "text-xs font-medium mt-1.5 tabular-nums",
                                      act.highlight ? "text-blue-600" : "text-slate-500"
                                    )}>
                                      {act.time}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Add New Template Source Modal */}
      <AnimatePresence>
        {showTemplateSourceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-[480px] text-left"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900">选择模板来源</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1 uppercase tracking-wider">Select Template Source</p>
                </div>
                <button onClick={() => setShowTemplateSourceModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    setTemplateSource('local');
                    showToast('已切换至本地上传模式，请选择文件');
                    setShowTemplateSourceModal(false);
                  }}
                  className="p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-5 group text-left"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <b className="block text-base font-medium text-slate-900">直接上传模板</b>
                    <span className="block text-sm font-medium text-slate-500 mt-1">支持 docx, xlsx, pptx 等标准办公文档。</span>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setTemplateSource('personal');
                    setShowPersonalKbPicker(true);
                    setShowTemplateSourceModal(false);
                  }}
                  className="p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-5 group text-left"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                    <Database className="w-7 h-7" />
                  </div>
                  <div>
                    <b className="block text-base font-medium text-slate-900">从我的知识库选择</b>
                    <span className="block text-sm font-medium text-slate-500 mt-1">复用您个人空间中已整理好的标准件。</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPersonalKbPicker && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] shadow-sm border border-[#DEE0E5] p-8 w-full max-w-[600px] text-left flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h3 className="text-lg font-medium text-[#222222]">从我的知识库选择</h3>
                  <p className="text-sm text-[#4B505A] mt-1">浏览并选择知识库中的文件夹或具体文件作为模板</p>
                </div>
                <button onClick={() => setShowPersonalKbPicker(false)} className="p-2 hover:bg-[#F7F9FC] rounded-full text-[#4B505A] transition cursor-pointer border-0 bg-transparent">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto space-y-2 pr-2">
                <div className="text-sm font-medium text-[#4B505A] tracking-wider mb-2">我的运营随手记</div>
                
                <div className="p-3 border border-[#DEE0E5] rounded-xl hover:bg-[#F7F9FC] flex items-center justify-between group cursor-pointer transition-colors" onClick={() => {}}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#222222]">2026年运营规划</div>
                      <div className="text-sm text-[#4B505A] mt-0.5">文件夹 · 包含 3 个模板文件</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#4B505A] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div 
                  className="p-3 border border-[#DEE0E5] rounded-xl hover:bg-[#F7F9FC] flex items-center justify-between group cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F7F9FC] text-[#6473FF] flex items-center justify-center font-medium text-sm border border-[#DEE0E5]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#222222]">个人项目复盘标准版.docx</div>
                      <div className="text-sm text-[#4B505A] mt-0.5">我的运营随手记 / 模板 · 42KB</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        const newId = `new_t_${Date.now()}`;
                        const current = kbTemplates[selectedKbId] || [];
                        setKbTemplates({
                          ...kbTemplates,
                          [selectedKbId]: [...current, { id: newId, name: '个人项目复盘标准版.docx', type: 'doc', size: '42KB', uploader: '管理员 (从个人库导入)', date: '刚刚' }]
                        });
                        setShowPersonalKbPicker(false);
                        showToast(`已成功从个人库导入模板：个人项目复盘标准版.docx`);
                    }}
                    className="px-3 py-1.5 bg-[#6473FF] text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition border-0 cursor-pointer"
                  >
                    导入此文件
                  </button>
                </div>

                <div className="text-sm font-medium text-[#4B505A] tracking-wider mb-2 mt-6">工作日志</div>

                <div 
                  className="p-3 border border-[#DEE0E5] rounded-xl hover:bg-[#F7F9FC] flex items-center justify-between group cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F7F9FC] text-[#6473FF] flex items-center justify-center font-medium text-sm border border-[#DEE0E5]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#222222]">通用会议纪要.docx</div>
                      <div className="text-sm text-[#4B505A] mt-0.5">工作日志 / 2026 · 12KB</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        const newId = `new_t_${Date.now()}_2`;
                        const current = kbTemplates[selectedKbId] || [];
                        setKbTemplates({
                          ...kbTemplates,
                          [selectedKbId]: [...current, { id: newId, name: '通用会议纪要.docx', type: 'doc', size: '12KB', uploader: '管理员 (从个人库导入)', date: '刚刚' }]
                        });
                        setShowPersonalKbPicker(false);
                        showToast(`已成功从个人库导入模板：通用会议纪要.docx`);
                    }}
                    className="px-3 py-1.5 bg-[#6473FF] text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition border-0 cursor-pointer"
                  >
                    导入此文件
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 转让团队 — 从现有成员中选择 */}
      <AnimatePresence>
        {showTransferModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] glass-overlay"
              onClick={() => setShowTransferModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="fixed left-1/2 top-1/2 z-[91] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 glass-modal rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-medium text-slate-900">转让团队管理权</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    从当前团队成员中选择新的创建者，转让后您将失去管理员权限。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 border-0 bg-transparent cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {transferCandidates.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">暂无可转让的成员</p>
                  <p className="text-xs text-slate-400 mt-1">请先在成员管理中添加团队成员</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                  {transferCandidates.map((member) => {
                    const selected = transferSelectedName === member.name;
                    return (
                      <button
                        key={member.name}
                        type="button"
                        onClick={() => setTransferSelectedName(member.name)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer",
                          selected
                            ? "border-blue-300 bg-blue-50/60 ring-1 ring-blue-200"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm shrink-0">
                          {member.name.slice(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">当前权限：{member.perm}</div>
                        </div>
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                            selected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                          )}
                        >
                          {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition border-0 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!transferSelectedName}
                  onClick={handleConfirmTransfer}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  确认转让
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MemberSelectorModal 
        isOpen={showMemberSelector}
        onClose={() => setShowMemberSelector(false)}
        title={memberSelectorContext === 'members' ? '添加团队成员' : '选择成员'}
        onConfirm={(selected) => {
          if (memberSelectorContext === 'members') {
            const currentMembers = kbMembers[selectedKbId] || [];
            const newEntries = selected
              .filter(item => !currentMembers.some(m => m.name === item.name))
              .map(item => ({
                name: item.name,
                role: item.dept || '',
                perm: '可查看',
                select: true,
              }));
            if (newEntries.length === 0) {
              showToast('所选成员均已在授权列表中');
              return;
            }
            setKbMembers({
              ...kbMembers,
              [selectedKbId]: [...currentMembers, ...newEntries],
            });
            showToast(`✓ 已成功添加 ${newEntries.length} 名成员，默认为【可查看】`);
            return;
          }

          const newMembers = selected.map(item => ({
            id: item.id,
            name: item.name,
            dept: item.dept || '未知部门',
            role: '可查看',
            desc: '查看, 复制内容, 打印, 下载',
            avatar: (item as any).avatar,
            type: item.type
          }));
          
          setAuthorizedMembersForCreate(prev => {
            const existingIds = prev.map(m => m.id);
            const filteredNew = newMembers.filter(n => !existingIds.includes(n.id));
            return [...prev, ...filteredNew];
          });
        }}
      />

      {/* 规范上传弹窗 */}
      {showUploadSpecModal && activeSpec && (
        <UploadWithSpecModal
          spec={activeSpec}
          onClose={() => { setShowUploadSpecModal(false); setActiveSpec(null); }}
          onComplete={(batchMetadata, files) => {
            const storedFiles = files.filter((f) => f.storeStatus === 'stored');
            if (storedFiles.length > 0) {
              const newNodes = storedFiles.map((item) => createFileNodeFromUpload(item, batchMetadata));
              setTeamKbNodes((prev) => ({
                ...prev,
                [selectedKbId]: [...(prev[selectedKbId] ?? DEFAULT_TEAM_KB_NODES[selectedKbId] ?? []), ...newNodes],
              }));
            }
            showToast(`已成功入库 ${storedFiles.length} 个文件`);
            setShowUploadSpecModal(false);
            setActiveSpec(null);
          }}
        />
      )}

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
