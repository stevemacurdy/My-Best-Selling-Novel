import type { Config } from 'tailwindcss';
import { colors, typography, motion } from './lib/brand';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: { brand: colors },
      fontFamily: {
        serif: typography.family.serif.split(','),
        sans: typography.family.sans.split(','),
      },
      animation: {
        fadeIn: `fadeIn ${motion.fadeIn}`,
        glow: `glow ${motion.glow}`,
        float: `float ${motion.float}`,
        spin: `spin ${motion.spin}`,
      },
      keyframes: {},
    },
  },
  plugins: [],
};

export default config;
