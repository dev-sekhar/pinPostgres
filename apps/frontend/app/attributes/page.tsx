'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';
import { HasPermission } from '../../components/HasPermission';

interface AttributeDefinition {
  id: string;
  code: string;
  name: string;
  type: string;
  isRequired: boolean;
}

export default function AttributesListPage() {
  const router = useRouter();
  const [attributes, setAttributes] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const [attrData, famData] = await Promise.all([
          fetchApi('/api/attributes'),
          fetchApi('/api/product-families')
        ]);
        setAttributes(attrData);
        setFamilies(famData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAttributes();
  }, []);

  if (loading) {
    return <div className="center-screen text-gradient">Loading attributes...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-gradient">Attributes Configuration</h1>
        </div>
        <HasPermission permission="attribute.create">
          <Button onClick={() => router.push('/attributes/new')}>Create Attribute</Button>
        </HasPermission>
      </header>
      
      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      {!error && attributes.length === 0 && (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>No attributes defined</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Create custom fields to describe your products.</p>
          </CardBody>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {attributes.map((attr) => (
          <Card key={attr.id}>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{attr.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Code: {attr.code}</p>
                {attr.productFamilyId && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Family: <strong>{families.find(f => f.id === attr.productFamilyId)?.name || 'Unknown'}</strong>
                  </p>
                )}
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '1rem', 
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--accent-primary)',
                fontWeight: 600
              }}>
                {attr.type}
              </span>
            </CardHeader>
            <CardBody>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: attr.isRequired ? 'var(--error-color)' : 'var(--text-secondary)' 
                }}>
                  {attr.isRequired ? 'Required Field' : 'Optional Field'}
                </span>
              </div>
              <HasPermission permission="attribute.update">
                <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push(`/attributes/${attr.id}/edit`)}>Edit</Button>
              </HasPermission>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
