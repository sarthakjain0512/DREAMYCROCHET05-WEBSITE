const fs = require('fs');

let safelist = [];
try {
  safelist = JSON.parse(fs.readFileSync('./scratch/comprehensive_safelist.json', 'utf8'));
} catch (e) {
  console.warn('Fallback: comprehensive_safelist.json not found, using default list.');
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './app.js',
    './src/**/*.{html,js}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#B58A6A', // Warm Brown
        'primary-container': '#FADADD', // Pastel Pink
        'on-primary-container': '#4A3321', // Dark Brown
        secondary: '#E7D7FF', // Lavender
        cream: '#FFF8EE',
        beige: '#F5E6D3',
        darkbrown: '#4A3321',
        // Stitch palette equivalents
        'cozy-surface': '#fdfcf9',
        'cozy-surface-low': '#f7f5f0',
        'cozy-accent': '#8b735b',
        'cozy-text-dark': '#4a3f35',
        'cozy-text-muted': '#7c7267'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        heading: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
        handwritten: ['Caveat', 'cursive'],
      },
      borderRadius: {
        'cozy': '1.5rem',
        'cozy-sm': '0.75rem',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
  safelist: safelist
};
