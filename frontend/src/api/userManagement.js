import { api } from "../lib/api";

export const getUserList = (page = 1, role = null, search = null) => {
  const params = new URLSearchParams();
  params.append('page', page);
  if (role && role !== 'All Roles') params.append('role', role);
  if (search) params.append('search', search);
  return api.get(`/admin/users/list?${params.toString()}`);
};

export const updateUserStatus = (userId, isActive) =>
  api.put(`/admin/users/update-status/${userId}`, { isActive });

export const resetUserPassword = (userId) =>
  api.post(`/admin/users/reset-password/${userId}`);

export const createManagedUser = (payload) =>
  api.post('/admin/users/create', payload);

export const updateManagedUser = (userId, payload) =>
  api.put(`/admin/users/update/${userId}`, payload);
