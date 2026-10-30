import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  HelpCircle,
  Building2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Asset, AssetCategory, CriticalityLevel, AssetStatus, FundingSource, AcquisitionMethod } from '../../types';
import { HOSPITAL_DEPARTMENTS, ASSET_CATEGORIES_CONFIG } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export const ImportAssetModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { batchAddAssets } = useApp();

  const [activeInputTab, setActiveInputTab] = useState<'file' | 'paste'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  
  // Parsed results
  const [parsedRows, setParsedRows] = useState<Omit<Asset, 'id'>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [defaultDepartment, setDefaultDepartment] = useState('5. อุบัติเหตุฉุกเฉิน');
  const [defaultCategory, setDefaultCategory] = useState<AssetCategory>('medical_health');
  const [isSuccess, setIsSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: map fuzzy category name to AssetCategory enum
  const mapCategory = (rawCat: string): AssetCategory => {
    if (!rawCat) return defaultCategory;
    const clean = rawCat.trim().toLowerCase();
    
    if (clean.includes('การแพทย์') || clean.includes('แพทย์') || clean.includes('สาธารณสุข') || clean.includes('medical')) return 'medical_health';
    if (clean.includes('คอมพิวเตอร์') || clean.includes('ไอที') || clean.includes('สารสนเทศ') || clean.includes('it') || clean.includes('computer')) return 'computer_it';
    if (clean.includes('ปรับอากาศ') || clean.includes('แอร์') || clean.includes('hvac') || clean.includes('air')) return 'hvac_aircon';
    if (clean.includes('ยานพาหนะ') || clean.includes('รถ') || clean.includes('ขนส่ง') || clean.includes('vehicle')) return 'vehicle_transport';
    if (clean.includes('วิทยาศาสตร์') || clean.includes('แล็บ') || clean.includes('lab') || clean.includes('science')) return 'science_lab';
    if (clean.includes('ไฟฟ้า') || clean.includes('วิทยุ') || clean.includes('สื่อสาร') || clean.includes('กำเนิดไฟฟ้า') || clean.includes('generator')) return 'electrical_telecom';
    if (clean.includes('โรงงาน') || clean.includes('วิศวกรรม') || clean.includes('บอยเลอร์') || clean.includes('autoclave')) return 'factory_engineering';
    if (clean.includes('สำนักงาน') || clean.includes('โต๊ะ') || clean.includes('ตู้') || clean.includes('office')) return 'office_furniture';
    if (clean.includes('บ้าน') || clean.includes('ครัว') || clean.includes('ซักฟอก') || clean.includes('housekeep')) return 'housekeeping_laundry';
    if (clean.includes('เกษตร') || clean.includes('สิ่งแวดล้อม') || clean.includes('น้ำเสีย')) return 'agriculture_environ';
    if (clean.includes('โฆษณา') || clean.includes('เผยแพร่') || clean.includes('เสียง') || clean.includes('จอ')) return 'audiovisual_broadcast';
    if (clean.includes('กายภาพ') || clean.includes('ฟื้นฟู') || clean.includes('pt')) return 'physical_therapy';
    if (clean.includes('สำรวจ') || clean.includes('มาตรวิทยา') || clean.includes('สอบเทียบ') || clean.includes('meter')) return 'survey_measurement';

    // match by id
    const foundById = ASSET_CATEGORIES_CONFIG.find(c => c.id === rawCat);
    if (foundById) return foundById.id;

    return defaultCategory;
  };

  // Helper: map fuzzy department to 17 departments
  const mapDepartment = (rawDept: string): string => {
    if (!rawDept) return defaultDepartment;
    const clean = rawDept.trim();

    // Direct exact match
    const exact = HOSPITAL_DEPARTMENTS.find(d => d === clean);
    if (exact && exact !== 'ทั้งหมด') return exact;

    // Fuzzy keyword match
    for (const d of HOSPITAL_DEPARTMENTS) {
      if (d === 'ทั้งหมด') continue;
      const coreName = d.replace(/^\d+\.\s*/, '');
      if (clean.includes(coreName) || coreName.includes(clean)) {
        return d;
      }
    }

    return defaultDepartment;
  };

  // CSV Line Parser with support for quotes
  const parseCSVLine = (line: string, delimiter: string = ','): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Core parser for CSV or TSV text
  const processRawText = (text: string) => {
    setParseErrors([]);
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    if (!cleanText) {
      setParsedRows([]);
      return;
    }

    // Try JSON first
    if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
      try {
        const json = JSON.parse(cleanText);
        if (Array.isArray(json)) {
          const rows: Omit<Asset, 'id'>[] = json.map((item, idx) => ({
            code: item.code || `SK-MD-67-${1000 + idx}`,
            gfmisCode: item.gfmisCode || `11050100-${item.code || idx}`,
            serialNumber: item.serialNumber || `SN-${10000 + idx}`,
            name: item.name || 'ไม่ระบุชื่อครุภัณฑ์',
            brand: item.brand || 'ไม่ระบุยี่ห้อ',
            model: item.model || 'ไม่ระบุรุ่น',
            category: mapCategory(item.category),
            department: mapDepartment(item.department),
            locationDetail: item.locationDetail || '',
            specification: item.specification || item.name || '',
            criticality: item.criticality || 'general',
            status: item.status || 'ready',
            fundingSource: item.fundingSource || 'budget',
            acquisitionMethod: item.acquisitionMethod || 'specific',
            documentNo: item.documentNo || `กจ 0032.2/${100 + idx}/2567`,
            acquisitionDate: item.acquisitionDate || new Date().toISOString().slice(0, 10),
            warrantyExpiry: item.warrantyExpiry || new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString().slice(0, 10),
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'เครื่อง',
            price: Number(item.price) || 50000,
            totalPrice: Number(item.totalPrice) || Number(item.price) || 50000,
            usefulLifeYears: Number(item.usefulLifeYears) || 8,
            depreciationRatePercent: Number(item.depreciationRatePercent) || 12.5,
            annualDepreciation: Number(item.annualDepreciation) || Math.round(((Number(item.price) || 50000) * 12.5) / 100),
            accumulatedDepreciation: Number(item.accumulatedDepreciation) || 0,
            netBookValue: Number(item.netBookValue) || Number(item.price) || 50000,
            vendor: item.vendor || 'บริษัทคู่ค้ามาตรฐาน',
            vendorAddress: item.vendorAddress || 'กรุงเทพมหานคร',
            vendorPhone: item.vendorPhone || '02-xxx-xxxx',
            lastPMDate: item.lastPMDate || new Date().toISOString().slice(0, 10),
            nextPMDate: item.nextPMDate || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
            pmFrequencyMonths: Number(item.pmFrequencyMonths) || 3,
          }));
          setParsedRows(rows);
          return;
        }
      } catch (e) {
        // Not valid json, proceed to CSV
      }
    }

    // Process as CSV or TSV
    const lines = cleanText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors(['ไฟล์ต้องมีอย่างน้อย 2 บรรทัด (แถวหัวตาราง Header และแถวข้อมูลอย่างน้อย 1 แถว)']);
      setParsedRows([]);
      return;
    }

    // Determine delimiter: tab, comma, or semicolon
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim().toLowerCase());

    // Map column indices
    const colIndex = {
      code: headers.findIndex(h => h.includes('รหัสครุภัณฑ์') || h.includes('asset_code') || h === 'code'),
      gfmisCode: headers.findIndex(h => h.includes('gfmis') || h.includes('รหัส gfmis')),
      serialNumber: headers.findIndex(h => h.includes('ซีเรียล') || h.includes('serial') || h.includes('s/n') || h === 'sn'),
      name: headers.findIndex(h => h.includes('ชื่อ') || h.includes('ครุภัณฑ์') || h.includes('name')),
      brand: headers.findIndex(h => h.includes('ยี่ห้อ') || h.includes('brand')),
      model: headers.findIndex(h => h.includes('รุ่น') || h.includes('model')),
      category: headers.findIndex(h => h.includes('หมวด') || h.includes('ประเภท') || h.includes('category')),
      department: headers.findIndex(h => h.includes('แผนก') || h.includes('หน่วยงาน') || h.includes('dept') || h.includes('department')),
      locationDetail: headers.findIndex(h => h.includes('สถานที่') || h.includes('ตำแหน่ง') || h.includes('location')),
      specification: headers.findIndex(h => h.includes('คุณลักษณะ') || h.includes('รายละเอียด') || h.includes('spec')),
      price: headers.findIndex(h => h.includes('ราคา') || h.includes('price') || h.includes('มูลค่า')),
      quantity: headers.findIndex(h => h.includes('จำนวน') || h.includes('qty') || h.includes('quantity')),
      unit: headers.findIndex(h => h.includes('หน่วยนับ') || h.includes('unit')),
      fundingSource: headers.findIndex(h => h.includes('ประเภทเงิน') || h.includes('เงิน') || h.includes('funding')),
      acquisitionMethod: headers.findIndex(h => h.includes('วิธีการได้มา') || h.includes('วิธี') || h.includes('acquisition')),
      acquisitionDate: headers.findIndex(h => h.includes('วันที่') || h.includes('ตรวจรับ') || h.includes('date')),
      vendor: headers.findIndex(h => h.includes('ผู้ขาย') || h.includes('ผู้บริจาค') || h.includes('vendor') || h.includes('supplier')),
      vendorPhone: headers.findIndex(h => h.includes('โทร') || h.includes('phone') || h.includes('tel')),
    };

    const errors: string[] = [];
    const rows: Omit<Asset, 'id'>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line, delimiter);
      
      const name = colIndex.name >= 0 ? cols[colIndex.name] : (cols[3] || `ครุภัณฑ์รายการที่ ${i}`);
      const code = colIndex.code >= 0 && cols[colIndex.code] 
        ? cols[colIndex.code] 
        : `SK-MD-67-${Math.floor(1000 + Math.random() * 9000)}`;

      if (!name) {
        errors.push(`แถวที่ ${i + 1}: ข้ามเนื่องจากไม่มีชื่อครุภัณฑ์`);
        continue;
      }

      const rawPrice = colIndex.price >= 0 ? cols[colIndex.price]?.replace(/[^\d.]/g, '') : '50000';
      const price = Number(rawPrice) || 50000;
      const quantity = colIndex.quantity >= 0 ? (Number(cols[colIndex.quantity]) || 1) : 1;
      const totalPrice = price * quantity;

      const brand = colIndex.brand >= 0 && cols[colIndex.brand] ? cols[colIndex.brand] : 'มาตรฐาน';
      const model = colIndex.model >= 0 && cols[colIndex.model] ? cols[colIndex.model] : '-';
      const rawCat = colIndex.category >= 0 ? cols[colIndex.category] : '';
      const rawDept = colIndex.department >= 0 ? cols[colIndex.department] : '';

      const usefulLifeYears = 8;
      const depreciationRatePercent = 12.5;
      const annualDepreciation = Math.round((totalPrice * depreciationRatePercent) / 100);

      rows.push({
        code,
        gfmisCode: colIndex.gfmisCode >= 0 && cols[colIndex.gfmisCode] ? cols[colIndex.gfmisCode] : `11050100-${code}`,
        serialNumber: colIndex.serialNumber >= 0 && cols[colIndex.serialNumber] ? cols[colIndex.serialNumber] : `SN-${Date.now().toString().slice(-6)}${i}`,
        name,
        brand,
        model,
        category: mapCategory(rawCat),
        department: mapDepartment(rawDept),
        locationDetail: colIndex.locationDetail >= 0 ? cols[colIndex.locationDetail] || '' : '',
        specification: colIndex.specification >= 0 && cols[colIndex.specification] ? cols[colIndex.specification] : name,
        criticality: 'high_risk',
        status: 'ready',
        fundingSource: 'budget',
        acquisitionMethod: 'specific',
        documentNo: `กจ 0032.2/${Math.floor(100 + Math.random() * 900)}/2567`,
        acquisitionDate: colIndex.acquisitionDate >= 0 && cols[colIndex.acquisitionDate] ? cols[colIndex.acquisitionDate] : new Date().toISOString().slice(0, 10),
        warrantyExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString().slice(0, 10),
        quantity,
        unit: colIndex.unit >= 0 && cols[colIndex.unit] ? cols[colIndex.unit] : 'เครื่อง',
        price,
        totalPrice,
        usefulLifeYears,
        depreciationRatePercent,
        annualDepreciation,
        accumulatedDepreciation: 0,
        netBookValue: totalPrice,
        vendor: colIndex.vendor >= 0 && cols[colIndex.vendor] ? cols[colIndex.vendor] : 'บริษัทคู่ค้ามาตรฐาน สธ.',
        vendorAddress: 'กรุงเทพมหานคร',
        vendorPhone: colIndex.vendorPhone >= 0 && cols[colIndex.vendorPhone] ? cols[colIndex.vendorPhone] : '02-xxx-xxxx',
        lastPMDate: new Date().toISOString().slice(0, 10),
        nextPMDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        pmFrequencyMonths: 3,
      });
    }

    setParseErrors(errors);
    setParsedRows(rows);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      processRawText(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        processRawText(text);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Template download: Sample MOPH CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'รหัสครุภัณฑ์',
      'รหัส GFMIS',
      'หมายเลขซีเรียล (S/N)',
      'ชื่อครุภัณฑ์',
      'ยี่ห้อ',
      'รุ่น',
      'หมวดหมู่ครุภัณฑ์',
      'แผนกผู้รับผิดชอบ',
      'สถานที่ติดตั้ง',
      'คุณลักษณะเฉพาะ',
      'ราคาต่อหน่วย',
      'จำนวน',
      'ประเภทเงิน',
      'วิธีการได้มา',
      'วันที่ตรวจรับ',
      'ชื่อผู้ขาย/ผู้บริจาค',
      'เบอร์โทรผู้ขาย'
    ];

    const sampleRows = [
      [
        'SK-MD-67-0099',
        '11050100-67-0099',
        'SN-PHIL-88410',
        'เครื่องติดตามสัญญาณชีพและวัดความอิ่มตัวของออกซิเจน (Vital Signs Monitor)',
        'Philips',
        'SureSigns VM4',
        '1. ครุภัณฑ์การแพทย์และสาธารณสุข',
        '5. อุบัติเหตุฉุกเฉิน',
        'ห้องกู้ชีพ Resuscitation เตียง 2',
        'จอสีขนาด 8.4 นิ้ว วัด NIBP, SpO2, Pulse Rate พร้อมแบตสำรอง',
        '95000',
        '1',
        'เงินงบประมาณ',
        'เฉพาะเจาะจง',
        '2024-05-15',
        'บริษัท ฟิลิปส์ อิเล็กทรอนิกส์ (ประเทศไทย) จำกัด',
        '02-614-3333'
      ],
      [
        'SK-AC-67-0021',
        '11050300-67-0021',
        'SN-DAIK-36K-IPD',
        'เครื่องปรับอากาศระบบอินเวอร์เตอร์ 36,000 BTU',
        'Daikin',
        'Inverter FTKC36',
        '3. ครุภัณฑ์ปรับอากาศและระบายอากาศ',
        '4. ผู้ป่วยใน',
        'ห้องพักพยาบาล ตึกผู้ป่วยใน ชั้น 2',
        'เครื่องปรับอากาศแยกส่วนติดผนัง ประหยัดไฟเบอร์ 5 น้ำยา R32',
        '42000',
        '1',
        'เงินนอกงบประมาณ (เงินบำรุง)',
        'เฉพาะเจาะจง',
        '2024-06-20',
        'หจก. กาญจนบุรี คูลลิ่ง แอนด์ ซัพพลาย',
        '034-511-998'
      ],
      [
        'SK-IT-67-0055',
        '11050200-67-0055',
        'SN-DELL-OPT-7090',
        'เครื่องคอมพิวเตอร์ประมวลผลงานระบบสารสนเทศโรงพยาบาล',
        'Dell',
        'OptiPlex 7090 MFF',
        '2. ครุภัณฑ์คอมพิวเตอร์และระบบสารสนเทศ',
        '17. สารสนเทศ',
        'จุดบริการเชื่อมต่อเครือข่าย HIS ชั้น 1',
        'Intel Core i7, RAM 16GB, SSD 512GB NVMe, จอ LED 23.8 นิ้ว',
        '35000',
        '2',
        'เงินงบประมาณ',
        'เฉพาะเจาะจง',
        '2024-07-10',
        'บริษัท ไอที โซลูชั่น ซิสเต็มส์ จำกัด',
        '034-512888'
      ]
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ไฟล์แม่แบบนำเข้าทะเบียนครุภัณฑ์_สธ_รพ_สังขละบุรี.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    batchAddAssets(parsedRows);
    setImportedCount(parsedRows.length);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                นำเข้าข้อมูลทะเบียนครุภัณฑ์ (Asset Data Import)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                รองรับไฟล์ CSV, Excel (.csv) หรือ JSON นำเข้าสู่ฐานข้อมูลครุภัณฑ์ 17 แผนก โรงพยาบาลสังขละบุรี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="ดาวน์โหลดไฟล์ตัวอย่าง CSV ที่มีคอลัมน์มาตรฐานถูกต้อง"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>ดาวน์โหลดไฟล์แม่แบบ CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Overlay Banner */}
        {isSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              นำเข้าข้อมูลครุภัณฑ์สำเร็จแล้ว!
            </h4>
            <p className="text-xs text-slate-500 max-w-md">
              เพิ่มครุภัณฑ์ใหม่จำนวน <strong>{importedCount} รายการ</strong> เข้าสู่ระบบทะเบียนครุภัณฑ์และปรับปรุงรายงาน สธ. เรียบร้อยแล้ว กำลังปิดหน้าต่าง...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            
            {/* Input Selection Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInputTab('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeInputTab === 'file' 
                      ? 'bg-emerald-700 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  อัปโหลดไฟล์ (.CSV / .TXT / .JSON)
                </button>
                <button
                  onClick={() => setActiveInputTab('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeInputTab === 'paste' 
                      ? 'bg-emerald-700 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  วางข้อความตาราง (Paste Text / CSV)
                </button>
              </div>

              {/* Default Settings */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">แผนกเริ่มต้น:</span>
                  <select
                    value={defaultDepartment}
                    onChange={(e) => setDefaultDepartment(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-[11px] font-medium"
                  >
                    {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mode 1: File Upload Drag & Drop */}
            {activeInputTab === 'file' && (
              <div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                    dragOver 
                      ? 'border-emerald-500 bg-emerald-50/60' 
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .tsv, .txt, .json"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="p-3.5 rounded-full bg-emerald-50 text-emerald-700">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      รองรับไฟล์ .CSV (UTF-8) ที่ส่งออกจาก Microsoft Excel, Google Sheets, หรือระบบ ERP เดิม
                    </p>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
                  >
                    เลือกไฟล์จากอุปกรณ์
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Paste Raw CSV / Text */}
            {activeInputTab === 'paste' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  วางข้อความแถวข้อมูล CSV หรือข้อมูลที่คัดลอกจาก Excel / Google Sheets:
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    processRawText(e.target.value);
                  }}
                  placeholder="รหัสครุภัณฑ์,รหัส GFMIS,ชื่อครุภัณฑ์,ยี่ห้อ,รุ่น,แผนก,ราคา&#10;SK-MD-67-001,11050100-001,เครื่องวัดความดัน,Omron,HBP-1320,3. ผู้ป่วยนอก,12000"
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            )}

            {/* Errors or Warnings */}
            {parseErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>พบข้อผิดพลาดหรือคำเตือนบางส่วน:</span>
                </div>
                {parseErrors.map((err, idx) => (
                  <p key={idx} className="text-[11px] text-amber-700">• {err}</p>
                ))}
              </div>
            )}

            {/* Preview of Parsed Data */}
            {parsedRows.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900">
                      ตรวจสอบข้อมูลที่ตรวจพบ ({parsedRows.length} รายการ)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    แสดงตัวอย่าง 5 รายการแรก
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">รหัสครุภัณฑ์</th>
                        <th className="py-2 px-3">ชื่อครุภัณฑ์</th>
                        <th className="py-2 px-3">ยี่ห้อ / รุ่น</th>
                        <th className="py-2 px-3">แผนก</th>
                        <th className="py-2 px-3 text-right">ราคา (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{row.code}</td>
                          <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate">{row.name}</td>
                          <td className="py-2 px-3 text-slate-600">{row.brand} {row.model}</td>
                          <td className="py-2 px-3 text-emerald-800 font-semibold">{row.department}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-800 font-medium">
                            {row.price.toLocaleString()} ฿
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedRows.length > 10 && (
                  <p className="text-[11px] text-slate-400 text-center italic">
                    ... และอีก {parsedRows.length - 10} รายการที่จะถูกนำเข้าพร้อมกัน
                  </p>
                )}
              </div>
            )}

          </div>
        )}

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              {parsedRows.length > 0 ? (
                <span>พร้อมนำเข้า <strong>{parsedRows.length} รายการ</strong></span>
              ) : (
                <span>ยังไม่มีข้อมูลที่พร้อมนำเข้า</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedRows.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>ยืนยันนำเข้าข้อมูล ({parsedRows.length} รายการ)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
