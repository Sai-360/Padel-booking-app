export type MemberType = 'GLOBAL' | 'SITE' | 'FREE';

export interface Member {
  id: string;
  matricule: string;
  name: string;
  type: 'GLOBAL' | 'SITE' | 'FREE';
  siteId?: string | null;
  unpaidBalance: number;
  blockedUntil?: string | null;
  adminRole?: 'NONE' | 'GLOBAL_ADMIN' | 'SITE_ADMIN';
}
