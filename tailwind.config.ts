import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B9D',
          50:  '#FFF0F5',
          100: '#FFE0EC',
          200: '#FFC2D9',
          300: '#FF9DBE',
          400: '#FF85AB',
          500: '#FF6B9D',
          600: '#E0527F',
          700: '#C23A64',
          800: '#9E2549',
          900: '#7A142F',
        },
        secondary: {
          DEFAULT: '#FFD93D',
          100: '#FFF9D6',
          200: '#FFF0A3',
          300: '#FFE570',
          400: '#FFDA3D',
          500: '#FFD93D',
          600: '#E6C200',
          700: '#B89B00',
        },
        accent: {
          green:  '#6BCB77',
          purple: '#845EC2',
          blue:   '#4D96FF',
          orange: '#FF9F43',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft:    '#FFF8F9',
          muted:   '#F5F5F5',
        },
        ink: {
          DEFAULT: '#2D2D2D',
          muted:   '#777777',
          light:   '#AAAAAA',
        },
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'sans-serif'],
        body:    ['var(--font-nunito)',  'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'h1':      ['2.75rem', { lineHeight: '1.15', fontWeight: '800' }],
        'h2':      ['2rem',    { lineHeight: '1.2',  fontWeight: '700' }],
        'h3':      ['1.5rem',  { lineHeight: '1.3',  fontWeight: '700' }],
        'h4':      ['1.125rem',{ lineHeight: '1.4',  fontWeight: '700' }],
        'body-lg': ['1.0625rem',{ lineHeight: '1.75' }],
        'body':    ['1rem',    { lineHeight: '1.7'  }],
        'body-sm': ['0.875rem',{ lineHeight: '1.6'  }],
        'caption': ['0.75rem', { lineHeight: '1.5'  }],
      },
      borderRadius: {
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '24px',
        '3xl': '32px',
        'pill':'9999px',
      },
      boxShadow: {
        'card':    '0 4px 20px rgba(0,0,0,0.07)',
        'card-lg': '0 8px 40px rgba(0,0,0,0.10)',
        'primary': '0 4px 20px rgba(255,107,157,0.35)',
        'float':   '0 8px 30px rgba(0,0,0,0.12)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      backgroundImage: {
        'hero-gradient':    'linear-gradient(135deg, #FFF0F5 0%, #FFF8E7 50%, #F0FFF4 100%)',
        'primary-gradient': 'linear-gradient(135deg, #FF6B9D 0%, #845EC2 100%)',
        'card-alfa':        'linear-gradient(135deg, #FFE8F0, #ffd0e4)',
        'card-mat':         'linear-gradient(135deg, #E8F0FF, #d0defb)',
        'card-arts':        'linear-gradient(135deg, #FFF0D0, #ffe0a8)',
        'card-sci':         'linear-gradient(135deg, #E8FFE8, #c8f5c8)',
        'card-games':       'linear-gradient(135deg, #f0e8ff, #ddd0fa)',
        'card-seq':         'linear-gradient(135deg, #fce4ec, #f8bbd0)',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'scale-in':   'scaleIn 0.25s ease-out',
        'float':      'float 3s ease-in-out infinite',
        'marquee':    'marquee 30s linear infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        marquee:  { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      maxWidth: {
        'content': '1200px',
      },
    },
  },
  plugins: [],
}

export default config
