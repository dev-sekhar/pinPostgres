'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { HasPermission } from '../components/HasPermission';
import { clearPermissionsCache } from '../lib/usePermissions';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic auth check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearPermissionsCache();
    router.push('/login');
  };

  if (loading) {
    return <div className="center-screen text-gradient">Loading...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient">Tenant Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        <HasPermission permission="product.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Products</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your product catalog and inventory.</p>
              <Button style={{ width: '100%' }} onClick={() => router.push('/products')}>View Products</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="user.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Team Members</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Invite and manage users in your workspace.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/users')}>Manage Users</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="attribute.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Attributes</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Define custom product attributes for your tenant.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/attributes')}>Configure</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="tenant.manage">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Roles</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage roles and granular permissions.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/roles')}>Manage Roles</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="audit.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Audit Trail</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View the history of all changes made in your workspace.</p>
              <Button variant="outline" style={{ width: '100%' }} onClick={() => router.push('/audit')}>View Logs</Button>
            </CardBody>
          </Card>
        </HasPermission>
      </div>
    </div>
  );
}
