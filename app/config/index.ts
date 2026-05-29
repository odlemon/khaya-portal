// @ts-nocheck
import { getApiBaseURL } from './api.config';

const config = {
  api: {
    get baseUrl() {
      return getApiBaseURL();
    },
  },
};

export default config;
