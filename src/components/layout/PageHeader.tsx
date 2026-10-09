import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold tracking-tight text-[#f3f6fc]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#a6b2c6]">{description}</p>}
    </div>
  );
};
