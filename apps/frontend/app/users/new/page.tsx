'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';

export default function InviteUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchApi('/api/roles');
        setRoles(data);
      } catch (err: any) {
        console.error("Failed to load roles", err);
      } finally {
        setFetchingRoles(false);
      }
    };
    loadRoles();
  }, []);

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
    setLoading(true);
    setError('');

    try {
      await fetchApi('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          roleIds: Array.from(selectedRoleIds)
        }),
      });
      router.push('/users');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/users')} style={{ marginBottom: '1rem' }}>
          &larr; Back to Team Members
        </Button>
        <h1 className="text-gradient">Invite Team Member</h1>
      </header>

      <div style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <Card style={{ marginBottom: '2rem' }}>
            <CardHeader>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>User Details</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Invite a new user to your workspace.</p>
            </CardHeader>
            <CardBody>
                <Input
                  id="name"
                  label="Full Name"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="jane@acme.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="password"
                  type="password"
                  label="Temporary Password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
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
              {fetchingRoles ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading roles...</div>
              ) : roles.length > 0 ? (
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
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No roles found.</div>
              )}
            </CardBody>
          </Card>

          {error && (
            <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button type="button" variant="outline" onClick={() => router.push('/users')}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Send Invitation</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
