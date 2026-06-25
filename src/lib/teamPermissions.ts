export type TeamMemberPerm = '仅查看' | '可查看' | '可评论' | '可编辑' | '可管理';

export const PERMISSION_OPTIONS: { value: TeamMemberPerm; label: string; desc: string }[] = [
  { value: '仅查看', label: '仅查看', desc: '查看' },
  { value: '可查看', label: '可查看', desc: '查看，复制内容，下载' },
  { value: '可评论', label: '可评论', desc: '查看，复制内容，下载，评论' },
  { value: '可编辑', label: '可编辑', desc: '查看，复制内容，上传，下载，评论，编辑，删除' },
  { value: '可管理', label: '可管理', desc: '拥有文件(夹)所有权限' },
];

export function getPermissionDesc(role: string): string {
  return PERMISSION_OPTIONS.find((o) => o.value === role)?.desc ?? role;
}

export const CURRENT_TEAM_USER = '张敏';

export function canUploadInTeam(perm: TeamMemberPerm): boolean {
  return perm === '可编辑' || perm === '可管理';
}

export function canManageAllGovernance(perm: TeamMemberPerm): boolean {
  return perm === '可管理';
}

/** 所有权限用户均可查看治理结果 */
export function canViewGovernance(_perm: TeamMemberPerm): boolean {
  return true;
}

/** 可管理：全部文件；可上传：仅自己上传的文件 */
export function canProcessGovernance(
  perm: TeamMemberPerm,
  fileCreator?: string,
  currentUser: string = CURRENT_TEAM_USER,
): boolean {
  if (perm === '可管理') return true;
  if (canUploadInTeam(perm) && fileCreator === currentUser) return true;
  return false;
}
