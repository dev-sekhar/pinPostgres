'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';

export default function CreateAttributePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'TEXT',
    isRequired: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await fetchApi('/api/attributes', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      // On success, redirect back to attributes list
      router.push('/attributes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/attributes')} style={{ marginBottom: '1rem' }}>
          &larr; Back to Attributes
        </Button>
        <h1 className="text-gradient">Create Attribute</h1>
      </header>

      <div style={{ maxWidth: '500px' }}>
        <Card>
          <CardHeader>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Attribute Settings</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Define a new custom field for your products.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Input
                id="name"
                label="Display Name"
                placeholder="e.g. Color, Size, Voltage"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                id="code"
                label="Internal Code"
                placeholder="e.g. color, item_size"
                value={formData.code}
                onChange={handleChange}
                required
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.5rem' }}>
                <label htmlFor="type" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Data Type
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="BOOLEAN">Yes / No</option>
                  <option value="SELECT">Single Select</option>
                  <option value="MULTI_SELECT">Multiple Select</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={formData.isRequired}
                  onChange={handleChange}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                />
                <label htmlFor="isRequired" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  This is a required field for all products
                </label>
              </div>

              {error && (
                <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                  {error}
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <Button type="button" variant="outline" onClick={() => router.push('/attributes')}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Save Attribute</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
