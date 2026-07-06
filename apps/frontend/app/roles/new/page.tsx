'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export default function CreateRolePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await fetchApi('/api/roles/permissions/all');
        setPermissions(perms);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, []);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedPerms);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPerms(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      await fetchApi('/api/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissionIds: Array.from(selectedPerms)
        })
      });
      router.push('/roles');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="center-screen text-gradient">Loading...</div>;

  // Group permissions by module
  const permsByModule = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/roles')} style={{ marginBottom: '1rem' }}>
          &larr; Back to Roles
        </Button>
        <h1 className="text-gradient">Create Custom Role</h1>
      </header>

      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: '2rem' }}>
          <CardHeader>
            <h3 style={{ fontSize: '1.25rem' }}>Role Details</h3>
          </CardHeader>
          <CardBody>
            <Input 
              id="name" 
              label="Role Name" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required 
            />
            <Input 
              id="description" 
              label="Description" 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </CardBody>
        </Card>

        <Card style={{ marginBottom: '2rem' }}>
          <CardHeader>
            <h3 style={{ fontSize: '1.25rem' }}>Permissions</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Select the actions users with this role can perform.</p>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {Object.entries(permsByModule).map(([module, perms]) => (
                <div key={module}>
                  <h4 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    {module}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {perms.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedPerms.has(p.id)}
                          onChange={() => handleToggle(p.id)}
                          style={{ marginTop: '0.25rem' }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Button type="submit" isLoading={saving}>Create Role</Button>
      </form>
    </div>
  );
}
