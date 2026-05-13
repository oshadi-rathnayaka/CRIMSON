import { api } from '../lib/api';

export const fetchPermissionsMatrix = () => api.get('/admin/permissions/matrix');

export const savePermissionsMatrix = (matrix) =>
  api.put('/admin/permissions/matrix', { matrix });

export const resetPermissionsMatrix = () =>
  api.post('/admin/permissions/matrix/reset');
