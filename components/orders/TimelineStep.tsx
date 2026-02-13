import React from 'react';
import { LucideIcon } from 'lucide-react';

type StepStatus = 'complete' | 'active' | 'pending';

interface TimelineStepProps {
  icon: LucideIcon;
  status?: StepStatus;
  title: string;
  description: string;
  animated?: boolean;
}

const statusStyles: Record<StepStatus, { icon: string; title: string }> = {
  complete: {
    icon: 'text-green-600',
    title: 'text-slate-900',
  },
  active: {
    icon: 'text-blue-600',
    title: 'text-blue-600',
  },
  pending: {
    icon: 'text-gray-400',
    title: 'text-gray-600',
  },
};

export const TimelineStep: React.FC<TimelineStepProps> = ({
  icon: Icon,
  status = 'complete',
  title,
  description,
  animated = false,
}) => {
  const styles = statusStyles[status];

  return (
    <div className="flex items-start gap-3">
      <Icon
        className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5 ${
          animated ? 'animate-pulse' : ''
        }`}
      />
      <div className="flex-1">
        <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default TimelineStep;

