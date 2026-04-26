// @ts-nocheck
const config = {
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://khaya-server.vercel.app/api',
    },
  } as const;
  
  export default config; 