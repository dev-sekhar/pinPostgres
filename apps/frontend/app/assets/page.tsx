'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../lib/api';
import { GridList } from '../../components/ui/GridList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/api/assets');
      setAssets(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadUrl) {
      toast.error('Please provide a name and URL');
      return;
    }

    setUploading(true);
    try {
      await fetchApi('/api/assets', {
        method: 'POST',
        body: JSON.stringify({ name: uploadName, url: uploadUrl })
      });
      toast.success('Asset uploaded successfully');
      setShowModal(false);
      setUploadName('');
      setUploadUrl('');
      loadAssets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload asset');
    } finally {
      setUploading(false);
    }
  };

  const gridItems = assets.map(a => ({
    id: a.id,
    title: a.name,
    subtitle: `${a.mimeType || 'Unknown'} • ${(a.sizeBytes / 1024).toFixed(1)} KB`,
    previewUrl: a.url,
    mimeType: a.mimeType,
    actions: (
      <Button 
        variant="secondary" 
        onClick={() => window.open(a.url, '_blank')}
      >
        Open
      </Button>
    )
  }));

  const router = useRouter();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-gradient">Asset Repository</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage generic digital assets and media.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Upload URL</Button>
      </header>

      {loading ? (
        <div className="center-screen text-gradient">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)' }}>No assets found. Upload a URL to get started.</div>
      ) : (
        <GridList items={gridItems} />
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-panel)', padding: '2rem', borderRadius: '12px', 
            width: '100%', maxWidth: '400px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Upload Asset URL</h3>
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Asset Name</label>
                <Input 
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Logo"
                  disabled={uploading}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Asset URL</label>
                <Input 
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  type="url"
                  disabled={uploading}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button" disabled={uploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Processing...' : 'Save Asset'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
