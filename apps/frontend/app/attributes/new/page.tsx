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
  const actionRef = React.useRef<'save' | 'saveAndAdd'>('save');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Classification state
  const [domains, setDomains] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');

  React.useEffect(() => {
    const loadClassification = async () => {
      try {
        const [dData, cData, fData] = await Promise.all([
          fetchApi('/api/domains'),
          fetchApi('/api/categories'),
          fetchApi('/api/product-families')
        ]);
        setDomains(dData);
        setCategories(cData);
        setFamilies(fData);
      } catch (err: any) {
        console.error("Failed to load classification", err);
      }
    };
    loadClassification();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedFamilyId) {
      setError("Please select a Product Family for this attribute.");
      setLoading(false);
      return;
    }

    try {
      await fetchApi('/api/attributes', {
        method: 'POST',
        body: JSON.stringify({ ...formData, productFamilyId: selectedFamilyId }),
      });
      
      if (actionRef.current === 'saveAndAdd') {
        // Keep classification state, just clear the attribute-specific fields
        setFormData({
          code: '',
          name: '',
          type: 'TEXT',
          isRequired: false
        });
        // Scroll to top or focus name field if desired
        document.getElementById('name')?.focus();
      } else {
        // On standard save, redirect back to attributes list
        router.push('/attributes');
      }
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Domain</label>
                  <select 
                    value={selectedDomainId} 
                    onChange={e => { setSelectedDomainId(e.target.value); setSelectedCategoryId(''); setSelectedFamilyId(''); }}
                    style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="">-- Select Domain --</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Category</label>
                  <select 
                    value={selectedCategoryId} 
                    onChange={e => { setSelectedCategoryId(e.target.value); setSelectedFamilyId(''); }}
                    style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                    disabled={!selectedDomainId}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.filter(c => c.domainId === selectedDomainId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Product Family *</label>
                  <select 
                    value={selectedFamilyId} 
                    onChange={e => setSelectedFamilyId(e.target.value)}
                    style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                    disabled={!selectedCategoryId}
                    required
                  >
                    <option value="">-- Select Family --</option>
                    {families.filter(f => f.categoryId === selectedCategoryId).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>

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
                <Button type="submit" variant="secondary" isLoading={loading && actionRef.current === 'saveAndAdd'} onClick={() => actionRef.current = 'saveAndAdd'}>
                  Save & Add Another
                </Button>
                <Button type="submit" isLoading={loading && actionRef.current === 'save'} onClick={() => actionRef.current = 'save'}>
                  Save Attribute
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
