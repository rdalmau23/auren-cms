"use client";

import React, { useState } from 'react';
import { FormFieldSchema } from '@/types';
import { Input } from './Input';
import { Select } from './Select';
import { TextArea } from './TextArea';
import { Button } from './Button';

interface DynamicFormProps {
  schema: FormFieldSchema[];
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting?: boolean;
}

export function DynamicForm({ schema, onSubmit, initialData = {}, isSubmitting = false }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {schema.map((field) => {
        const value = formData[field.id] || '';

        switch (field.type) {
          case 'TEXT':
            return (
              <Input
                key={field.id}
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
              />
            );
          case 'NUMBER':
            return (
              <Input
                key={field.id}
                type="number"
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => handleChange(field.id, Number(e.target.value))}
                required={field.required}
                placeholder={field.placeholder}
              />
            );
          case 'BOOLEAN':
            return (
              <div key={field.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={field.id}
                  name={field.name}
                  checked={Boolean(value)}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={field.id} className="ml-2 block text-sm text-gray-900">
                  {field.label}
                </label>
              </div>
            );
          case 'SELECT':
            return (
              <Select
                key={field.id}
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required}
              >
                <option value="">Seleccione una opción</option>
                {field.options?.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            );
          case 'DATE':
            return (
              <Input
                key={field.id}
                type="date"
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                required={field.required}
              />
            );
          case 'JSON':
            return (
              <TextArea
                key={field.id}
                label={field.label}
                name={field.name}
                value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange(field.id, parsed);
                  } catch (err) {
                    handleChange(field.id, e.target.value); // Keep string if invalid JSON
                  }
                }}
                required={field.required}
                rows={4}
                placeholder='{"key": "value"}'
              />
            );
          default:
            return null;
        }
      })}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Guardar Observación
        </Button>
      </div>
    </form>
  );
}
