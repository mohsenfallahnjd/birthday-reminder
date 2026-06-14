import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Bell,
  Cake,
  Calendar,
  ChevronLeft,
  Clock,
  Copy,
  CreditCard,
  Gift,
  Heart,
  Lock,
  Pencil,
  PartyPopper,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const icons = {
  cake: Cake,
  gift: Gift,
  party: PartyPopper,
  users: Users,
  bell: Bell,
  calendar: Calendar,
  sparkles: Sparkles,
  heart: Heart,
  wallet: Wallet,
  card: CreditCard,
  copy: Copy,
  share: Share2,
  pencil: Pencil,
  trash: Trash2,
  search: Search,
  "user-plus": UserPlus,
  "chevron-left": ChevronLeft,
  clock: Clock,
  lock: Lock,
  archive: Archive,
  "rotate-ccw": RotateCcw,
} as const;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, className, size = 18, strokeWidth = 1.5 }: IconProps) {
  const Lucide: LucideIcon = icons[name];
  return (
    <Lucide
      className={cn("shrink-0 text-muted", className)}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
