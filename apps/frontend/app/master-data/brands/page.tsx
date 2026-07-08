'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { fetchApi } from '../../../lib/api';

import { useForm } from 'react-hook-form';

export default function BrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { register, handleSubmit: hookFormSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      legalName: '',
      status: 'ACTIVE'
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/brands');
      setBrands(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      reset(item);
    } else {
      setEditingItem(null);
      reset({ code: '', name: '', status: 'ACTIVE' });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingItem) {
        await fetchApi(`/api/brands/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        if (editingItem.status !== data.status) {
            await fetchApi(`/api/brands/${editingItem.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: data.status })
            });
        }
      } else {
        await fetchApi('/api/brands', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await fetchApi(`/api/brands/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="center-screen text-gradient">Loading brands...</div>;

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '1000px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/master-data')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Master Data
          </Button>
          <h1 className="text-gradient">Brands</h1>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Add Brand</Button>
      </header>

      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {brands.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No brands found. Create one to get started.</p>
        ) : (
          brands.map(b => (
            <Card key={b.id}>
              <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{b.name} <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>({b.code})</span></h3>
                  {b.legalName && <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>{b.legalName}</p>}
                  {b.description && <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>{b.description}</p>}
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: b.status === 'ACTIVE' ? 'var(--success-color, #10b981)' : 'var(--error-color)' }}>{b.status}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal(b)}>Edit</Button>
                  <Button variant="outline" size="sm" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={() => handleDelete(b.id)}>Delete</Button>
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
                {editingItem ? 'Edit Brand' : 'New Brand'}
              </h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={hookFormSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Code</label>
                  <Input {...register('code')} />
                  {errors.code && <span style={{color: 'red', fontSize: '0.8rem'}}>{errors.code.message as string}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name</label>
                  <Input {...register('name')} />
                  {errors.name && <span style={{color: 'red', fontSize: '0.8rem'}}>{errors.name.message as string}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Legal Name</label>
                  <Input {...register('legalName')} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                  <Input {...register('description')} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    {...register('status')}
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
