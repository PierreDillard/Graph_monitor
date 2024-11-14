/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/components/common/**/*.{ts,tsx}",
    "./src/components/layout/**/*.{ts,tsx}",
    "./src/components/widgets/**/*.{ts,tsx}",
    "./src/store/**/*.{ts,tsx}",
    "./src/services/**/*.{ts,tsx}",
    "./src/utils/**/*.{ts,tsx}",
    "./src/types/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'widget-sm': '300px',
        'widget-md': '400px',
        'widget-lg': '500px',
      },
      minHeight: {
        'widget': '200px',
      },
      maxHeight: {
        'widget': '800px',
      },
      // Ajout des styles pour le curseur de déplacement
      cursor: {
        'move': 'move',
      },
      // Ajout des styles pour l'indicateur de drag
      animation: {
        'drag-indicator': 'dragPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        dragPulse: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 0.25 },
        },
      },
    },
  },
  plugins: [
    // Plugin pour ajouter la pseudo-classe before avec l'indicateur de drag
    function({ addUtilities }) {
      const newUtilities = {
        '.drag-indicator': {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'rgba(59, 130, 246, 0.5)',
            opacity: '0',
            transition: 'opacity 0.2s ease-in-out',
          },
          '&:hover::before': {
            opacity: '1',
          },
        }
      }
      addUtilities(newUtilities, ['hover'])
    }
  ],
  // Activation du mode JIT
  mode: 'jit',
}