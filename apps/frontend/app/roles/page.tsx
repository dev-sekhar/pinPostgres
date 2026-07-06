'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';
import { HasPermission } from '../../components/HasPermission';

interface Role {
  id: string;
  name: string;
  description: string;
  roleType: string;
  isActive: boolean;
  rolePermissions: any[];
}

export default function RolesListPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchApi('/api/roles');
        setRoles(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadRoles();
  }, []);

  if (loading) {
    return <div className="center-screen text-gradient">Loading roles...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-gradient">Roles & Permissions</h1>
        </div>
        <HasPermission permission="tenant.manage">
          <Button onClick={() => router.push('/roles/new')}>Create Role</Button>
        </HasPermission>
      </header>
      
      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{role.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{role.description}</p>
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '1rem', 
                background: role.roleType === 'SYSTEM' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                color: role.roleType === 'SYSTEM' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                fontWeight: 600
              }}>
                {role.roleType}
              </span>
            </CardHeader>
            <CardBody>
              <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {role.rolePermissions.length} Permissions Assigned
              </div>
              <HasPermission permission="tenant.manage">
                <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push(`/roles/${role.id}`)}>
                  {role.roleType === 'SYSTEM' ? 'View Details' : 'Edit Role'}
                </Button>
              </HasPermission>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
