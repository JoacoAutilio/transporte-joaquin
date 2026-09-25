export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1E3D', mid: '#132A52' },
        brand: { DEFAULT: '#E8500A', light: '#FF6B2B' }
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Barlow', 'sans-serif'],
      }
    }
  }
}
