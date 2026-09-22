export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
}

export const USER_ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.MEMBER, label: 'Member' },
] as const;
