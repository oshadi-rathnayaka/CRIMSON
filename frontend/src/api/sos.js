import { api } from "../lib/api";

export const activateSOS = (data) =>
  api.post("/sos/activate", data);

export const cancelSOS = (caseId) =>
  api.put(`/sos/cancel/${caseId}`);

export const getActiveSOS = () =>
  api.get("/sos/active");

export const getMySOS = () =>
  api.get("/sos/my-sos");
