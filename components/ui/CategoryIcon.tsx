import {
  Utensils, Car, ShoppingBag, Home, Zap, HeartPulse, GraduationCap,
  Film, Repeat, Smartphone, Building, ShoppingCart, Smile, Plane,
  TrendingUp, CircleDot, Briefcase, Laptop, Store, Wallet, Gift,
  PiggyBank, Target, Baby, Music, Dumbbell, LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'utensils': Utensils,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'home': Home,
  'zap': Zap,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'film': Film,
  'repeat': Repeat,
  'smartphone': Smartphone,
  'building': Building,
  'shopping-cart': ShoppingCart,
  'smile': Smile,
  'plane': Plane,
  'trending-up': TrendingUp,
  'circle-dot': CircleDot,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'store': Store,
  'wallet': Wallet,
  'gift': Gift,
  'piggy-bank': PiggyBank,
  'target': Target,
  'baby': Baby,
  'ring': Gift,
  'music': Music,
  'dumbbell': Dumbbell,
};

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
  withBackground?: boolean;
  bgOpacity?: number;
}

export function CategoryIcon({
  icon,
  color = '#6366f1',
  size = 20,
  className = '',
  withBackground = false,
  bgOpacity = 0.15,
}: CategoryIconProps) {
  const Icon = iconMap[icon] ?? CircleDot;

  if (withBackground) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl flex-shrink-0 ${className}`}
        style={{
          width: size + 16,
          height: size + 16,
          background: `${color}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
        }}
      >
        <Icon style={{ color, width: size, height: size }} />
      </div>
    );
  }

  return <Icon style={{ color, width: size, height: size }} className={className} />;
}
