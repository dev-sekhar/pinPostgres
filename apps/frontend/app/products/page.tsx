'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';
import { HasPermission } from '../../components/HasPermission';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: string;
  createdAt: string;
}

export default function ProductsListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchApi('/api/products');
        setProducts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  if (loading) {
    return <div className="center-screen text-gradient">Loading products...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-gradient">Products</h1>
        </div>
        <HasPermission permission="product.create">
          <Button onClick={() => router.push('/products/new')}>Create Product</Button>
        </HasPermission>
      </header>
      
      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      {!error && products.length === 0 && (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>No products found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You haven't created any products yet.</p>
          </CardBody>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{product.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SKU: {product.sku}</p>
            </CardHeader>
            <CardBody>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
                ${Number(product.price).toFixed(2)}
              </div>
              <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push(`/products/${product.id}`)}>View Details</Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
