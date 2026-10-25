import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyber' | 'void' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'cyber',
  size = 'md',
  className = '',
  children,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-full transition-all duration-200 cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 sm:px-4 py-1.5 min-h-[38px] gap-1.5',
    md: 'text-xs sm:text-sm px-5 sm:px-6 py-2.5 min-h-[44px] gap-2',
    lg: 'text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 min-h-[48px] gap-2.5 shadow-lg',
  }[size];

  const variantStyles = {
    cyber:
      'bg-[#FDE047] text-black hover:bg-[#FEF08A] hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/25 border border-yellow-300',
    void:
      'bg-[#171717] text-white hover:bg-[#262626] border border-white/20 hover:border-white/30',
    glass:
      'bg-white/10 text-white backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:border-white/30',
    danger:
      'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 hover:border-rose-500/60',
    ghost:
      'bg-transparent text-white/80 hover:text-white hover:bg-white/10',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
