'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';

export default function JobDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [editedRows, setEditedRows] = useState<any[]>([]);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadJob = async () => {
      try {
        const data = await fetchApi(`/api/jobs/${id}`);
        setJob(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadJob();
    const interval = setInterval(() => {
      // Re-fetch only if not completed/failed
      setJob((prev: any) => {
        if (!prev || (prev.status !== 'COMPLETED' && prev.status !== 'FAILED')) {
          loadJob();
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (job?.errorLog && job.errorLog.length > 0 && editedRows.length === 0) {
      setEditedRows(job.errorLog.map((log: any) => ({ ...log.row })));
    }
  }, [job]);

  const handleCellChange = (index: number, key: string, value: string) => {
    const newRows = [...editedRows];
    newRows[index] = { ...newRows[index], [key]: value };
    setEditedRows(newRows);
  };

  const handleResubmit = async () => {
    setResubmitting(true);
    try {
      const res = await fetchApi(`/api/jobs/${id}/retry`, {
        method: 'POST',
        body: JSON.stringify({ rows: editedRows })
      });
      router.push(`/imports/${res.id}`);
    } catch (err: any) {
      alert("Failed to resubmit: " + err.message);
      setResubmitting(false);
    }
  };

  if (!job) return <div className="center-screen">Loading...</div>;

  const total = job.totalRows || 1;
  const processed = job.processedRows + job.failedRows;
  const progress = (processed / total) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'gray';
      case 'PROCESSING': return 'blue';
      case 'COMPLETED': return 'green';
      case 'FAILED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/imports')} style={{ marginBottom: '1rem' }}>
          &larr; Back to Imports
        </Button>
        <h1 className="text-gradient">Job Details</h1>
        <p style={{ color: 'var(--text-secondary)' }}>ID: {job.id}</p>
      </header>

      <Card style={{ marginBottom: '2rem' }}>
        <CardBody style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Status</p>
              <h2 style={{ margin: 0, color: getStatusColor(job.status) }}>{job.status}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Processed / Total</p>
              <h2 style={{ margin: 0 }}>{processed} / {job.totalRows}</h2>
            </div>
          </div>

          <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '24px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--primary-color)', 
              width: `${progress}%`,
              transition: 'width 0.5s ease-in-out'
            }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: progress > 50 ? '#fff' : 'var(--text-primary)', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {progress.toFixed(1)}%
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Success: {job.processedRows}</span>
            <span style={{ color: 'red' }}>Failed: {job.failedRows}</span>
          </div>
        </CardBody>
      </Card>

      {job.errorLog && job.errorLog.length > 0 && editedRows.length > 0 && (
        <Card>
          <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'red' }}>Failed Records ({editedRows.length})</h3>
            <Button onClick={handleResubmit} disabled={resubmitting}>
              {resubmitting ? 'Resubmitting...' : 'Resubmit Corrected Rows'}
            </Button>
          </CardHeader>
          <CardBody style={{ overflowX: 'auto', padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Error Reason</th>
                  {Object.keys(editedRows[0]).map(key => (
                    <th key={key} style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editedRows.map((row, index) => (
                  <tr key={index} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#ff6b6b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={job.errorLog[index].error}>
                      {job.errorLog[index].error}
                    </td>
                    {Object.keys(row).map(key => (
                      <td key={key} style={{ padding: '0.25rem' }}>
                        <input
                          type="text"
                          value={row[key] || ''}
                          onChange={(e) => handleCellChange(index, key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid transparent',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            borderRadius: '4px'
                          }}
                          onFocus={(e) => { e.target.style.border = '1px solid var(--border-color)'; e.target.style.background = 'var(--bg-panel)'; }}
                          onBlur={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.background = 'transparent'; }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
