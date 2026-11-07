import React, { useState, useEffect, useMemo } from 'react';
import { TranslatableInput } from '../components/TranslatableInput';
import { LocalizedText, Ghat, PublishStatus, BathingStatus, CrowdLevel, RecordStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdminApi } from '../services/adminApi';

interface FacilityItem {
  facility_type: string;
  is_operational: boolean;
  count: number;
  details: LocalizedText;
}

interface AartiItem {
  aarti_name: LocalizedText;
  time: string;
  days: string;
  description: LocalizedText;
}

const DEFAULT_FACILITY_TYPES = [
  'changing_rooms',
  'drinking_water',
  'toilet',
  'medical_camp',
  'parking',
  'police_post',
  'cloak_room',
  'prasad_counter',
  'help_desk',
  'life_jacket_station',
];

const SARASWATI_GHAT_SAMPLE = {
  name: {
    en: 'Saraswati Ghat',
    te: 'సరస్వతి ఘాట్',
    hi: 'सरस्वती घाट',
  },
  river: 'Godavari',
  district: 'East Godavari',
  state: 'Andhra Pradesh',
  lat: 17.0048,
  lng: 81.7762,
  nearest_town: {
    en: 'Rajahmundry',
    te: 'రాజమండ్రి',
    hi: 'राजमुंदरी',
  },
  nearest_railway_station: {
    en: 'Godavari Railway Station (GVN - 1.4 km)',
    te: 'గోదావరి రైల్వే స్టేషన్ (GVN - 1.4 కి.మీ)',
    hi: 'गोदावरी रेलवे स्टेशन (GVN - 1.4 किमी)',
  },
  nearest_bus_stand: {
    en: 'Kotipalli Bus Stand (3.0 km)',
    te: 'కోటిపల్లి బస్టాండ్ (3.0 కి.మీ)',
    hi: 'कोटिपल्ली बस स्टैंड (3.0 किमी)',
  },
  official_source_url: 'https://eastgodavari.ap.gov.in/pushkaralu/saraswati-ghat',
  verified_at: '2026-09-20T11:30:00Z',
  record_status: 'officially_listed',
  bathing_status: 'allowed',
  crowd_level: 'medium',
  publish_status: 'published',
  description: {
    en: 'Tranquil ghat situated slightly north of Pushkar ghat, preferred by families and elder pilgrims.',
    te: 'పుష్కర్ ఘాట్‌కు కొద్దిగా ఉత్తరాన ఉన్న ప్రశాంతమైన ఘాట్, కుటుంబాలు మరియు వృద్ధ భక్తులకు అత్యంత అనుకూలమైనది.',
    hi: 'पुष्कर घाट के उत्तर में स्थित शांत घाट, परिवारों और वृद्ध श्रद्धालुओं के लिए उपयुक्त।',
  },
  max_capacity: 30000,
  sources: [
    {
      source_url: 'https://eastgodavari.ap.gov.in/pushkaralu/saraswati-ghat',
      source_name: 'East Godavari District Portal',
      source_type: 'district_portal',
    },
  ],
  facilities: [
    {
      facility_type: 'changing_rooms',
      available: true,
      details: {
        en: 'Separate enclosures for men and women',
        te: 'స్త్రీలు మరియు పురుషులకు ప్రత్యేక గదులు',
        hi: 'महिला एवं पुरुष हेतु पृथक कक्ष',
      },
      count: 12,
    },
  ],
  aarti_timings: [
    {
      aarti_name: {
        en: 'Godavari Harathi',
        te: 'గోదావరి హారతి',
        hi: 'गोदावरी आरती',
      },
      time: '19:00',
      days: ['everyday'],
      description: {
        en: 'Daily evening aarti by the river bank',
        te: 'నదీ తీరాన రోజువారీ సాయంత్రం హారతి',
        hi: 'నదీ తీరాన రోజువారీ సాయంత్రం హారతి',
      },
    },
  ],
};

