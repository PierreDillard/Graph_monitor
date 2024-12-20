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
      colors: {
        gray: {
          750: '#2D3748', 
        },
  
      },
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
 
      cursor: {
        'move': 'move',
      },
    
      animation: {
        'drag-indicator': 'dragPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        overlayShow: 'overlayShow 150ms cubic-bezier(0.16, 1, 0.5, 1)',
        overlayHide: 'overlayHide 150ms cubic-bezier(0.16, 1, 0.5, 1)',
        contentShow: 'contentShow 150ms cubic-bezier(0.16, 1, 0.5, 1)',
        contentHide: 'contentHide 150ms cubic-bezier(0.16, 1, 0.5, 1)',
      },
      keyframes: {
        dragPulse: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 0.25 },
        },
        overlayShow: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        overlayHide: {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        contentShow: {
          from: {
            opacity: 0,
            transform: 'translate(-50%, -48%) scale(0.96)'
          },
          to: {
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)'
          },
        },
        contentHide: {
          from: {
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)'
          },
          to: {
            opacity: 0,
            transform: 'translate(-50%, -48%) scale(0.96)'
          },
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