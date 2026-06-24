export type OwnerType = 'personal' | 'team' | 'public';
export type Visibility = 'private' | 'team' | 'org' | 'public' | 'custom';
export type LifecycleStatus = 'draft' | 'pending_governance' | 'governing' | 'pending_confirm' | 'published' | 'archived' | 'offline' | 'recycle_bin';
export type GovernanceStatus = 'not_started' | 'running' | 'success' | 'failed' | 'pending_confirm' | 'skipped';
export type PreprocessStatus = 'not_processed' | 'processing' | 'processed' | 'pending_confirm' | 'failed';
export type SourceLabel = 'personal' | 'team' | 'public';
export type DownstreamSyncStatus = 'not_synced' | 'synced' | 'callback_received' | 'sync_failed';

export interface KnowledgeBase {
  id: string;
  name: string;
  ownerType: OwnerType;
  visibility?: Visibility;
  status?: string;
  description?: string;
  updatedAt: string;
  isShared?: boolean;
  shareSettings?: {
    target: 'organization' | 'user' | 'public';
    permission: 'view' | 'download' | 'comment';
    expires: '7d' | '30d' | 'permanent' | 'custom';
    customDate?: string;
    emails?: string[];
    description?: string;
    tags?: string[];
    name?: string;
  };
}

export interface Subscription {
  id: string;
  kbId: string;
  sourceLabel: SourceLabel;
  canCancel: boolean;
  canEdit: boolean;
  knowledgeBase: KnowledgeBase;
}

export interface SourceFile {
  id: string;
  kbId: string;
  name: string;
  format: string;
  size: number;
  version: string;
  lifecycleStatus: LifecycleStatus;
  governanceStatus: GovernanceStatus;
  preprocessStatus: PreprocessStatus;
  sliceCandidateCount: number;
  downstreamSyncStatus: DownstreamSyncStatus;
  ownerId: string;
  updatedAt: string;
}

export interface SliceCandidate {
  id: string;
  content: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'rejected';
  sourcePosition?: string;
}

export interface FilePreprocessDetail {
  fileId: string;
  ocrText: string;
  ocrEntityType?: string;
  summary: string;
  tags: string[];
  qualityReport: {
    score: number;
    readability: string;
    issues: string[];
  };
  sliceCandidates: SliceCandidate[];
}

export interface FavoriteFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  targetId: string; // KB id or File id
  name: string;
  type: 'file' | 'kb';
  folderId: string; // Reference to FavoriteFolder.id or 'default'
  addedAt: string;
  memo?: string;
  tag?: string;
  kbName?: string;
  kbType?: SourceLabel;
  format?: string;
}

// --- 资料收集规范相关类型 ---

export type MetadataInputType = 'single_text' | 'multi_text' | 'number' | 'date' | 'dropdown' | 'radio' | 'checkbox' | 'person' | 'department';
export type MetadataScope = 'batch' | 'file';

export interface MetadataFieldOption {
  label: string;
  value: string;
}

export interface MetadataField {
  id: string;
  name: string;
  code: string;
  inputType: MetadataInputType;
  required: boolean;
  scope: MetadataScope;
  options?: MetadataFieldOption[];
  defaultValue?: string;
  placeholder?: string;
  sortOrder: number;
}

export interface MaterialTypeRule {
  id: string;
  materialType: string;
  requiredFields: string[]; // MetadataField.code[]
  fileTypes: string[]; // e.g. ['xlsx', 'xls', 'doc', 'docx']
  excelRequiredHeaders?: string[]; // e.g. ['指标名称', '指标计算公式']
  validationMessage: string;
}

export interface CollectionSpec {
  id: string;
  name: string;
  enabled: boolean;
  metadataFields: MetadataField[];
  materialTypeRules: MaterialTypeRule[];
  isPreset?: boolean;
}

// 上传流程中的文件校验状态
export type FileValidationStatus = 'pending' | 'passed' | 'failed' | 'not_applicable';
export type FileStoreStatus = 'waiting' | 'stored' | 'fix_required' | 'store_failed';

export interface UploadFileItem {
  id: string;
  file: File;
  fileName: string;
  materialType: string;
  fieldValues: Record<string, string>;
  fileTypeValidation: FileValidationStatus;
  excelHeaderValidation: FileValidationStatus;
  requiredFieldStatus: 'filled' | 'missing';
  storeStatus: FileStoreStatus;
  errorMessage?: string;
}

