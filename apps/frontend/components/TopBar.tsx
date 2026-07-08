'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { fetchApi } from '../lib/api';
import { clearPermissionsCache } from '../lib/usePermissions';

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [tenantName, setTenantName] = useState<string>('Tenant');

  useEffect(() => {
    // Only fetch if we are on an authenticated route
    if (pathname === '/login' || pathname === '/register') return;
    
    const token = sessionStorage.getItem('token');
    if (token) {
      fetchApi('/api/auth/me')
        .then(data => {
          if (data.tenant && data.tenant.name) {
            setTenantName(data.tenant.name);
          }
        })
        .catch(err => console.error("Failed to fetch user info", err));
    }
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    clearPermissionsCache();
    router.push('/login');
  };

  return (
    <div style={{
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        paddingBottom: '1rem',
      }}>
        <div 
          style={{ cursor: 'pointer' }}
          onClick={() => router.push('/')}
        >
          <h1 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>{tenantName}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
      </div>
    </div>
  );
}
