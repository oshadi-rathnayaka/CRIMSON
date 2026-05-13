import { api } from '../lib/api';

export const getSystemHealthOverview = () =>
  api.get('/admin/system-health/overview');

export const exportSystemHealthReport = () =>
  api.post('/admin/system-health/export-report');
