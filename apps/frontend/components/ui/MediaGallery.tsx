import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { fetchApi } from '../../lib/api';
import { GridList, GridItemProps } from './GridList';
import { AssetPickerModal } from './AssetPickerModal';

interface MediaGalleryProps {
  entityType: 'product' | 'brand' | 'supplier' | 'manufacturer' | 'complianceType' | 'channel';
  entityId: string;
}

interface MediaItem {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ entityType, entityId }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/api/media/${entityType}/${entityId}`);
      setMedia(data);
    } catch (err) {
      console.error('Failed to load media', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [entityType, entityId]);

  const handleSelectAsset = async (asset: any) => {
    try {
      await fetchApi(`/api/media/${entityType}`, {
        method: 'POST',
        body: JSON.stringify({
          url: asset.url,
          altText: asset.name,
          assetId: asset.id,
          [`${entityType}Id`]: entityId,
          sortOrder: media.length
        })
      });
      setIsPickerOpen(false);
      loadMedia();
    } catch (err) {
      console.error('Failed to attach asset', err);
      alert('Failed to attach asset');
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm('Are you sure you want to remove this media link?')) return;
    try {
      await fetchApi(`/api/media/${entityType}/${mediaId}`, { method: 'DELETE' });
      loadMedia();
    } catch (err) {
      console.error('Failed to delete media', err);
    }
  };

  const gridItems: GridItemProps[] = media.map(item => ({
    id: item.id,
    title: item.altText || 'Media',
    previewUrl: item.url,
    mimeType: 'image/jpeg', // Assume image for now as we don't have the original asset mimeType readily available here unless we expand the backend response
    actions: (
      <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
        Remove
      </Button>
    )
  }));

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Media & Assets</h3>
        <Button size="sm" onClick={() => setIsPickerOpen(true)}>+ Add Media</Button>
      </div>

      {loading ? (
        <div>Loading media...</div>
      ) : media.length > 0 ? (
        <GridList items={gridItems} />
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
          No media linked yet.
        </div>
      )}

      {isPickerOpen && (
        <AssetPickerModal 
          onClose={() => setIsPickerOpen(false)} 
          onSelect={handleSelectAsset} 
        />
      )}
    </div>
  );
};
