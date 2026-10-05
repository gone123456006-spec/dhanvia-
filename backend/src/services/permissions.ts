import { permissionKeys, type PermissionKey } from '../domain/enums.js'

type PermissionMap = Partial<Record<PermissionKey, boolean | null | undefined>>

/**
 * Pages and actions that were open to every employee before they became permissions.
 * Employees saved before then keep that access until a Super Admin turns it off.
 */
const legacyDefaults: Partial<Record<PermissionKey, (stored: PermissionMap) => boolean>> = {
  viewCustomers: () => true,
  viewSupport: () => true,
  managePayments: () => true,
  archiveLeads: (stored) => Boolean(stored.assignLeads),
}

/** A member of a custom role gets exactly the role's permissions; otherwise their own. */
export function resolvePermissions(own: PermissionMap | null | undefined, role: PermissionMap | null | undefined): Record<PermissionKey, boolean> {
  if (role) return Object.fromEntries(permissionKeys.map((key) => [key, Boolean(role[key])])) as Record<PermissionKey, boolean>
  const stored = own ?? {}
  return Object.fromEntries(permissionKeys.map((key) => {
    const value = stored[key]
    return [key, typeof value === 'boolean' ? value : (legacyDefaults[key]?.(stored) ?? false)]
  })) as Record<PermissionKey, boolean>
}
