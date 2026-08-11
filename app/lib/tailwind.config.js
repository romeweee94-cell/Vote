/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#D62828",
          redDark: "#9B1C1C",
          yellow: "#F7B32B",
          yellowLight: "#FFE082",
          cream: "#FFF8E7",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans Thai'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #D62828 0%, #F7B32B 100%)",
      },
    },
  },
  plugins: [],
};
