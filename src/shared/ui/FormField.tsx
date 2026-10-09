import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-medium text-[#f3f6fc]">{label}</label>
      {children}
      {error && <span className="text-xs text-rose-400" role="alert">{error}</span>}
    </div>
  );
};
