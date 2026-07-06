'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { fetchApi } from '../../../../lib/api';
import { HasPermission } from '../../../../components/HasPermission';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const [user, rolesData] = await Promise.all([
          fetchApi(`/api/users/${userId}`),
          fetchApi('/api/roles')
        ]);
        
        setFormData({
          name: user.name,
          email: user.email,
          password: ''
        });
        
        const assignedIds = new Set<string>(user.userRoles.map((ur: any) => ur.roleId));
        setSelectedRoleIds(assignedIds);
        setRoles(rolesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRoleToggle = (id: string) => {
    const newSet = new Set(selectedRoleIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRoleIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        roleIds: Array.from(selectedRoleIds)
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      await fetchApi(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      router.push('/users');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this user from the workspace?')) return;
    setDeleting(true);
    try {
      await fetchApi(`/api/users/${userId}`, { method: 'DELETE' });
      router.push('/users');
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="center-screen text-gradient">Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/users')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Team Members
          </Button>
          <h1 className="text-gradient">Manage Access</h1>
        </div>
        <HasPermission permission="user.delete">
          <Button variant="outline" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={handleDelete} isLoading={deleting}>
            Remove User
          </Button>
        </HasPermission>
      </header>

      <div style={{ maxWidth: '600px' }}>
        {error && (
          <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <Card style={{ marginBottom: '2rem' }}>
            <CardHeader>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>User Details</h2>
            </CardHeader>
            <CardBody>
                <Input
                  id="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="email"
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="password"
                  type="password"
                  label="New Password (Optional)"
                  placeholder="Leave blank to keep unchanged"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                />
            </CardBody>
          </Card>

          <Card style={{ marginBottom: '2rem' }}>
            <CardHeader>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Access Roles</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Assign roles to grant permissions to this user.</p>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {roles.map(r => (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={selectedRoleIds.has(r.id)}
                      onChange={() => handleRoleToggle(r.id)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {r.roleType === 'SYSTEM' ? 'System Role' : 'Custom Role'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button type="submit" isLoading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
