'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { HasPermission } from '../components/HasPermission';

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

  if (loading) {
    return <div className="center-screen text-gradient">Loading...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 className="text-gradient">Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Welcome to your workspace.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        <HasPermission permission="tenant.manage">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#818cf8' }}>Roles</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage roles and granular permissions.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/roles')}>Manage Roles</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="user.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#f472b6' }}>Team Members</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Invite and manage users in your workspace.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/users')}>Manage Team Members</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="domain.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#34d399' }}>Classification</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage domains, categories, and product families.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/classification')}>Manage Classification</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="attribute.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fbbf24' }}>Attributes</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Define custom product attributes for your tenant.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/attributes')}>Manage Attributes</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="product.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#60a5fa' }}>Products</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your product catalog and inventory.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/products')}>Manage Products</Button>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="audit.read">
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#94a3b8' }}>Audit Trail</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View the history of all changes made in your workspace.</p>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push('/audit')}>View Logs</Button>
            </CardBody>
          </Card>
        </HasPermission>
      </div>
    </div>
  );
}
