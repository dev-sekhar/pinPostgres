import { useState, useEffect } from 'react';
import { fetchApi } from './api';

let cachedPermissions: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;
let cachedToken: string | null = null;

export function usePermissions() {
    const [permissions, setPermissions] = useState<string[]>(cachedPermissions || []);
    const [loading, setLoading] = useState<boolean>(cachedPermissions === null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        // Invalidate cache if token changed
        if (cachedToken !== token) {
            clearPermissionsCache();
        }
        
        if (cachedPermissions) {
            setPermissions(cachedPermissions);
            setLoading(false);
            return;
        }

        if (!fetchPromise) {
            const token = localStorage.getItem('token');
            if (token) {
                fetchPromise = fetchApi('/api/auth/me/permissions')
                    .then(data => {
                        cachedPermissions = data.permissions || [];
                        cachedToken = token;
                        return cachedPermissions as string[];
                    })
                    .catch(err => {
                        console.error('Failed to fetch permissions', err);
                        return [];
                    });
            } else {
                fetchPromise = Promise.resolve([]);
            }
        }

        fetchPromise.then(perms => {
            setPermissions(perms);
            setLoading(false);
        });
    }, []);

    const hasPermission = (code: string) => permissions.includes(code);

    return { permissions, hasPermission, loading };
}

export function clearPermissionsCache() {
    cachedPermissions = null;
    fetchPromise = null;
    cachedToken = null;
}
