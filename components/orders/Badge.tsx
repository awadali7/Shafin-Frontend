import React from 'react';
import { LucideIcon } from 'lucide-react';

type BadgeVariant =
  | 'paid'
  | 'pending'
  | 'cancelled'
  | 'shipped'
  | 'dispatched'
  | 'delivered'
  | 'refunded'
  | 'tracked'
  | 'ready'
  | 'available'
  | 'physical'
  | 'digital';


interface BadgeProps {
  variant: BadgeVariant;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  paid: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  dispatched: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-gray-50 text-gray-700 border-gray-200',
  tracked: 'bg-blue-50 text-blue-700 border-blue-200',
  ready: 'bg-purple-50 text-purple-700 border-purple-200',
  available: 'bg-green-50 text-green-700 border-green-200',
  physical: 'bg-blue-50 text-blue-700 border-blue-200',
  digital: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const Badge: React.FC<BadgeProps> = ({ variant, icon: Icon, children }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 border rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

export default Badge;

