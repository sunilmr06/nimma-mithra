import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
    icon: 'p-2',
  };

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 focus:ring-primary',
    cyan: 'bg-cyan hover:bg-cyan-hover text-background font-semibold shadow-lg shadow-cyan/20 focus:ring-cyan',
    secondary: 'bg-elevated hover:bg-border text-main border border-border focus:ring-slate-500',
    outline: 'bg-transparent border border-border hover:border-slate-500 hover:bg-card text-main focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-card text-muted hover:text-main focus:ring-slate-500',
    danger: 'bg-critical hover:bg-red-600 text-white shadow-lg shadow-critical/20 focus:ring-critical',
    success: 'bg-success hover:bg-emerald-600 text-white shadow-lg shadow-success/20 focus:ring-success',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        Icon && <Icon className="w-4 h-4 text-current" />
      )}
      {children}
    </button>
  );
};

export default Button;
