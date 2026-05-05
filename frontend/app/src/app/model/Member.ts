export type MemberType = 'GLOBAL' | 'SITE' | 'FREE';

export interface Member {
  id: string;
  matricule: string;
  name: string;
  type: MemberType;
  siteId?: string;
  unpaidBalance: number;
  blockedUntil?: string;
}
