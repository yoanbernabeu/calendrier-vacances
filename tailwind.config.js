/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zone-a': '#4F46E5',
        'zone-b': '#0EA5E9',
        'zone-c': '#14B8A6',
      },
      animation: {
        'bounce': 'bounce 1s infinite',
      },
    },
  },
  plugins: [
    require("daisyui"),
  ],
  daisyui: {
    themes: ["light"],
  }
};
