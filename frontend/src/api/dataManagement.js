import { api } from '../lib/api';

export const getDataManagementOverview = () =>
  api.get('/admin/data-management/overview');

export const validateImportFile = (file) => {
  const formData = new FormData();
  formData.append('dataFile', file);
  return api.post('/admin/data-management/import/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const commitImportOperation = (payload) =>
  api.post('/admin/data-management/import/commit', payload);

export const previewExportData = (payload) =>
  api.post('/admin/data-management/export/preview', payload);

export const generateDataExport = (payload) =>
  api.post('/admin/data-management/export/generate', payload);

export const getDataManagementActivity = () =>
  api.get('/admin/data-management/activity');
