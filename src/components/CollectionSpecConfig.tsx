import React, { useState, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ChevronRight,
  ArrowLeft,
  Settings,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  X,
  Check,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type {
  MetadataInputType,
  MetadataScope,
  MetadataFieldOption,
  MetadataField,
  MaterialTypeRule,
  CollectionSpec,
} from '../types';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const INPUT_TYPE_LABELS: Record<MetadataInputType, string> = {
  single_text: '单行文本',
  multi_text: '多行文本',
  number: '数字',
  date: '日期',
  dropdown: '下拉框',
  radio: '单选',
  checkbox: '多选',
  person: '人员',
  department: '部门',
};

const SCOPE_LABELS: Record<MetadataScope, string> = {
  batch: '批次级',
  file: '文件级',
};

const ALL_INPUT_TYPES: MetadataInputType[] = [
  'single_text',
  'multi_text',
  'number',
  'date',
  'dropdown',
  'radio',
  'checkbox',
  'person',
  'department',
];

const OPTION_INPUT_TYPES: MetadataInputType[] = ['dropdown', 'radio', 'checkbox'];

function uid(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Preset template
// ---------------------------------------------------------------------------

export function buildPresetSpec(): CollectionSpec {
  return {
    id: 'preset_project_delivery',
    name: '项目交付资料收集',
    enabled: true,
    isPreset: true,
    metadataFields: [
      {
        id: uid(),
        name: '项目编号',
        code: 'project_no',
        inputType: 'single_text',
        required: true,
        scope: 'batch',
        sortOrder: 1,
      },
      {
        id: uid(),
        name: '项目名称',
        code: 'project_name',
        inputType: 'single_text',
        required: true,
        scope: 'batch',
        sortOrder: 2,
      },
      {
        id: uid(),
        name: '所属地区',
        code: 'region',
        inputType: 'dropdown',
        required: true,
        scope: 'batch',
        options: [
          { label: '东区', value: 'east' },
          { label: '西区', value: 'west' },
          { label: '南区', value: 'south' },
          { label: '北区', value: 'north' },
        ],
        sortOrder: 3,
      },
      {
        id: uid(),
        name: '所属银行',
        code: 'bank_name',
        inputType: 'single_text',
        required: true,
        scope: 'batch',
        sortOrder: 4,
      },
      // 文件级字段
      {
        id: uid(),
        name: '业务需求标题',
        code: 'business_req_title',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 5,
      },
      {
        id: uid(),
        name: '技术需求名称',
        code: 'tech_req_name',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 6,
      },
      {
        id: uid(),
        name: '操作手册名称',
        code: 'manual_name',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 7,
      },
      {
        id: uid(),
        name: '通报标题',
        code: 'report_title',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 8,
      },
      {
        id: uid(),
        name: '简单描述',
        code: 'brief_desc',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 9,
      },
      {
        id: uid(),
        name: '流程名称',
        code: 'process_name',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 10,
      },
      {
        id: uid(),
        name: '制度名称',
        code: 'policy_name',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 11,
      },
      {
        id: uid(),
        name: '经验主题',
        code: 'experience_topic',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 12,
      },
      {
        id: uid(),
        name: '监管文件标题',
        code: 'reg_file_title',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 13,
      },
      {
        id: uid(),
        name: '内容主题',
        code: 'content_topic',
        inputType: 'single_text',
        required: false,
        scope: 'file',
        sortOrder: 14,
      },
    ],
    materialTypeRules: [
      {
        id: uid(),
        materialType: '指标',
        requiredFields: [],
        fileTypes: ['xlsx', 'xls'],
        excelRequiredHeaders: ['指标名称', '指标计算公式'],
        validationMessage: "指标：上传的 Excel 头两列必须为'指标名称、指标计算公式'，否则校验不通过。",
      },
      {
        id: uid(),
        materialType: '标签',
        requiredFields: [],
        fileTypes: ['xlsx', 'xls'],
        excelRequiredHeaders: ['标签名称', '标签字段'],
        validationMessage: "标签：上传的 Excel 头两列必须为'标签名称、标签字段'，否则校验不通过。",
      },
      {
        id: uid(),
        materialType: '业务需求文档',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '业务需求文档：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '技术需求文档',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '技术需求文档：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '操作手册',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '操作手册：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '风险模型',
        requiredFields: [],
        fileTypes: ['xlsx', 'xls'],
        excelRequiredHeaders: ['模型名称', '模型规则'],
        validationMessage: "风险模型：上传的 Excel 头两列必须为'模型名称、模型规则'，否则校验不通过。",
      },
      {
        id: uid(),
        materialType: '风险案例通报',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'xlsx'],
        validationMessage: '风险案例通报：请填写登记文件简述，仅允许上传 Word / PDF / Excel 文件。',
      },
      {
        id: uid(),
        materialType: '审核规则',
        requiredFields: [],
        fileTypes: ['xlsx', 'xls'],
        excelRequiredHeaders: ['规则名称', '规则逻辑'],
        validationMessage: "审核规则：上传的 Excel 头两列必须为'规则名称、规则逻辑'，否则校验不通过。",
      },
      {
        id: uid(),
        materialType: '业务流程描述',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '业务流程描述：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '内部制度文档',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '内部制度文档：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '内部专家经验',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '内部专家经验：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '外部监管文件',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '外部监管文件：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '行内痛点及需求',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md'],
        validationMessage: '行内痛点及需求：请填写登记文件简述，仅允许上传 Word / PDF / Markdown 文件。',
      },
      {
        id: uid(),
        materialType: '其他',
        requiredFields: ['file_description'],
        fileTypes: ['doc', 'docx', 'pdf', 'md', 'xlsx'],
        validationMessage: '其他材料：请填写登记文件简述，仅允许上传 Word / PDF / Markdown / Excel 文件。',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CollectionSpecConfigProps {
  kbId: string;
  kbName: string;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CollectionSpecConfig: React.FC<CollectionSpecConfigProps> = ({
  kbId,
  kbName,
  onBack,
}) => {
  // ---- Global spec store (per kbId) ----
  const [specsStore, setSpecsStore] = useState<Record<string, CollectionSpec[]>>(() => ({
    [kbId]: [buildPresetSpec()],
  }));

  const specs = specsStore[kbId] ?? [];

  const updateSpecs = useCallback(
    (updater: (prev: CollectionSpec[]) => CollectionSpec[]) => {
      setSpecsStore((prev) => ({ ...prev, [kbId]: updater(prev[kbId] ?? []) }));
    },
    [kbId],
  );

  // ---- Editing state ----
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<'basic' | 'metadata' | 'rules'>('basic');

  // ---- Inline-edit draft for the spec being edited ----
  const [draftSpec, setDraftSpec] = useState<CollectionSpec | null>(null);

  // ---- Toast ----
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ---- Metadata field editing ----
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldDraft, setEditingFieldDraft] = useState<MetadataField | null>(null);

  // ---- Material type rule editing ----
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleDraft, setEditingRuleDraft] = useState<MaterialTypeRule | null>(null);

  // ---- Template picker modal ----
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // ========================================================================
  // Handlers – spec list
  // ========================================================================

  const handleToggleEnabled = (specId: string) => {
    updateSpecs((prev) =>
      prev.map((s) => (s.id === specId ? { ...s, enabled: !s.enabled } : s)),
    );
    const spec = specs.find((s) => s.id === specId);
    showToast(`规范「${spec?.name}」已${spec?.enabled ? '停用' : '启用'}`);
  };

  const handleCopySpec = (spec: CollectionSpec) => {
    const copy: CollectionSpec = {
      ...spec,
      id: uid(),
      name: `${spec.name} (副本)`,
      isPreset: false,
      metadataFields: spec.metadataFields.map((f) => ({ ...f, id: uid() })),
      materialTypeRules: spec.materialTypeRules.map((r) => ({ ...r, id: uid() })),
    };
    updateSpecs((prev) => [...prev, copy]);
    showToast(`已复制规范「${spec.name}」`);
  };

  const handleDeleteSpec = (specId: string) => {
    const spec = specs.find((s) => s.id === specId);
    updateSpecs((prev) => prev.filter((s) => s.id !== specId));
    showToast(`已删除规范「${spec?.name}」`);
  };

  const handleAddSpec = () => {
    const newSpec: CollectionSpec = {
      id: uid(),
      name: '新规范',
      enabled: false,
      metadataFields: [],
      materialTypeRules: [],
    };
    updateSpecs((prev) => [...prev, newSpec]);
    openEditor(newSpec.id, newSpec);
  };

  const handleCreateFromTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleApplyTemplate = (template: CollectionSpec) => {
    const newSpec: CollectionSpec = {
      ...template,
      id: uid(),
      name: `${template.name} (从模板创建)`,
      isPreset: false,
      metadataFields: template.metadataFields.map((f) => ({ ...f, id: uid() })),
      materialTypeRules: template.materialTypeRules.map((r) => ({ ...r, id: uid() })),
    };
    updateSpecs((prev) => [...prev, newSpec]);
    setShowTemplateModal(false);
    openEditor(newSpec.id, newSpec);
    showToast(`已从模板创建规范「${template.name}」`);
  };

  // ========================================================================
  // Handlers – spec editor
  // ========================================================================

  const openEditor = (specId: string, spec?: CollectionSpec) => {
    const target = spec ?? specs.find((s) => s.id === specId);
    if (!target) return;
    setEditingSpecId(specId);
    setDraftSpec(JSON.parse(JSON.stringify(target)));
    setEditTab('basic');
    setEditingFieldId(null);
    setEditingFieldDraft(null);
    setEditingRuleId(null);
    setEditingRuleDraft(null);
  };

  const handleSaveSpec = () => {
    if (!draftSpec) return;
    if (!draftSpec.name.trim()) {
      showToast('规范名称不能为空');
      return;
    }
    updateSpecs((prev) => prev.map((s) => (s.id === draftSpec.id ? draftSpec : s)));
    setEditingSpecId(null);
    setDraftSpec(null);
    showToast(`规范「${draftSpec.name}」已保存`);
  };

  const handleCancelEdit = () => {
    setEditingSpecId(null);
    setDraftSpec(null);
    setEditingFieldId(null);
    setEditingFieldDraft(null);
    setEditingRuleId(null);
    setEditingRuleDraft(null);
  };

  // ========================================================================
  // Handlers – metadata fields
  // ========================================================================

  const handleAddField = () => {
    if (!draftSpec) return;
    const newField: MetadataField = {
      id: uid(),
      name: '',
      code: '',
      inputType: 'single_text',
      required: false,
      scope: 'file',
      sortOrder: draftSpec.metadataFields.length + 1,
    };
    setDraftSpec({
      ...draftSpec,
      metadataFields: [...draftSpec.metadataFields, newField],
    });
    setEditingFieldId(newField.id);
    setEditingFieldDraft({ ...newField });
  };

  const handleStartEditField = (field: MetadataField) => {
    setEditingFieldId(field.id);
    setEditingFieldDraft({ ...field });
  };

  const handleSaveField = () => {
    if (!draftSpec || !editingFieldDraft) return;
    if (!editingFieldDraft.name.trim()) {
      showToast('字段名称不能为空');
      return;
    }
    if (!editingFieldDraft.code.trim()) {
      showToast('字段编码不能为空');
      return;
    }
    // Check code uniqueness
    const codeExists = draftSpec.metadataFields.some(
      (f) => f.id !== editingFieldDraft.id && f.code === editingFieldDraft.code,
    );
    if (codeExists) {
      showToast('字段编码已存在，请使用唯一编码');
      return;
    }
    setDraftSpec({
      ...draftSpec,
      metadataFields: draftSpec.metadataFields.map((f) =>
        f.id === editingFieldDraft.id ? editingFieldDraft : f,
      ),
    });
    setEditingFieldId(null);
    setEditingFieldDraft(null);
    showToast('字段已保存');
  };

  const handleCancelEditField = () => {
    // If it was a new empty field, remove it
    if (draftSpec && editingFieldDraft && !editingFieldDraft.name.trim() && !editingFieldDraft.code.trim()) {
      setDraftSpec({
        ...draftSpec,
        metadataFields: draftSpec.metadataFields.filter((f) => f.id !== editingFieldDraft.id),
      });
    }
    setEditingFieldId(null);
    setEditingFieldDraft(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!draftSpec) return;
    setDraftSpec({
      ...draftSpec,
      metadataFields: draftSpec.metadataFields.filter((f) => f.id !== fieldId),
    });
    if (editingFieldId === fieldId) {
      setEditingFieldId(null);
      setEditingFieldDraft(null);
    }
    showToast('字段已删除');
  };

  // ========================================================================
  // Handlers – material type rules
  // ========================================================================

  const handleAddRule = () => {
    if (!draftSpec) return;
    const newRule: MaterialTypeRule = {
      id: uid(),
      materialType: '',
      requiredFields: [],
      fileTypes: [],
      validationMessage: '',
    };
    setDraftSpec({
      ...draftSpec,
      materialTypeRules: [...draftSpec.materialTypeRules, newRule],
    });
    setEditingRuleId(newRule.id);
    setEditingRuleDraft({ ...newRule });
  };

  const handleStartEditRule = (rule: MaterialTypeRule) => {
    setEditingRuleId(rule.id);
    setEditingRuleDraft({ ...rule });
  };

  const handleSaveRule = () => {
    if (!draftSpec || !editingRuleDraft) return;
    if (!editingRuleDraft.materialType.trim()) {
      showToast('材料类型不能为空');
      return;
    }
    setDraftSpec({
      ...draftSpec,
      materialTypeRules: draftSpec.materialTypeRules.map((r) =>
        r.id === editingRuleDraft.id ? editingRuleDraft : r,
      ),
    });
    setEditingRuleId(null);
    setEditingRuleDraft(null);
    showToast('规则已保存');
  };

  const handleCancelEditRule = () => {
    if (draftSpec && editingRuleDraft && !editingRuleDraft.materialType.trim()) {
      setDraftSpec({
        ...draftSpec,
        materialTypeRules: draftSpec.materialTypeRules.filter((r) => r.id !== editingRuleDraft.id),
      });
    }
    setEditingRuleId(null);
    setEditingRuleDraft(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!draftSpec) return;
    setDraftSpec({
      ...draftSpec,
      materialTypeRules: draftSpec.materialTypeRules.filter((r) => r.id !== ruleId),
    });
    if (editingRuleId === ruleId) {
      setEditingRuleId(null);
      setEditingRuleDraft(null);
    }
    showToast('规则已删除');
  };

  // ========================================================================
  // Sub-components
  // ========================================================================

  /** Toggle switch */
  const ToggleSwitch: React.FC<{ on: boolean; onToggle: () => void; disabled?: boolean }> = ({
    on,
    onToggle,
    disabled,
  }) => (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      className={cn(
        'w-10 h-5 rounded-full relative transition-colors shrink-0',
        on ? 'bg-blue-600' : 'bg-slate-200',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div
        className={cn(
          'absolute top-0.5 bg-white w-4 h-4 rounded-full transition-all shadow-sm',
          on ? 'right-0.5' : 'left-0.5',
        )}
      />
    </button>
  );

  /** Options editor for dropdown/radio/checkbox */
  const OptionsEditor: React.FC<{
    options: MetadataFieldOption[];
    onChange: (opts: MetadataFieldOption[]) => void;
  }> = ({ options, onChange }) => (
    <div className="space-y-2 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
        候选选项配置
      </div>
      {(options ?? []).map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={opt.label}
            onChange={(e) => {
              const next = [...options];
              next[idx] = { ...next[idx], label: e.target.value, value: e.target.value };
              onChange(next);
            }}
            placeholder="选项标签"
            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <button
            onClick={() => onChange(options.filter((_, i) => i !== idx))}
            className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...options, { label: '', value: '' }])}
        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors mt-1"
      >
        <Plus className="w-3 h-3" /> 添加选项
      </button>
    </div>
  );

  /** Inline metadata field row (editing or display) */
  const MetadataFieldRow: React.FC<{ field: MetadataField }> = ({ field }) => {
    const isEditing = editingFieldId === field.id;

    if (isEditing && editingFieldDraft) {
      return (
        <tr className="bg-blue-50/30">
          <td colSpan={8} className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">字段名称 *</label>
                <input
                  type="text"
                  value={editingFieldDraft.name}
                  onChange={(e) =>
                    setEditingFieldDraft({ ...editingFieldDraft, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="例：项目编号"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">字段编码 *</label>
                <input
                  type="text"
                  value={editingFieldDraft.code}
                  onChange={(e) =>
                    setEditingFieldDraft({
                      ...editingFieldDraft,
                      code: e.target.value.replace(/\s/g, '_'),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="例：project_no"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">输入类型</label>
                <select
                  value={editingFieldDraft.inputType}
                  onChange={(e) =>
                    setEditingFieldDraft({
                      ...editingFieldDraft,
                      inputType: e.target.value as MetadataInputType,
                      options: OPTION_INPUT_TYPES.includes(e.target.value as MetadataInputType)
                        ? editingFieldDraft.options ?? [{ label: '', value: '' }]
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  {ALL_INPUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {INPUT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">适用范围</label>
                <select
                  value={editingFieldDraft.scope}
                  onChange={(e) =>
                    setEditingFieldDraft({
                      ...editingFieldDraft,
                      scope: e.target.value as MetadataScope,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value="batch">{SCOPE_LABELS.batch}</option>
                  <option value="file">{SCOPE_LABELS.file}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">是否必填</label>
                <div className="flex items-center gap-2 h-[38px]">
                  <ToggleSwitch
                    on={editingFieldDraft.required}
                    onToggle={() =>
                      setEditingFieldDraft({
                        ...editingFieldDraft,
                        required: !editingFieldDraft.required,
                      })
                    }
                  />
                  <span className="text-sm text-slate-600">
                    {editingFieldDraft.required ? '必填' : '选填'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">文件列表展示</label>
                <div className="flex items-center gap-2 h-[38px]">
                  <ToggleSwitch
                    on={!!editingFieldDraft.showInFileList}
                    onToggle={() =>
                      setEditingFieldDraft({
                        ...editingFieldDraft,
                        showInFileList: !editingFieldDraft.showInFileList,
                      })
                    }
                  />
                  <span className="text-sm text-slate-600">
                    {editingFieldDraft.showInFileList ? '展示' : '不展示'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">排序号</label>
                <input
                  type="number"
                  value={editingFieldDraft.sortOrder}
                  onChange={(e) =>
                    setEditingFieldDraft({
                      ...editingFieldDraft,
                      sortOrder: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  min={0}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">默认值</label>
                <input
                  type="text"
                  value={editingFieldDraft.defaultValue ?? ''}
                  onChange={(e) =>
                    setEditingFieldDraft({ ...editingFieldDraft, defaultValue: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="可选"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">占位提示</label>
                <input
                  type="text"
                  value={editingFieldDraft.placeholder ?? ''}
                  onChange={(e) =>
                    setEditingFieldDraft({ ...editingFieldDraft, placeholder: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="可选"
                />
              </div>
              {OPTION_INPUT_TYPES.includes(editingFieldDraft.inputType) && (
                <div className="col-span-2">
                  <OptionsEditor
                    options={editingFieldDraft.options ?? []}
                    onChange={(opts) =>
                      setEditingFieldDraft({ ...editingFieldDraft, options: opts })
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <button
                onClick={handleCancelEditField}
                className="px-4 py-1.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveField}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                保存字段
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="group hover:bg-slate-50/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="text-sm font-medium text-slate-900">{field.name}</span>
            {field.required && (
              <span className="text-rose-500 text-xs">*</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
            {field.code}
          </code>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {INPUT_TYPE_LABELS[field.inputType]}
          </span>
        </td>
        <td className="px-4 py-3">
          {field.required ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <span className="text-slate-300 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-slate-600">{SCOPE_LABELS[field.scope]}</span>
        </td>
        <td className="px-4 py-3 text-center">
          {field.showInFileList ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              展示
            </span>
          ) : (
            <span className="text-slate-300 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-slate-500 font-mono">{field.sortOrder}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleStartEditField(field)}
              className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
              title="编辑"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteField(field.id)}
              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  /** Inline material type rule row */
  const MaterialTypeRuleRow: React.FC<{ rule: MaterialTypeRule }> = ({ rule }) => {
    const isEditing = editingRuleId === rule.id;

    if (isEditing && editingRuleDraft) {
      return (
        <tr className="bg-blue-50/30">
          <td colSpan={6} className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">材料类型 *</label>
                <input
                  type="text"
                  value={editingRuleDraft.materialType}
                  onChange={(e) =>
                    setEditingRuleDraft({ ...editingRuleDraft, materialType: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="例：指标"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  必填业务字段（逗号分隔）
                </label>
                <input
                  type="text"
                  value={editingRuleDraft.requiredFields.join(', ')}
                  onChange={(e) =>
                    setEditingRuleDraft({
                      ...editingRuleDraft,
                      requiredFields: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="例：业务需求标题, 技术需求名称"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  文件类型限制（逗号分隔）
                </label>
                <input
                  type="text"
                  value={editingRuleDraft.fileTypes.join(', ')}
                  onChange={(e) =>
                    setEditingRuleDraft({
                      ...editingRuleDraft,
                      fileTypes: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="例：xlsx, xls, doc, docx"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Excel 必填表头（逗号分隔，可选）
                </label>
                <input
                  type="text"
                  value={editingRuleDraft.excelRequiredHeaders?.join(', ') ?? ''}
                  onChange={(e) =>
                    setEditingRuleDraft({
                      ...editingRuleDraft,
                      excelRequiredHeaders: e.target.value
                        ? e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="例：指标名称, 指标计算公式"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  校验不通过提示
                </label>
                <textarea
                  value={editingRuleDraft.validationMessage}
                  onChange={(e) =>
                    setEditingRuleDraft({
                      ...editingRuleDraft,
                      validationMessage: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                  placeholder="校验不通过时显示的提示信息"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <button
                onClick={handleCancelEditRule}
                className="px-4 py-1.5 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveRule}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                保存规则
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="group hover:bg-slate-50/50 transition-colors">
        <td className="px-4 py-3">
          <span className="text-sm font-medium text-slate-900">{rule.materialType}</span>
        </td>
        <td className="px-4 py-3">
          {rule.requiredFields.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rule.requiredFields.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-300 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {rule.fileTypes.map((ft) => (
              <span
                key={ft}
                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
              >
                .{ft}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          {rule.excelRequiredHeaders && rule.excelRequiredHeaders.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rule.excelRequiredHeaders.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"
                >
                  {h}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-300 text-sm">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-slate-600 line-clamp-2 max-w-[220px]">
            {rule.validationMessage || '—'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleStartEditRule(rule)}
              className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
              title="编辑"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteRule(rule.id)}
              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ========================================================================
  // Render
  // ========================================================================

  // ---- Editor view ----
  if (editingSpecId && draftSpec) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelEdit}
              className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 transition bg-white shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-medium text-slate-900">编辑规范</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {kbName} · {draftSpec.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              取消
            </button>
            <button
              onClick={handleSaveSpec}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              保存规范
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex gap-6">
            {([
              { id: 'basic' as const, label: '基础信息' },
              { id: 'metadata' as const, label: '元数据字段配置' },
              { id: 'rules' as const, label: '资料类型配置' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEditTab(tab.id)}
                className={cn(
                  'text-sm font-medium py-3 transition-all relative',
                  editTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {tab.label}
                {editTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-6">
          {/* ---- Basic info ---- */}
          {editTab === 'basic' && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                    规范名称 *
                  </label>
                  <input
                    type="text"
                    value={draftSpec.name}
                    onChange={(e) => setDraftSpec({ ...draftSpec, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none transition-all"
                    placeholder="请输入规范名称"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">启用状态</h4>
                    <p className="text-sm text-slate-400 mt-0.5">
                      启用后，该规范将在资料收集流程中生效
                    </p>
                  </div>
                  <ToggleSwitch
                    on={draftSpec.enabled}
                    onToggle={() => setDraftSpec({ ...draftSpec, enabled: !draftSpec.enabled })}
                  />
                </div>
                {draftSpec.isPreset && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">
                      此规范为系统预设模板，修改后仍可恢复默认值
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- Metadata fields ---- */}
          {editTab === 'metadata' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-slate-800">元数据字段列表</h3>
                  <span className="text-xs text-slate-400 font-medium">
                    ({draftSpec.metadataFields.length} 个字段)
                  </span>
                </div>
                <button
                  onClick={handleAddField}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> 新增
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        字段名称
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        字段编码
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        输入类型
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        必填
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        适用范围
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        文件列表展示
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        排序号
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {draftSpec.metadataFields.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Settings className="w-10 h-10 text-slate-200 mb-2" />
                            <p className="text-sm text-slate-400 font-medium">暂无元数据字段</p>
                            <p className="text-xs text-slate-300 mt-1">点击「新增」开始配置</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      draftSpec.metadataFields
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((field) => <MetadataFieldRow key={field.id} field={field} />)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- Material type rules ---- */}
          {editTab === 'rules' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-slate-800">资料类型规则列表</h3>
                  <span className="text-xs text-slate-400 font-medium">
                    ({draftSpec.materialTypeRules.length} 条规则)
                  </span>
                </div>
                <button
                  onClick={handleAddRule}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> 新增
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]">
                        材料类型
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[140px]">
                        必填业务字段
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[140px]">
                        文件类型限制
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[140px]">
                        Excel必填表头
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[200px]">
                        校验不通过提示
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {draftSpec.materialTypeRules.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Settings className="w-10 h-10 text-slate-200 mb-2" />
                            <p className="text-sm text-slate-400 font-medium">暂无资料类型规则</p>
                            <p className="text-xs text-slate-300 mt-1">点击「新增」开始配置</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      draftSpec.materialTypeRules.map((rule) => (
                        <MaterialTypeRuleRow key={rule.id} rule={rule} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        )}
      </div>
    );
  }

  // ---- List view ----
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 transition bg-white shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-medium text-slate-900">资料上传规范配置</h2>
            <p className="text-sm text-slate-500 mt-0.5">{kbName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateFromTemplate}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" /> 从模板创建
          </button>
          <button
            onClick={handleAddSpec}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> 新增规范
          </button>
        </div>
      </div>

      {/* Spec list */}
      <div className="flex-1 overflow-auto p-6">
        {specs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Settings className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">暂无收集规范</h3>
            <p className="text-sm text-slate-300 max-w-[360px] text-center mb-6">
              您可以新增规范或从预设模板创建，规范用于约束资料上传时的元数据填写和文件类型校验
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateFromTemplate}
                className="px-5 py-2.5 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> 从模板创建
              </button>
              <button
                onClick={handleAddSpec}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 新增规范
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-[960px]">
            {specs.map((spec) => (
              <div
                key={spec.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center font-medium text-sm shrink-0',
                        spec.enabled
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-slate-900">{spec.name}</h4>
                        {spec.isPreset && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded-md border border-amber-100 uppercase tracking-wider">
                            预设
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">
                          {spec.metadataFields.length} 个字段
                        </span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">
                          {spec.materialTypeRules.length} 条规则
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Enabled toggle */}
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        on={spec.enabled}
                        onToggle={() => handleToggleEnabled(spec.id)}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          spec.enabled ? 'text-blue-600' : 'text-slate-400',
                        )}
                      >
                        {spec.enabled ? '已启用' : '已停用'}
                      </span>
                    </div>

                    <div className="w-px h-6 bg-slate-100" />

                    {/* Actions */}
                    <button
                      onClick={() => openEditor(spec.id)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopySpec(spec)}
                      className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                      title="复制"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSpec(spec.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick preview */}
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <div className="flex flex-wrap gap-1.5">
                    {spec.metadataFields.slice(0, 5).map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100"
                      >
                        {f.name}
                        {f.required && <span className="text-rose-400 ml-0.5">*</span>}
                      </span>
                    ))}
                    {spec.metadataFields.length > 5 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100">
                        +{spec.metadataFields.length - 5} 更多
                      </span>
                    )}
                    {spec.metadataFields.length === 0 && (
                      <span className="text-xs text-slate-300">暂无字段</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template picker modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] text-left overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900">从模板创建规范</h3>
                <p className="text-sm text-slate-400 mt-1">选择预设模板快速创建收集规范</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleApplyTemplate(buildPresetSpec())}
                className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center gap-4 group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <b className="block text-sm font-medium text-slate-900">项目交付资料收集</b>
                  <span className="block text-xs text-slate-500 mt-1">
                    包含 4 个批次级元数据字段、14 条资料类型规则（指标、标签、需求文档、风险模型等）
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </button>
            </div>
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-5 py-2 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
};

export default CollectionSpecConfig;
