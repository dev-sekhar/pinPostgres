'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { fetchApi } from '../../../../lib/api';

export default function EditAttributePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'TEXT',
    isRequired: false
  });
  
  // For options (we'll join/split by comma for simplicity in this UI)
  const [optionsString, setOptionsString] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      try {
        const data = await fetchApi(`/api/attributes/${id}`);
        setFormData({
          code: data.code,
          name: data.name,
          type: data.type,
          isRequired: data.isRequired
        });
        if (data.options && Array.isArray(data.options)) {
          setOptionsString(data.options.join(', '));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    let optionsArray: string[] | undefined = undefined;
    if (formData.type === 'SELECT' || formData.type === 'MULTI_SELECT') {
      optionsArray = optionsString.split(',').map(s => s.trim()).filter(Boolean);
      if (optionsArray.length === 0) {
        setError("Options are required for SELECT type. Please provide comma-separated values.");
        setSaving(false);
        return;
      }
    }

    try {
      await fetchApi(`/api/attributes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          options: optionsArray
        }),
      });
      router.push('/attributes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="center-screen text-gradient">Loading attribute...</div>;

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/attributes')} style={{ marginBottom: '1rem' }}>
          &larr; Back to Attributes
        </Button>
        <h1 className="text-gradient">Edit Attribute</h1>
      </header>

      <div style={{ maxWidth: '500px' }}>
        <Card>
          <CardHeader>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Attribute Settings</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Update custom field configuration.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Input
                id="name"
                label="Display Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                id="code"
                label="Internal Code"
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
              
              {(formData.type === 'SELECT' || formData.type === 'MULTI_SELECT') && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <Input
                    id="options"
                    label="Options (Comma Separated)"
                    placeholder="e.g. Red, Blue, Green"
                    value={optionsString}
                    onChange={(e) => setOptionsString(e.target.value)}
                    required
                  />
                </div>
              )}

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
                <Button type="submit" isLoading={saving}>Save Changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
