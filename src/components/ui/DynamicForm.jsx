import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const DynamicForm = ({ fields, initialData = {}, onChange }) => {
  const { t } = useSettings();
  // Only initialize state from initialData once, or when initialData changes but is NOT empty
  const [formData, setFormData] = useState(initialData);

  // Use a more conservative update approach: only sync from parent if the IDs differ
  // or if we are switching between "Create" and "Edit" modes.
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    } else if (Object.keys(formData).length > 0 && Object.keys(initialData).length === 0) {
      // This happens when closing/resetting the form
      setFormData({});
    }
  }, [initialData]); // Sync when initialData object reference changes

  const handleChange = (e, field) => {
    const newVal = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const nextState = { ...formData, [field]: newVal };
    setFormData(nextState);
    if (onChange) onChange(nextState);
  };

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.name} className="animate-in fade-in slide-in-from-top-1 duration-300">
          <label className="block text-label text-slate-700 dark:text-slate-300 mb-1.5">{t(field.label)}</label>
          {field.type === 'select' ? (
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(e, field.name)}
              className="form-input-custom cursor-pointer"
            >
              <option value="" disabled>{t('select')} {t(field.label)}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{t(opt.label)}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(e, field.name)}
              placeholder={field.placeholder ? t(field.placeholder) : ''}
              rows={4}
              className="form-input-custom min-h-[100px] resize-none"
            ></textarea>
          ) : field.type === 'checkbox' ? (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
              <input
                type="checkbox"
                checked={!!formData[field.name]}
                onChange={(e) => handleChange(e, field.name)}
                className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary/20"
              />
              <span className="text-label text-slate-700 dark:text-slate-200">{t(field.label)}</span>
            </label>
          ) : (
            <input
              type={field.type || 'text'}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(e, field.name)}
              placeholder={field.placeholder ? t(field.placeholder) : ''}
              className="form-input-custom"
              required={field.required}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicForm;
