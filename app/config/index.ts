// @ts-nocheck
const config = {
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://31.220.82.129:4002/api',
    },
  } as const;
  
  export default config; 