export const GhatsPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [ghats, setGhats] = useState<Ghat[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [publishFilter, setPublishFilter] = useState('all');
  const [bathingFilter, setBathingFilter] = useState('all');

  // Single Ghat Modal (Create / Edit)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGhatId, setEditingGhatId] = useState<string | null>(null);
  const [formName, setFormName] = useState<LocalizedText>({ en: '', te: '', hi: '' });
  const [formRiver, setFormRiver] = useState('Godavari');
  const [formDistrict, setFormDistrict] = useState('East Godavari');
  const [formState, setFormState] = useState('Andhra Pradesh');
  const [formLat, setFormLat] = useState('17.0000');
  const [formLng, setFormLng] = useState('81.7800');
  const [formTown, setFormTown] = useState<LocalizedText>({ en: '', te: '', hi: '' });
  const [formRailway, setFormRailway] = useState<LocalizedText>({ en: '', te: '', hi: '' });
  const [formBusStand, setFormBusStand] = useState<LocalizedText>({ en: '', te: '', hi: '' });
  const [formOfficialUrl, setFormOfficialUrl] = useState('');
  const [formVerifiedAt, setFormVerifiedAt] = useState('');
  const [formRecordStatus, setFormRecordStatus] = useState<RecordStatus>('officially_listed');
  const [formBathingStatus, setFormBathingStatus] = useState<BathingStatus>('allowed');
  const [formCrowdLevel, setFormCrowdLevel] = useState<CrowdLevel>('medium');
  const [formPublishStatus, setFormPublishStatus] = useState<PublishStatus>('published');
  const [formDesc, setFormDesc] = useState<LocalizedText>({ en: '', te: '', hi: '' });
  const [formMaxCapacity, setFormMaxCapacity] = useState('25000');
  const [formFacilities, setFormFacilities] = useState<FacilityItem[]>([]);
  const [formAartiTimings, setFormAartiTimings] = useState<AartiItem[]>([]);
  const [formAuditReason, setFormAuditReason] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Bulk CSV Upload Modal
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvParsedRecords, setCsvParsedRecords] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvAuditReason, setCsvAuditReason] = useState('Bulk CSV import of Pushkaralu ghats');
  const [csvSubmitting, setCsvSubmitting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ghatToDelete, setGhatToDelete] = useState<Ghat | null>(null);
  const [deleteReason, setDeleteReason] = useState('Decommissioned or duplicated ghat entry');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const canWrite = hasPermission('ghats.write') || hasPermission('*');

  const loadGhats = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await AdminApi.getGhats({ limit: '200' });
      setGhats(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load ghats from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGhats();
  }, []);

  // Filtered ghats list
  const filteredGhats = useMemo(() => {
    return ghats.filter((g) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const enMatch = g.name?.en?.toLowerCase().includes(query);
        const teMatch = g.name?.te?.toLowerCase().includes(query);
        const hiMatch = g.name?.hi?.toLowerCase().includes(query);
        const townMatch = g.nearest_town?.en?.toLowerCase().includes(query);
        if (!enMatch && !teMatch && !hiMatch && !townMatch) return false;
      }
      if (districtFilter !== 'all' && g.district !== districtFilter) return false;
      if (publishFilter !== 'all' && g.publish_status !== publishFilter) return false;
      if (bathingFilter !== 'all' && g.bathing_status !== bathingFilter) return false;
      return true;
    });
  }, [ghats, search, districtFilter, publishFilter, bathingFilter]);

  // Unique districts for filter dropdown
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    ghats.forEach((g) => {
      if (g.district) set.add(g.district);
    });
    return Array.from(set);
  }, [ghats]);

  // Reset Single Ghat Form
  const openCreateModal = () => {
    setEditingGhatId(null);
    setFormName({ en: '', te: '', hi: '' });
    setFormRiver('Godavari');
    setFormDistrict('East Godavari');
    setFormState('Andhra Pradesh');
    setFormLat('17.0048');
    setFormLng('81.7762');
    setFormTown({ en: 'Rajahmundry', te: 'రాజమండ్రి', hi: 'राजमुंदरी' });
    setFormRailway({ en: '', te: '', hi: '' });
    setFormBusStand({ en: '', te: '', hi: '' });
    setFormOfficialUrl('https://eastgodavari.ap.gov.in/pushkaralu');
    setFormVerifiedAt(new Date().toISOString());
    setFormRecordStatus('officially_listed');
    setFormBathingStatus('allowed');
    setFormCrowdLevel('medium');
    setFormPublishStatus('published');
    setFormDesc({ en: '', te: '', hi: '' });
    setFormMaxCapacity('30000');
    setFormFacilities([
      {
        facility_type: 'changing_rooms',
        is_operational: true,
        count: 10,
        details: { en: 'Separate enclosures for men and women', te: 'స్త్రీలు మరియు పురుషులకు ప్రత్యేక గదులు', hi: 'महिला एवं पुरुष हेतु पृथक कक्ष' },
      },
      {
        facility_type: 'drinking_water',
        is_operational: true,
        count: 4,
        details: { en: 'RO Purified water counters', te: 'RO శుద్ధి చేసిన తాగునీటి కేంద్రాలు', hi: 'RO शुद्ध पेयजल केंद्र' },
      },
    ]);
    setFormAartiTimings([
      {
        aarti_name: { en: 'Godavari Harathi', te: 'గోదావరి హారతి', hi: 'गोदावरी आरती' },
        time: '19:00',
        days: 'everyday',
        description: { en: 'Evening river bank aarti', te: 'సాయంత్రం నదీ హారతి', hi: 'संध्या आरती' },
      },
    ]);
    setFormAuditReason('Adding new officially surveyed Pushkaralu ghat');
    setEditModalOpen(true);
  };

  const openEditModal = (ghat: Ghat) => {
    setEditingGhatId(ghat.id);
    setFormName({ en: ghat.name?.en || '', te: ghat.name?.te || '', hi: ghat.name?.hi || '' });
    setFormRiver(ghat.river || 'Godavari');
    setFormDistrict(ghat.district || 'East Godavari');
    setFormState(ghat.state || 'Andhra Pradesh');
    setFormLat(String(ghat.lat ?? ''));
    setFormLng(String(ghat.lng ?? ''));
    setFormTown({ en: ghat.nearest_town?.en || '', te: ghat.nearest_town?.te || '', hi: ghat.nearest_town?.hi || '' });
    setFormRailway({ en: ghat.nearest_railway_station?.en || '', te: ghat.nearest_railway_station?.te || '', hi: ghat.nearest_railway_station?.hi || '' });
    setFormBusStand({ en: ghat.nearest_bus_stand?.en || '', te: ghat.nearest_bus_stand?.te || '', hi: ghat.nearest_bus_stand?.hi || '' });
    setFormOfficialUrl(ghat.official_source_url || '');
    setFormVerifiedAt(ghat.verified_at || '');
    setFormRecordStatus(ghat.record_status || 'officially_listed');
    setFormBathingStatus(ghat.bathing_status || 'allowed');
    setFormCrowdLevel(ghat.crowd_level || 'medium');
    setFormPublishStatus(ghat.publish_status || 'published');
    setFormDesc({ en: ghat.description?.en || '', te: ghat.description?.te || '', hi: ghat.description?.hi || '' });
    setFormMaxCapacity(ghat.max_capacity ? String(ghat.max_capacity) : '25000');

    // Populate facilities if present
    if (Array.isArray(ghat.facilities) && ghat.facilities.length > 0) {
      setFormFacilities(
        ghat.facilities.map((f: any) => ({
          facility_type: f.facility_type || 'changing_rooms',
          is_operational: f.is_operational !== undefined ? f.is_operational : (f.available !== undefined ? f.available : true),
          count: f.count || 1,
          details: typeof f.details === 'object' ? f.details : { en: String(f.details || '') },
        }))
      );
    } else {
      setFormFacilities([]);
    }

    // Populate aarti timings if present
    if (Array.isArray(ghat.aarti_timings) && ghat.aarti_timings.length > 0) {
      setFormAartiTimings(
        ghat.aarti_timings.map((a: any) => ({
          aarti_name: typeof a.aarti_name === 'object' ? a.aarti_name : (typeof a.name === 'object' ? a.name : { en: a.aarti_name || a.name || 'Aarti' }),
          time: a.time || a.time_start || '19:00',
          days: Array.isArray(a.days) ? a.days.join(', ') : (a.days_of_week || 'everyday'),
          description: typeof a.description === 'object' ? a.description : { en: String(a.description || '') },
        }))
      );
    } else {
      setFormAartiTimings([]);
    }

    setFormAuditReason(`Updated ghat metadata for ${ghat.name?.en || 'ghat'}`);
    setEditModalOpen(true);
  };

  const handleSaveGhat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.en?.trim()) {
      alert('English Ghat Name is mandatory.');
      return;
    }
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    if (!formAuditReason.trim() || formAuditReason.trim().length < 5) {
      alert('Audit reason of at least 5 characters is mandatory for logging this change in the audit trail.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        name: formName,
        river: formRiver,
        district: formDistrict,
        state: formState,
        lat,
        lng,
        nearest_town: formTown,
        nearest_railway_station: formRailway,
        nearest_bus_stand: formBusStand,
        official_source_url: formOfficialUrl.trim() || null,
        verified_at: formVerifiedAt.trim() || null,
        record_status: formRecordStatus,
        bathing_status: formBathingStatus,
        crowd_level: formCrowdLevel,
        publish_status: formPublishStatus,
        description: formDesc.en?.trim() ? formDesc : null,
        max_capacity: formMaxCapacity ? parseInt(formMaxCapacity, 10) : null,
        facilities: formFacilities,
        aarti_timings: formAartiTimings,
        reason: formAuditReason.trim(),
      };

      if (editingGhatId) {
        await AdminApi.updateGhat(editingGhatId, payload);
        setSuccessMessage(`Ghat "${formName.en}" successfully updated.`);
      } else {
        await AdminApi.createGhat(payload);
        setSuccessMessage(`New ghat "${formName.en}" successfully created.`);
      }

      setEditModalOpen(false);
      await loadGhats();
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Unknown error'}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Publish / Hidden
  const handleTogglePublish = async (ghat: Ghat) => {
    const nextStatus: PublishStatus = ghat.publish_status === 'published' ? 'hidden' : 'published';
    const reason = prompt(
      `Enter reason for changing publish status of "${ghat.name?.en}" to ${nextStatus}:`,
      `Control room routine status update (${nextStatus})`
    );
    if (!reason || reason.trim().length < 5) {
      alert('A valid reason of at least 5 characters is required for audit logs.');
      return;
    }

    try {
      await AdminApi.setPublishStatus(ghat.id, nextStatus, reason.trim());
      setSuccessMessage(`Publish status of "${ghat.name?.en}" changed to ${nextStatus}.`);
      await loadGhats();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Delete Ghat Modal
  const openDeleteModal = (ghat: Ghat) => {
    setGhatToDelete(ghat);
    setDeleteReason(`Decommissioning or removing obsolete record for ${ghat.name?.en}`);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ghatToDelete) return;
    if (!deleteReason.trim() || deleteReason.trim().length < 5) {
      alert('Audit reason of at least 5 characters is mandatory.');
      return;
    }

    setDeleteSubmitting(true);
    try {
      await AdminApi.deleteGhat(ghatToDelete.id, deleteReason.trim());
      setSuccessMessage(`Ghat "${ghatToDelete.name?.en}" deleted successfully.`);
      setDeleteModalOpen(false);
      setGhatToDelete(null);
      await loadGhats();
    } catch (err: any) {
      alert(`Failed to delete ghat: ${err.message}`);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const headers = [
      'name_en',
      'name_te',
      'name_hi',
      'river',
      'district',
      'state',
      'lat',
      'lng',
      'nearest_town_en',
      'nearest_town_te',
      'nearest_town_hi',
      'nearest_railway_station_en',
      'nearest_railway_station_te',
      'nearest_railway_station_hi',
      'nearest_bus_stand_en',
      'nearest_bus_stand_te',
      'nearest_bus_stand_hi',
      'official_source_url',
      'verified_at',
      'record_status',
      'bathing_status',
      'crowd_level',
      'publish_status',
      'description_en',
      'description_te',
      'description_hi',
      'max_capacity',
      'sources',
      'facilities',
      'aarti_timings',
    ];

    const s = SARASWATI_GHAT_SAMPLE;
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const row = [
      escapeCsv(s.name.en),
      escapeCsv(s.name.te),
      escapeCsv(s.name.hi),
      escapeCsv(s.river),
      escapeCsv(s.district),
      escapeCsv(s.state),
      s.lat,
      s.lng,
      escapeCsv(s.nearest_town.en),
      escapeCsv(s.nearest_town.te),
      escapeCsv(s.nearest_town.hi),
      escapeCsv(s.nearest_railway_station.en),
      escapeCsv(s.nearest_railway_station.te),
      escapeCsv(s.nearest_railway_station.hi),
      escapeCsv(s.nearest_bus_stand.en),
      escapeCsv(s.nearest_bus_stand.te),
      escapeCsv(s.nearest_bus_stand.hi),
      escapeCsv(s.official_source_url),
      escapeCsv(s.verified_at),
      escapeCsv(s.record_status),
      escapeCsv(s.bathing_status),
      escapeCsv(s.crowd_level),
      escapeCsv(s.publish_status),
      escapeCsv(s.description.en),
      escapeCsv(s.description.te),
      escapeCsv(s.description.hi),
      s.max_capacity,
      escapeCsv(s.sources),
      escapeCsv(s.facilities),
      escapeCsv(s.aarti_timings),
    ];

    const csvContent = headers.join(',') + '\n' + row.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'smart_pushkaralu_ghats_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parsing
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          setCsvError('Uploaded CSV file is empty.');
          setCsvParsedRecords([]);
          return;
        }

        // Parse CSV text
        const rows = parseCSVText(text);
        if (rows.length === 0) {
          setCsvError('No valid data rows found in CSV.');
          setCsvParsedRecords([]);
          return;
        }

        // Transform CSV rows to Ghat JSON objects
        const transformed: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const ghatObj = convertCsvRowToGhat(r);
          if (ghatObj) transformed.push(ghatObj);
        }

        if (transformed.length === 0) {
          setCsvError('Could not parse any valid ghat records from the CSV file.');
          setCsvParsedRecords([]);
          return;
        }

        setCsvParsedRecords(transformed);
      } catch (err: any) {
        setCsvError(`Failed to process CSV: ${err.message}`);
        setCsvParsedRecords([]);
      }
    };
    reader.readAsText(file);
  };

  const parseCSVText = (text: string): Record<string, string>[] => {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === '\r' && nextChar === '\n') || char === '\n') {
        if (inQuotes) {
          current += '\n';
        } else {
          lines.push(current);
          current = '';
          if (char === '\r') i++;
        }
      } else {
        current += char;
      }
    }
    if (current.trim()) lines.push(current);

    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const cells: string[] = [];
      let cell = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        const nc = line[i + 1];
        if (c === '"') {
          if (inQ && nc === '"') {
            cell += '"';
            i++;
          } else {
            inQ = !inQ;
          }
        } else if (c === ',' && !inQ) {
          cells.push(cell.trim());
          cell = '';
        } else {
          cell += c;
        }
      }
      cells.push(cell.trim());
      return cells;
    };

    const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseLine(lines[i]);
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      result.push(obj);
    }
    return result;
  };

  const convertCsvRowToGhat = (row: Record<string, string>): any => {
    const parseJsonOrString = (val: string, fallback = '') => {
      if (!val) return { en: fallback };
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === 'object') return parsed;
      } catch {
        // Not JSON
      }
      return { en: val };
    };

    const parseJsonArray = (val: string) => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Not JSON
      }
      return [];
    };

    // 1. Name
    let name: LocalizedText;
    if (row.name_en || row.name_te || row.name_hi) {
      name = {
        en: row.name_en || 'Pushkaralu Ghat',
        te: row.name_te || '',
        hi: row.name_hi || '',
      };
    } else if (row.name) {
      name = parseJsonOrString(row.name, 'Pushkaralu Ghat');
    } else {
      name = { en: 'Pushkaralu Ghat' };
    }

    // 2. Coordinates
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    if (isNaN(lat) || isNaN(lng)) return null;

    // 3. Transit details
    const nearest_town =
      row.nearest_town_en || row.nearest_town_te || row.nearest_town_hi
        ? { en: row.nearest_town_en || '', te: row.nearest_town_te || '', hi: row.nearest_town_hi || '' }
        : parseJsonOrString(row.nearest_town, row.district || 'Rajahmundry');

    const nearest_railway_station =
      row.nearest_railway_station_en || row.nearest_railway_station_te || row.nearest_railway_station_hi
        ? { en: row.nearest_railway_station_en || '', te: row.nearest_railway_station_te || '', hi: row.nearest_railway_station_hi || '' }
        : parseJsonOrString(row.nearest_railway_station, '');

    const nearest_bus_stand =
      row.nearest_bus_stand_en || row.nearest_bus_stand_te || row.nearest_bus_stand_hi
        ? { en: row.nearest_bus_stand_en || '', te: row.nearest_bus_stand_te || '', hi: row.nearest_bus_stand_hi || '' }
        : parseJsonOrString(row.nearest_bus_stand, '');

    // 4. Description
    const description =
      row.description_en || row.description_te || row.description_hi
        ? { en: row.description_en || '', te: row.description_te || '', hi: row.description_hi || '' }
        : parseJsonOrString(row.description, '');

    return {
      name,
      river: row.river || 'Godavari',
      district: row.district || 'East Godavari',
      state: row.state || 'Andhra Pradesh',
      lat,
      lng,
      nearest_town,
      nearest_railway_station,
      nearest_bus_stand,
      official_source_url: row.official_source_url || null,
      verified_at: row.verified_at || null,
      record_status: row.record_status || 'officially_listed',
      bathing_status: row.bathing_status || 'allowed',
      crowd_level: row.crowd_level || 'medium',
      publish_status: row.publish_status || 'published',
      description,
      max_capacity: row.max_capacity ? parseInt(row.max_capacity, 10) : 30000,
      sources: parseJsonArray(row.sources),
      facilities: parseJsonArray(row.facilities),
      aarti_timings: parseJsonArray(row.aarti_timings),
    };
  };

  const handleImportCSVSubmit = async () => {
    if (csvParsedRecords.length === 0) {
      alert('No parsed ghat records to import.');
      return;
    }
    if (!csvAuditReason.trim() || csvAuditReason.trim().length < 5) {
      alert('Audit reason of at least 5 characters is required.');
      return;
    }

    setCsvSubmitting(true);
    try {
      const res = await AdminApi.bulkImportGhats(csvParsedRecords, csvAuditReason.trim());
      setSuccessMessage(`Successfully imported ${res.count} ghats into database.`);
      setCsvModalOpen(false);
      setCsvParsedRecords([]);
      setCsvFileName('');
      await loadGhats();
    } catch (err: any) {
      alert(`Bulk import failed: ${err.message}`);
    } finally {
      setCsvSubmitting(false);
    }
  };

  if (!canWrite) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks permission required to manage ghat records.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Ghats Management & Directory
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Coordinate, safety, crowd status, and multilingual pilgrim information for Godavari Pushkaralu ghats.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadSampleCSV}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📥 Download Sample CSV
          </button>

          <button
            onClick={() => {
              setCsvError(null);
              setCsvParsedRecords([]);
              setCsvFileName('');
              setCsvModalOpen(true);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #0F52BA',
              background: '#EFF6FF',
              color: '#0F52BA',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📤 Upload CSV File
          </button>

          <button
            onClick={openCreateModal}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#0F52BA',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ➕ Add Single Ghat
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div style={{ padding: '0.75rem 1rem', background: '#DCFCE7', color: '#166534', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="🔍 Search ghat by name (EN / TE / HI) or town..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>District:</label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            <option value="all">All Districts</option>
            {uniqueDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Publish:</label>
          <select
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Bathing:</label>
          <select
            value={bathingFilter}
            onChange={(e) => setBathingFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            <option value="all">All</option>
            <option value="allowed">Allowed</option>
            <option value="restricted">Restricted</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748B' }}>
          Showing <strong>{filteredGhats.length}</strong> of {ghats.length} ghats
        </div>
      </div>

      {/* Ghats Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            Loading ghat directory...
          </div>
        ) : filteredGhats.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            No ghats match your search and filter criteria.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Ghat Name</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>River & District</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Coordinates</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Bathing Safety</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Crowd Level</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Capacity</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGhats.map((g) => {
                const bathingColor =
                  g.bathing_status === 'allowed' ? '#16A34A' : g.bathing_status === 'restricted' ? '#EA580C' : '#DC2626';
                const bathingBg =
                  g.bathing_status === 'allowed' ? '#DCFCE7' : g.bathing_status === 'restricted' ? '#FFEDD5' : '#FEE2E2';

                const publishBadgeColor =
                  g.publish_status === 'published' ? '#1E40AF' : g.publish_status === 'draft' ? '#92400E' : '#64748B';
                const publishBadgeBg =
                  g.publish_status === 'published' ? '#DBEAFE' : g.publish_status === 'draft' ? '#FEF3C7' : '#F1F5F9';

                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{g.name?.en}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {g.name?.te && <span>{g.name.te}</span>}
                        {g.name?.hi && <span> • {g.name.hi}</span>}
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ color: '#334155' }}>{g.district}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{g.river}, {g.state}</div>
                    </td>

                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                      {g.lat.toFixed(4)}, {g.lng.toFixed(4)}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: bathingColor,
                          background: bathingBg,
                        }}
                      >
                        {g.bathing_status}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#F1F5F9',
                        }}
                      >
                        {g.crowd_level}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      {g.max_capacity ? g.max_capacity.toLocaleString() : '—'}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: publishBadgeColor,
                          background: publishBadgeBg,
                        }}
                      >
                        {g.publish_status}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(g)}
                          title="Edit Ghat"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() => handleTogglePublish(g)}
                          title="Toggle Publish Status"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          {g.publish_status === 'published' ? '👁️ Hide' : '👁️ Publish'}
                        </button>

                        <button
                          onClick={() => openDeleteModal(g)}
                          title="Delete Ghat"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #FCA5A5',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: Single Ghat Add / Edit */}
      {editModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <form onSubmit={handleSaveGhat}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {editingGhatId ? 'Edit Ghat Information' : 'Add New Pushkaralu Ghat'}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Multilingual Ghat Name */}
                <TranslatableInput
                  label="Ghat Name"
                  value={formName}
                  onChange={setFormName}
                  requiredLanguages={['en', 'te']}
                  helperText="English is mandatory. Telugu & Hindi are strongly recommended for pilgrim accessibility."
                />

                {/* Geography & Location */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>River</label>
                    <input
                      type="text"
                      value={formRiver}
                      onChange={(e) => setFormRiver(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>District</label>
                    <input
                      type="text"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>State</label>
                    <input
                      type="text"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Max Capacity (Pilgrims)</label>
                    <input
                      type="number"
                      value={formMaxCapacity}
                      onChange={(e) => setFormMaxCapacity(e.target.value)}
                      placeholder="e.g. 30000"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Status Parameters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Record Status</label>
                    <select
                      value={formRecordStatus}
                      onChange={(e) => setFormRecordStatus(e.target.value as RecordStatus)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    >
                      <option value="officially_listed">Officially Listed (Govt Verified)</option>
                      <option value="reported">Reported (Community/Media)</option>
                      <option value="unverified">Unverified (Pending Review)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bathing Safety Status</label>
                    <select
                      value={formBathingStatus}
                      onChange={(e) => setFormBathingStatus(e.target.value as BathingStatus)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    >
                      <option value="allowed">Allowed (Safe for Holy Dip)</option>
                      <option value="restricted">Restricted (High Current / Danger)</option>
                      <option value="closed">Closed (Strictly Prohibited)</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Crowd Level</label>
                    <select
                      value={formCrowdLevel}
                      onChange={(e) => setFormCrowdLevel(e.target.value as CrowdLevel)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    >
                      <option value="low">Low (Light Footfall)</option>
                      <option value="medium">Medium (Moderate Wait)</option>
                      <option value="high">High (Heavy Pilgrims)</option>
                      <option value="very_high">Very High (Peak Congestion)</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Publish Status</label>
                    <select
                      value={formPublishStatus}
                      onChange={(e) => setFormPublishStatus(e.target.value as PublishStatus)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    >
                      <option value="published">Published (Visible in App)</option>
                      <option value="draft">Draft (Control Room Review)</option>
                      <option value="hidden">Hidden (Deactivated)</option>
                    </select>
                  </div>
                </div>

                {/* Official Source & Verification */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Official Source URL (.gov.in / .nic.in required for officially_listed)
                    </label>
                    <input
                      type="url"
                      value={formOfficialUrl}
                      onChange={(e) => setFormOfficialUrl(e.target.value)}
                      placeholder="https://eastgodavari.ap.gov.in/pushkaralu/ghats"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Verified At</label>
                    <input
                      type="text"
                      value={formVerifiedAt}
                      onChange={(e) => setFormVerifiedAt(e.target.value)}
                      placeholder="2026-09-20T11:30:00Z"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Multilingual Transit Information */}
                <TranslatableInput
                  label="Nearest Town"
                  value={formTown}
                  onChange={setFormTown}
                  requiredLanguages={['en']}
                  helperText="Nearest municipality or village center."
                />

                <TranslatableInput
                  label="Nearest Railway Station (with station code & distance)"
                  value={formRailway}
                  onChange={setFormRailway}
                  helperText="e.g. Godavari Railway Station (GVN - 1.4 km)"
                />

                <TranslatableInput
                  label="Nearest Bus Stand (with distance)"
                  value={formBusStand}
                  onChange={setFormBusStand}
                  helperText="e.g. Kotipalli Bus Stand (3.0 km)"
                />

                {/* Multilingual Description */}
                <TranslatableInput
                  label="Ghat Description & Pilgrim Guidance"
                  value={formDesc}
                  onChange={setFormDesc}
                  multiline
                  helperText="Include safety notes, historical importance, and elder accessibility tips."
                />

                {/* Facilities List */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem', background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                      Ghat Facilities ({formFacilities.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFormFacilities([
                          ...formFacilities,
                          {
                            facility_type: 'changing_rooms',
                            is_operational: true,
                            count: 1,
                            details: { en: 'Separate enclosures for pilgrims', te: '', hi: '' },
                          },
                        ])
                      }
                      style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #0F52BA', background: '#FFFFFF', color: '#0F52BA', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      + Add Facility
                    </button>
                  </div>

                  {formFacilities.map((fac, idx) => (
                    <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          value={fac.facility_type}
                          onChange={(e) => {
                            const updated = [...formFacilities];
                            updated[idx].facility_type = e.target.value;
                            setFormFacilities(updated);
                          }}
                          style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        >
                          {DEFAULT_FACILITY_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569' }}>
                          <input
                            type="checkbox"
                            checked={fac.is_operational}
                            onChange={(e) => {
                              const updated = [...formFacilities];
                              updated[idx].is_operational = e.target.checked;
                              setFormFacilities(updated);
                            }}
                          />
                          Operational
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>Count:</span>
                          <input
                            type="number"
                            min="1"
                            value={fac.count}
                            onChange={(e) => {
                              const updated = [...formFacilities];
                              updated[idx].count = parseInt(e.target.value, 10) || 1;
                              setFormFacilities(updated);
                            }}
                            style={{ width: '60px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormFacilities(formFacilities.filter((_, i) => i !== idx))}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Facility details / description (e.g. Separate male & female sections)..."
                        value={fac.details?.en || ''}
                        onChange={(e) => {
                          const updated = [...formFacilities];
                          updated[idx].details = { ...updated[idx].details, en: e.target.value };
                          setFormFacilities(updated);
                        }}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Aarti Timings List */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem', background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                      Aarti & Harathi Timings ({formAartiTimings.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFormAartiTimings([
                          ...formAartiTimings,
                          {
                            aarti_name: { en: 'Godavari Harathi', te: 'గోదావరి హారతి', hi: 'गोदावरी आरती' },
                            time: '19:00',
                            days: 'everyday',
                            description: { en: 'Evening river bank aarti', te: '', hi: '' },
                          },
                        ])
                      }
                      style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #0F52BA', background: '#FFFFFF', color: '#0F52BA', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      + Add Aarti Timing
                    </button>
                  </div>

                  {formAartiTimings.map((aarti, idx) => (
                    <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Aarti Name (e.g. Godavari Harathi)"
                          value={aarti.aarti_name?.en || ''}
                          onChange={(e) => {
                            const updated = [...formAartiTimings];
                            updated[idx].aarti_name = { ...updated[idx].aarti_name, en: e.target.value };
                            setFormAartiTimings(updated);
                          }}
                          style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />

                        <input
                          type="text"
                          placeholder="Time (e.g. 19:00)"
                          value={aarti.time}
                          onChange={(e) => {
                            const updated = [...formAartiTimings];
                            updated[idx].time = e.target.value;
                            setFormAartiTimings(updated);
                          }}
                          style={{ width: '100px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />

                        <input
                          type="text"
                          placeholder="Days (e.g. everyday)"
                          value={aarti.days}
                          onChange={(e) => {
                            const updated = [...formAartiTimings];
                            updated[idx].days = e.target.value;
                            setFormAartiTimings(updated);
                          }}
                          style={{ width: '120px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />

                        <button
                          type="button"
                          onClick={() => setFormAartiTimings(formAartiTimings.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audit Reason (Mandatory) */}
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                    Mandatory Audit Reason (Logged permanently in Audit Trail) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuditReason}
                    onChange={(e) => setFormAuditReason(e.target.value)}
                    placeholder="e.g. Surveyed new Saraswati Ghat with District Collectorate approval"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #FCD34D', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#F8FAFC' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0F52BA', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  {formSubmitting ? 'Saving...' : editingGhatId ? 'Update Ghat' : 'Create Ghat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bulk CSV Upload */}
      {csvModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  Bulk Import Ghats from CSV
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Upload a standard CSV file containing Pushkaralu ghat coordinates, facilities, and multilingual metadata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCsvModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* File Selector */}
              <div
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '8px',
                  padding: '1.75rem',
                  textAlign: 'center',
                  background: '#F8FAFC',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '0.25rem' }}>
                  Choose CSV file from your computer
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                  Supports both standard flattened headers and nested JSON objects in cells.
                </div>

                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCSVFileSelect}
                  style={{ display: 'none' }}
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: '#0F52BA',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'inline-block',
                  }}
                >
                  Browse File
                </label>

                {csvFileName && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                    Selected: {csvFileName}
                  </div>
                )}
              </div>

              {csvError && (
                <div style={{ padding: '0.75rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '0.85rem' }}>
                  ⚠️ {csvError}
                </div>
              )}

              {/* Preview Table */}
              {csvParsedRecords.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                      CSV Preview ({csvParsedRecords.length} records ready to import)
                    </h3>
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                        <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                          <th style={{ padding: '8px' }}>#</th>
                          <th style={{ padding: '8px' }}>Ghat Name (EN / TE)</th>
                          <th style={{ padding: '8px' }}>District</th>
                          <th style={{ padding: '8px' }}>Coordinates</th>
                          <th style={{ padding: '8px' }}>Bathing</th>
                          <th style={{ padding: '8px' }}>Facilities</th>
                          <th style={{ padding: '8px' }}>Aarti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsedRecords.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px', color: '#94A3B8' }}>{i + 1}</td>
                            <td style={{ padding: '8px', fontWeight: 600, color: '#0F172A' }}>
                              {r.name?.en} {r.name?.te && <span style={{ color: '#64748B', fontWeight: 400 }}>({r.name.te})</span>}
                            </td>
                            <td style={{ padding: '8px' }}>{r.district}</td>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>{r.lat}, {r.lng}</td>
                            <td style={{ padding: '8px' }}>{r.bathing_status}</td>
                            <td style={{ padding: '8px' }}>{Array.isArray(r.facilities) ? `${r.facilities.length} items` : '0'}</td>
                            <td style={{ padding: '8px' }}>{Array.isArray(r.aarti_timings) ? `${r.aarti_timings.length} items` : '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Audit Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Audit Reason for Bulk Import *
                </label>
                <input
                  type="text"
                  required
                  value={csvAuditReason}
                  onChange={(e) => setCsvAuditReason(e.target.value)}
                  placeholder="e.g. Official Pushkaralu ghat directory CSV upload by District Collectorate"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => setCsvModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={csvParsedRecords.length === 0 || csvSubmitting}
                onClick={handleImportCSVSubmit}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: csvParsedRecords.length === 0 ? '#94A3B8' : '#0F52BA',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: csvParsedRecords.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {csvSubmitting ? 'Importing...' : `Import ${csvParsedRecords.length} Ghats`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteModalOpen && ghatToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#DC2626' }}>
                Confirm Deletion of Ghat
              </h2>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>{ghatToDelete.name?.en}</strong> ({ghatToDelete.district})?
                This will cascade-delete associated facilities, aarti timings, notices, and crowd records.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Demolished or replaced by unified ghat complex"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                {deleteSubmitting ? 'Deleting...' : 'Delete Ghat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
