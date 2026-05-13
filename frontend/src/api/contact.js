import { api } from "../lib/api";

export const getContactContent = () =>
  api.get("/contact/content");

export const submitContactMessage = (payload) =>
  api.post("/contact/submit", payload);