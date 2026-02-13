import React from 'react';
import { LucideIcon } from 'lucide-react';

type BannerVariant = 'info' | 'success' | 'warning' | 'purple' | 'blue';

interface NotificationBannerProps {
  variant?: BannerVariant;
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const variantStyles: Record<BannerVariant, { bg: string; border: string; iconColor: string }> = {
  info: {
    bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
  success: {
    bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
    border: 'border-yellow-200',
    iconColor: 'text-yellow-600',
  },
  purple: {
    bg: 'bg-gradient-to-r from-purple-50 to-pink-50',
    border: 'border-purple-200',
    iconColor: 'text-purple-600',
  },
  blue: {
    bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
};

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  variant = 'info',
  icon: Icon,
  title,
  description,
  action,
}) => {
  const styles = variantStyles[variant];

  return (
    <div className={`mb-4 p-4 ${styles.bg} border ${styles.border} rounded-lg`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-700">{description}</p>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
};

export default NotificationBanner;

