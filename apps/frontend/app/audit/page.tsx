"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import styles from "./audit.module.css";

export default function AuditTrailPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            const data = await fetchApi('/api/audit');
            setLogs(data);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (loading) {
        return <div className={styles.loading}>Loading audit trail...</div>;
    }

    if (error) {
        return <div className={styles.container}>Error: {error}</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column' }}>
                <button 
                    onClick={() => window.location.href = '/'} 
                    style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: '#cbd5e1', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    &larr; Back to Dashboard
                </button>
                <h1 className={styles.title}>Audit Trail</h1>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Date & Time</th>
                            <th className={styles.th}>Operation</th>
                            <th className={styles.th}>Entity Type</th>
                            <th className={styles.th}>Entity ID</th>
                            <th className={styles.th}>User</th>
                            <th className={styles.th}>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.emptyState}>
                                    No audit logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <React.Fragment key={log.id}>
                                    <tr 
                                        className={`${styles.tr} ${styles.trExpandable}`}
                                        onClick={() => toggleRow(log.id)}
                                    >
                                        <td className={styles.td}>
                                            <span className={styles.dateText}>
                                                {new Intl.DateTimeFormat('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                                                }).format(new Date(log.createdAt))}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={`${styles.operationBadge} ${styles['operation' + log.operation]}`}>
                                                {log.operation}
                                            </span>
                                        </td>
                                        <td className={styles.td}>{log.entityType}</td>
                                        <td className={styles.td} style={{ fontFamily: 'monospace' }}>
                                            {log.entityId}
                                        </td>
                                        <td className={styles.td}>
                                            {log.user ? log.user.name : "System"}
                                        </td>
                                        <td className={styles.td}>{log.source}</td>
                                    </tr>
                                    
                                    {expandedRows[log.id] && (
                                        <tr className={styles.detailsRow}>
                                            <td colSpan={6} style={{ padding: 0 }}>
                                                <div className={styles.detailsContent}>
                                                    {log.remarks && (
                                                        <div style={{ marginBottom: '1rem', color: '#94a3b8' }}>
                                                            <strong>Remarks: </strong> {log.remarks}
                                                        </div>
                                                    )}
                                                    
                                                    {log.changedFields ? (
                                                        <>
                                                            <div className={styles.codeTitle}>Changed Fields</div>
                                                            <div className={styles.codeBlock}>
                                                                <pre>{JSON.stringify(log.changedFields, null, 2)}</pre>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={styles.diffContainer}>
                                                            <div>
                                                                <div className={styles.codeTitle}>Before State</div>
                                                                <div className={styles.codeBlock}>
                                                                    <pre>{log.beforeState ? JSON.stringify(log.beforeState, null, 2) : "null"}</pre>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className={styles.codeTitle}>After State</div>
                                                                <div className={styles.codeBlock}>
                                                                    <pre>{log.afterState ? JSON.stringify(log.afterState, null, 2) : "null"}</pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                        <span><strong>IP:</strong> {log.ipAddress || 'N/A'}</span>
                                                        <span style={{ marginLeft: '1rem' }}><strong>User Agent:</strong> {log.userAgent || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
