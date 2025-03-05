import nextPwa from 'next-pwa';

const withPWA = nextPwa({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
  });
  
  export default withPWA({
    reactStrictMode: true,
    images: {
      domains: ['placeholder.com'],
    },
  });