import { api } from '../lib/api';

export const getAuditLogs = ({
  page = 1,
  limit = 50,
  role = null,
  actionType = null,
  status = null,
  search = null,
  from = null,
  to = null,
} = {}) => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (role && role !== 'All Roles') params.append('role', role.toLowerCase());
  if (actionType && actionType !== 'All Action Types') params.append('actionType', actionType);
  if (status && status !== 'All') params.append('status', status.toLowerCase());
  if (search) params.append('search', search);
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  return api.get(`/admin/audit/list?${params.toString()}`);
};
