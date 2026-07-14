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
          <Card onClick={() => router.push('/roles')} style={{ cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } } as any}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#818cf8' }}>Roles</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage roles and granular permissions.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="user.read">
          <Card onClick={() => router.push('/users')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#f472b6' }}>Team Members</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Invite and manage users in your workspace.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="domain.read">
          <Card onClick={() => router.push('/classification')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#34d399' }}>Classification</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage domains, categories, and product families.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="supplier.read">
          <Card onClick={() => router.push('/master-data')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fbbf24' }}>Master Data</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage Brands, Suppliers, Manufacturers, and Compliance Types.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="product.read">
          <Card onClick={() => router.push('/products')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#60a5fa' }}>Products</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage your product catalog and inventory.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="audit.read">
          <Card onClick={() => router.push('/audit')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#94a3b8' }}>Audit Trail</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>View the history of all changes made in your workspace.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="product.manage">
          <Card onClick={() => router.push('/imports')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#a78bfa' }}>Imports & Exports</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Bulk import or export products and master data via CSV.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="settings.read">
          <Card onClick={() => router.push('/settings')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#c084fc' }}>Settings</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Configure tenant-wide settings like SKU generation.</p>
            </CardBody>
          </Card>
        </HasPermission>
        <HasPermission permission="asset.read">
          <Card onClick={() => router.push('/assets')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#ec4899' }}>Assets</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage generic digital assets and media.</p>
            </CardBody>
          </Card>
        </HasPermission>
      </div>
    </div>
  );
}
