/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: '#4B8BFF',
                success: '#3BBF8A',
                warning: '#F2B84B',
                danger: '#E05A5A',
                'bg-base': '#0B1220',
                'bg-card': '#121F38',
                'text-primary': '#E7EDF7',
                'text-secondary': '#A9B6CC',
                'text-muted': '#7F8DA6',
                border: {
                    soft: '#1E2A44',
                }
            }
        },
    },
    plugins: [],
}
