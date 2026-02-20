export type DeviceRole = 'MASTER' | 'SLAVE';

const FALLBACK_ROLE: DeviceRole = 'MASTER';

function isDeviceRole(value: string): value is DeviceRole {
  return value === 'MASTER' || value === 'SLAVE';
}

export function getDeviceRole(): DeviceRole {
  const rawRole = import.meta.env.VITE_DEVICE_ROLE;

  if (!rawRole) {
    return FALLBACK_ROLE;
  }

  const normalizedRole = rawRole.trim().toUpperCase();
  return isDeviceRole(normalizedRole) ? normalizedRole : FALLBACK_ROLE;
}
