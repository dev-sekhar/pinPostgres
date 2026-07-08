import React, { useState } from 'react';
import styles from './GridList.module.css';
import { Button } from './Button';

export interface GridItemProps {
  id: string;
  title: string;
  subtitle?: string;
  previewUrl?: string;
  mimeType?: string;
  actions?: React.ReactNode;
}

export interface GridListProps {
  items: GridItemProps[];
  renderFallbackPreview?: (item: GridItemProps) => React.ReactNode;
  hidePreview?: boolean;
}

export const GridList: React.FC<GridListProps> = ({ items, renderFallbackPreview, hidePreview = false }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
        </Button>
      </div>
      
      {viewMode === 'grid' ? (
        <div className={styles.grid}>
          {items.map((item) => {
            const isImage = item.mimeType?.startsWith('image/');
            
            return (
              <div key={item.id} className={styles.listItem}>
                {!hidePreview && (
                  <div className={styles.preview}>
                    {isImage && item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt={item.title} />
                    ) : (
                      <div className={styles.previewFallback}>
                        {renderFallbackPreview ? renderFallbackPreview(item) : (item.mimeType?.split('/')[1] || 'FILE')}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={styles.content}>
                  <div className={styles.title} title={item.title}>
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className={styles.subtitle}>{item.subtitle}</div>
                  )}
                  
                  {item.actions && (
                    <div className={styles.actions}>
                      {item.actions}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {!hidePreview && <th className={styles.th}>Preview</th>}
                <th className={styles.th}>Title</th>
                <th className={styles.th}>Details</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isImage = item.mimeType?.startsWith('image/');
                return (
                  <tr key={item.id} className={styles.tr}>
                    {!hidePreview && (
                      <td className={styles.td}>
                        <div className={styles.tablePreview}>
                          {isImage && item.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.previewUrl} alt={item.title} />
                          ) : (
                            <div className={styles.tablePreviewFallback}>
                              {renderFallbackPreview ? renderFallbackPreview(item) : (item.mimeType?.split('/')[1] || 'FILE')}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className={styles.td} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {item.title}
                    </td>
                    <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>
                      {item.subtitle}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      {item.actions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
