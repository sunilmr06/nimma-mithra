import React from 'react';

const Card = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-5 transition-all duration-200 ${
        hover ? 'hover:border-slate-600 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
