import React, { useState, useEffect } from 'react';

const DynamicForm = ({ fields, initialData = {}, onChange }) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [JSON.stringify(initialData)]);

  const handleChange = (e, field) => {
    const newVal = e.target.value;
    const nextState = { ...formData, [field]: newVal };
    setFormData(nextState);
    onChange(nextState);
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{field.label}</label>
          {field.type === 'select' ? (
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(e, field.name)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary/50 bg-white dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <option value="" disabled>Select {field.label}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800">{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(e, field.name)}
              placeholder={field.placeholder || ''}
              rows={4}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary/50 bg-white dark:bg-slate-800 dark:text-slate-200 transition-colors resize-none"
            ></textarea>
          ) : (
            <input
              type={field.type || 'text'}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(e, field.name)}
              placeholder={field.placeholder || ''}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary/50 bg-white dark:bg-slate-800 dark:text-slate-200 transition-colors"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicForm;
