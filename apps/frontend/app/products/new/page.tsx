'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';
import toast from 'react-hot-toast';

interface AttributeDefinition {
  id: string;
  code: string;
  name: string;
  type: string;
  isRequired: boolean;
  options?: any;
  productFamilyId: string;
}

interface AttributeAssignment {
  attributeCode: string;
  value: any;
}

function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'ACTIVE'
  });
  
  // Master list of available definitions
  const [attributeDefs, setAttributeDefs] = useState<AttributeDefinition[]>([]);
  // Current assignments for this product
  const [assignments, setAssignments] = useState<AttributeAssignment[]>([]);
  
  // Classification state
  const [domains, setDomains] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');

  // Master Data state
  const [brands, setBrands] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [complianceTypes, setComplianceTypes] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);

  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
  const [selectedComplianceTypeIds, setSelectedComplianceTypeIds] = useState<string[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [previewSku, setPreviewSku] = useState('');

  // Fetch classification and attributes on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const promises: Promise<any>[] = [
          fetchApi('/api/domains'),
          fetchApi('/api/categories'),
          fetchApi('/api/product-families'),
          fetchApi('/api/attributes'),
          fetchApi('/api/brands'),
          fetchApi('/api/suppliers'),
          fetchApi('/api/manufacturers'),
          fetchApi('/api/compliance-types'),
          fetchApi('/api/channels')
        ];
        
        if (parentId) {
          promises.push(fetchApi(`/api/products/${parentId}`));
          promises.push(fetchApi(`/api/products/${parentId}/next-variant-sku`).catch(() => ({ nextSku: 'Auto-generated' })));
        } else {
          promises.push(fetchApi('/api/products/next-sku').catch(() => ({ nextSku: 'Auto-generated' })));
        }
        
        const results = await Promise.all(promises);
        const [dData, cData, fData, attrData, bData, sData, mData, ctData, chData, parentData, skuPreviewData] = results;
        
        // Handle variant case vs base product case
        let actualParentData = null;
        let actualSkuPreviewData = null;
        
        if (parentId) {
            actualParentData = parentData;
            actualSkuPreviewData = skuPreviewData;
        } else {
            actualSkuPreviewData = parentData; // The item after chData is the SKU preview when no parentId
        }

        if (actualSkuPreviewData && actualSkuPreviewData.nextSku) {
            setPreviewSku(actualSkuPreviewData.nextSku);
        }
        
        setDomains(dData);
        setCategories(cData);
        setFamilies(fData);
        setAttributeDefs(attrData);
        
        // Filter master data to only ACTIVE
        setBrands(bData.filter((b: any) => b.status === 'ACTIVE'));
        setSuppliers(sData.filter((s: any) => s.status === 'ACTIVE'));
        setManufacturers(mData.filter((m: any) => m.status === 'ACTIVE'));
        setComplianceTypes(ctData.filter((c: any) => c.status === 'ACTIVE'));
        setChannels(chData.filter((c: any) => c.status === 'ACTIVE'));
        
        if (actualParentData && actualParentData.productFamilyId) {
          const prodFamId = actualParentData.productFamilyId;
          setSelectedFamilyId(prodFamId);
          const fam = fData.find((f: any) => f.id === prodFamId);
          if (fam) {
            setSelectedCategoryId(fam.categoryId);
            const cat = cData.find((c: any) => c.id === fam.categoryId);
            if (cat) {
              setSelectedDomainId(cat.domainId);
            }
          }
        }
      } catch (err: any) {
        toast.error("Failed to load initial data: " + err.message);
        console.error("Failed to load initial data", err);
      }
    };
    loadInitialData();
  }, [parentId]);

  // Update attributes when family changes
  useEffect(() => {
    if (!selectedFamilyId) {
      setAssignments([]);
      return;
    }
    const familyAttributes = attributeDefs.filter((a: any) => a.productFamilyId === selectedFamilyId);
    
    // Auto-add rows for ALL attributes
    const initialAssignments: AttributeAssignment[] = [];
    familyAttributes.forEach((attr: AttributeDefinition) => {
      initialAssignments.push({
        attributeCode: attr.code,
        value: attr.type === 'BOOLEAN' ? false : ''
      });
    });
    setAssignments(initialAssignments);
  }, [selectedFamilyId, attributeDefs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleAssignmentChange = (index: number, field: 'attributeCode' | 'value', val: any) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = val;
    
    // If the user changed the attribute, reset the value based on the new attribute's type
    if (field === 'attributeCode') {
      const def = attributeDefs.find(a => a.code === val && a.productFamilyId === selectedFamilyId);
      newAssignments[index].value = def?.type === 'BOOLEAN' ? false : '';
    }
    
    setAssignments(newAssignments);
  };

  const addAssignmentRow = () => {
    setAssignments([...assignments, { attributeCode: '', value: '' }]);
  };

  const removeAssignmentRow = (index: number) => {
    const newAssignments = [...assignments];
    newAssignments.splice(index, 1);
    setAssignments(newAssignments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedFamilyId) {
      toast.error("Please select a Product Family.");
      setLoading(false);
      return;
    }

    // Ensure all required attributes are present
    const requiredDefs = attributeDefs.filter((a: any) => a.isRequired && a.productFamilyId === selectedFamilyId);
    for (const def of requiredDefs) {
      const assignment = assignments.find(a => a.attributeCode === def.code);
      if (!assignment || assignment.value === '' || assignment.value === undefined) {
        toast.error(`Required attribute "${def.name}" is missing or empty.`);
        setLoading(false);
        return;
      }
    }

    // Convert assignments array to a clean JSON object
    const attributesObj: Record<string, any> = {};
    for (const assignment of assignments) {
      if (assignment.attributeCode && assignment.value !== '') {
        attributesObj[assignment.attributeCode] = assignment.value;
      }
    }

    try {
      await fetchApi('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          parentId: parentId || undefined,
          productFamilyId: selectedFamilyId,
          attributes: attributesObj,
          brandId: selectedBrandId || undefined,
          supplierId: selectedSupplierId || undefined,
          manufacturerId: selectedManufacturerId || undefined,
          complianceTypeIds: selectedComplianceTypeIds,
          channelIds: selectedChannelIds,
          status: formData.status
        }),
      });
      // On success, redirect back to parent or products list
      if (parentId) {
        router.push(`/products/${parentId}`);
      } else {
        router.push('/products');
      }
      toast.success('Product saved successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get unassigned attributes for the dropdown
  const getAvailableOptions = (currentIndex: number) => {
    const familyAttributes = attributeDefs.filter((a: any) => a.productFamilyId === selectedFamilyId);
    const assignedCodes = assignments.map((a, i) => i !== currentIndex ? a.attributeCode : null).filter(Boolean);
    return familyAttributes.filter(def => !assignedCodes.includes(def.code));
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <Button variant="outline" size="sm" onClick={() => parentId ? router.push(`/products/${parentId}`) : router.push('/products')} style={{ marginBottom: '1rem' }}>
          &larr; Back
        </Button>
        <h1 className="text-gradient">
          {parentId ? 'Create Product Variant' : 'Create New Product'}
        </h1>
      </header>

      <div style={{ maxWidth: '800px' }}>
        <Card>
          <CardHeader>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Product Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Enter the primary information for this product.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                <Input
                  id="name"
                  label="Product Name"
                  placeholder="Awesome T-Shirt"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  id="sku"
                  label="SKU"
                  value={previewSku}
                  onChange={() => {}}
                  placeholder="Loading preview..."
                  disabled={true}
                />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  label="Price ($)"
                  placeholder="99.99"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Domain</label>
                  <select 
                    value={selectedDomainId} 
                    onChange={e => { setSelectedDomainId(e.target.value); setSelectedCategoryId(''); setSelectedFamilyId(''); }}
                    style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', opacity: parentId ? 0.7 : 1 }}
                    disabled={!!parentId}
                  >
                    <option value="">-- Select Domain --</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Category</label>
                  <select 
                    value={selectedCategoryId} 
                    onChange={e => { setSelectedCategoryId(e.target.value); setSelectedFamilyId(''); }}
                    style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', opacity: parentId ? 0.7 : 1 }}
                    disabled={!selectedDomainId || !!parentId}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.filter(c => c.domainId === selectedDomainId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Product Family *</label>
                  <select 
                    value={selectedFamilyId} 
                    onChange={e => setSelectedFamilyId(e.target.value)}
                    style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', opacity: parentId ? 0.7 : 1 }}
                    disabled={!selectedCategoryId || !!parentId}
                    required
                  >
                    <option value="">-- Select Family --</option>
                    {families.filter(f => f.categoryId === selectedCategoryId).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Master Data Section */}
              <div style={{ marginTop: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Master Data Links</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Brand</label>
                    <select 
                      value={selectedBrandId} 
                      onChange={e => setSelectedBrandId(e.target.value)}
                      style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="">-- Select Brand --</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Supplier</label>
                    <select 
                      value={selectedSupplierId} 
                      onChange={e => setSelectedSupplierId(e.target.value)}
                      style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Manufacturer</label>
                    <select 
                      value={selectedManufacturerId} 
                      onChange={e => setSelectedManufacturerId(e.target.value)}
                      style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="">-- Select Manufacturer --</option>
                      {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Compliance Types</label>
                    <div style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                      {complianceTypes.map(c => (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedComplianceTypeIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedComplianceTypeIds([...selectedComplianceTypeIds, c.id]);
                              else setSelectedComplianceTypeIds(selectedComplianceTypeIds.filter(id => id !== c.id));
                            }}
                          />
                          {c.name}
                        </label>
                      ))}
                      {complianceTypes.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No active compliance types.</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Channels</label>
                    <div style={{ padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                      {channels.map(c => (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedChannelIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedChannelIds([...selectedChannelIds, c.id]);
                              else setSelectedChannelIds(selectedChannelIds.filter(id => id !== c.id));
                            }}
                          />
                          {c.name}
                        </label>
                      ))}
                      {channels.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No active channels.</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
                <label htmlFor="description" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Dynamic Assignments Section */}
              {attributeDefs.length > 0 && (
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem' }}>Attribute Assignments</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Fill out the custom attributes for this product.</p>
                    </div>
                    {getAvailableOptions(-1).length > 0 && (
                      <Button type="button" size="sm" onClick={addAssignmentRow}>+ Assign Attribute</Button>
                    )}
                  </div>
                  
                  {assignments.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>No attributes assigned.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {assignments.map((assignment, index) => {
                        const def = attributeDefs.find((a: any) => a.code === assignment.attributeCode && a.productFamilyId === selectedFamilyId);
                        const isRequired = def?.isRequired;
                        
                        return (
                          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', alignItems: 'end', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            {/* Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Attribute</label>
                              <select
                                value={assignment.attributeCode}
                                onChange={(e) => handleAssignmentChange(index, 'attributeCode', e.target.value)}
                                disabled={isRequired} // Cannot unassign a required attribute row
                                style={{
                                  padding: '0.625rem 1rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--bg-input)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                }}
                                required
                              >
                                <option value="" disabled>-- Select Attribute --</option>
                                {def && <option value={def.code}>{def.name} {isRequired ? '*' : ''}</option>}
                                {!def && getAvailableOptions(index).map(opt => (
                                  <option key={opt.code} value={opt.code}>{opt.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Value Input */}
                            <div>
                              {!def && <div style={{ padding: '0.625rem', color: 'var(--text-secondary)' }}>Select an attribute first...</div>}
                              
                              {def?.type === 'TEXT' && (
                                <Input
                                  id={`val-${index}`}
                                  label="Value"
                                  value={assignment.value}
                                  onChange={(e) => handleAssignmentChange(index, 'value', e.target.value)}
                                  required={isRequired}
                                />
                              )}
                              
                              {def?.type === 'NUMBER' && (
                                <Input
                                  id={`val-${index}`}
                                  type="number"
                                  label="Value"
                                  value={assignment.value}
                                  onChange={(e) => handleAssignmentChange(index, 'value', Number(e.target.value))}
                                  required={isRequired}
                                />
                              )}
                              
                              {def?.type === 'BOOLEAN' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}>
                                  <input
                                    type="checkbox"
                                    id={`val-${index}`}
                                    checked={!!assignment.value}
                                    onChange={(e) => handleAssignmentChange(index, 'value', e.target.checked)}
                                    style={{ width: '1.25rem', height: '1.25rem' }}
                                  />
                                  <label htmlFor={`val-${index}`}>Yes / True</label>
                                </div>
                              )}
                              
                              {def?.type === 'SELECT' && Array.isArray(def.options) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Value</label>
                                  <select
                                    value={assignment.value}
                                    onChange={(e) => handleAssignmentChange(index, 'value', e.target.value)}
                                    required={isRequired}
                                    style={{
                                      padding: '0.625rem 1rem',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'var(--bg-input)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-primary)',
                                      fontFamily: 'inherit',
                                      outline: 'none',
                                    }}
                                  >
                                    <option value="">-- Select --</option>
                                    {def.options.map((opt: string, i: number) => (
                                      <option key={i} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            {/* Remove Button (Only for Optional Attributes) */}
                            {!isRequired && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => removeAssignmentRow(index)}
                                style={{ padding: '0 1rem', height: '42px' }}
                              >
                                X
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem' }}>
                <Button type="button" variant="outline" onClick={() => parentId ? router.push(`/products/${parentId}`) : router.push('/products')}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Save Product</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div className="center-screen text-gradient">Loading...</div>}>
      <ProductForm />
    </Suspense>
  );
}
