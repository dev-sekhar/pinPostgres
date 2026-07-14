'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';
import { HasPermission } from '../../components/HasPermission';
import { GridList } from '../../components/ui/GridList';

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/jobs/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const data = await res.json();
        
        // Store the parsed result in sessionStorage to pass it to the mapping screen
        sessionStorage.setItem('import_fileData', JSON.stringify(data));
        router.push('/imports/new/map');
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  if (loading) {
    return <div className="center-screen text-gradient">Loading products...</div>;
  }

  const gridItems = products.map(product => ({
    id: product.id,
    title: product.name,
    subtitle: `SKU: ${product.sku} • $${Number(product.price).toFixed(2)}`,
    actions: (
      <Button variant="secondary" style={{ width: '100%' }} onClick={() => router.push(`/products/${product.id}`)}>
        View Details
      </Button>
    )
  }));

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-gradient">Products</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <HasPermission permission="import.create">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Import CSV'}
              </Button>
              <a 
                href="data:text/csv;charset=utf-8,name,description,price,productFamilyCode,brandCode,supplierCode,manufacturerCode,channelCodes,complianceTypeCodes" 
                download="product_import_template.csv"
                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}
              >
                Download Template
              </a>
            </div>
          </HasPermission>
          <HasPermission permission="product.create">
            <Button onClick={() => router.push('/products/new')}>Create Product</Button>
          </HasPermission>
        </div>
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

      {!error && products.length > 0 && (
        <GridList items={gridItems} hidePreview={true} />
      )}
    </div>
  );
}
