'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';
import { HasPermission } from '../../../components/HasPermission';

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  
  const [formData, setFormData] = useState({ name: '', description: '', roleType: 'CUSTOM' });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roleId) return;
    
    const loadData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          fetchApi('/api/roles'),
          fetchApi('/api/roles/permissions/all')
        ]);
        
        const role = rolesRes.find((r: any) => r.id === roleId);
        if (!role) throw new Error("Role not found");
        
        setFormData({ 
          name: role.name, 
          description: role.description || '', 
          roleType: role.roleType 
        });
        
        const assignedIds = new Set<string>(role.rolePermissions.map((rp: any) => rp.permissionId));
        setSelectedPerms(assignedIds);
        setPermissions(permsRes);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [roleId]);

  const handleToggle = (id: string) => {
    if (formData.roleType === 'SYSTEM') return; // Cannot edit SYSTEM roles
    
    const newSet = new Set(selectedPerms);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPerms(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roleType === 'SYSTEM') return;
    
    setSaving(true);
    setError('');
    
    try {
      await fetchApi(`/api/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          isActive: true,
          permissionIds: Array.from(selectedPerms)
        })
      });
      router.push('/roles');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this role? Users with this role will lose its permissions.')) return;
    setDeleting(true);
    try {
      await fetchApi(`/api/roles/${roleId}`, { method: 'DELETE' });
      router.push('/roles');
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="center-screen text-gradient">Loading...</div>;

  const isSystem = formData.roleType === 'SYSTEM';

  const permsByModule = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/roles')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Roles
          </Button>
          <h1 className="text-gradient">
            {isSystem ? 'View Role Details' : 'Edit Role'}
          </h1>
        </div>
        {!isSystem && (
          <HasPermission permission="tenant.manage">
            <Button variant="outline" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={handleDelete} isLoading={deleting}>
              Delete Role
            </Button>
          </HasPermission>
        )}
      </header>

      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}
      
      {isSystem && (
        <div style={{ color: 'var(--accent-secondary)', marginBottom: '2rem', padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: 'var(--radius-md)' }}>
          This is a SYSTEM role. It cannot be renamed, deleted, or modified.
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
              disabled={isSystem}
            />
            <Input 
              id="description" 
              label="Description" 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={isSystem}
            />
          </CardBody>
        </Card>

        <Card style={{ marginBottom: '2rem' }}>
          <CardHeader>
            <h3 style={{ fontSize: '1.25rem' }}>Permissions</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Assigned permissions for this role.</p>
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
                      <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: isSystem ? 'not-allowed' : 'pointer', opacity: (isSystem && !selectedPerms.has(p.id)) ? 0.5 : 1 }}>
                        <input 
                          type="checkbox" 
                          checked={selectedPerms.has(p.id)}
                          onChange={() => handleToggle(p.id)}
                          style={{ marginTop: '0.25rem' }}
                          disabled={isSystem}
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

        {!isSystem && (
          <Button type="submit" isLoading={saving}>Save Changes</Button>
        )}
      </form>
    </div>
  );
}
