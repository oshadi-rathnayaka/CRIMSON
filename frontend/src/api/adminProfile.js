import { api } from "../lib/api";

export const getAdminProfile = () =>
  api.get('/admin/auth/me');

export const updateAdminProfile = (payload) =>
  api.put('/admin/auth/profile', payload);

export const changeAdminPassword = (currentPassword, newPassword) =>
  api.put('/admin/auth/change-password', { currentPassword, newPassword });
