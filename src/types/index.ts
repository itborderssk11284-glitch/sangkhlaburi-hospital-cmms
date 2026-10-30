export type AssetCategory = 
  | 'medical_health'        // 1. ครุภัณฑ์การแพทย์และสาธารณสุข
  | 'computer_it'           // 2. ครุภัณฑ์คอมพิวเตอร์และระบบสารสนเทศ
  | 'hvac_aircon'           // 3. ครุภัณฑ์ปรับอากาศและระบายอากาศ
  | 'vehicle_transport'     // 4. ครุภัณฑ์ยานพาหนะและขนส่ง
  | 'science_lab'           // 5. ครุภัณฑ์วิทยาศาสตร์และการแพทย์
  | 'electrical_telecom'    // 6. ครุภัณฑ์ไฟฟ้า วิทยุสื่อสาร และพลังงานสำรอง
  | 'factory_engineering'   // 7. ครุภัณฑ์โรงงานและวิศวกรรมอาคาร
  | 'office_furniture'      // 8. ครุภัณฑ์สำนักงาน
  | 'housekeeping_laundry'  // 9. ครุภัณฑ์งานบ้านงานครัวและซักฟอก
  | 'agriculture_environ'   // 10. ครุภัณฑ์การเกษตรและสิ่งแวดล้อม/บำบัดน้ำเสีย
  | 'audiovisual_broadcast' // 11. ครุภัณฑ์โฆษณาและเผยแพร่
  | 'physical_therapy'      // 12. ครุภัณฑ์กายภาพบำบัดและฟื้นฟู
  | 'survey_measurement';   // 13. ครุภัณฑ์สำรวจและมาตรวิทยา

export type CriticalityLevel = 'life_support' | 'high_risk' | 'general';

export type AssetStatus = 
  | 'ready'         // พร้อมใช้งาน
  | 'in_repair'     // กำลังซ่อมบำรุง
  | 'wait_parts'    // รออะไหล่
  | 'external'      // ส่งซ่อมภายนอก/ศูนย์
  | 'decommission';   // ปลดระวาง

export type FundingSource = 'budget' | 'non_budget' | 'donation' | 'other';
export type AcquisitionMethod = 'specific' | 'inquiry' | 'bidding' | 'special' | 'donation';

export interface DepreciationHistoryEntry {
  fiscalYear: string;         // ปีงบประมาณ เช่น 2567
  date: string;               // วัน เดือน ปี
  documentNo: string;         // ที่เอกสาร
  description: string;        // รายการ
  quantity: number;           // จำนวน (หน่วย)
  unitPrice: number;          // ราคาต่อหน่วย
  totalPrice: number;         // มูลค่ารวม
  usefulLifeYears: number;    // อายุใช้งาน (ปี)
  depreciationRate: number;   // อัตราค่าเสื่อมราคา (%)
  annualDepreciation: number; // ค่าเสื่อมราคาประจำปี
  accumulatedDepreciation: number; // ค่าเสื่อมราคาสะสม
  netBookValue: number;       // มูลค่าสุทธิ (บาท)
  remarks: string;            // หมายเหตุ
}

export interface Asset {
  id: string;
  code: string;            // รหัสครุภัณฑ์ เช่น SK-MD-65-0012
  gfmisCode: string;       // รหัส GFMIS เช่น 11050100-65-0012
  serialNumber: string;    // S/N / ลักษณะเฉพาะ
  name: string;            // ชื่อครุภัณฑ์
  brand: string;           // ยี่ห้อ
  model: string;           // รุ่น/แบบ
  category: AssetCategory;
  department: string;      // สถานที่ตั้ง/หน่วยงานผู้รับผิดชอบ
  locationDetail: string;  // ตำแหน่งเฉพาะ
  specification: string;   // ลักษณะ/คุณสมบัติ
  criticality: CriticalityLevel;
  status: AssetStatus;
  
  // ข้อมูลตามฟอร์มทะเบียนคุมทรัพย์สิน สธ.
  fundingSource: FundingSource;           // ประเภทเงิน (งบประมาณ, นอกงบประมาณ, บริจาค, อื่นๆ)
  fundingSourceOtherDetail?: string;
  acquisitionMethod: AcquisitionMethod;   // วิธีการได้มา (เฉพาะเจาะจง, สอบราคา, ประกวดราคา, วิธีพิเศษ, รับบริจาค)
  documentNo: string;                     // ที่เอกสารจัดซื้อ/ตรวจรับ เช่น กจ 0032.2/2565
  acquisitionDate: string;                // วัน เดือน ปี ที่ได้รับ
  quantity: number;                       // จำนวน (หน่วย)
  unit: string;                           // หน่วยนับ เช่น เครื่อง, ชุด, ระบบ
  price: number;                          // ราคาต่อหน่วย/ชุด
  totalPrice: number;                     // มูลค่ารวม (บาท)
  usefulLifeYears: number;                // อายุใช้งาน (ปี)
  depreciationRatePercent: number;        // อัตราค่าเสื่อมราคา (%)
  annualDepreciation: number;             // ค่าเสื่อมราคาประจำปี (บาท)
  accumulatedDepreciation: number;        // ค่าเสื่อมราคาสะสม (บาท)
  netBookValue: number;                   // มูลค่าสุทธิคงเหลือ (บาท)
  
