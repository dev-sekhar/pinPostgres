'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { fetchApi } from '../../../lib/api';

export default function ComplianceTypesPage() {
  const router = useRouter();
  const [complianceTypes, setComplianceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/compliance-types');
      setComplianceTypes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ code: item.code, name: item.name, description: item.description || '', status: item.status });
    } else {
      setEditingItem(null);
      setFormData({ code: '', name: '', description: '', status: 'ACTIVE' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await fetchApi(`/api/compliance-types/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi('/api/compliance-types', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this compliance type?')) return;
    try {
      await fetchApi(`/api/compliance-types/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="center-screen text-gradient">Loading compliance types...</div>;

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '1000px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/master-data')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Master Data
          </Button>
          <h1 className="text-gradient">Compliance Types</h1>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Add Compliance Type</Button>
      </header>

      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {complianceTypes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No compliance types found. Create one to get started.</p>
        ) : (
          complianceTypes.map(s => (
            <Card key={s.id}>
              <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{s.name} <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>({s.code})</span></h3>
                  {s.description && <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>{s.description}</p>}
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: s.status === 'ACTIVE' ? 'var(--success-color, #10b981)' : 'var(--error-color)' }}>{s.status}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal(s)}>Edit</Button>
                  <Button variant="outline" size="sm" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={() => handleDelete(s.id)}>Delete</Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <Card style={{ width: '100%', maxWidth: '500px', margin: '0 1rem', background: 'var(--bg-panel)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <CardHeader style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {editingItem ? 'Edit Compliance Type' : 'New Compliance Type'}
              </h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Code</label>
                  <Input 
                    required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                  <Input 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    value={formData.status || 'ACTIVE'} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
