export type SharePermission = 'view' | 'download' | 'comment';

export function isOthersSharedKb(kbType: string) {
  return kbType === 'personal';
}

export function canSharedDownload(permission: SharePermission = 'view') {
  return permission === 'download' || permission === 'comment';
}

export function canSharedComment(permission: SharePermission = 'view') {
  return permission === 'comment';
}

export function sharedPermissionLabel(permission: SharePermission = 'view') {
  switch (permission) {
    case 'comment':
      return '可查看、下载、评论与收藏';
    case 'download':
      return '可查看、下载与收藏';
    default:
      return '仅可查看与收藏';
  }
}
