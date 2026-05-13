import { api } from "../lib/api";

// For logged-in users
export const sendMessage = (message, history) =>
  api.post("/chatbot/message", { message, history });

// For public landing page
export const sendPublicMessage = (message) =>
  api.post("/chatbot/public", { message });