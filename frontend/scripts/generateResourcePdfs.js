import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'public', 'resources');

const resources = [
  {
    filename: 'rights-of-victims-act.pdf',
    title: 'Rights of Victims Act',
    subtitle: 'Citizen quick guide for essential protections',
    sections: [
      {
        heading: 'Core Rights',
        lines: [
          '1. Right to safety and dignity in all reporting interactions.',
          '2. Right to privacy and confidentiality of personal details.',
          '3. Right to report without intimidation or retaliation.',
          '4. Right to legal support and case progress updates.',
          '5. Right to request protection measures when at risk.',
        ],
      },
      {
        heading: 'Important Note',
        lines: [
          'This document is an informational guide for CRIMSON users.',
          'For official legal interpretation, consult licensed legal professionals.',
        ],
      },
    ],
  },
  {
    filename: 'legal-process-handbook.pdf',
    title: 'Legal Process Handbook',
    subtitle: 'Step-by-step reporting and follow-up flow',
    sections: [
      {
        heading: 'Process Steps',
        lines: [
          '1. File your report with complete and accurate details.',
          '2. Preserve evidence in original form where possible.',
          '3. Track updates through your CRIMSON case timeline.',
          '4. Attend interviews and hearings as requested.',
          '5. Request legal aid when you need guidance.',
        ],
      },
      {
        heading: 'Emergency Reminder',
        lines: [
          'For immediate danger, contact emergency services first.',
          'Use SOS in CRIMSON only for active emergency situations.',
        ],
      },
    ],
  },
  {
    filename: 'safety-planning-guide.pdf',
    title: 'Safety Planning Guide',
    subtitle: 'Practical personal and digital safety checklist',
    sections: [
      {
        heading: 'Immediate Safety',
        lines: [
          '- Keep emergency contacts ready and reachable.',
          '- Share location with a trusted person when needed.',
          '- Identify nearby safe places before travel.',
          '- Keep transport and hotline numbers accessible.',
          '- Use SOS only when there is urgent, active danger.',
        ],
      },
      {
        heading: 'Digital Safety',
        lines: [
          '- Enable two-factor authentication on key accounts.',
          '- Use strong, unique passwords.',
          '- Avoid unknown links and suspicious attachments.',
          '- Review privacy permissions regularly.',
        ],
      },
    ],
  },
  {
    filename: 'emergency-shelter-directory.pdf',
    title: 'Emergency Shelter Directory',
    subtitle: 'Sample district support contacts',
    sections: [
      {
        heading: 'Directory',
        lines: [
          'Colombo - Safe Haven Center - +94 11 000 0001',
          'Colombo - Community Relief Hub - +94 11 000 0002',
          'Gampaha - Family Protection Unit - +94 33 000 0001',
          'Kandy - Regional Care Shelter - +94 81 000 0003',
        ],
      },
      {
        heading: 'Verification',
        lines: [
          'Contact official district authorities for latest verified listings.',
        ],
      },
    ],
  },
  {
    filename: 'witness-protection-info.pdf',
    title: 'Witness Protection Information',
    subtitle: 'Overview of common protective measures',
    sections: [
      {
        heading: 'Possible Measures',
        lines: [
          '- Confidential handling of identity and sensitive details.',
          '- Controlled disclosure of witness information.',
          '- Safety coordination with authorized protection units.',
        ],
      },
      {
        heading: 'Urgent Action',
        lines: [
          'If you face immediate threats, contact emergency services first',
          'and clearly request witness protection support.',
        ],
      },
    ],
  },
  {
    filename: 'psychosocial-support-map.pdf',
    title: 'Psychosocial Support Map',
    subtitle: 'Service pathways for emotional and trauma recovery',
    sections: [
      {
        heading: 'Support Channels',
        lines: [
          '- Crisis counseling for acute distress.',
          '- Child and family psychosocial support.',
          '- Community mental health referral points.',
          '- Group recovery and peer-support programs.',
        ],
      },
      {
        heading: 'How to Connect',
        lines: [
          'Use Support > Counseling and Trauma in CRIMSON to request',
          'direct connection to appropriate service providers.',
        ],
      },
    ],
  },
];

function drawWrappedText(page, text, x, y, maxWidth, font, size, color) {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);

    if (width > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color });
      cursorY -= size + 5;
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: cursorY, size, font, color });
    cursorY -= size + 5;
  }

  return cursorY;
}

async function createPdf(resource) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: height - 140,
    width,
    height: 140,
    color: rgb(0.11, 0.33, 0.85),
  });

  page.drawText(resource.title, {
    x: 42,
    y: height - 78,
    size: 26,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(resource.subtitle, {
    x: 42,
    y: height - 105,
    size: 12,
    font: fontRegular,
    color: rgb(0.9, 0.95, 1),
  });

  let y = height - 170;
  const left = 42;
  const maxWidth = width - 84;

  for (const section of resource.sections) {
    page.drawText(section.heading, {
      x: left,
      y,
      size: 15,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    y -= 24;

    for (const line of section.lines) {
      y = drawWrappedText(page, line, left, y, maxWidth, fontRegular, 11.5, rgb(0.2, 0.25, 0.35));
    }

    y -= 8;
  }

  page.drawText('Generated by CRIMSON Resource Center', {
    x: left,
    y: 24,
    size: 9,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.58),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(outputDir, resource.filename), pdfBytes);
}

(async () => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const resource of resources) {
    await createPdf(resource);
    console.log('Created', resource.filename);
  }
})();