  // ผู้จำหน่ายและสถานที่
  vendor: string;                         // ชื่อผู้ขาย/ผู้รับจ้าง/ผู้บริจาค
  vendorAddress: string;                  // ที่อยู่
  vendorPhone: string;                    // โทรศัพท์
  warrantyExpiry: string;                 // วันสิ้นสุดประกัน

  // งานบำรุงรักษา PM & แอร์
  lastPMDate: string;
  nextPMDate: string;
  pmFrequencyMonths: number;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  imageUrl?: string;
  expectedLifeYears?: number;

  // กรณีแอร์
  btu?: number;
  acType?: 'split' | 'cassette' | 'vrv' | 'package' | 'inverter';
  lastCleanedDate?: string;
  nextCleanDate?: string;
  cleaningFrequencyMonths?: number;

  // ตารางประวัติการตัดค่าเสื่อมราคารายปี
  depreciationHistory?: DepreciationHistoryEntry[];
}

export type PriorityLevel = 'emergency' | 'urgent' | 'normal';

export type WorkOrderStatus = 
  | 'pending'       // รอดำเนินการรับเรื่อง
  | 'assigned'      // รับงาน/มอบหมายแล้ว
  | 'in_progress'   // กำลังปฏิบัติงานซ่อม
  | 'waiting_parts' // รออะไหล่
  | 'external'      // ส่งซ่อมภายนอก
  | 'testing'       // รอทดสอบ/ตรวจรับ
  | 'completed'     // ซ่อมเสร็จสมบูรณ์
  | 'cancelled';    // ยกเลิก

export interface UsedPart {
  partId: string;
  partName: string;
  partCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;    // เลขที่ใบแจ้งซ่อม เช่น WO-2026-0089
  assetId: string;
  assetCode: string;
  assetName: string;
  department: string;
  priority: PriorityLevel;
  status: WorkOrderStatus;
  symptom: string;        // อาการเสีย/ปัญหาที่พบ
  errorDetails?: string;  // รายละเอียดความผิดปกติเพิ่มเติม
  reporterName: string;   // ชื่อผู้แจ้งซ่อม
  reporterPhone: string;  // เบอร์ติดต่อผู้แจ้ง
  reportDate: string;     // วันเวลาแจ้งซ่อม
  assignedTechId?: string;
  assignedTechName?: string;
  assignedDate?: string;
  repairStartDate?: string;
  repairEndDate?: string;
  rootCause?: string;     // สาเหตุของอาการเสีย
  actionTaken?: string;   // รายละเอียดการดำเนินการแก้ไข
  usedParts: UsedPart[];
  externalVendorName?: string;
  externalCost?: number;
  totalCost: number;      // รวมค่าอะไหล่ + ค่าจ้างภายนอก
  inspectorName?: string; // ผู้ตรวจรับงาน (หัวหน้าแผนกผู้ใช้)
  inspectionDate?: string;
  inspectionPassed?: boolean;
  notes?: string;
  photoUrl?: string;
}

export type PMStatus = 'scheduled' | 'passed' | 'failed' | 'overdue';

export interface PMRecord {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  department: string;
  type: 'pm' | 'calibration' | 'ac_cleaning';
  scheduledDate: string;
  completedDate?: string;
  technicianId?: string;
  technicianName?: string;
  status: PMStatus;
  deviationRate?: string;
  certificateNumber?: string;
  calibratedBy?: string;
  checklist: {
    item: string;
    passed: boolean;
    note?: string;
  }[];
  overallResult?: 'pass' | 'conditional_pass' | 'fail';
  notes?: string;
  nextScheduledDate: string;
  acDetails?: {
    btu?: number;
    filterWashed: boolean;
    indoorCoilCleaned: boolean;
    outdoorCoilCleaned: boolean;
    drainPipeFlushed: boolean;
    refrigerantPsi?: number;
    currentAmp?: number;
    cleanType: 'normal' | 'chemical_overhaul';
  };
}

export interface ReplacementIndicator {
  assetId: string;
  assetCode: string;
  assetName: string;
  department: string;
  category: AssetCategory;
  price: number;
  ageYears: number;
  expectedLifeYears: number;
  ageExceeded: boolean;
  repairCount: number;
  totalRepairCost: number;
  repairCostRatio: number;
  recommendation: 'urgent_replace' | 'watchlist' | 'good_condition';
  justificationReason: string;
}

export interface SparePart {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  unitPrice: number;
  location: string;
  supplier: string;
  lastRestockedDate: string;
}

export interface Technician {
  id: string;
  name: string;
  role: 'biomedical' | 'it' | 'facility' | 'medical_tech';
  roleTitle: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'leave';
  activeTicketsCount: number;
  completedTicketsCount: number;
  avatarColor: string;
}

export type UserRole = 'super_admin' | 'supervisor' | 'technician' | 'department_staff';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface SystemUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  roleName: string;
  department: string;
  phone: string;
  email: string;
  status: UserStatus;
  registeredDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  lastLogin?: string;
  permissions: string[];
}
