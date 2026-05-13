const router = require("express").Router();
const auth   = require("../middleware/auth");
const ml     = require("../services/mlService");
const Report = require("../models/Report");
const SosAlert = require("../models/SosAlert");

const KNOWN_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
  "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

const normalizeRiskLevel = (value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["4", "critical"].includes(raw)) return 4;
  if (["3", "high", "high risk", "high_risk"].includes(raw)) return 3;
  if (["2", "moderate", "medium"].includes(raw)) return 2;
  if (["1", "safe", "low"].includes(raw)) return 1;
  return null;
};

const reportStatusToLevel = (status) => {
  if (status === "submitted") return 3;
  if (status === "under_review") return 3;
  if (status === "assigned") return 2;
  if (status === "resolved") return 1;
  if (status === "closed") return 1;
  return 2;
};

const sosStatusToLevel = (status) => {
  if (status === "active") return 4;
  if (status === "cancelled") return 1;
  if (status === "resolved") return 1;
  return 2;
};

const toAlertMessage = (category, description) => {
  const cat = String(category || "Incident").trim();
  const desc = String(description || "").trim();
  if (!desc) return `${cat} report submitted`;
  return desc.length > 80 ? `${desc.slice(0, 77)}...` : desc;
};

const findDistrict = (...candidates) => {
  const normalizedCandidates = candidates
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .map((v) => v.replace(/\bdistrict\b/ig, "").trim());

  for (const text of normalizedCandidates) {
    const direct = KNOWN_DISTRICTS.find((d) => d.toLowerCase() === text.toLowerCase());
    if (direct) return direct;
  }

  for (const text of normalizedCandidates) {
    const lowered = text.toLowerCase();
    const partial = KNOWN_DISTRICTS.find((d) => lowered.includes(d.toLowerCase()));
    if (partial) return partial;
  }

  return "Unknown";
};

router.get("/recent-alerts", auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);
    const levelFilter = normalizeRiskLevel(req.query.level);
    const districtsFilter = String(req.query.districts || "")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    const [reports, sosAlerts] = await Promise.all([
      Report.find()
        .sort({ submittedAt: -1 })
        .limit(100)
        .select("category description status location.address submittedAt createdAt"),
      SosAlert.find()
        .sort({ activatedAt: -1 })
        .limit(100)
        .select("status location.address location.district activatedAt createdAt"),
    ]);

    const reportAlerts = reports.map((report) => {
      const district = findDistrict(report.location?.address);
      return {
        source: "report",
        district,
        msg: toAlertMessage(report.category, report.description),
        level: reportStatusToLevel(report.status),
        createdAt: report.submittedAt || report.createdAt,
      };
    });

    const sosMapped = sosAlerts.map((alert) => ({
      source: "sos",
      district: findDistrict(alert.location?.district, alert.location?.address),
      msg: alert.status === "active"
        ? "Emergency SOS alert active"
        : alert.status === "resolved"
          ? "Emergency SOS alert resolved"
          : "Emergency SOS alert cancelled",
      level: sosStatusToLevel(alert.status),
      createdAt: alert.activatedAt || alert.createdAt,
    }));

    let combined = [...reportAlerts, ...sosMapped]
      .filter((a) => a.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (districtsFilter.length > 0) {
      const allowed = new Set(districtsFilter.map((d) => d.toLowerCase()));
      combined = combined.filter((a) => allowed.has(String(a.district || "").toLowerCase()));
    }

    if (levelFilter) {
      combined = combined.filter((a) => a.level === levelFilter);
    }

    const alerts = combined.slice(0, limit).map((a) => ({
      district: a.district,
      msg: a.msg,
      level: a.level,
      createdAt: a.createdAt,
      source: a.source,
    }));

    res.json({ success: true, data: alerts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/forecast",      auth, async (req, res) => {
  try { res.json(await ml.getForecast(req.body)); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/hotspots",      auth, async (req, res) => {
  try { res.json(await ml.getHotspots(req.body)); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/recidivism",    auth, async (req, res) => {
  try { res.json(await ml.getRecidivism(req.body)); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/victimization",  auth, async (req, res) => {
  try { res.json(await ml.getVictimization(req.query)); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/categorize",    auth, async (req, res) => {
  try { res.json(await ml.categorize(req.body.text)); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/summary",        auth, async (req, res) => {
  try { res.json(await ml.getSummary()); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;