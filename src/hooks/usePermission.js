import { useAuthStore } from '../stores/useAuthStore.js';

export function usePermission() {
    const userPermissions = useAuthStore.getState().permissions || [];

    const hasPermission = (permission) => {
        return userPermissions.includes(permission);
    }

    const hasAllPermissions = (permissions = []) => {
        if (permissions.length === 0) return true;
        return permissions.every((permission) => userPermissions.includes(permission));
    }

    const hasSomePermissions = (permissions = []) => {
        if (permissions.length === 0) return true;
        return permissions.some((permission) => userPermissions.includes(permission));
    }

    return { hasPermission, hasAllPermissions, hasSomePermissions };
}