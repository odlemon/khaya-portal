// @ts-nocheck
const config = {
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api',
    },
  } as const;
  
  export default config; 