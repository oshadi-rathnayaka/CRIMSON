const axios = require("axios");

const PRIMARY_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

const DEFAULT_CANDIDATES = [
  PRIMARY_URL,
  PRIMARY_URL.includes(":8001") ? PRIMARY_URL.replace(":8001", ":8000") : `${PRIMARY_URL.replace(/\/$/, "")}:8000`,
  PRIMARY_URL.includes(":8000") ? PRIMARY_URL.replace(":8000", ":8001") : `${PRIMARY_URL.replace(/\/$/, "")}:8001`,
  "http://127.0.0.1:8001",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  "http://localhost:8001",
];

const URL_CANDIDATES = [...new Set(DEFAULT_CANDIDATES.filter(Boolean).map((u) => String(u).replace(/\/$/, "")))];

const ML_TIMEOUT_MS = parseInt(process.env.ML_SERVICE_TIMEOUT_MS || "120000", 10);

const isNetworkError = (err) => {
  const code = err?.code;
  return !err?.response || code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND";
};

async function requestWithFallback(method, path, payload) {
  const networkErrors = [];

  for (const baseURL of URL_CANDIDATES) {
    const client = axios.create({
      baseURL,
      timeout: ML_TIMEOUT_MS,
    });

    try {
      const res = method === "get"
        ? await client.get(path, payload)
        : await client.post(path, payload);
      return res.data;
    } catch (err) {
      if (!isNetworkError(err)) {
        throw err;
      }
      networkErrors.push(`${baseURL} (${err.code || "NETWORK"})`);
    }
  }

  if (networkErrors.length > 0) {
    throw new Error(
      `Unable to reach ML service. Tried: ${networkErrors.join(", ")}. Start ml-service and check ML_SERVICE_URL.`
    );
  }

  throw new Error("Unable to reach ML service. No candidate URLs available.");
}

module.exports = {
  getForecast:      (data) => requestWithFallback("post", "/forecast", data),
  getHotspots:      (data) => requestWithFallback("post", "/hotspots", data),
  getRecidivism:    (data) => requestWithFallback("post", "/recidivism", data),
  getVictimization: (q)    => requestWithFallback("get", "/victimization", { params: q }),
  categorize:       (text) => requestWithFallback("post", "/categorize", { text }),
  getSummary:       ()     => requestWithFallback("get", "/summary"),
};