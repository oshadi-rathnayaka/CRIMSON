import { api } from "../lib/api";

export const getAdminDashboardStats = () =>
  api.get("/admin/dashboard/stats");
