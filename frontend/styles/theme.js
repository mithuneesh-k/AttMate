import { StyleSheet } from 'react-native';

export const COLORS = {
    bg: '#ffffff',
    bgSoft: '#fdfdfd',
    text: '#111827',
    muted: '#6b7280',
    card: '#ffffff',

    // Premium Emerald Palette (HSL Balanced)
    accent: '#10b981',   // Emerald 500
    accentLight: '#34d399', // Emerald 400
    accentDeep: '#059669',  // Emerald 600
    accentSoft: 'rgba(16, 185, 129, 0.08)',

    // Secondary Greens
    mint: '#ecfdf5',

    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    border: '#f1f5f9',

    // Glassmorphism & Depth
    glass: 'rgba(255, 255, 255, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.05)',
};

export const GLOBAL_STYLES = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 20,
        padding: 20,
        // Premium Multi-layered Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    input: {
        width: '100%',
        padding: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 16,
    },
    btnPrimary: {
        backgroundColor: COLORS.accent,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        // Button Shadow
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    btnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 16,
        lineHeight: 20,
    },
    pill: {
        backgroundColor: COLORS.accentSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    pillText: {
        color: COLORS.accentDeep,
        fontSize: 12,
        fontWeight: '600',
    },
    // Utility for Android & Web Responsiveness
    horizontalScroll: {
        paddingBottom: 15, // Spacing for scrollbar
        // Web only: Force scrollbar visibility for better UX
    },
    webScroll: {
        // This will be used in components to allow better desktop scrolling
        overflowX: 'auto',
    }
});
