import React from 'react';
import { usePermissions } from '../lib/usePermissions';

interface HasPermissionProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({ permission, children, fallback = null }) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return null; // Or a small skeleton
    }

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
