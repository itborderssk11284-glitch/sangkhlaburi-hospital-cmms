import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  HelpCircle,
  Building2,
  Layers,
  ArrowRight,
  FileCheck,
  Info,
  Loader2,
  FileType,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { 
  Asset, 
  AssetCategory, 
  CriticalityLevel, 
  AssetStatus, 
  FundingSource, 
  AcquisitionMethod 
} from '../../types';
import { HOSPITAL_DEPARTMENTS, ASSET_CATEGORIES_CONFIG } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

// Configure pdfjs worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export const ImportAssetModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { batchAddAssets } = useApp();

  const [activeInputTab, setActiveInputTab] = useState<'file' | 'paste'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileTypeDetected, setFileTypeDetected] = useState<'excel' | 'pdf' | 'csv' | 'json' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [rawText, setRawText] = useState('');
  
  // Parsed results
  const [parsedRows, setParsedRows] = useState<Omit<Asset, 'id'>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [defaultDepartment, setDefaultDepartment] = useState('5. อุบัติเหตุฉุกเฉิน');
  const [defaultCategory, setDefaultCategory] = useState<AssetCategory>('medical_health');
  const [isSuccess, setIsSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: map fuzzy category name to AssetCategory enum
  const mapCategory = (rawCat: any): AssetCategory => {
    if (!rawCat) return defaultCategory;
    const clean = String(rawCat).trim().toLowerCase();
    
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
  const mapDepartment = (rawDept: any): string => {
    if (!rawDept) return defaultDepartment;
    const clean = String(rawDept).trim();

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

  // Helper: map criticality
  const mapCriticality = (rawCrit: any): CriticalityLevel => {
    if (!rawCrit) return 'high_risk';
    const clean = String(rawCrit).trim().toLowerCase();
    if (clean.includes('วิกฤต') || clean.includes('ช่วยชีวิต') || clean.includes('life')) return 'life_support';
    if (clean.includes('สูง') || clean.includes('high')) return 'high_risk';
    return 'general';
  };

  // Helper: map status
  const mapStatus = (rawStat: any): AssetStatus => {
    if (!rawStat) return 'ready';
    const clean = String(rawStat).trim().toLowerCase();
    if (clean.includes('ซ่อมบำรุง') || clean.includes('กำลังซ่อม') || clean.includes('in_repair')) return 'in_repair';
    if (clean.includes('รออะไหล่') || clean.includes('wait')) return 'wait_parts';
    if (clean.includes('ภายนอก') || clean.includes('ศูนย์') || clean.includes('external')) return 'external';
    if (clean.includes('ปลดระวาง') || clean.includes('ชำรุด') || clean.includes('decommission')) return 'decommission';
    return 'ready';
  };

  // Helper: map funding source
  const mapFundingSource = (raw: any): FundingSource => {
    if (!raw) return 'budget';
    const clean = String(raw).trim().toLowerCase();
    if (clean.includes('นอกงบ') || clean.includes('เงินบำรุง') || clean.includes('non_budget')) return 'non_budget';
    if (clean.includes('บริจาค') || clean.includes('donation')) return 'donation';
    if (clean.includes('อื่น') || clean.includes('other')) return 'other';
    return 'budget';
  };

  // Helper: map acquisition method
  const mapAcquisitionMethod = (raw: any): AcquisitionMethod => {
    if (!raw) return 'specific';
    const clean = String(raw).trim().toLowerCase();
    if (clean.includes('ประกวด') || clean.includes('bidding') || clean.includes('e-bidding')) return 'bidding';
    if (clean.includes('สอบราคา') || clean.includes('inquiry')) return 'inquiry';
    if (clean.includes('พิเศษ') || clean.includes('special')) return 'special';
    if (clean.includes('บริจาค') || clean.includes('donation')) return 'donation';
    return 'specific';
  };

  // Format date helper
  const normalizeDate = (rawDate: any): string => {
    if (!rawDate) return new Date().toISOString().slice(0, 10);
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      return rawDate.toISOString().slice(0, 10);
    }
    const str = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      let year = parseInt(dmy[3], 10);
      if (year > 2500) year -= 543; // Buddhist Era to CE
      const month = dmy[2].padStart(2, '0');
      const day = dmy[1].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return new Date().toISOString().slice(0, 10);
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

  // Build standard Asset objects from normalized row dictionaries
  const buildAssetsFromDicts = (rows: Record<string, any>[]): Omit<Asset, 'id'>[] => {
    const results: Omit<Asset, 'id'>[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const rawName = row.name || row['ชื่อครุภัณฑ์'] || row['ชื่อ'] || row['รายการ'];
      if (!rawName) {
        warnings.push(`แถวที่ ${rowNum}: ข้ามเนื่องจากไม่พบชื่อครุภัณฑ์`);
        return;
      }

      const name = String(rawName).trim();
      const rawCode = row.code || row['รหัสครุภัณฑ์'] || row['รหัส'] || row['หมายเลขครุภัณฑ์'];
      const code = rawCode ? String(rawCode).trim() : `SK-MD-67-${Math.floor(1000 + Math.random() * 9000)}`;

      const gfmisCode = row.gfmisCode || row['รหัส GFMIS'] || row['GFMIS'] || `11050100-${code}`;
      const serialNumber = row.serialNumber || row['หมายเลขซีเรียล (S/N)'] || row['S/N'] || row['Serial Number'] || `SN-${Date.now().toString().slice(-6)}${idx}`;
      const brand = row.brand || row['ยี่ห้อ'] || 'มาตรฐาน';
      const model = row.model || row['รุ่น'] || '-';
      const category = mapCategory(row.category || row['หมวดหมู่ครุภัณฑ์'] || row['หมวด']);
      const department = mapDepartment(row.department || row['แผนกผู้รับผิดชอบ'] || row['แผนก']);
      const locationDetail = row.locationDetail || row['สถานที่ติดตั้ง/ตำแหน่งเฉพาะ'] || row['สถานที่ติดตั้ง'] || '';
      const specification = row.specification || row['คุณลักษณะเฉพาะ/สเปก'] || row['คุณลักษณะเฉพาะ'] || name;
      const criticality = mapCriticality(row.criticality || row['ความสำคัญ']);
      const status = mapStatus(row.status || row['สถานะ']);

      const rawPrice = String(row.price || row['ราคาต่อหน่วย (บาท)'] || row['ราคาต่อหน่วย'] || row['ราคา'] || '50000').replace(/[^\d.]/g, '');
      const price = Number(rawPrice) || 50000;
      const quantity = Number(row.quantity || row['จำนวน (หน่วย)'] || row['จำนวน'] || 1) || 1;
      const unit = String(row.unit || row['หน่วยนับ'] || 'เครื่อง').trim();
      const totalPrice = price * quantity;

      const usefulLifeYears = Number(row.usefulLifeYears || row['อายุการใช้งาน (ปี)'] || 8) || 8;
      const depreciationRatePercent = Number(row.depreciationRatePercent || 12.5) || 12.5;
      const annualDepreciation = Math.round((totalPrice * depreciationRatePercent) / 100);

      const fundingSource = mapFundingSource(row.fundingSource || row['ประเภทเงิน']);
      const acquisitionMethod = mapAcquisitionMethod(row.acquisitionMethod || row['วิธีการได้มา']);
      const documentNo = String(row.documentNo || row['ที่เอกสารจัดซื้อ/ตรวจรับ'] || `กจ 0032.2/${Math.floor(100 + Math.random() * 900)}/2567`).trim();
      const acquisitionDate = normalizeDate(row.acquisitionDate || row['วันที่ตรวจรับ'] || row['วันที่ได้มา']);
      const warrantyExpiry = normalizeDate(row.warrantyExpiry || row['วันสิ้นสุดประกัน'] || new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString().slice(0, 10));

      const vendor = String(row.vendor || row['ชื่อผู้ขาย/ผู้บริจาค'] || row['ผู้ขาย'] || 'บริษัทคู่ค้ามาตรฐาน สธ.').trim();
      const vendorAddress = String(row.vendorAddress || row['ที่อยู่ผู้ขาย'] || 'กรุงเทพมหานคร').trim();
      const vendorPhone = String(row.vendorPhone || row['เบอร์โทรศัพท์ผู้ขาย'] || row['เบอร์โทรผู้ขาย'] || '02-xxx-xxxx').trim();

      results.push({
        code,
        gfmisCode: String(gfmisCode).trim(),
        serialNumber: String(serialNumber).trim(),
        name,
        brand: String(brand).trim(),
        model: String(model).trim(),
        category,
        department,
        locationDetail: String(locationDetail).trim(),
        specification: String(specification).trim(),
        criticality,
        status,
        fundingSource,
        acquisitionMethod,
        documentNo,
        acquisitionDate,
        warrantyExpiry,
        quantity,
        unit,
        price,
        totalPrice,
        usefulLifeYears,
        depreciationRatePercent,
        annualDepreciation,
        accumulatedDepreciation: 0,
        netBookValue: totalPrice,
        vendor,
        vendorAddress,
        vendorPhone,
        lastPMDate: acquisitionDate,
        nextPMDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        pmFrequencyMonths: 3,
        lastRepairDate: undefined
      });
    });

    setParseErrors(errors);
    setParseWarnings(warnings);
    return results;
  };

  // 1. Process Excel File (.xlsx / .xls)
  const processExcelBuffer = async (buffer: ArrayBuffer) => {
    try {
      setProcessingStatus('กำลังอ่านโครงสร้างสมุดงาน Excel...');
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setParseErrors(['ไม่พบแผ่นงาน (Worksheet) ในไฟล์ Excel ที่เลือก']);
        setParsedRows([]);
        return;
      }

      // Pick first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawAoA = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false, defval: '' });

      if (rawAoA.length < 2) {
        setParseErrors(['ไฟล์ Excel ต้องมีแถวหัวตาราง (Header) และข้อมูลอย่างน้อย 1 รายการ']);
        setParsedRows([]);
        return;
      }

      // Detect header row (first 10 rows search)
      let headerRowIndex = 0;
      for (let r = 0; r < Math.min(10, rawAoA.length); r++) {
        const rowStr = rawAoA[r].map((cell: any) => String(cell).toLowerCase()).join(' ');
        if (
          rowStr.includes('ชื่อ') || 
          rowStr.includes('name') || 
          rowStr.includes('รหัส') || 
          rowStr.includes('code') ||
          rowStr.includes('gfmis')
        ) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = rawAoA[headerRowIndex].map((h: any) => String(h).trim());
      setDetectedColumns(headers.filter(Boolean));

      // Map to dictionaries
      const dictRows: Record<string, any>[] = [];
      for (let i = headerRowIndex + 1; i < rawAoA.length; i++) {
        const rowData = rawAoA[i];
        if (!rowData || rowData.every((c: any) => String(c).trim() === '')) continue;
        
        const obj: Record<string, any> = {};
        headers.forEach((hdr: string, colIdx: number) => {
          if (!hdr) return;
          const val = rowData[colIdx];
          obj[hdr] = val;

          // Normalized key mapping
          const normHdr = hdr.toLowerCase();
          if (normHdr.includes('รหัสครุภัณฑ์') || normHdr.includes('asset code') || normHdr === 'code') obj.code = val;
          else if (normHdr.includes('gfmis')) obj.gfmisCode = val;
          else if (normHdr.includes('ซีเรียล') || normHdr.includes('serial') || normHdr.includes('s/n')) obj.serialNumber = val;
          else if (normHdr.includes('ชื่อ') || normHdr.includes('name') || normHdr.includes('รายการ')) obj.name = val;
          else if (normHdr.includes('ยี่ห้อ') || normHdr.includes('brand')) obj.brand = val;
          else if (normHdr.includes('รุ่น') || normHdr.includes('model')) obj.model = val;
          else if (normHdr.includes('หมวด') || normHdr.includes('category')) obj.category = val;
          else if (normHdr.includes('แผนก') || normHdr.includes('หน่วยงาน') || normHdr.includes('dept')) obj.department = val;
          else if (normHdr.includes('สถานที่') || normHdr.includes('ตำแหน่ง') || normHdr.includes('location')) obj.locationDetail = val;
          else if (normHdr.includes('คุณลักษณะ') || normHdr.includes('spec')) obj.specification = val;
          else if (normHdr.includes('ความสำคัญ') || normHdr.includes('crit')) obj.criticality = val;
          else if (normHdr.includes('สถานะ') || normHdr.includes('status')) obj.status = val;
          else if (normHdr.includes('ราคา') || normHdr.includes('price')) obj.price = val;
          else if (normHdr.includes('จำนวน') || normHdr.includes('qty')) obj.quantity = val;
          else if (normHdr.includes('หน่วยนับ') || normHdr.includes('unit')) obj.unit = val;
          else if (normHdr.includes('ประเภทเงิน') || normHdr.includes('เงิน') || normHdr.includes('funding')) obj.fundingSource = val;
          else if (normHdr.includes('วิธีการได้มา') || normHdr.includes('วิธี') || normHdr.includes('acquisition')) obj.acquisitionMethod = val;
          else if (normHdr.includes('ที่เอกสาร') || normHdr.includes('doc')) obj.documentNo = val;
          else if (normHdr.includes('วันที่') || normHdr.includes('ตรวจรับ') || normHdr.includes('date')) obj.acquisitionDate = val;
          else if (normHdr.includes('ประกัน') || normHdr.includes('warranty')) obj.warrantyExpiry = val;
          else if (normHdr.includes('ผู้ขาย') || normHdr.includes('vendor')) obj.vendor = val;
          else if (normHdr.includes('โทร') || normHdr.includes('phone') || normHdr.includes('tel')) obj.vendorPhone = val;
        });
        dictRows.push(obj);
      }

      setProcessingStatus(`ตรวจพบข้อมูลทั้งหมด ${dictRows.length} รายการจากแผ่นงาน "${sheetName}"`);
      const built = buildAssetsFromDicts(dictRows);
      setParsedRows(built);
    } catch (err: any) {
      console.error('[Excel Import Error]:', err);
      setParseErrors([`เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ${err?.message || 'ไฟล์อาจเสียหายหรือไม่ตรงฟอร์แมต'}`]);
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Process PDF File (.pdf)
  const processPdfBuffer = async (buffer: ArrayBuffer) => {
    try {
      setProcessingStatus('กำลังแยกวิเคราะห์ข้อความและตารางจากเอกสาร PDF...');
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;

      const numPages = pdf.numPages;
      const extractedLines: string[] = [];

      for (let p = 1; p <= numPages; p++) {
        setProcessingStatus(`กำลังอ่านหน้าเอกสาร PDF ที่ ${p} จาก ${numPages} หน้า...`);
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (!items || items.length === 0) continue;

        // Sort items: Top-to-bottom (Y descending), then Left-to-right (X ascending)
        items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 5) return yDiff;
          return a.transform[4] - b.transform[4];
        });

        let currentY: number | null = null;
        let currentLine = '';

        for (const item of items) {
          const str = item.str || '';
          if (!str.trim() && !currentLine) continue;
          const y = item.transform[5];

          if (currentY === null || Math.abs(currentY - y) > 5) {
            if (currentLine.trim()) extractedLines.push(currentLine.trim());
            currentLine = str;
            currentY = y;
          } else {
            currentLine += (currentLine.endsWith(' ') || str.startsWith(' ') ? '' : '\t') + str;
          }
        }
        if (currentLine.trim()) extractedLines.push(currentLine.trim());
      }

      if (extractedLines.length === 0) {
        setParseErrors(['ไม่พบข้อความที่สามารถอ่านได้ในไฟล์ PDF (อาจเป็นไฟล์สแกนแบบรูปภาพ กรุณาใช้ไฟล์ Excel หรือ CSV)']);
        setParsedRows([]);
        return;
      }

      // Process extracted lines into asset dictionaries
      const dictRows: Record<string, any>[] = [];
      const lines = extractedLines;

      // Check if lines contain tabular tab/comma separated structure
      let headerFound = false;
      let headers: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // Check if header
        if (!headerFound && (lower.includes('รหัส') || lower.includes('ชื่อครุภัณฑ์') || lower.includes('name') || lower.includes('code'))) {
          headerFound = true;
          headers = line.split(/[\t,|;]+/).map(h => h.trim());
          setDetectedColumns(headers.filter(Boolean));
          continue;
        }

        // If header was found, split row by same delimiters
        if (headerFound && headers.length > 0) {
          const parts = line.split(/[\t|;,]+/).map(p => p.trim());
          if (parts.length >= 2) {
            const obj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              if (parts[idx]) {
                obj[h] = parts[idx];
                const normHdr = h.toLowerCase();
                if (normHdr.includes('รหัส')) obj.code = parts[idx];
                else if (normHdr.includes('ชื่อ')) obj.name = parts[idx];
                else if (normHdr.includes('ยี่ห้อ')) obj.brand = parts[idx];
                else if (normHdr.includes('รุ่น')) obj.model = parts[idx];
                else if (normHdr.includes('แผนก')) obj.department = parts[idx];
                else if (normHdr.includes('หมวด')) obj.category = parts[idx];
                else if (normHdr.includes('ราคา')) obj.price = parts[idx];
              }
            });
            if (obj.name || obj['ชื่อ'] || obj.code) {
              dictRows.push(obj);
              continue;
            }
          }
        }

        // Fallback: Smart Pattern Matcher for line items in PDF reports
        // Matches e.g. "SK-MD-67-0012 เครื่องตรวจคลื่นไฟฟ้าหัวใจ EKG Philips PageWriter 5. อุบัติเหตุฉุกเฉิน 180,000"
        const codeMatch = line.match(/(SK-[A-Z]{2,4}-\d{2}-\d{3,5}|[A-Za-z0-9\-]{6,})/);
        const priceMatch = line.match(/([\d,]{4,10})\s*(บาท|฿)?/);

        if (codeMatch && line.length > 15) {
          const code = codeMatch[1];
          let remainder = line.replace(code, '').trim();
          let price = 50000;
          if (priceMatch) {
            price = Number(priceMatch[1].replace(/,/g, '')) || 50000;
            remainder = remainder.replace(priceMatch[0], '').trim();
          }

          // Search department in remainder
          let matchedDept = defaultDepartment;
          for (const d of HOSPITAL_DEPARTMENTS) {
            if (d === 'ทั้งหมด') continue;
            const core = d.replace(/^\d+\.\s*/, '');
            if (remainder.includes(core)) {
              matchedDept = d;
              remainder = remainder.replace(core, '').trim();
              break;
            }
          }

          const name = remainder.length > 3 ? remainder : `ครุภัณฑ์นำเข้าจาก PDF (${code})`;
          dictRows.push({
            code,
            name,
            price,
            department: matchedDept,
            category: mapCategory(name)
          });
        }
      }

      if (dictRows.length === 0) {
        setParseErrors([
          'ไม่สามารถจัดกลุ่มข้อมูลครุภัณฑ์จากไฟล์ PDF ได้โดยตรง',
          'คำแนะนำ: กรุณาใช้ไฟล์แม่แบบ Microsoft Excel (.xlsx) หรือ CSV ที่ระบบจัดเตรียมไว้เพื่อความสมบูรณ์ 100%'
        ]);
        setParsedRows([]);
        return;
      }

      setProcessingStatus(`ตรวจพบข้อมูลครุภัณฑ์ทั้งหมด ${dictRows.length} รายการจากเอกสาร PDF`);
      const built = buildAssetsFromDicts(dictRows);
      setParsedRows(built);
    } catch (err: any) {
      console.error('[PDF Import Error]:', err);
      setParseErrors([`เกิดข้อผิดพลาดในการอ่านไฟล์ PDF: ${err?.message || 'ไม่สามารถประมวลผลไฟล์ PDF ได้'}`]);
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Process CSV or TSV text
  const processRawText = (text: string) => {
    setParseErrors([]);
    setParseWarnings([]);
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
          const built = buildAssetsFromDicts(json);
          setParsedRows(built);
          return;
        }
      } catch (e) {
        // Not JSON, continue to CSV
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

    const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim());
    setDetectedColumns(headers.filter(Boolean));

    const dictRows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = parseCSVLine(line, delimiter);
      const obj: Record<string, any> = {};

      headers.forEach((hdr, colIdx) => {
        const val = cols[colIdx] || '';
        obj[hdr] = val;
        const normHdr = hdr.toLowerCase();
        if (normHdr.includes('รหัสครุภัณฑ์') || normHdr.includes('asset code') || normHdr === 'code') obj.code = val;
        else if (normHdr.includes('gfmis')) obj.gfmisCode = val;
        else if (normHdr.includes('ซีเรียล') || normHdr.includes('serial') || normHdr.includes('s/n')) obj.serialNumber = val;
        else if (normHdr.includes('ชื่อ') || normHdr.includes('name') || normHdr.includes('รายการ')) obj.name = val;
        else if (normHdr.includes('ยี่ห้อ') || normHdr.includes('brand')) obj.brand = val;
        else if (normHdr.includes('รุ่น') || normHdr.includes('model')) obj.model = val;
        else if (normHdr.includes('หมวด') || normHdr.includes('category')) obj.category = val;
        else if (normHdr.includes('แผนก') || normHdr.includes('หน่วยงาน') || normHdr.includes('dept')) obj.department = val;
        else if (normHdr.includes('สถานที่') || normHdr.includes('ตำแหน่ง') || normHdr.includes('location')) obj.locationDetail = val;
        else if (normHdr.includes('คุณลักษณะ') || normHdr.includes('spec')) obj.specification = val;
        else if (normHdr.includes('ความสำคัญ') || normHdr.includes('crit')) obj.criticality = val;
        else if (normHdr.includes('สถานะ') || normHdr.includes('status')) obj.status = val;
        else if (normHdr.includes('ราคา') || normHdr.includes('price')) obj.price = val;
        else if (normHdr.includes('จำนวน') || normHdr.includes('qty')) obj.quantity = val;
        else if (normHdr.includes('หน่วยนับ') || normHdr.includes('unit')) obj.unit = val;
        else if (normHdr.includes('ประเภทเงิน') || normHdr.includes('เงิน') || normHdr.includes('funding')) obj.fundingSource = val;
        else if (normHdr.includes('วิธีการได้มา') || normHdr.includes('วิธี') || normHdr.includes('acquisition')) obj.acquisitionMethod = val;
        else if (normHdr.includes('ที่เอกสาร') || normHdr.includes('doc')) obj.documentNo = val;
        else if (normHdr.includes('วันที่') || normHdr.includes('ตรวจรับ') || normHdr.includes('date')) obj.acquisitionDate = val;
        else if (normHdr.includes('ประกัน') || normHdr.includes('warranty')) obj.warrantyExpiry = val;
        else if (normHdr.includes('ผู้ขาย') || normHdr.includes('vendor')) obj.vendor = val;
        else if (normHdr.includes('โทร') || normHdr.includes('phone') || normHdr.includes('tel')) obj.vendorPhone = val;
      });
      dictRows.push(obj);
    }

    const built = buildAssetsFromDicts(dictRows);
    setParsedRows(built);
  };

  // Dispatch File Handler
  const handleIncomingFile = async (file: File) => {
    setFileName(file.name);
    setParseErrors([]);
    setParseWarnings([]);
    setParsedRows([]);
    setIsProcessing(true);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      setFileTypeDetected('excel');
      setProcessingStatus('กำลังอ่านข้อมูลสเปรดชีต Excel...');
      const buffer = await file.arrayBuffer();
      await processExcelBuffer(buffer);
    } else if (ext === 'pdf') {
      setFileTypeDetected('pdf');
      setProcessingStatus('กำลังเริ่มการอ่านเอกสาร PDF...');
      const buffer = await file.arrayBuffer();
      await processPdfBuffer(buffer);
    } else if (ext === 'json') {
      setFileTypeDetected('json');
      setProcessingStatus('กำลังอ่านไฟล์ JSON...');
      const text = await file.text();
      setRawText(text);
      processRawText(text);
      setIsProcessing(false);
    } else {
      // CSV, TSV, TXT
      setFileTypeDetected('csv');
      setProcessingStatus('กำลังอ่านข้อความ CSV/TSV...');
      const text = await file.text();
      setRawText(text);
      processRawText(text);
      setIsProcessing(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleIncomingFile(file);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleIncomingFile(file);
    }
  };

  // -------------------------------------------------------------
  // Template Download Handlers (Excel, PDF, CSV)
  // -------------------------------------------------------------

  // 1. Download Official Excel Template (.xlsx)
  const handleDownloadExcelTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: ทะเบียนคุมครุภัณฑ์ (สธ.)
    const headers = [
      'รหัสครุภัณฑ์ (Asset Code)*',
      'รหัส GFMIS',
      'หมายเลขซีเรียล (S/N)',
      'ชื่อครุภัณฑ์ (Asset Name)*',
      'ยี่ห้อ (Brand)',
      'รุ่น (Model)',
      'หมวดหมู่ครุภัณฑ์ (13 หมวด สธ.)*',
      'แผนกผู้รับผิดชอบ (17 แผนก รพ.สังขละบุรี)*',
      'สถานที่ติดตั้ง/ตำแหน่งเฉพาะ (Location)',
      'คุณลักษณะเฉพาะ/สเปก (Specification)',
      'ความสำคัญ (วิกฤตช่วยชีวิต / ความเสี่ยงสูง / ทั่วไป)',
      'สถานะ (พร้อมใช้งาน / กำลังซ่อมบำรุง / รออะไหล่ / ส่งซ่อมศูนย์ / ปลดระวาง)',
      'ราคาต่อหน่วย (บาท)*',
      'จำนวน (หน่วย)',
      'หน่วยนับ',
      'ประเภทเงิน (เงินงบประมาณ / เงินนอกงบประมาณ / เงินบริจาค / อื่นๆ)',
      'วิธีการได้มา (เฉพาะเจาะจง / สอบราคา / ประกวดราคา / วิธีพิเศษ / บริจาค)',
      'ที่เอกสารจัดซื้อ/ตรวจรับ',
      'วันที่ตรวจรับ (วว/ดด/ปปปป หรือ YYYY-MM-DD)',
      'วันสิ้นสุดประกัน (YYYY-MM-DD)',
      'ชื่อผู้ขาย/ผู้บริจาค',
      'เบอร์โทรศัพท์ผู้ขาย'
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
        'ความเสี่ยงสูง',
        'พร้อมใช้งาน',
        95000,
        1,
        'เครื่อง',
        'เงินงบประมาณ',
        'เฉพาะเจาะจง',
        'กจ 0032.2/142/2567',
        '2024-05-15',
        '2026-05-15',
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
        'ทั่วไป',
        'พร้อมใช้งาน',
        42000,
        1,
        'เครื่อง',
        'เงินนอกงบประมาณ (เงินบำรุง)',
        'เฉพาะเจาะจง',
        'กจ 0032.2/215/2567',
        '2024-06-20',
        '2025-06-20',
        'หจก. กาญจนบุรี คูลลิ่ง แอนด์ ซัพพลาย',
        '034-511-998'
      ],
      [
        'SK-IT-67-0055',
        '11050200-67-0055',
        'SN-DELL-OPT-7090',
        'เครื่องคอมพิวเตอร์ประมวลผลงานระบบสารสนเทศโรงพยาบาล (HIS Client)',
        'Dell',
        'OptiPlex 7090 MFF',
        '2. ครุภัณฑ์คอมพิวเตอร์และระบบสารสนเทศ',
        '17. สารสนเทศ',
        'จุดบริการเชื่อมต่อเครือข่าย HIS ชั้น 1',
        'Intel Core i7, RAM 16GB, SSD 512GB NVMe, จอ LED 23.8 นิ้ว',
        'ทั่วไป',
        'พร้อมใช้งาน',
        35000,
        2,
        'เครื่อง',
        'เงินงบประมาณ',
        'เฉพาะเจาะจง',
        'กจ 0032.2/310/2567',
        '2024-07-10',
        '2027-07-10',
        'บริษัท ไอที โซลูชั่น ซิสเต็มส์ จำกัด',
        '034-512-888'
      ],
      [
        'SK-LB-67-0014',
        '11050500-67-0014',
        'SN-SYSMEX-XN350',
        'เครื่องวิเคราะห์เซลล์เม็ดเลือดอัตโนมัติ (Automated Hematology Analyzer)',
        'Sysmex',
        'XN-350',
        '5. ครุภัณฑ์วิทยาศาสตร์และการแพทย์',
        '6. ชันสูตรสาธารณสุข',
        'ห้องปฏิบัติการโลหิตวิทยา (Hematology Lab)',
        'วิเคราะห์ CBC 5-part diff 60 ตัวอย่าง/ชม. พร้อมระบบล้างอัตโนมัติ',
        'วิกฤตช่วยชีวิต',
        'พร้อมใช้งาน',
        680000,
        1,
        'ชุด',
        'เงินงบประมาณ',
        'ประกวดราคา',
        'กจ 0032.2/411/2567',
        '2024-03-25',
        '2027-03-25',
        'บริษัท ซิสเมกซ์ (ไทยแลนด์) จำกัด',
        '02-032-2888'
      ],
      [
        'SK-VH-67-0003',
        '11050400-67-0003',
        'SN-TOY-COMMUTER-EMS',
        'รถพยาบาลฉุกเฉินระดับสูงพร้อมอุปกรณ์ช่วยชีวิต (EMS Ambulance)',
        'Toyota',
        'Commuter 2.8 D4D',
        '4. ครุภัณฑ์ยานพาหนะและขนส่ง',
        '5. อุบัติเหตุฉุกเฉิน',
        'ลานจอดรถฉุกเฉิน ER อาคารอุบัติเหตุ',
        'ระบบไฟฉุกเฉิน LED, สัญญาณไซเรน, ถังออกซิเจนท่อคู่, เครื่องกระตุกหัวใจ AED',
        'วิกฤตช่วยชีวิต',
        'พร้อมใช้งาน',
        2450000,
        1,
        'คัน',
        'เงินงบประมาณ',
        'ประกวดราคา',
        'กจ 0032.2/502/2567',
        '2024-01-10',
        '2029-01-10',
        'บริษัท โตโยต้าเมืองกาญจน์ จำกัด',
        '034-513-111'
      ]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    // Configure column widths
    ws1['!cols'] = [
      { wch: 18 }, // code
      { wch: 18 }, // gfmis
      { wch: 20 }, // serial
      { wch: 45 }, // name
      { wch: 15 }, // brand
      { wch: 18 }, // model
      { wch: 32 }, // category
      { wch: 26 }, // department
      { wch: 30 }, // location
      { wch: 45 }, // spec
      { wch: 16 }, // criticality
      { wch: 16 }, // status
      { wch: 16 }, // price
      { wch: 10 }, // qty
      { wch: 10 }, // unit
      { wch: 22 }, // funding
      { wch: 18 }, // acq method
      { wch: 22 }, // doc no
      { wch: 14 }, // acq date
      { wch: 14 }, // warranty
      { wch: 36 }, // vendor
      { wch: 16 }  // phone
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'ทะเบียนคุมครุภัณฑ์_สธ');

    // Sheet 2: รายชื่อ 13 หมวดหมู่ สธ.
    const catHeaders = ['รหัสระบบ (Category Key)', 'หมายเลขหมวด', 'ชื่อหมวดหมู่ตามมาตรฐาน สธ.', 'ตัวอย่างครุภัณฑ์ในหมวดนี้'];
    const catRows = ASSET_CATEGORIES_CONFIG.map(c => [
      c.id,
      c.label.split('.')[0]?.trim() || '',
      c.label,
      c.id === 'medical_health' ? 'เครื่องวัดความดัน, เครื่องกระตุกหัวใจ, เครื่องช่วยหายใจ, เตียงผ่าตัด' :
      c.id === 'computer_it' ? 'คอมพิวเตอร์, เซิร์ฟเวอร์, สวิตช์เครือข่าย, จอภาพ, เครื่องพิมพ์' :
      c.id === 'hvac_aircon' ? 'เครื่องปรับอากาศแยกส่วน, ระบบ VRV, พัดลมดูดอากาศแรงดันลบ' :
      c.id === 'vehicle_transport' ? 'รถพยาบาลฉุกเฉิน, รถกระบะส่งต่อ, รถยนต์ส่วนกลาง' :
      c.id === 'science_lab' ? 'เครื่องปั่นเหวี่ยง, กล้องจุลทรรศน์, ตู้บ่มเชื้อ, เครื่องวิเคราะห์สารเคมี' :
      c.id === 'electrical_telecom' ? 'เครื่องกำเนิดไฟฟ้าสำรอง (Generator), วิทยุสื่อสาร VHF, UPS ขนาดใหญ่' :
      c.id === 'factory_engineering' ? 'หม้อต้มไอน้ำ (Boiler), เครื่องนึ่งฆ่าเชื้อ Autoclave, ปั๊มน้ำแรงดัน' :
      c.id === 'office_furniture' ? 'โต๊ะตรวจโรค, ตู้เก็บเวชระเบียนเหล็ก, เก้าอี้สำนักงาน' :
      c.id === 'housekeeping_laundry' ? 'เครื่องซักผ้าอุตสาหกรรม, เครื่องอบผ้า, ตู้เย็นเก็บอาหารผู้ป่วย' :
      c.id === 'agriculture_environ' ? 'ระบบบำบัดน้ำเสีย, เครื่องตัดหญ้า, เครื่องพ่นหมอกควันกำจัดยุง' :
      c.id === 'audiovisual_broadcast' ? 'เครื่องเสียงห้องประชุม, โปรเจกเตอร์, โทรทัศน์ประชาสัมพันธ์' :
      c.id === 'physical_therapy' ? 'เครื่องอัลตราซาวด์บำบัด, เครื่องกระตุ้นไฟฟ้ากล้ามเนื้อ, ราวหัดเดิน' :
      'เครื่องวัดระดับเลเซอร์, เครื่องสอบเทียบอุณหภูมิ, มัลติมิเตอร์วัดทางวิศวกรรม'
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
    ws2['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 38 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'รหัสหมวดหมู่_13หมวด');

    // Sheet 3: รายชื่อ 17 แผนก รพ.สังขละบุรี
    const deptHeaders = ['ลำดับ', 'ชื่อแผนกที่ใช้ในระบบ รพ.สังขละบุรี', 'ชั้น/สถานที่ตั้ง', 'ประเภทภารกิจ'];
    const deptRows = HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map((d, idx) => [
      idx + 1,
      d,
      idx < 5 ? 'อาคารผู้ป่วยนอก/อุบัติเหตุ ชั้น 1' : idx < 10 ? 'อาคารผู้ป่วยใน/สนับสนุน ชั้น 2' : 'อาคารบริการและบริหาร ชั้น 1-2',
      idx < 7 ? 'บริการทางการแพทย์และคลินิก' : idx < 12 ? 'บริการทางคลินิกเฉพาะทางและชันสูตร' : 'งานสนับสนุนบริการและบริหารจัดการ'
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([deptHeaders, ...deptRows]);
    ws3['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 35 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'รายชื่อแผนก_17แผนก');

    XLSX.writeFile(wb, 'ไฟล์แม่แบบนำเข้าทะเบียนครุภัณฑ์_สธ_รพ_สังขละบุรี.xlsx');
  };

  // 2. Download Official PDF Guideline & Structure Template (.pdf)
  const handleDownloadPdfTemplate = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [16, 120, 87]; // Emerald 700
    const darkColor = [15, 23, 42]; // Slate 900
    const grayColor = [100, 116, 139]; // Slate 500

    // Top Header Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('SANGKHLABURI HOSPITAL - CMMS & ASSET LEDGER', 14, 11);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Official MOPH Asset Data Import Structure & Guideline (Template Specification)', 14, 18);

    // Section 1: Overview
    let y = 35;
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Structure Specifications (22 Standard MOPH Fields)', 14, y);

    y += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(
      'The system automatically parses Microsoft Excel (.xlsx/.xls), PDF reports (.pdf), and CSV files matching the columns below:',
      14,
      y
    );

    // Table of Columns
    y += 6;
    const tableHeaders = ['#', 'Field / Column Name', 'Type / Format', 'Required', 'Description & Examples'];
    const colWidths = [10, 52, 32, 22, 66];

    // Draw header row
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let curX = 14;
    tableHeaders.forEach((th, idx) => {
      doc.text(th, curX + 2, y + 4.8);
      curX += colWidths[idx];
    });

    const columnsSpec = [
      ['1', 'code (Asset Code)', 'String (e.g. SK-MD-67-001)', 'Yes*', 'Official Hospital Asset Code'],
      ['2', 'gfmisCode (GFMIS Code)', 'String (e.g. 11050100-...)', 'Optional', 'Government Financial GFMIS Asset ID'],
      ['3', 'serialNumber (S/N)', 'String (e.g. SN-88410)', 'Recommended', 'Manufacturer Machine Serial Number'],
      ['4', 'name (Asset Name)', 'String (Thai / Eng)', 'Yes*', 'Full descriptive equipment name'],
      ['5', 'brand (Brand)', 'String (e.g. Philips, Dell)', 'Recommended', 'Manufacturer brand or maker'],
      ['6', 'model (Model)', 'String (e.g. SureSigns VM4)', 'Optional', 'Equipment model / series number'],
      ['7', 'category (Category)', '13 MOPH Categories', 'Yes*', '1.Medical, 2.IT, 3.AC, 4.Vehicle, etc.'],
      ['8', 'department (Department)', '17 Hospital Depts', 'Yes*', 'OPD, IPD, ER, Lab, Radiology, etc.'],
      ['9', 'locationDetail (Location)', 'String (Room / Bed / Floor)', 'Optional', 'Specific installation area or room'],
      ['10', 'specification (Spec)', 'String (Details / Spec)', 'Optional', 'Key technical specifications'],
      ['11', 'criticality (Risk Level)', 'life_support / high_risk / general', 'Optional', 'Criticality priority level'],
      ['12', 'status (Asset Status)', 'ready / in_repair / wait_parts', 'Optional', 'Default: ready (Active)'],
      ['13', 'price (Unit Price)', 'Numeric (THB currency)', 'Yes*', 'Unit acquisition purchase cost (THB)'],
      ['14', 'quantity (Quantity)', 'Numeric (Integer >= 1)', 'Optional', 'Default: 1 unit'],
      ['15', 'unit (Unit Name)', 'String (e.g. เครื่อง, ชุด, คัน)', 'Optional', 'Counting unit (เครื่อง, ชุด, ตัว)'],
      ['16', 'fundingSource (Funding)', 'budget / non_budget / donation', 'Optional', 'Budget source (งบประมาณ / เงินบำรุง)'],
      ['17', 'acquisitionMethod (Method)', 'specific / bidding / inquiry', 'Optional', 'Procurement method'],
      ['18', 'documentNo (Contract No)', 'String (e.g. กจ 0032.2/...)', 'Optional', 'Procurement PO or inspection doc no'],
      ['19', 'acquisitionDate (Date)', 'YYYY-MM-DD or DD/MM/YYYY', 'Optional', 'Acceptance / inspection date'],
      ['20', 'warrantyExpiry (Warranty)', 'YYYY-MM-DD', 'Optional', 'Manufacturer warranty expiry date'],
      ['21', 'vendor (Supplier)', 'Company Name', 'Optional', 'Supplier or authorized distributor'],
      ['22', 'vendorPhone (Phone)', 'Phone Number (02-xxx-xxxx)', 'Optional', 'Contact phone number for service']
    ];

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    columnsSpec.forEach((row, rowIdx) => {
      if (rowIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 5.5, 'F');
      }

      curX = 14;
      row.forEach((cell, cellIdx) => {
        doc.setTextColor(cellIdx === 3 && cell.includes('Yes') ? 180 : 50, cellIdx === 3 && cell.includes('Yes') ? 50 : 60, cellIdx === 3 && cell.includes('Yes') ? 50 : 70);
        if (cellIdx === 3 && cell.includes('Yes')) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');
        
        doc.text(String(cell), curX + 2, y + 3.8);
        curX += colWidths[cellIdx];
      });

      y += 5.5;
    });

    // Section 2: Instructions for Excel & PDF
    y += 6;
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. How to Prepare and Import Data', 14, y);

    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    
    const tips = [
      '• Excel (.xlsx / .xls): Recommended format. Download the official Excel template with 3 sheets for sample data and valid dropdown lists.',
      '• PDF (.pdf): The system extracts text lines and tabular rows automatically. Ensure the PDF has selectable text (not scanned images).',
      '• Column Matching: Column names can be in Thai or English synonyms. Unmatched optional fields receive automatic system defaults.',
      '• Live Synchronization: Imported assets are instantly saved to Firebase Cloud Firestore and synchronized across all hospital devices.'
    ];

    tips.forEach(tip => {
      doc.text(tip, 16, y);
      y += 4.2;
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Sangkhlaburi Hospital CMMS & Asset Ledger | ICT & Medical Engineering Department | Version 2.4.0', 14, 287);

    doc.save('คู่มือและโครงสร้างนำเข้าทะเบียนครุภัณฑ์_สธ_รพ_สังขละบุรี.pdf');
  };

  // 3. Download Standard CSV Template (.csv)
  const handleDownloadCsvTemplate = () => {
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
      'ความสำคัญ',
      'สถานะ',
      'ราคาต่อหน่วย',
      'จำนวน',
      'หน่วยนับ',
      'ประเภทเงิน',
      'วิธีการได้มา',
      'ที่เอกสารจัดซื้อ',
      'วันที่ตรวจรับ',
      'วันสิ้นสุดประกัน',
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
        'ความเสี่ยงสูง',
        'พร้อมใช้งาน',
        '95000',
        '1',
        'เครื่อง',
        'เงินงบประมาณ',
        'เฉพาะเจาะจง',
        'กจ 0032.2/142/2567',
        '2024-05-15',
        '2026-05-15',
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
        'ทั่วไป',
        'พร้อมใช้งาน',
        '42000',
        '1',
        'เครื่อง',
        'เงินนอกงบประมาณ (เงินบำรุง)',
        'เฉพาะเจาะจง',
        'กจ 0032.2/215/2567',
        '2024-06-20',
        '2025-06-20',
        'หจก. กาญจนบุรี คูลลิ่ง แอนด์ ซัพพลาย',
        '034-511-998'
      ]
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ไฟล์แม่แบบนำเข้าทะเบียนครุภัณฑ์_สธ_รพ_สังขละบุรี.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirm and Execute Import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    batchAddAssets(parsedRows);
    setImportedCount(parsedRows.length);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // Calculate summary stats
  const totalValuation = parsedRows.reduce((acc, row) => acc + (row.price * (row.quantity || 1)), 0);
  const uniqueDepts = Array.from(new Set(parsedRows.map(r => r.department))).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  นำเข้าข้อมูลทะเบียนครุภัณฑ์ (Asset Ledger Import)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  รองรับ Excel & PDF & CSV
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                นำเข้าข้อมูลสู่ทะเบียนคุมทรัพย์สิน 17 แผนก โรงพยาบาลสังขละบุรี เชื่อมฐานข้อมูล Firebase อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Downloads Bar */}
        <div className="bg-slate-800/90 text-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px]">ดาวน์โหลดไฟล์แม่แบบมาตรฐาน สธ. 22 ฟิลด์ เพื่อนำข้อมูลใส่และอัปโหลด:</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Excel */}
            <button
              onClick={handleDownloadExcelTemplate}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
              title="ดาวน์โหลดไฟล์สเปรดชีต Excel (.xlsx) ที่มี 3 แผ่นงาน พร้อมตัวอย่างและรายการหมวดหมู่/แผนก"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดแม่แบบ Excel (.xlsx)</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdfTemplate}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-700/80 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
              title="ดาวน์โหลดโครงสร้างและคู่มือสเปกแบบฟอร์ม PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>คู่มือ/เทมเพลต PDF (.pdf)</span>
            </button>

            {/* Download CSV */}
            <button
              onClick={handleDownloadCsvTemplate}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer"
              title="ดาวน์โหลดไฟล์ CSV (UTF-8)"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>แม่แบบ CSV (.csv)</span>
            </button>
          </div>
        </div>

        {/* Success Overlay Banner */}
        {isSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              นำเข้าข้อมูลทะเบียนครุภัณฑ์สำเร็จแล้ว!
            </h4>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              บันทึกครุภัณฑ์ใหม่จำนวน <strong className="text-emerald-700 text-sm">{importedCount} รายการ</strong> เข้าสู่ระบบทะเบียนคุมทรัพย์สิน สธ. และซิงค์ขึ้น Cloud Firebase เรียบร้อยแล้ว กำลังปิดหน้าต่าง...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            
            {/* Input Selection Tabs & Default Settings */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInputTab('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeInputTab === 'file' 
                      ? 'bg-emerald-700 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>อัปโหลดไฟล์ (Excel .xlsx, PDF, CSV)</span>
                </button>
                <button
                  onClick={() => setActiveInputTab('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeInputTab === 'paste' 
                      ? 'bg-emerald-700 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileType className="w-3.5 h-3.5" />
                  <span>วางข้อความตาราง (Paste Table / Text)</span>
                </button>
              </div>

              {/* Defaults config if file omits them */}
              <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium text-[11px]">แผนกเริ่มต้น:</span>
                  <select
                    value={defaultDepartment}
                    onChange={(e) => setDefaultDepartment(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] font-medium text-slate-800"
                  >
                    {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium text-[11px]">หมวดหมู่เริ่มต้น:</span>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value as AssetCategory)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] font-medium text-slate-800"
                  >
                    {ASSET_CATEGORIES_CONFIG.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
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
                  className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                    dragOver 
                      ? 'border-emerald-500 bg-emerald-50/70' 
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .pdf, .csv, .tsv, .txt, .json"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 shadow-2xs">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="p-3 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 shadow-2xs">
                      <FileCheck className="w-7 h-7" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'ลากไฟล์ Excel (.xlsx / .xls), PDF (.pdf), หรือ CSV มาวางที่นี่'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                      ระบบจะวิเคราะห์โครงสร้างข้อมูลและจับคู่คอลัมน์อัตโนมัติให้ตรงกับทะเบียนคุมทรัพย์สิน สธ. 22 ฟิลด์
                    </p>
                  </div>

                  {fileTypeDetected && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        ประเภทไฟล์ที่ตรวจพบ: {
                          fileTypeDetected === 'excel' ? 'Microsoft Excel Spreadsheet (.xlsx / .xls)' :
                          fileTypeDetected === 'pdf' ? 'Adobe PDF Document (.pdf)' :
                          fileTypeDetected === 'csv' ? 'Comma-Separated Values (.csv)' : 'JSON Data'
                        }
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="px-4 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
                  >
                    เลือกไฟล์จากคอมพิวเตอร์ / มือถือ
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Paste Raw CSV / Text */}
            {activeInputTab === 'paste' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  วางข้อความแถวข้อมูลที่คัดลอกจาก Excel, ตาราง PDF หรือไฟล์ข้อความ CSV:
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    processRawText(e.target.value);
                  }}
                  placeholder="รหัสครุภัณฑ์,รหัส GFMIS,ชื่อครุภัณฑ์,ยี่ห้อ,รุ่น,หมวดหมู่ครุภัณฑ์,แผนกผู้รับผิดชอบ,ราคาต่อหน่วย,จำนวน&#10;SK-MD-67-001,11050100-001,เครื่องวัดความดันโลหิตดิจิตอล,Omron,HBP-1320,1. ครุภัณฑ์การแพทย์และสาธารณสุข,3. ผู้ป่วยนอก,12000,1"
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin shrink-0" />
                <span className="font-medium">{processingStatus || 'กำลังประมวลผลข้อมูล...'}</span>
              </div>
            )}

            {/* Errors Notification */}
            {parseErrors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>ข้อผิดพลาดในการประมวลผลไฟล์:</span>
                </div>
                {parseErrors.map((err, idx) => (
                  <p key={idx} className="text-[11px] text-rose-700 pl-5">• {err}</p>
                ))}
              </div>
            )}

            {/* Warnings Notification */}
            {parseWarnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>คำเตือน ({parseWarnings.length} รายการ):</span>
                </div>
                {parseWarnings.slice(0, 3).map((warn, idx) => (
                  <p key={idx} className="text-[11px] text-amber-700 pl-5">• {warn}</p>
                ))}
                {parseWarnings.length > 3 && (
                  <p className="text-[10px] text-amber-600 pl-5 italic">...และอีก {parseWarnings.length - 3} คำเตือน</p>
                )}
              </div>
            )}

            {/* Detected Columns Mapping Tags */}
            {detectedColumns.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    คอลัมน์ที่ตรวจพบในไฟล์ ({detectedColumns.length} คอลัมน์):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    จับคู่กับเทมเพลตมาตรฐาน สธ. เรียบร้อย
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {detectedColumns.map((col, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                    >
                      ✓ {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary KPI Cards when rows parsed */}
            {parsedRows.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">
                    จำนวนครุภัณฑ์ที่พบ
                  </span>
                  <p className="text-xl font-black text-emerald-950 mt-0.5">
                    {parsedRows.length.toLocaleString()} <span className="text-xs font-normal">รายการ</span>
                  </p>
                </div>

                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-sky-800 uppercase tracking-wide">
                    มูลค่ารวมทั้งสิ้น
                  </span>
                  <p className="text-xl font-black text-sky-950 mt-0.5">
                    {totalValuation.toLocaleString()} <span className="text-xs font-normal">บาท</span>
                  </p>
                </div>

                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-purple-800 uppercase tracking-wide">
                    แผนกที่เกี่ยวข้อง
                  </span>
                  <p className="text-xl font-black text-purple-950 mt-0.5">
                    {uniqueDepts.length} <span className="text-xs font-normal">แผนก</span>
                  </p>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">
                    สถานะการตรวจสอบ
                  </span>
                  <p className="text-sm font-bold text-amber-900 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    พร้อมนำเข้าสู่ระบบ
                  </p>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">
                      ตัวอย่างข้อมูลที่พร้อมนำเข้า (แสดง {Math.min(parsedRows.length, 10)} จาก {parsedRows.length} รายการ)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    ข้อมูลจะถูกบันทึกลง Cloud Firestore ทันทีเมื่อกดยืนยัน
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">รหัสครุภัณฑ์</th>
                        <th className="py-2 px-3">ชื่อครุภัณฑ์</th>
                        <th className="py-2 px-3">ยี่ห้อ / รุ่น</th>
                        <th className="py-2 px-3">หมวดหมู่</th>
                        <th className="py-2 px-3">แผนกผู้รับผิดชอบ</th>
                        <th className="py-2 px-3 text-right">ราคาต่อหน่วย</th>
                        <th className="py-2 px-3 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {row.code}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate" title={row.name}>
                            {row.name}
                          </td>
                          <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                            {row.brand} {row.model !== '-' ? row.model : ''}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {ASSET_CATEGORIES_CONFIG.find(c => c.id === row.category)?.label.slice(0, 18) || row.category}...
                          </td>
                          <td className="py-2 px-3 text-emerald-800 font-semibold text-[11px] whitespace-nowrap">
                            {row.department}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-800 font-semibold whitespace-nowrap">
                            {row.price.toLocaleString()} ฿
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {row.status === 'ready' ? 'พร้อมใช้งาน' : row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedRows.length > 10 && (
                  <p className="text-[11px] text-slate-500 text-center italic pt-1">
                    ... และอีก {parsedRows.length - 10} รายการที่จะถูกบันทึกพร้อมกัน
                  </p>
                )}
              </div>
            )}

          </div>
        )}

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-600">
              {parsedRows.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  พร้อมนำเข้า <strong>{parsedRows.length.toLocaleString()} รายการ</strong> (มูลค่ารวม {totalValuation.toLocaleString()} บาท)
                </span>
              ) : (
                <span className="text-slate-400">ยังไม่มีข้อมูลที่ตรวจพบ กรุณาเลือกไฟล์ Excel, PDF หรือ CSV</span>
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
                disabled={parsedRows.length === 0 || isProcessing}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>ยืนยันนำเข้าข้อมูลสู่ระบบ ({parsedRows.length.toLocaleString()} รายการ)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
