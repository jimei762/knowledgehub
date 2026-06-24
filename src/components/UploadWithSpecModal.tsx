import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  RefreshCw,
  Minus,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type {
  CollectionSpec,
  MetadataField,
  UploadFileItem,
  FileValidationStatus,
} from '../types';

interface UploadWithSpecModalProps {
  spec: CollectionSpec;
  onClose: () => void;
  onComplete: (batchMetadata: Record<string, string>, files: UploadFileItem[]) => void;
}

const STEP_LABELS = ['基础元数据录入', '文件选择与资料类型配置', '校验结果与入库'];

export const UploadWithSpecModal: React.FC<UploadWithSpecModalProps> = ({
  spec,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [batchMetadata, setBatchMetadata] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    spec.metadataFields.forEach((f) => {
      if (f.scope === 'batch' && f.defaultValue) {
        init[f.code] = f.defaultValue;
      }
    });
    return init;
  });
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const batchFields = useMemo(
    () =>
      spec.metadataFields
        .filter((f) => f.scope === 'batch')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [spec.metadataFields]
  );

  const fileFields = useMemo(
    () =>
      spec.metadataFields
        .filter((f) => f.scope === 'file')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [spec.metadataFields]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Step 1 helpers ---
  const isBatchValid = batchFields
    .filter((f) => f.required)
    .every((f) => batchMetadata[f.code]?.trim());

  const handleBatchChange = (code: string, value: string) => {
    setBatchMetadata((prev) => ({ ...prev, [code]: value }));
  };

  // --- Step 2 helpers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const filesArray: File[] = Array.from(selected);
    const newFiles: UploadFileItem[] = filesArray.map((file) => ({
      id: Math.random().toString(36).slice(2, 10),
      file: file,
      fileName: file.name,
      materialType: '',
      fieldValues: {},
      fileTypeValidation: 'pending',
      excelHeaderValidation: 'not_applicable',
      requiredFieldStatus: 'missing',
      storeStatus: 'waiting',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateFileType = (fileName: string, materialType: string): FileValidationStatus => {
    const rule = spec.materialTypeRules.find((r) => r.materialType === materialType);
    if (!rule) return 'pending';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return rule.fileTypes.includes(ext) ? 'passed' : 'failed';
  };

  const validateExcelHeaders = (fileName: string, materialType: string): FileValidationStatus => {
    const rule = spec.materialTypeRules.find((r) => r.materialType === materialType);
    if (!rule || !rule.excelRequiredHeaders || rule.excelRequiredHeaders.length === 0) {
      return 'not_applicable';
    }
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'xlsx' && ext !== 'xls') return 'not_applicable';
    // Mock: pass if "标准" in name, fail otherwise
    return fileName.includes('标准') ? 'passed' : 'failed';
  };

  const getRuleForMaterialType = (materialType: string) =>
    spec.materialTypeRules.find((r) => r.materialType === materialType);

  const handleMaterialTypeChange = (fileId: string, materialType: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const ftVal = validateFileType(f.fileName, materialType);
        const ehVal = validateExcelHeaders(f.fileName, materialType);
        const rule = getRuleForMaterialType(materialType);
        const requiredCodes = rule?.requiredFields || [];
        const filled = requiredCodes.every(
          (code) => f.fieldValues[code]?.trim()
        );
        const failed = ftVal === 'failed' || ehVal === 'failed';
        return {
          ...f,
          materialType,
          fileTypeValidation: ftVal,
          excelHeaderValidation: ehVal,
          requiredFieldStatus: filled ? 'filled' : 'missing',
          storeStatus: 'waiting' as const,
          errorMessage: failed ? rule?.validationMessage : undefined,
        };
      })
    );
  };

  const handleFileFieldChange = (fileId: string, fieldCode: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const newValues = { ...f.fieldValues, [fieldCode]: value };
        const rule = getRuleForMaterialType(f.materialType);
        const requiredCodes = rule?.requiredFields || [];
        const filled = requiredCodes.every((code) => newValues[code]?.trim());
        return { ...f, fieldValues: newValues, requiredFieldStatus: filled ? 'filled' : 'missing' };
      })
    );
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmitStore = () => {
    let hasError = false;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.materialType === '') {
          hasError = true;
          return { ...f, storeStatus: 'fix_required' as const, errorMessage: '请选择材料类型' };
        }
        if (f.fileTypeValidation === 'failed') {
          hasError = true;
          const rule = getRuleForMaterialType(f.materialType);
          return {
            ...f,
            storeStatus: 'fix_required' as const,
            errorMessage: rule?.validationMessage || '文件类型校验不通过',
          };
        }
        if (f.excelHeaderValidation === 'failed') {
          hasError = true;
          const rule = getRuleForMaterialType(f.materialType);
          return {
            ...f,
            storeStatus: 'fix_required' as const,
            errorMessage: rule?.validationMessage || 'Excel表头校验不通过',
          };
        }
        if (f.requiredFieldStatus === 'missing') {
          hasError = true;
          return { ...f, storeStatus: 'fix_required' as const, errorMessage: '登记文件简述未填写' };
        }
        return { ...f, storeStatus: 'stored' as const, errorMessage: undefined };
      })
    );
    if (hasError) {
      showToast('部分文件校验未通过，请修正后重试');
      setCurrentStep(2);
    } else {
      setCurrentStep(2);
    }
  };

  // --- Step 3 helpers ---
  const handleRevalidate = () => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.storeStatus !== 'fix_required') return f;
        const ftVal = validateFileType(f.fileName, f.materialType);
        const ehVal = validateExcelHeaders(f.fileName, f.materialType);
        const rule = getRuleForMaterialType(f.materialType);
        const requiredCodes = rule?.requiredFields || [];
        const filled = requiredCodes.every((code) => f.fieldValues[code]?.trim());

        if (ftVal === 'failed' || ehVal === 'failed') {
          return {
            ...f,
            fileTypeValidation: ftVal,
            excelHeaderValidation: ehVal,
            storeStatus: 'fix_required' as const,
            errorMessage: rule?.validationMessage || '校验不通过',
          };
        }
        if (!filled) {
          return { ...f, storeStatus: 'fix_required' as const, errorMessage: '登记文件简述未填写' };
        }
        return {
          ...f,
          fileTypeValidation: ftVal,
          excelHeaderValidation: ehVal,
          requiredFieldStatus: 'filled' as const,
          storeStatus: 'stored' as const,
          errorMessage: undefined,
        };
      })
    );
    showToast('已重新校验');
  };

  const allStored = files.length > 0 && files.every((f) => f.storeStatus === 'stored');

  // --- Render helpers ---
  const renderFieldInput = (
    field: MetadataField,
    value: string,
    onChange: (val: string) => void
  ) => {
    const baseClass =
      'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all';
    switch (field.inputType) {
      case 'single_text':
        return (
          <input
            type="text"
            className={baseClass}
            placeholder={field.placeholder || `请输入${field.name}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'multi_text':
        return (
          <textarea
            className={cn(baseClass, 'min-h-[80px] resize-y')}
            placeholder={field.placeholder || `请输入${field.name}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className={baseClass}
            placeholder={field.placeholder || `请输入${field.name}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className={baseClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'dropdown':
        return (
          <select className={baseClass} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">请选择</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="flex flex-wrap gap-4 mt-1">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={field.code}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex flex-wrap gap-4 mt-1">
            {field.options?.map((opt) => {
              const checked = value
                ? value.split(',').includes(opt.value)
                : false;
              return (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={checked}
                    onChange={() => {
                      const current = value ? value.split(',').filter(Boolean) : [];
                      const next = checked
                        ? current.filter((v) => v !== opt.value)
                        : [...current, opt.value];
                      onChange(next.join(','));
                    }}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      case 'person':
        return (
          <input
            type="text"
            className={baseClass}
            placeholder="请输入人员姓名"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'department':
        return (
          <input
            type="text"
            className={baseClass}
            placeholder="请输入部门名称"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  const renderValidationIcon = (status: FileValidationStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'not_applicable':
        return <Minus className="w-4 h-4 text-slate-300" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-300" />;
    }
  };

  const renderStoreBadge = (status: UploadFileItem['storeStatus']) => {
    const map: Record<string, { label: string; cls: string }> = {
      waiting: { label: '待入库', cls: 'bg-slate-100 text-slate-500' },
      stored: { label: '已入库', cls: 'bg-emerald-50 text-emerald-600' },
      fix_required: { label: '待修正', cls: 'bg-amber-50 text-amber-600' },
      store_failed: { label: '入库失败', cls: 'bg-rose-50 text-rose-600' },
    };
    const info = map[status] || map.waiting;
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', info.cls)}>
        {info.label}
      </span>
    );
  };

  // --- Step renders ---
  const renderStep1 = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {batchFields.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">无批次级元数据字段</div>
        )}
        {batchFields.map((field) => (
          <div key={field.id} className="text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {field.required && <span className="text-rose-500 mr-0.5">*</span>}
              {field.name}
            </label>
            {renderFieldInput(field, batchMetadata[field.code] || '', (val) =>
              handleBatchChange(field.code, val)
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-4 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-100"
        >
          <Upload className="w-4 h-4" />
          选择文件
        </button>
        <span className="text-sm text-slate-400">
          {files.length > 0 ? `已选择 ${files.length} 个文件` : '请选择需要上传的文件'}
        </span>
      </div>

      {files.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">文件名</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">材料类型</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">登记文件简述</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">文件类型校验</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Excel表头校验</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">入库状态</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((f) => {
                  const rule = getRuleForMaterialType(f.materialType);
                  const requiredFileFields = rule
                    ? fileFields.filter((ff) => rule.requiredFields.includes(ff.code))
                    : [];
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-800 truncate max-w-[180px]" title={f.fileName}>
                            {f.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                          value={f.materialType}
                          onChange={(e) => handleMaterialTypeChange(f.id, e.target.value)}
                        >
                          <option value="">请选择</option>
                          {spec.materialTypeRules.map((r) => (
                            <option key={r.id} value={r.materialType}>
                              {r.materialType}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2 min-w-[160px]">
                          {f.materialType === '' && (
                            <span className="text-slate-300 text-xs">请先选择材料类型</span>
                          )}
                          {f.materialType !== '' && requiredFileFields.length === 0 && !rule?.requiredFields.includes('file_description') && (
                            <span className="text-slate-400 text-xs">无必填字段</span>
                          )}
                          {requiredFileFields.map((ff) => (
                            <div key={ff.id}>
                              <label className="block text-xs text-slate-500 mb-0.5">
                                {ff.required && <span className="text-rose-500">*</span>}
                                {ff.name}
                              </label>
                              <input
                                type={ff.inputType === 'number' ? 'number' : 'text'}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-100"
                                placeholder={ff.placeholder || `请输入${ff.name}`}
                                value={f.fieldValues[ff.code] || ''}
                                onChange={(e) =>
                                  handleFileFieldChange(f.id, ff.code, e.target.value)
                                }
                              />
                            </div>
                          ))}
                          {/* 处理特殊字段 file_description（登记文件简述） */}
                          {f.materialType !== '' && rule?.requiredFields.includes('file_description') && (
                            <div key="file_description">
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-100"
                                placeholder="请输入文件简述/标题"
                                value={f.fieldValues['file_description'] || ''}
                                onChange={(e) =>
                                  handleFileFieldChange(f.id, 'file_description', e.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{renderValidationIcon(f.fileTypeValidation)}</td>
                      <td className="px-4 py-3 text-center">{renderValidationIcon(f.excelHeaderValidation)}</td>
                      <td className="px-4 py-3 text-center">{renderStoreBadge(f.storeStatus)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveFile(f.id)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition"
                          title="移除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">文件名</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">材料类型</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">必填字段状态</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">文件类型校验</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Excel表头校验</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">入库状态</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">错误提示</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((f) => {
                const rule = getRuleForMaterialType(f.materialType);
                const requiredFileFields = rule
                  ? fileFields.filter((ff) => rule.requiredFields.includes(ff.code))
                  : [];
                const isFixRequired = f.storeStatus === 'fix_required';
                return (
                  <tr
                    key={f.id}
                    className={cn('transition', isFixRequired && 'bg-amber-50/30')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-800 truncate max-w-[180px]" title={f.fileName}>
                          {f.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isFixRequired ? (
                        <select
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                          value={f.materialType}
                          onChange={(e) => handleMaterialTypeChange(f.id, e.target.value)}
                        >
                          <option value="">请选择</option>
                          {spec.materialTypeRules.map((r) => (
                            <option key={r.id} value={r.materialType}>
                              {r.materialType}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-700">{f.materialType || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isFixRequired && f.requiredFieldStatus === 'missing' ? (
                        <div className="space-y-1">
                          {requiredFileFields.map((ff) => (
                            <div key={ff.id} className="flex items-center gap-1">
                              <input
                                type={ff.inputType === 'number' ? 'number' : 'text'}
                                className="w-full px-2 py-1 bg-white border border-amber-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-100"
                                placeholder={ff.name}
                                value={f.fieldValues[ff.code] || ''}
                                onChange={(e) =>
                                  handleFileFieldChange(f.id, ff.code, e.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            f.requiredFieldStatus === 'filled'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          )}
                        >
                          {f.requiredFieldStatus === 'filled' ? '已填写' : '缺失'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderValidationIcon(f.fileTypeValidation)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderValidationIcon(f.excelHeaderValidation)}
                    </td>
                    <td className="px-4 py-3 text-center">{renderStoreBadge(f.storeStatus)}</td>
                    <td className="px-4 py-3">
                      {f.errorMessage ? (
                        <span className="text-xs text-rose-500">{f.errorMessage}</span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isFixRequired && (
                        <button
                          onClick={() => handleRemoveFile(f.id)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition"
                          title="移除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {files.some((f) => f.storeStatus === 'fix_required') && (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleRevalidate}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            重新校验
          </button>
          <span className="text-xs text-slate-400">修正后点击重新校验</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-800">
              规范上传 — {spec.name}
            </span>
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {STEP_LABELS.map((label, idx) => (
                <React.Fragment key={label}>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition',
                      idx === currentStep
                        ? 'bg-blue-600 text-white'
                        : idx < currentStep
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-100 text-slate-400'
                    )}
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border current:border-transparent">
                      {idx < currentStep ? '✓' : idx + 1}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {idx < STEP_LABELS.length - 1 && (
                    <div
                      className={cn(
                        'w-4 h-px',
                        idx < currentStep ? 'bg-blue-300' : 'bg-slate-200'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                返回上一步
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
            >
              取消
            </button>
            {currentStep === 0 && (
              <button
                disabled={!isBatchValid}
                onClick={() => setCurrentStep(1)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isBatchValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                )}
              >
                下一步：选择文件
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {currentStep === 1 && (
              <button
                onClick={handleSubmitStore}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-100"
              >
                提交入库
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {currentStep === 2 && (
              <button
                onClick={() => onComplete(batchMetadata, files)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  allStored
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                )}
                disabled={!allStored}
              >
                完成
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg animate-pulse">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};
