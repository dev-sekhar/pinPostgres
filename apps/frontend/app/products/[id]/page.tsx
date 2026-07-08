'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';
import { MediaGallery } from '../../../components/ui/MediaGallery';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  attributes: any;
  parentId: string | null;
  variants?: Product[];
  brandId?: string | null;
  supplierId?: string | null;
  manufacturerId?: string | null;
  complianceTypes?: any[];
  channels?: any[];
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<Product | null>(null);
  
  // Master Data mappings
  const [brands, setBrands] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<Record<string, string>>({});
  const [manufacturers, setManufacturers] = useState<Record<string, string>>({});
  const [complianceTypes, setComplianceTypes] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const loadProduct = async () => {
      try {
        const [data, bData, sData, mData, ctData, chData] = await Promise.all([
          fetchApi(`/api/products/${id}`),
          fetchApi('/api/brands'),
          fetchApi('/api/suppliers'),
          fetchApi('/api/manufacturers'),
          fetchApi('/api/compliance-types'),
          fetchApi('/api/channels')
        ]);
        
        setProduct(data);
        
        // Create lookup maps
        const bMap: Record<string, string> = {}; bData.forEach((b: any) => bMap[b.id] = b.name); setBrands(bMap);
        const sMap: Record<string, string> = {}; sData.forEach((s: any) => sMap[s.id] = s.name); setSuppliers(sMap);
        const mMap: Record<string, string> = {}; mData.forEach((m: any) => mMap[m.id] = m.name); setManufacturers(mMap);
        const ctMap: Record<string, string> = {}; ctData.forEach((ct: any) => ctMap[ct.id] = ct.name); setComplianceTypes(ctMap);
        const chMap: Record<string, string> = {}; chData.forEach((ch: any) => chMap[ch.id] = ch.name); setChannels(chMap);
        
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
            {/* Master Data */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Master Data</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Brand</div>
                  <div style={{ fontWeight: 500 }}>{product.brandId ? brands[product.brandId] || 'Unknown' : 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Supplier</div>
                  <div style={{ fontWeight: 500 }}>{product.supplierId ? suppliers[product.supplierId] || 'Unknown' : 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Manufacturer</div>
                  <div style={{ fontWeight: 500 }}>{product.manufacturerId ? manufacturers[product.manufacturerId] || 'Unknown' : 'None'}</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Compliance Types</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {product.complianceTypes && product.complianceTypes.length > 0 ? (
                      product.complianceTypes.map((c: any) => (
                        <span key={c.complianceTypeId} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                          {complianceTypes[c.complianceTypeId] || 'Unknown'}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontWeight: 500 }}>None</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Channels</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {product.channels && product.channels.length > 0 ? (
                      product.channels.map((c: any) => (
                        <span key={c.channelId} style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                          {channels[c.channelId] || 'Unknown'}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontWeight: 500 }}>None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
            
            {/* Media Gallery */}
            <MediaGallery entityType="product" entityId={product.id} />
            
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
