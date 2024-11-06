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
    },
  },
  plugins: [],
  // Activation du mode JIT
  mode: 'jit',
}