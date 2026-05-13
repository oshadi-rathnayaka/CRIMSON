const DEFAULT_OFFICER_PREFERENCES = {
  language: "english",
  theme: "light",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24hour",
};

const LANGUAGE_LOCALE = {
  english: "en-LK",
  sinhala: "si-LK",
  tamil: "ta-LK",
};

const toValidDate = (dateLike) => {
  const dt = new Date(dateLike);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

export function getStoredOfficerPreferences() {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return DEFAULT_OFFICER_PREFERENCES;
    const parsed = JSON.parse(raw);
    const prefs = parsed?.settings?.preferences || {};
    return {
      ...DEFAULT_OFFICER_PREFERENCES,
      ...prefs,
    };
  } catch {
    return DEFAULT_OFFICER_PREFERENCES;
  }
}

export function getOfficerLocale(preferences = getStoredOfficerPreferences()) {
  return LANGUAGE_LOCALE[preferences?.language] || "en-LK";
}

const isNumericDateStyle = (style) => style === "numeric" || style === "2-digit";

const formatNumericDateByPattern = (dateObj, preferences, options) => {
  const pattern = preferences?.dateFormat || "DD/MM/YYYY";
  const monthVal = options?.month === "2-digit"
    ? String(dateObj.getMonth() + 1).padStart(2, "0")
    : String(dateObj.getMonth() + 1);
  const dayVal = options?.day === "2-digit"
    ? String(dateObj.getDate()).padStart(2, "0")
    : String(dateObj.getDate());
  const yearVal = options?.year === "2-digit"
    ? String(dateObj.getFullYear()).slice(-2)
    : String(dateObj.getFullYear());

  if (pattern === "MM/DD/YYYY") return `${monthVal}/${dayVal}/${yearVal}`;
  if (pattern === "YYYY-MM-DD") return `${yearVal}-${monthVal}-${dayVal}`;
  return `${dayVal}/${monthVal}/${yearVal}`;
};

export function formatOfficerDate(
  dateLike,
  options = { year: "numeric", month: "short", day: "numeric" },
  preferences = getStoredOfficerPreferences()
) {
  const dt = toValidDate(dateLike);
  if (!dt) return "-";

  const hasYMD = options?.year && options?.month && options?.day;
  const isNumericYMD = hasYMD
    && isNumericDateStyle(options.year)
    && isNumericDateStyle(options.month)
    && isNumericDateStyle(options.day);

  if (isNumericYMD) {
    return formatNumericDateByPattern(dt, preferences, options);
  }

  return new Intl.DateTimeFormat(getOfficerLocale(preferences), options).format(dt);
}

export function formatOfficerTime(
  dateLike,
  options = { hour: "2-digit", minute: "2-digit" },
  preferences = getStoredOfficerPreferences()
) {
  const dt = toValidDate(dateLike);
  if (!dt) return "-";

  const hour12 = preferences?.timeFormat === "12hour";
  return new Intl.DateTimeFormat(getOfficerLocale(preferences), {
    ...options,
    hour12,
  }).format(dt);
}

export function formatOfficerDateTime(
  dateLike,
  dateOptions,
  timeOptions,
  preferences = getStoredOfficerPreferences()
) {
  const datePart = formatOfficerDate(dateLike, dateOptions, preferences);
  const timePart = formatOfficerTime(dateLike, timeOptions, preferences);
  if (datePart === "-" || timePart === "-") return "-";
  return `${datePart} ${timePart}`;
}

export function formatOfficerNumber(value, preferences = getStoredOfficerPreferences()) {
  if (value == null || Number.isNaN(Number(value))) return "0";
  return Number(value).toLocaleString(getOfficerLocale(preferences));
}
