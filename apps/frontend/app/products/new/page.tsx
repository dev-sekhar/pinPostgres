'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { fetchApi } from '../../../lib/api';

interface AttributeDefinition {
  id: string;
  code: string;
  name: string;
  type: string;
  isRequired: boolean;
  options?: any;
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
    sku: '',
    name: '',
    description: '',
    price: ''
  });
  
  // Master list of available definitions
  const [attributeDefs, setAttributeDefs] = useState<AttributeDefinition[]>([]);
  // Current assignments for this product
  const [assignments, setAssignments] = useState<AttributeAssignment[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch attribute definitions on mount
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const data = await fetchApi('/api/attributes');
        setAttributeDefs(data);
        
        // Auto-add rows for REQUIRED attributes
        const initialAssignments: AttributeAssignment[] = [];
        data.forEach((attr: AttributeDefinition) => {
          if (attr.isRequired) {
            initialAssignments.push({
              attributeCode: attr.code,
              value: attr.type === 'BOOLEAN' ? false : ''
            });
          }
        });
        setAssignments(initialAssignments);
      } catch (err: any) {
        console.error("Failed to load attributes", err);
      }
    };
    loadAttributes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleAssignmentChange = (index: number, field: 'attributeCode' | 'value', val: any) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = val;
    
    // If the user changed the attribute, reset the value based on the new attribute's type
    if (field === 'attributeCode') {
      const def = attributeDefs.find(a => a.code === val);
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
    setError('');

    // Ensure all required attributes are present
    const requiredDefs = attributeDefs.filter(a => a.isRequired);
    for (const def of requiredDefs) {
      const assignment = assignments.find(a => a.attributeCode === def.code);
      if (!assignment || assignment.value === '' || assignment.value === undefined) {
        setError(`Required attribute "${def.name}" is missing or empty.`);
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
          attributes: attributesObj // Pass dynamically assigned attributes
        }),
      });
      // On success, redirect back to parent or products list
      if (parentId) {
        router.push(`/products/${parentId}`);
      } else {
        router.push('/products');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get unassigned attributes for the dropdown
  const getAvailableOptions = (currentIndex: number) => {
    const assignedCodes = assignments.map((a, i) => i !== currentIndex ? a.attributeCode : null).filter(Boolean);
    return attributeDefs.filter(def => !assignedCodes.includes(def.code));
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  id="sku"
                  label="SKU"
                  placeholder="PROD-01"
                  value={formData.sku}
                  onChange={handleChange}
                  required
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
              <Input
                id="name"
                label="Product Name"
                placeholder="Awesome T-Shirt"
                value={formData.name}
                onChange={handleChange}
                required
              />
              
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
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Link custom schema attributes to this product.</p>
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
                        const def = attributeDefs.find(a => a.code === assignment.attributeCode);
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

                            {/* Remove Button */}
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => removeAssignmentRow(index)}
                              disabled={isRequired} // Cannot remove required attributes
                              style={{ padding: '0 1rem', height: '42px' }}
                            >
                              X
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginTop: '2rem' }}>
                  {error}
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
