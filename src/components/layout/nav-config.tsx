import {
  LayoutDashboardIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  ReceiptIcon,
  LandmarkIcon,
  Building2Icon,
  ShieldIcon,
  ArrowLeftRightIcon,
  UsersIcon,
  BellIcon,
  SettingsIcon,
  UserRoundIcon,
  CalendarClockIcon,
  LockKeyholeIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  /** Route key used to match active route (for TanStack Router link props). */
  routeKey?: string
  /** Static path or a function that builds a path from the active family id. */
  getTo: (familyId?: string) => string
  /** Optional search/query params to include on the link. */
  search?: Record<string, string>
  /** When set, also treat matching family feature URLs with this scope as active. */
  activeScope?: 'family' | 'personal'
  /** Family feature path prefix for active matching (e.g. /income). */
  activePathPrefix?: string
}

export interface NavSection {
  heading: string
  items: NavItem[]
}

export const familyNavSections: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboardIcon,
        routeKey: 'dashboard',
        getTo: (id) => (id ? `/dashboard/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/dashboard',
      },
      {
        label: 'Savings',
        icon: PiggyBankIcon,
        routeKey: 'savings',
        getTo: (id) => (id ? `/savings/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/savings',
      },
      {
        label: 'Income',
        icon: TrendingUpIcon,
        routeKey: 'income',
        getTo: (id) => (id ? `/income/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/income',
      },
      {
        label: 'Expenses',
        icon: ReceiptIcon,
        routeKey: 'expenses',
        getTo: (id) => (id ? `/expenses/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/expenses',
      },
      {
        label: 'Debts',
        icon: LandmarkIcon,
        routeKey: 'debts',
        getTo: (id) => (id ? `/debts/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/debts',
      },
      {
        label: 'Assets',
        icon: Building2Icon,
        routeKey: 'assets',
        getTo: (id) => (id ? `/assets/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/assets',
      },
      {
        label: 'Insurance',
        icon: ShieldIcon,
        routeKey: 'insurance',
        getTo: (id) => (id ? `/insurance/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/insurance',
      },
      {
        label: 'Transfers',
        icon: ArrowLeftRightIcon,
        routeKey: 'transfers',
        getTo: (id) => (id ? `/transfers/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/transfers',
      },
      {
        label: 'Upcoming',
        icon: CalendarClockIcon,
        routeKey: 'upcoming',
        getTo: (id) => (id ? `/upcoming/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/upcoming',
      },
      {
        label: 'Vault',
        icon: LockKeyholeIcon,
        routeKey: 'vault',
        getTo: (id) => (id ? `/vault/${id}` : '/families'),
        search: { scope: 'family' },
        activeScope: 'family',
        activePathPrefix: '/vault',
      },
    ],
  },
  {
    heading: 'Household',
    items: [
      { label: 'Families', icon: UsersIcon, getTo: () => '/families' },
      {
        label: 'Notifications',
        icon: BellIcon,
        routeKey: 'notifications',
        getTo: () => '/notifications',
      },
      {
        label: 'Family Settings',
        icon: SettingsIcon,
        getTo: (id) => (id ? `/settings/${id}` : '/families'),
      },
    ],
  },
]

export const personalNavSections: NavSection[] = [
  {
    heading: 'Personal',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboardIcon,
        routeKey: 'personal-dashboard',
        getTo: () => '/personal/dashboard',
        activeScope: 'personal',
        activePathPrefix: '/dashboard',
      },
      {
        label: 'Savings',
        icon: PiggyBankIcon,
        routeKey: 'personal-savings',
        getTo: () => '/personal/savings',
        activeScope: 'personal',
        activePathPrefix: '/savings',
      },
      {
        label: 'Income',
        icon: TrendingUpIcon,
        routeKey: 'personal-income',
        getTo: () => '/personal/income',
      },
      {
        label: 'Expenses',
        icon: ReceiptIcon,
        routeKey: 'personal-expenses',
        getTo: () => '/personal/expenses',
      },
      {
        label: 'Debts',
        icon: LandmarkIcon,
        routeKey: 'personal-debts',
        getTo: () => '/personal/debts',
      },
      {
        label: 'Assets',
        icon: Building2Icon,
        routeKey: 'personal-assets',
        getTo: (id) => (id ? `/assets/${id}?scope=personal` : '/personal/assets'),
        activeScope: 'personal',
        activePathPrefix: '/assets',
      },
      {
        label: 'Insurance',
        icon: ShieldIcon,
        routeKey: 'personal-insurance',
        getTo: (id) => (id ? `/insurance/${id}?scope=personal` : '/personal/insurance'),
        activeScope: 'personal',
        activePathPrefix: '/insurance',
      },
      {
        label: 'Friends',
        icon: UserRoundIcon,
        routeKey: 'personal-friends',
        getTo: () => '/personal/friends',
      },
      {
        label: 'Transfers',
        icon: ArrowLeftRightIcon,
        routeKey: 'personal-transfers',
        getTo: () => '/personal/transfers',
      },
      {
        label: 'Upcoming',
        icon: CalendarClockIcon,
        routeKey: 'personal-upcoming',
        getTo: () => '/personal/upcoming',
        activeScope: 'personal',
        activePathPrefix: '/upcoming',
      },
      {
        label: 'Vault',
        icon: LockKeyholeIcon,
        routeKey: 'personal-vault',
        getTo: () => '/personal/vault',
        activeScope: 'personal',
        activePathPrefix: '/vault',
      },
    ],
  },
  {
    heading: 'Account',
    items: [
      { label: 'Families', icon: UsersIcon, getTo: () => '/families' },
      {
        label: 'Notifications',
        icon: BellIcon,
        routeKey: 'notifications',
        getTo: () => '/notifications',
      },
    ],
  },
]

/** @deprecated Use familyNavSections / personalNavSections */
export const navSections = familyNavSections
