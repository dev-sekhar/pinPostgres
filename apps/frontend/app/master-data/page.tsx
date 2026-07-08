'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HasPermission } from '../../components/HasPermission';

export default function MasterDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-gradient">Master Data</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Manage core data entities used across the platform.
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        <HasPermission permission="attribute.read">
          <Card onClick={() => router.push('/attributes')} style={{ cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } } as any}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fbbf24' }}>Attributes</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Define custom product attributes for your tenant.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="settings.read">
          <Card onClick={() => router.push('/master-data/brands')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#60a5fa' }}>Brands</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage Brands associated with products.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="supplier.read">
          <Card onClick={() => router.push('/master-data/suppliers')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#34d399' }}>Suppliers</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage product suppliers and vendors.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="manufacturer.read">
          <Card onClick={() => router.push('/master-data/manufacturers')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#f472b6' }}>Manufacturers</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage product manufacturers.</p>
            </CardBody>
          </Card>
        </HasPermission>

        <HasPermission permission="complianceType.read">
          <Card onClick={() => router.push('/master-data/compliance-types')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#c084fc' }}>Compliance Types</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage compliance and certification types.</p>
            </CardBody>
          </Card>
        </HasPermission>
        
        <HasPermission permission="channel.read">
          <Card onClick={() => router.push('/master-data/channels')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <CardHeader>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#818cf8' }}>Channels</h3>
            </CardHeader>
            <CardBody>
              <p style={{ color: 'var(--text-secondary)' }}>Manage distribution channels.</p>
            </CardBody>
          </Card>
        </HasPermission>
      </div>
    </div>
  );
}
