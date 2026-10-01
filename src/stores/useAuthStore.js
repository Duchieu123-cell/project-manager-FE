import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'
import { useThemeStore } from './useThemeStore';


export const useAuthStore = create(
    persist(
        (set, get) => ({
            accessToken: null,
            permissions: [],
            isAuthenticated: false,
            actions: {
                login: (accessToken, permissions) => {
                    set({ accessToken, permissions, isAuthenticated: true })
                },
                logout: () => {
                    set({ accessToken: null, permissions: [], isAuthenticated: false });
                    useThemeStore.getState().setLightTheme(); // Reset theme to light on logout
                    console.log(`Người dùng đã đăng xuất, xóa user khỏi localStorage`);
                },
                setNewAccessToken: (newAccessToken) => {
                    set({ accessToken: newAccessToken });
                }
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated,
            })
        }
    )
)

export const useAuthStoreActions = () => useAuthStore((state) => state.actions);