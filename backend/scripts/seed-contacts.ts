import { query } from '../src/db/index.js';

async function main() {
  const contacts = [
    {
      label: { en: 'National Emergency Helpline (Police, Medical, Fire)', te: 'జాతీయ అత్యవసర సహాయం (పోలీస్, వైద్యం, ఫైర్)', hi: 'राष्ट्रीय आपातकालीन हेल्पलाइन' },
      phone: '112',
      kind: 'control_room',
      sort_order: 1,
    },
    {
      label: { en: 'Ambulance & Medical Emergency', te: 'అంబులెన్స్ & వైద్య సహాయం', hi: 'एम्बुलेंस और आपातकालीन चिकित्सा' },
      phone: '108',
      kind: 'ambulance',
      sort_order: 2,
    },
    {
      label: { en: 'Pushkaralu District Command Control Room', te: 'పుష్కరాల జిల్లా కమాండ్ కంట్రోల్ రూమ్', hi: 'पुष्करालु जिला कमान नियंत्रण कक्ष' },
      phone: '0883-2442233',
      kind: 'control_room',
      sort_order: 3,
    },
    {
      label: { en: 'Fire & Disaster Rescue Station', te: 'అగ్నిమాపక & విపత్తు రక్షణ విభాగం', hi: 'अग्निशमन एवं आपदा बचाव सेवा' },
      phone: '101',
      kind: 'fire',
      sort_order: 4,
    },
    {
      label: { en: 'Police Assistance & Lost Person Helpdesk', te: 'పోలీస్ సహాయం & తప్పిపోయిన వారి విభాగం', hi: 'पुलिस सहायता और लापता व्यक्ति डेस्क' },
      phone: '100',
      kind: 'police',
      sort_order: 5,
    },
  ];

  for (const c of contacts) {
    await query(
      `INSERT INTO emergency_contacts (label, phone, kind, sort_order, active)
       VALUES ($1, $2, $3, $4, true)`,
      [JSON.stringify(c.label), c.phone, c.kind, c.sort_order]
    );
  }

  console.log('Seeded emergency contacts successfully');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

