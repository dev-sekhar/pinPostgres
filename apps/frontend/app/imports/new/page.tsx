'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function NewImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
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
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/imports')} style={{ marginBottom: '1rem' }}>
          &larr; Back to Imports
        </Button>
        <h1 className="text-gradient">Upload CSV</h1>
      </header>

      <Card>
        <CardBody style={{ padding: '3rem', textAlign: 'center', border: '2px dashed var(--border-color)', margin: '1rem', borderRadius: 'var(--radius-lg)' }}>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="csv-upload"
          />
          <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3rem', color: 'var(--primary-color)' }}>📄</div>
            {file ? (
              <h3>{file.name}</h3>
            ) : (
              <>
                <h3>Click to select or drag and drop</h3>
                <p style={{ color: 'var(--text-secondary)' }}>CSV files only. Max 50MB.</p>
              </>
            )}
          </label>
          
          {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
          
          {file && (
            <div style={{ marginTop: '2rem' }}>
              <Button onClick={handleUpload} disabled={uploading} style={{ width: '100%', maxWidth: '300px' }}>
                {uploading ? 'Uploading & Parsing...' : 'Continue to Mapping'}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
