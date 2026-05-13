const router = require('express').Router();
const Report = require('../models/Report');
const SosAlert = require('../models/SosAlert');

function formatTimeAgo(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return 'Just now';

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function titleFromCategory(category) {
  const normalized = (category || '').trim();
  if (!normalized) return 'Community Safety Update';
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} Incident Update`;
}

function categoryToTip(category) {
  const key = (category || '').toLowerCase();

  if (key.includes('cyber') || key.includes('phishing') || key.includes('online') || key.includes('fraud')) {
    return {
      id: 'tip-cyber',
      icon: '🔐',
      tag: 'DIGITAL SAFETY',
      title: 'Secure Your Online Accounts',
      desc: 'Enable 2FA, verify sender links, and never share OTP or banking PIN details through calls or SMS.',
    };
  }

  if (key.includes('theft') || key.includes('robbery') || key.includes('burglary')) {
    return {
      id: 'tip-theft',
      icon: '🚪',
      tag: 'HOME SAFETY',
      title: 'Strengthen Entry Point Security',
      desc: 'Use quality locks, outdoor lighting, and report suspicious movement in your neighborhood immediately.',
    };
  }

  if (key.includes('drug') || key.includes('narcotic')) {
    return {
      id: 'tip-drug',
      icon: '🧭',
      tag: 'COMMUNITY SAFETY',
      title: 'Report Drug Activity Early',
      desc: 'Avoid direct confrontation and submit exact location details through Report or SOS for rapid police action.',
    };
  }

  if (key.includes('violence') || key.includes('assault') || key.includes('abuse')) {
    return {
      id: 'tip-violence',
      icon: '🛡️',
      tag: 'PERSONAL SAFETY',
      title: 'Prioritize Safe Escape Routes',
      desc: 'If conflict escalates, move to a populated area and use SOS to share your location with responders.',
    };
  }

  return {
    id: 'tip-general',
    icon: '📢',
    tag: 'PUBLIC SAFETY',
    title: 'Verify and Share Trusted Updates',
    desc: 'Follow official channels for verified alerts and help neighbors stay informed with accurate information.',
  };
}

function buildSafetyTips(recentReports) {
  const mappedTips = recentReports.map((report) => categoryToTip(report.category));
  const uniqueTips = [];
  const seen = new Set();

  mappedTips.forEach((tip) => {
    if (!seen.has(tip.id)) {
      seen.add(tip.id);
      uniqueTips.push(tip);
    }
  });

  const defaultTips = [
    {
      id: 'tip-default-cyber',
      icon: '🔐',
      tag: 'DIGITAL SAFETY',
      title: 'Review Privacy Settings Weekly',
      desc: 'Limit public profile visibility and remove unknown app permissions from your phone and browser.',
    },
    {
      id: 'tip-default-community',
      icon: '🤝',
      tag: 'COMMUNITY SAFETY',
      title: 'Coordinate with Trusted Neighbors',
      desc: 'Keep emergency contacts ready and use neighborhood watch groups for faster incident reporting.',
    },
    {
      id: 'tip-default-emergency',
      icon: '🆘',
      tag: 'EMERGENCY READINESS',
      title: 'Use SOS Only for Immediate Danger',
      desc: 'Trigger SOS when there is urgent threat so officers can prioritize life-critical responses quickly.',
    },
  ];

  return [...uniqueTips, ...defaultTips]
    .slice(0, 3);
}

router.get('/citizen', async (req, res) => {
  try {
    const [activeSos, recentReports] = await Promise.all([
      SosAlert.find({ status: 'active' })
        .sort({ activatedAt: -1 })
        .limit(3)
        .lean(),
      Report.find({})
        .sort({ submittedAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const sosAlerts = activeSos.map((sos) => {
      const district = sos?.location?.district && sos.location.district !== 'Unknown'
        ? sos.location.district
        : 'your area';

      return {
        id: `sos-${sos._id}`,
        time: `${formatTimeAgo(sos.activatedAt)} · Emergency Response`,
        title: 'Active SOS Alert',
        desc: `An emergency SOS request is currently active near ${district}. Stay alert and avoid the immediate location if possible.`,
        type: 'sos',
        color: '#E8192C',
      };
    });

    const reportAlerts = recentReports.map((report) => {
      const address = report?.location?.address && report.location.address !== 'Unknown'
        ? report.location.address
        : 'reported area';

      return {
        id: `report-${report._id}`,
        time: `${formatTimeAgo(report.submittedAt)} · Citizen Reports`,
        title: titleFromCategory(report.category),
        desc: `A new ${report.category || 'safety'} report was submitted near ${address}. Please remain cautious and follow official instructions.`,
        type: 'report',
        color: '#f59e0b',
      };
    });

    const alerts = [...sosAlerts, ...reportAlerts]
      .slice(0, 6);

    if (alerts.length === 0) {
      alerts.push({
        id: 'system-default',
        time: 'Just now · CRIMSON Safety Center',
        title: 'No Active Alerts',
        desc: 'There are no active emergency or incident alerts right now. Continue to report suspicious activity to keep your community safe.',
        type: 'system',
        color: '#16a34a',
      });
    }

    const tips = buildSafetyTips(recentReports);

    return res.status(200).json({
      success: true,
      data: { alerts, tips },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: {
        alerts: [
          {
            id: 'fallback-maintenance',
            time: 'Just now · CRIMSON System',
            title: 'Safety Feed Temporarily Limited',
            desc: 'Live alert aggregation is temporarily unavailable. Emergency reporting is still active via SOS and Report pages.',
            type: 'system',
            color: '#16a34a',
          },
        ],
        tips: [
          {
            id: 'tip-fallback-cyber',
            icon: '🔐',
            tag: 'DIGITAL SAFETY',
            title: 'Avoid Suspicious Login Links',
            desc: 'Use official apps and websites only, and verify URL spelling before entering credentials.',
          },
          {
            id: 'tip-fallback-emergency',
            icon: '🆘',
            tag: 'EMERGENCY READINESS',
            title: 'Keep Emergency Contacts Updated',
            desc: 'Ensure family and trusted contacts are reachable for fast coordination during incidents.',
          },
        ],
      },
      fallback: true,
      updatedAt: new Date().toISOString(),
    });
  }
});

module.exports = router;