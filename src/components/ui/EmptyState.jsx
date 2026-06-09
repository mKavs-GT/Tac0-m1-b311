import React from 'react';

export function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-bg-surface border border-dashed border-border-main rounded-xl text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-muted flex items-center justify-center mb-4">
        {Icon && <Icon size={32} className="text-text-muted opacity-60" strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-medium text-text-main mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-text-muted max-w-sm mb-6">{subtitle}</p>}
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-10 px-6 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-all shadow-sm active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
