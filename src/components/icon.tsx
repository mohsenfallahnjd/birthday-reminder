import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Cake,
  Calendar,
  CreditCard,
  Gift,
  Heart,
  PartyPopper,
  Sparkles,
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
} as const;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  className?: string;
  size?: number;
};

export function Icon({ name, className, size = 20 }: IconProps) {
  const Lucide: LucideIcon = icons[name];
  return (
    <Lucide
      className={cn("shrink-0 text-party-fuchsia", className)}
      size={size}
      aria-hidden
    />
  );
}
