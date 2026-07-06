'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await fetchApi('/api/auth/register-tenant', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      // On success, redirect to login
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Card>
          <CardHeader>
            <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create Workspace</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Set up your tenant space to get started.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Input
                id="companyName"
                label="Company Name"
                placeholder="Acme Corp"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
              <Input
                id="adminName"
                label="Admin Name"
                placeholder="Tony Stark"
                value={formData.adminName}
                onChange={handleChange}
                required
              />
              <Input
                id="adminEmail"
                type="email"
                label="Admin Email"
                placeholder="tony@acme.com"
                value={formData.adminEmail}
                onChange={handleChange}
                required
              />
              <Input
                id="adminPassword"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.adminPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
              
              {error && <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
              
              <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                Register Tenant
              </Button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
              <a href="/login" style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>Sign In</a>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
