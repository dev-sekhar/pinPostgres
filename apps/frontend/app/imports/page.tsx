'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { GridList } from '../../components/ui/GridList';
import { HasPermission } from '../../components/HasPermission';

export default function ImportsDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await fetchApi('/api/jobs');
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadJobs();
    
    // Poll every 5 seconds if there are running jobs
    const interval = setInterval(() => {
      loadJobs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'gray';
      case 'PROCESSING': return 'blue';
      case 'COMPLETED': return 'green';
      case 'FAILED': return 'red';
      default: return 'gray';
    }
  };

  if (loading && jobs.length === 0) return <div className="center-screen text-gradient">Loading jobs...</div>;

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient">Imports & Exports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your bulk data operations</p>
        </div>
        <HasPermission permission="import.create">
          <Button onClick={() => router.push('/imports/new')}>+ New Import</Button>
        </HasPermission>
      </header>

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No jobs found.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Progress</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{job.type}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: getStatusColor(job.status), fontWeight: 'bold' }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        background: 'var(--primary-color)', 
                        width: `${job.totalRows > 0 ? (job.processedRows + job.failedRows) / job.totalRows * 100 : 0}%` 
                      }} />
                    </div>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      {job.processedRows + job.failedRows} / {job.totalRows}
                    </small>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/imports/${job.id}`)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
