/**
 * Central icon catalog — modules import from here, never lucide directly.
 */
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Package,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'

export type AppIcon = LucideIcon

export const icons = {
  alert: AlertTriangle, // EmptyState / errors
  building: Building2,
  check: Check,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  eye: Eye,
  eyeOff: EyeOff,
  central: LayoutDashboard,
  spinner: LoaderCircle,
  menu: Menu,
  product: Package,
  panelClose: PanelLeftClose,
  panelOpen: PanelLeft,
  plus: Plus,
  search: Search,
  settings: Settings,
  sale: ShoppingCart,
  trending: TrendingUp,
  import: Upload,
  customer: Users,
  finance: Wallet,
  inventory: Warehouse,
  operation: Wrench,
  close: X,
} as const

export type IconName = keyof typeof icons

export function getIcon(name: IconName): AppIcon {
  return icons[name]
}
