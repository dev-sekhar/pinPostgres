'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fetchApi } from '../../lib/api';
import { HasPermission } from '../../components/HasPermission';

export default function ClassificationPage() {
  const router = useRouter();
  
  // Data State
  const [domains, setDomains] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  
  // Selection State
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newDomainName, setNewDomainName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    initialValue: string;
    onSubmit: (val: string) => void;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dData, cData, fData] = await Promise.all([
        fetchApi('/api/domains'),
        fetchApi('/api/categories'),
        fetchApi('/api/product-families')
      ]);
      setDomains(dData);
      setCategories(cData);
      setFamilies(fData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName) return;
    try {
      const newDomain = await fetchApi('/api/domains', {
        method: 'POST',
        body: JSON.stringify({ name: newDomainName.trim() })
      });
      setDomains(prev => [...prev, newDomain]);
      setNewDomainName('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!newCategoryName || !selectedDomainId) return;
    try {
      const newCategory = await fetchApi('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim(), domainId: selectedDomainId, parentId })
      });
      setCategories(prev => [...prev, newCategory]);
      setNewCategoryName('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName || !selectedCategoryId) return;
    try {
      const newFamily = await fetchApi('/api/product-families', {
        method: 'POST',
        body: JSON.stringify({ name: newFamilyName.trim(), categoryId: selectedCategoryId })
      });
      setFamilies(prev => [...prev, newFamily]);
      setNewFamilyName('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditItem = (type: 'domains'|'categories'|'product-families', item: any) => {
    setModalConfig({
      isOpen: true,
      title: `Enter new name for ${item.name}:`,
      initialValue: item.name,
      onSubmit: async (newName: string) => {
        if (!newName || newName === item.name) return;
        try {
          await fetchApi(`/api/${type}/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName.trim() })
          });
          loadData();
        } catch (err: any) {
          setError(err.message);
        }
      }
    });
  };

  const handleDeleteItem = async (type: 'domains'|'categories'|'product-families', id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await fetchApi(`/api/${type}/${id}`, { method: 'DELETE' });
      if (type === 'domains' && selectedDomainId === id) setSelectedDomainId(null);
      if (type === 'categories' && selectedCategoryId === id) setSelectedCategoryId(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="center-screen text-gradient">Loading classification hierarchy...</div>;
  }

  const renderCategoryTree = (parentId: string | null, depth: number = 0) => {
    const children = categories.filter(c => c.domainId === selectedDomainId && c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: depth > 0 ? '1rem' : '0', borderLeft: depth > 0 ? '1px solid var(--border-color)' : 'none', paddingLeft: depth > 0 ? '0.5rem' : '0' }}>
        {children.map(c => (
          <React.Fragment key={c.id}>
            <Card 
              style={{ 
                cursor: 'pointer', 
                borderColor: selectedCategoryId === c.id ? 'var(--accent-primary)' : 'var(--border-color)',
                background: selectedCategoryId === c.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-panel)'
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedCategoryId(c.id); }}
            >
              <CardBody style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: depth > 0 ? '0.9rem' : '1rem' }}>{c.name}</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <HasPermission permission="category.create">
                    <Button size="sm" variant="outline" onClick={(e) => { 
                      e.stopPropagation(); 
                      setModalConfig({
                        isOpen: true,
                        title: `Enter name for subcategory of ${c.name}:`,
                        initialValue: '',
                        onSubmit: (name: string) => {
                          if (name) {
                            fetchApi('/api/categories', {
                              method: 'POST',
                              body: JSON.stringify({ name: name.trim(), domainId: selectedDomainId, parentId: c.id })
                            }).then(newCat => setCategories(prev => [...prev, newCat])).catch(err => setError(err.message));
                          }
                        }
                      });
                    }}>+ Sub</Button>
                  </HasPermission>
                  <HasPermission permission="category.update">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditItem('categories', c); }}>Edit</Button>
                  </HasPermission>
                  <HasPermission permission="category.delete">
                    <Button size="sm" variant="outline" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={(e) => { e.stopPropagation(); handleDeleteItem('categories', c.id); }}>Del</Button>
                  </HasPermission>
                </div>
              </CardBody>
            </Card>
            {renderCategoryTree(c.id, depth + 1)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const activeCategories = categories.filter(c => c.domainId === selectedDomainId && c.parentId === null);
  const activeFamilies = families.filter(f => f.categoryId === selectedCategoryId);

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '1400px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-gradient">Classification Hierarchy</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Manage Domains, Categories, and Product Families.
          </p>
        </div>
      </header>

      {error && (
        <div style={{ color: 'var(--error-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        
        {/* DOMAINS COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Domains</h2>
          
          <HasPermission permission="domain.create">
            <form onSubmit={handleCreateDomain} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <Input 
                  id="domainName" 
                  placeholder="New Domain..." 
                  value={newDomainName} 
                  onChange={(e) => setNewDomainName(e.target.value)} 
                />
              </div>
              <Button type="submit" size="sm">+</Button>
            </form>
          </HasPermission>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {domains.map(d => (
              <Card 
                key={d.id} 
                style={{ 
                  cursor: 'pointer', 
                  borderColor: selectedDomainId === d.id ? 'var(--accent-primary)' : 'var(--border-color)',
                  background: selectedDomainId === d.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-panel)'
                }}
                onClick={() => { setSelectedDomainId(d.id); setSelectedCategoryId(null); }}
              >
                <CardBody style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>{d.name}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <HasPermission permission="domain.update">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditItem('domains', d); }}>Edit</Button>
                    </HasPermission>
                    <HasPermission permission="domain.delete">
                      <Button size="sm" variant="outline" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={(e) => { e.stopPropagation(); handleDeleteItem('domains', d.id); }}>Del</Button>
                    </HasPermission>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* CATEGORIES COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Categories</h2>
          
          {!selectedDomainId ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Select a domain first.</p>
          ) : (
            <>
              <HasPermission permission="category.create">
                <form onSubmit={(e) => handleCreateCategory(e, null)} style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <Input 
                      id="categoryName" 
                      placeholder="New Root Category..." 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)} 
                    />
                  </div>
                  <Button type="submit" size="sm">+</Button>
                </form>
              </HasPermission>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {renderCategoryTree(null)}
                {activeCategories.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No categories found in this domain.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* PRODUCT FAMILIES COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Product Families</h2>
          
          {!selectedCategoryId ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Select a category first.</p>
          ) : (
            <>
              <HasPermission permission="productFamily.create">
                <form onSubmit={handleCreateFamily} style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <Input 
                      id="familyName" 
                      placeholder="New Family..." 
                      value={newFamilyName} 
                      onChange={(e) => setNewFamilyName(e.target.value)} 
                    />
                  </div>
                  <Button type="submit" size="sm">+</Button>
                </form>
              </HasPermission>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeFamilies.map(f => (
                  <Card key={f.id} style={{ padding: '1rem' }}>
                    <CardBody style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>{f.name}</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <HasPermission permission="productFamily.update">
                          <Button size="sm" variant="outline" onClick={() => handleEditItem('product-families', f)}>Edit</Button>
                        </HasPermission>
                        <HasPermission permission="productFamily.delete">
                          <Button size="sm" variant="outline" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={() => handleDeleteItem('product-families', f.id)}>Del</Button>
                        </HasPermission>
                      </div>
                    </CardBody>
                  </Card>
                ))}
                {activeFamilies.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No product families found in this category.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CUSTOM PROMPT MODAL */}
      {modalConfig && modalConfig.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <Card style={{ width: '100%', maxWidth: '400px', margin: '0 1rem', background: 'var(--bg-panel)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <CardHeader style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{modalConfig.title}</h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const val = formData.get('modalInput') as string;
                modalConfig.onSubmit(val);
                setModalConfig(null);
              }}>
                <Input
                  id="modalInput"
                  name="modalInput"
                  defaultValue={modalConfig.initialValue}
                  autoFocus
                  style={{ marginBottom: '1.5rem', width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <Button type="button" variant="outline" onClick={() => setModalConfig(null)}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
