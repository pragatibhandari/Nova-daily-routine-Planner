
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => {
  return (
    <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 dark:bg-white/10 p-0.5 transition-all duration-300">
      <div 
        className={`h-full w-[27px] rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          checked ? 'translate-x-[20px] bg-white' : 'translate-x-0'
        }`}
      />
      <input 
        type="checkbox" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="invisible absolute" 
      />
      <div className={`absolute inset-0 rounded-full transition-colors pointer-events-none -z-10 ${checked ? 'bg-primary' : 'bg-transparent'}`} />
    </label>
  );
};

export default Toggle;
