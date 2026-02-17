/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Uber Base System
                app: 'var(--bg-app)',
                surface: {
                    DEFAULT: 'var(--bg-surface)',
                    hover: 'var(--bg-surface-hover)',
                    active: 'var(--bg-surface-active)',
                    elevated: 'var(--bg-elevated)',
                },
                border: {
                    DEFAULT: 'var(--border-medium)',
                    subtle: 'var(--border-subtle)',
                    highlight: 'var(--border-highlight)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    muted: 'var(--text-muted)',
                },
                brand: {
                    DEFAULT: 'var(--accent-blue)', // Uber Blue
                    dim: 'var(--accent-blue-dim)',
                    glow: 'transparent',
                },
                accent: {
                    emerald: 'var(--accent-emerald)',
                    rose: 'var(--accent-rose)',
                    amber: 'var(--accent-amber)',
                    purple: 'var(--accent-purple)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['SF Mono', 'ui-monospace', 'monospace'],
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'glass': 'none', // Removed
                'glass-hover': 'none', // Removed
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
