import { api } from "../lib/api";

export const getForecast      = (data) => api.post("/analytics/forecast",     data);
export const getHotspots      = (data) => api.post("/analytics/hotspots",     data);
export const getRecidivism    = (data) => api.post("/analytics/recidivism",   data);
export const getVictimization = (p)    => api.get("/analytics/victimization", { params: p });
export const categorizeReport = (text) => api.post("/analytics/categorize",   { text });
export const getMLSummary     = ()     => api.get("/analytics/summary");
export const getRecentAlerts  = (p)    => api.get("/analytics/recent-alerts", { params: p });
export const getHomeStats     = ()     => api.get("/about/home-stats");