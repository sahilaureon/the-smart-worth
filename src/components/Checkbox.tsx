import React from 'react';
import { cn } from '../lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, error, className, ...props }) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer group">
      <div className="relative flex items-center">
        <input 
          type="checkbox" 
          className={cn(
            "peer h-4 w-4 cursor-pointer appearance-none rounded border-2 transition-all checked:border-[#0061FF] checked:bg-[#0061FF] focus:outline-none",
            error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white",
            className
          )} 
          {...props}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-[#0061FF] transition-colors">
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
