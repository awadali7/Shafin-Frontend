import React from 'react';

type RowVariant = 'default' | 'total';

interface SummaryRowProps {
  label: string;
  value: string | React.ReactNode;
  variant?: RowVariant;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  variant = 'default',
}) => {
  if (variant === 'total') {
    return (
      <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
        <span className="text-slate-900">{label}</span>
        <span className="text-[#B00000]">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
};

export default SummaryRow;

