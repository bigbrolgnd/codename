export const ADMIN_ROUTES = {
  OVERVIEW: 'overview',
  INSIGHTS: 'insights',
  CALENDAR: 'calendar',
  STAFF: 'staff',
  MARKETING: 'marketing',
  SETTINGS: 'settings',
} as const;

export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];