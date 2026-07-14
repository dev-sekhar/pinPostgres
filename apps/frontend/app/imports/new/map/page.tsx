'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { fetchApi } from '../../../../lib/api';

export default function MappingPage() {
  const router = useRouter();
  const [fileData, setFileData] = useState<any>(null);
  const [productFamilies, setProductFamilies] = useState<any[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [attributes, setAttributes] = useState<any[]>([]);
  
  // Mapping state
  const [mapping, setMapping] = useState<any>({
    name: '',
    description: '',
    price: '',
    brandCode: '',
    supplierCode: '',
    manufacturerCode: '',
    channelCodes: '',
    complianceTypeCodes: '',
    attributes: {}
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dataStr = sessionStorage.getItem('import_fileData');
    if (dataStr) {
      setFileData(JSON.parse(dataStr));
    } else {
      router.push('/imports/new');
    }

    const loadFamilies = async () => {
      try {
        const families = await fetchApi('/api/product-families');
        setProductFamilies(families);
      } catch (err) {
        console.error(err);
      }
    };
    loadFamilies();
  }, []);

  useEffect(() => {
    if (selectedFamilyId) {
      const loadAttributes = async () => {
        try {
          const attrs = await fetchApi(`/api/product-families/${selectedFamilyId}/attributes`);
          setAttributes(attrs);
          setMapping((prev: any) => ({ ...prev, attributes: {} }));
        } catch (err) {
          console.error(err);
        }
      };
      loadAttributes();
    } else {
      setAttributes([]);
    }
  }, [selectedFamilyId]);

  if (!fileData) return null;

  const handleSubmit = async () => {
    if (!mapping.name) {
      alert("Name is a mandatory mapping.");
      return;
    }
    
    setSubmitting(true);
    try {
      const finalMappingConfig = {
        ...mapping,
        productFamilyId: selectedFamilyId || null
      };

      const res = await fetchApi('/api/jobs/import', {
        method: 'POST',
        body: JSON.stringify({
          filePath: fileData.filePath,
          mappingConfig: finalMappingConfig,
          type: 'IMPORT_PRODUCTS'
        })
      });
      
      sessionStorage.removeItem('import_fileData');
      router.push(`/imports/${res.id}`);
    } catch (err: any) {
      alert("Failed to submit job: " + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Map CSV Columns</h1>
        <p style={{ color: 'var(--text-secondary)' }}>File: {fileData.originalName}</p>
      </header>

      <Card style={{ marginBottom: '2rem' }}>
        <CardBody style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Target Product Family (Optional)</label>
            <select 
              value={selectedFamilyId} 
              onChange={e => setSelectedFamilyId(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              <option value="">-- No Family (Base Attributes Only) --</option>
              {productFamilies.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>PIM Attribute</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>CSV Column</th>
              </tr>
            </thead>
            <tbody>
              {/* Base Fields */}
              {['name', 'description', 'price', 'brandCode', 'supplierCode', 'manufacturerCode', 'channelCodes', 'complianceTypeCodes'].map(field => (
                <tr key={field} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{field.toUpperCase()}</strong>
                    {['name'].includes(field) && <span style={{ color: 'red', marginLeft: '0.5rem' }}>*</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={mapping[field] || ''}
                      onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">-- Ignore --</option>
                      {fileData.headers.map((h: string) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                </tr>
              ))}

              {/* Dynamic Attributes */}
              {attributes.map(attr => (
                <tr key={attr.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    {attr.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({attr.code})</span>
                    {attr.isRequired && <span style={{ color: 'red', marginLeft: '0.5rem' }}>*</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={mapping.attributes[attr.code] || ''}
                      onChange={e => setMapping({ 
                        ...mapping, 
                        attributes: { ...mapping.attributes, [attr.code]: e.target.value } 
                      })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">-- Ignore --</option>
                      {fileData.headers.map((h: string) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button variant="outline" onClick={() => router.push('/imports/new')}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Starting Import...' : 'Start Import Job'}
        </Button>
      </div>
    </div>
  );
}
