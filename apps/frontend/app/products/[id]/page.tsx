'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  attributes: any;
  parentId: string | null;
  variants?: Product[];
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const loadProduct = async () => {
      try {
        const data = await fetchApi(`/api/products/${id}`);
        setProduct(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) return <div className="center-screen text-gradient">Loading...</div>;
  if (error || !product) return <div className="center-screen text-gradient" style={{ color: 'var(--error-color)' }}>{error || "Product not found"}</div>;

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/products')} style={{ marginBottom: '1rem' }}>
          &larr; Back to Catalog
        </Button>
        <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {product.name}
          {product.parentId && <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-primary)', fontWeight: 600 }}>Variant</span>}
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Main Details */}
        <Card>
          <CardHeader>
            <h2 style={{ fontSize: '1.25rem' }}>Details</h2>
          </CardHeader>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>SKU</div>
              <div style={{ fontWeight: 500 }}>{product.sku}</div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Price</div>
              <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '1.25rem' }}>${Number(product.price).toFixed(2)}</div>
            </div>
            {product.description && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description</div>
                <p style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>{product.description}</p>
              </div>
            )}

            {/* Custom Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Custom Attributes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontWeight: 500 }}>
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <Button style={{ width: '100%' }} onClick={() => router.push(`/products/${product.id}/edit`)}>Edit Details</Button>
            </div>
          </CardBody>
        </Card>

        {/* Variants Section (Only show if this is a parent product) */}
        {!product.parentId && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Product Variants</h2>
              <Button size="sm" onClick={() => router.push(`/products/new?parentId=${product.id}`)}>
                + Create Variant
              </Button>
            </div>
            
            {product.variants && product.variants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {product.variants.map(variant => (
                  <Card key={variant.id}>
                    <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{variant.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SKU: {variant.sku}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>${Number(variant.price).toFixed(2)}</div>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/products/${variant.id}`)}>View</Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardBody style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>This product has no variants.</p>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
