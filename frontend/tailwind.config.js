module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      screens: {
        xs: '360px'
      },
      colors: {
        primaryCol: '#FEE996',
        bgCol: '#fafafa',
        myGray: '#444'
      },
      flex: {
        0.8: '0.8'
      },
      height: {
        fit: 'fit-content'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
