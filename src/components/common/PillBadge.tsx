import React from 'react';

export interface PillBadgeProps {
  children: React.ReactNode;
  variant?: 'cyber' | 'emerald' | 'rose' | 'void' | 'glass' | 'neutral';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  children,
  variant = 'void',
  size = 'sm',
  icon,
}) => {
  const sizeStyles = {
    xs: 'text-[9px] px-2.5 py-0.5 tracking-wider',
    sm: 'text-[11px] px-3.5 py-1 tracking-wider',
    md: 'text-xs px-4 py-1.5 tracking-wider',
  }[size];

  const variantStyles = {
    cyber: 'bg-[#FDE047] text-black font-extrabold border border-yellow-300 shadow-sm',
    emerald: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold',
    rose: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold',
    void: 'bg-[#171717] text-white/90 border border-white/20 font-medium',
    glass: 'bg-white/10 text-white backdrop-blur-md border border-white/20 font-medium',
    neutral: 'bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase ${sizeStyles} ${variantStyles}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
