import { api } from "../lib/api";

export const getCitizenAlerts = () =>
  api.get("/alerts/citizen");