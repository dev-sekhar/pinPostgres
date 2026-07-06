'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Check if redirected from register
    if (typeof window !== 'undefined' && window.location.search.includes('registered=true')) {
      setSuccessMsg('Account created! Please log in.');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      // Save token
      if (data.token) {
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        throw new Error('No token received');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Card>
          <CardHeader>
            <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sign in to manage your workspace.</p>
          </CardHeader>
          <CardBody>
            {successMsg && <div style={{ color: 'var(--success-color)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>{successMsg}</div>}
            <form onSubmit={handleSubmit}>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="tony@acme.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              
              {error && <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
              
              <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                Sign In
              </Button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
              <a href="/register" style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>Create Workspace</a>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
