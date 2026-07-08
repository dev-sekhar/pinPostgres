import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from './Card';
import { Button } from './Button';
import { fetchApi } from '../../lib/api';
import { GridList, GridItemProps } from './GridList';

interface Asset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

interface AssetPickerModalProps {
  onClose: () => void;
  onSelect: (asset: Asset) => void;
}

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({ onClose, onSelect }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const data = await fetchApi('/api/assets');
        setAssets(data);
      } catch (err) {
        console.error('Failed to load assets', err);
      } finally {
        setLoading(false);
      }
    };
    loadAssets();
  }, []);

  const gridItems: GridItemProps[] = assets.map(asset => ({
    id: asset.id,
    title: asset.name,
    subtitle: `${Math.round((asset.sizeBytes || 0) / 1024)} KB`,
    previewUrl: asset.url,
    mimeType: asset.mimeType,
    actions: (
      <Button size="sm" onClick={() => onSelect(asset)}>
        Select
      </Button>
    )
  }));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }}>
      <Card style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
        <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Select Asset</h3>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </CardHeader>
        <CardBody style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading assets...</div>
          ) : (
            <GridList items={gridItems} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
