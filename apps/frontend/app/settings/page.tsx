'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export default function SettingsPage() {
    const router = useRouter();
    const [productSkuPattern, setProductSkuPattern] = useState('');
    const [variantSkuPattern, setVariantSkuPattern] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchApi('/api/settings/sku')
            .then((data) => {
                if (data) {
                    setProductSkuPattern(data.productSkuPattern || 'SKU-{SEQ}');
                    setVariantSkuPattern(data.variantSkuPattern || '{PARENT_SKU}-VAR-{SEQ}');
                }
            })
            .catch((err) => {
                console.error('Failed to load settings', err);
                setMessage('Failed to load settings');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            await fetchApi('/api/settings/sku', {
                method: 'PUT',
                body: JSON.stringify({ productSkuPattern, variantSkuPattern })
            });
            setMessage('Settings saved successfully!');
        } catch (error: any) {
            setMessage(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="center-screen text-gradient">Loading settings...</div>;
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Button variant="outline" onClick={() => router.push('/')}>&larr; Back</Button>
                <h1 className="text-gradient" style={{ margin: 0 }}>Tenant Settings</h1>
            </header>

            <Card style={{ maxWidth: '600px' }}>
                <CardHeader>
                    <h3>SKU Generation Rules</h3>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <Input 
                                id="productSkuPattern"
                                label="Base Product SKU Pattern"
                                value={productSkuPattern}
                                onChange={(e) => setProductSkuPattern(e.target.value)}
                                placeholder="e.g. SKU-{SEQ}"
                                required
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Use <code>{'{SEQ}'}</code> as the placeholder for the auto-incrementing number.
                            </p>
                        </div>
                        
                        <div>
                            <Input 
                                id="variantSkuPattern"
                                label="Variant SKU Pattern"
                                value={variantSkuPattern}
                                onChange={(e) => setVariantSkuPattern(e.target.value)}
                                placeholder="e.g. {PARENT_SKU}-VAR-{SEQ}"
                                required
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Use <code>{'{PARENT_SKU}'}</code> for the parent product's SKU, and <code>{'{SEQ}'}</code> for the variant sequence.
                            </p>
                        </div>

                        {message && (
                            <div style={{ 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                background: message.includes('success') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.includes('success') ? '#34d399' : '#ef4444',
                                border: `1px solid ${message.includes('success') ? '#34d399' : '#ef4444'}`
                            }}>
                                {message}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
