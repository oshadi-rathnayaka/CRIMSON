const router = require('express').Router();
const User = require('../models/User');
const Report = require('../models/Report');
const SosAlert = require('../models/SosAlert');
const Offender = require('../models/Offender');

const AI_ACCURACY = '95%';
const RESPONSE_GOAL = '<2min';

const aboutContent = {
  whoWeAre:
    'CRIMSON is a government-grade AI-powered crime reporting and predictive policing system designed specifically for the unique geographical and societal landscape of Sri Lanka. Our platform bridges the critical gap between citizens and law enforcement through advanced technology, ensuring that safety is proactive, not just reactive.',
  quote:
    'Our goal is to redefine public safety by putting powerful, anonymous, and real-time tools into the hands of every citizen while providing police with the AI insights they need to prevent crimes before they occur.',
  mission:
    'To create a transparent, efficient, and technology-driven bridge between the public and law enforcement, reducing crime rates through citizen engagement and data-driven intelligence.',
  vision:
    'To be the national standard for public safety in Sri Lanka, fostering a culture of mutual trust where technology serves as the ultimate deterrent against crime.',
  features: [
    {
      iconKey: 'instant_reporting',
      title: 'Instant Reporting',
      desc: 'Report incidents in seconds with real-time GPS tracking and multimedia evidence upload.',
    },
    {
      iconKey: 'anonymity',
      title: 'Complete Anonymity',
      desc: 'Advanced encryption ensures whistleblowers can report safely without fear of retaliation.',
    },
    {
      iconKey: 'ai_insights',
      title: 'AI Predictive Insights',
      desc: 'ML algorithms analyze historical data to predict potential crime hotspots before they emerge.',
    },
    {
      iconKey: 'heatmaps',
      title: 'Live Heatmaps',
      desc: 'Dynamic visualizations of crime trends across different districts and timeframes.',
    },
    {
      iconKey: 'victim_support',
      title: 'Victim Support',
      desc: 'Integrated links to emergency services, counseling, and legal aid resources.',
    },
    {
      iconKey: 'multi_platform',
      title: 'Multi-platform',
      desc: 'Available as a web portal, mobile app, and specialized PWA for low-connectivity areas.',
    },
  ],
  stats: [
    { value: '0', label: 'Active Users' },
    { value: '0', label: 'Police Stations' },
    { value: AI_ACCURACY, label: 'AI Accuracy' },
    { value: RESPONSE_GOAL, label: 'Response Goal' },
  ],
};

function formatCount(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));

  if (safeSeconds < 60) return `${safeSeconds}s`;

  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

async function buildDynamicStats() {
  const [
    activeUsers,
    officerStations,
    officersTotal,
  ] = await Promise.all([
    User.countDocuments({ role: 'citizen', isActive: true }),
    User.distinct('division', { role: 'officer', isActive: true, division: { $ne: null } }),
    User.countDocuments({ role: 'officer', isActive: true }),
  ]);

  const stationsCount = Array.isArray(officerStations) && officerStations.length > 0
    ? officerStations.length
    : officersTotal;

  return [
    { value: formatCount(activeUsers), label: 'Active Users' },
    { value: formatCount(stationsCount), label: 'Police Stations' },
    { value: AI_ACCURACY, label: 'AI Accuracy' },
    { value: RESPONSE_GOAL, label: 'Response Goal' },
  ];
}

router.get('/content', async (req, res) => {
  try {
    const stats = await buildDynamicStats();
    res.status(200).json({
      success: true,
      data: {
        ...aboutContent,
        stats,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Keep About page available even if DB operations fail.
    res.status(200).json({
      success: true,
      data: aboutContent,
      updatedAt: new Date().toISOString(),
      statsFallback: true,
    });
  }
});

router.get('/home-stats', async (req, res) => {
  try {
    const [casesResolved, coveredDistricts, sosHistory, offenderStats] = await Promise.all([
      Report.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      User.distinct('district', {
        district: { $nin: [null, '', 'Unknown'] },
        isActive: true,
      }),
      SosAlert.find({ status: { $in: ['resolved', 'cancelled'] } })
        .select('activatedAt resolvedAt cancelledAt updatedAt')
        .lean(),
      Offender.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: null,
            repeatPool: {
              $sum: {
                $cond: [{ $gte: ['$convictionCount', 2] }, 1, 0],
              },
            },
            activeRepeat: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$convictionCount', 2] },
                      { $gt: ['$pendingCaseCount', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    let avgSosResponse = '0s';
    if (Array.isArray(sosHistory) && sosHistory.length > 0) {
      const MAX_VALID_RESPONSE_SECONDS = 6 * 60 * 60;

      const validDurations = sosHistory
        .map((item) => {
          const start = new Date(item.activatedAt).getTime();
          const endSource = item.resolvedAt || item.cancelledAt;
          const end = new Date(endSource).getTime();
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

          return Math.round((end - start) / 1000);
        })
        .filter((seconds) => (
          Number.isFinite(seconds)
          && seconds > 0
          && seconds <= MAX_VALID_RESPONSE_SECONDS
        ));

      if (validDurations.length > 0) {
        const avgSosSeconds = validDurations.reduce((a, b) => a + b, 0) / validDurations.length;
        avgSosResponse = formatDuration(avgSosSeconds);
      }
    }

    const repeatPool = offenderStats?.[0]?.repeatPool || 0;
    const activeRepeat = offenderStats?.[0]?.activeRepeat || 0;
    const repeatOffenseReduction = repeatPool > 0
      ? `${Math.round(((repeatPool - activeRepeat) / repeatPool) * 100)}%`
      : '0%';

    const districtCount = Array.isArray(coveredDistricts) ? coveredDistricts.length : 0;

    return res.status(200).json({
      success: true,
      data: {
        casesResolved: casesResolved.toLocaleString('en-US'),
        districtsCovered: String(districtCount),
        avgSosResponse,
        repeatOffenseReduction,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: {
        casesResolved: '0',
        districtsCovered: '0',
        avgSosResponse: '0s',
        repeatOffenseReduction: '0%',
      },
      fallback: true,
      updatedAt: new Date().toISOString(),
    });
  }
});

module.exports = router;
