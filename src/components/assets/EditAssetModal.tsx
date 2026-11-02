import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Edit3, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Tag, 
  ShieldAlert, 
  Clock, 
  Wind, 
  DollarSign,
  Info
} from 'lucide-react';
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

export const EditAssetModal: React.FC<{
  asset: Asset;
  onClose: () => void;
}> = ({ asset, onClose }) => {
  const { updateAsset } = useApp();

  // Basic info
  const [code, setCode] = useState(asset.code || '');
  const [gfmisCode, setGfmisCode] = useState(asset.gfmisCode || '');
  const [serialNumber, setSerialNumber] = useState(asset.serialNumber || '');
  const [name, setName] = useState(asset.name || '');
  const [brand, setBrand] = useState(asset.brand || '');
  const [model, setModel] = useState(asset.model || '');
  const [category, setCategory] = useState<AssetCategory>(asset.category || 'medical_health');
  const [department, setDepartment] = useState(asset.department || '5. อุบัติเหตุฉุกเฉิน');
  const [locationDetail, setLocationDetail] = useState(asset.locationDetail || '');
  const [specification, setSpecification] = useState(asset.specification || '');
  const [criticality, setCriticality] = useState<CriticalityLevel>(asset.criticality || 'general');
  const [status, setStatus] = useState<AssetStatus>(asset.status || 'ready');

  // MOPH Financial & Procurement
  const [fundingSource, setFundingSource] = useState<FundingSource>(asset.fundingSource || 'budget');
  const [acquisitionMethod, setAcquisitionMethod] = useState<AcquisitionMethod>(asset.acquisitionMethod || 'specific');
  const [documentNo, setDocumentNo] = useState(asset.documentNo || '');
  const [quantity, setQuantity] = useState<number>(asset.quantity || 1);
  const [unit, setUnit] = useState(asset.unit || 'เครื่อง');
  const [price, setPrice] = useState<number>(asset.price || 0);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(asset.usefulLifeYears || 8);
  const [depreciationRatePercent, setDepreciationRatePercent] = useState<number>(
    asset.depreciationRatePercent || Number((100 / (asset.usefulLifeYears || 8)).toFixed(2))
  );
  const [acquisitionDate, setAcquisitionDate] = useState(asset.acquisitionDate || new Date().toISOString().slice(0, 10));
  const [warrantyExpiry, setWarrantyExpiry] = useState(asset.warrantyExpiry || '');

  // Vendor & Location
  const [vendor, setVendor] = useState(asset.vendor || '');
  const [vendorAddress, setVendorAddress] = useState(asset.vendorAddress || '');
  const [vendorPhone, setVendorPhone] = useState(asset.vendorPhone || '');

  // PM & Maintenance
  const [pmFrequencyMonths, setPmFrequencyMonths] = useState<number>(asset.pmFrequencyMonths || 6);
  const [lastPMDate, setLastPMDate] = useState(asset.lastPMDate || new Date().toISOString().slice(0, 10));
  const [nextPMDate, setNextPMDate] = useState(asset.nextPMDate || '');
  const [lastCalibrationDate, setLastCalibrationDate] = useState(asset.lastCalibrationDate || '');
  const [nextCalibrationDate, setNextCalibrationDate] = useState(asset.nextCalibrationDate || '');

  // Air conditioner specific
  const [btu, setBtu] = useState<number>(asset.btu || 24000);
  const [acType, setAcType] = useState<'split' | 'cassette' | 'vrv' | 'package' | 'inverter'>(
    (asset.acType as any) || 'split'
  );
  const [cleaningFrequencyMonths, setCleaningFrequencyMonths] = useState<number>(
    asset.cleaningFrequencyMonths || 3
  );

  // Validation & feedback state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const calculateTotalPrice = () => (Number(price) || 0) * (Number(quantity) || 1);
  const calculateAnnualDeprec = () => {
    const total = calculateTotalPrice();
    return Math.round((total * (Number(depreciationRatePercent) || 12.5)) / 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('กรุณาระบุชื่อครุภัณฑ์');
      return;
    }
    if (!code.trim()) {
      setFormError('กรุณาระบุรหัสครุภัณฑ์');
      return;
    }

    const totalPrice = calculateTotalPrice();
    const annualDepreciation = calculateAnnualDeprec();

    // Auto-compute next PM date if not set or frequency changed
    let computedNextPM = nextPMDate;
    if (!computedNextPM && lastPMDate) {
      const pmDateObj = new Date(lastPMDate);
      pmDateObj.setMonth(pmDateObj.getMonth() + Number(pmFrequencyMonths || 6));
      computedNextPM = pmDateObj.toISOString().slice(0, 10);
    }

    const updates: Partial<Asset> = {
      code: code.trim(),
      gfmisCode: gfmisCode.trim() || `11050100-${code.trim()}`,
      serialNumber: serialNumber.trim() || `SN-${code.trim()}`,
      name: name.trim(),
      brand: brand.trim() || 'มาตรฐาน',
      model: model.trim() || '-',
      category,
      department,
      locationDetail: locationDetail.trim(),
      specification: specification.trim() || name.trim(),
      criticality,
      status,
      fundingSource,
      acquisitionMethod,
      documentNo: documentNo.trim() || 'กจ 0032.2/2567',
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'เครื่อง',
      price: Number(price) || 0,
      totalPrice,
      usefulLifeYears: Number(usefulLifeYears) || 8,
      depreciationRatePercent: Number(depreciationRatePercent) || 12.5,
      annualDepreciation,
      netBookValue: totalPrice,
      acquisitionDate,
      warrantyExpiry,
      vendor: vendor.trim() || 'บริษัทคู่ค้ามาตรฐาน สธ.',
      vendorAddress: vendorAddress.trim() || 'กรุงเทพมหานคร',
      vendorPhone: vendorPhone.trim() || '02-xxx-xxxx',
      lastPMDate,
      nextPMDate: computedNextPM,
      pmFrequencyMonths: Number(pmFrequencyMonths) || 6,
      lastCalibrationDate: lastCalibrationDate || undefined,
      nextCalibrationDate: nextCalibrationDate || undefined,
      // If category is air conditioning, store AC fields
      ...(category === 'hvac_aircon' || btu ? {
        btu: Number(btu) || 24000,
        acType,
        cleaningFrequencyMonths: Number(cleaningFrequencyMonths) || 3
      } : {})
    };

    updateAsset(asset.id, updates);
    setIsSaved(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-800 border border-emerald-700/60 text-emerald-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  แก้ไขและเติมเต็มข้อมูลครุภัณฑ์
                </h3>
                <span className="font-mono text-xs bg-emerald-950/70 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                  {asset.code}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                ปรับปรุงข้อมูลที่ขาดหายจากการนำเข้า (Excel / PDF / CSV) ให้สมบูรณ์และซิงค์ขึ้น Firebase อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback / Saved banner */}
        {isSaved ? (
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              บันทึกการแก้ไขข้อมูลครุภัณฑ์เรียบร้อยแล้ว!
            </h4>
            <p className="text-xs text-slate-500">
              ข้อมูลได้รับการอัปเดตในระบบและซิงค์เชื่อมต่อกับ Cloud Firestore เรียบร้อยแล้ว
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            
            {/* Inline Error Notice if any */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            {/* Section 1: Core Identifiers */}
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1.5 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>1. ข้อมูลการระบุตัวตนและหมวดหมู่ครุภัณฑ์</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รหัสครุภัณฑ์ (Asset Code) *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-950 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รหัส GFMIS สินทรัพย์
                  </label>
                  <input
                    type="text"
                    value={gfmisCode}
                    onChange={(e) => setGfmisCode(e.target.value)}
                    placeholder="เช่น 11050100-67-0012"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    หมายเลขซีเรียล (S/N)
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="เช่น SN-8839210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อครุภัณฑ์ *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="ระบุชื่อครุภัณฑ์เต็มตามบัญชีคุม"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    หมวดหมู่ (13 หมวด สธ.) *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AssetCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                  >
                    {ASSET_CATEGORIES_CONFIG.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ยี่ห้อ (Brand)
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="เช่น Philips, GE, Daikin, Dell"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รุ่น / แบบ (Model)
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="เช่น SureSigns VM4, OptiPlex 7090"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ลักษณะ / คุณลักษณะเฉพาะ (Specification)
                </label>
                <textarea
                  rows={2}
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="ระบุสเปกทางเทคนิค, ขนาด, ความจุ, คุณสมบัติการใช้งาน..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 2: Department, Criticality & Status */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>2. หน่วยงานผู้รับผิดชอบ ระดับความเสี่ยง และสถานะ</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    แผนกผู้รับผิดชอบ (17 แผนก รพ.สังขละบุรี) *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    สถานที่ติดตั้ง / ตำแหน่งเฉพาะ (Location Detail)
                  </label>
                  <input
                    type="text"
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                    placeholder="เช่น ห้องกู้ชีพ เตียง 2, อาคารผู้ป่วยใน ชั้น 2"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ระดับความสำคัญ / ความเสี่ยง (Criticality) *
                  </label>
                  <select
                    value={criticality}
                    onChange={(e) => setCriticality(e.target.value as CriticalityLevel)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="life_support">● วิกฤต / ช่วยชีวิต (Life Support - ต้องพร้อมใช้งาน 100%)</option>
                    <option value="high_risk">● ความเสี่ยงสูง (High Risk - ส่งผลต่อการวินิจฉัย/รักษา)</option>
                    <option value="general">● ทั่วไป (General Equipment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    สถานะการใช้งาน (Status) *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssetStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value="ready">พร้อมใช้งาน (Active / Normal)</option>
                    <option value="in_repair">กำลังซ่อมบำรุง (Under Repair)</option>
                    <option value="wait_parts">รออะไหล่ (Awaiting Spare Parts)</option>
                    <option value="external">ส่งซ่อมภายนอก / ศูนย์บริการ (External Service)</option>
                    <option value="decommission">ปลดระวาง / ชำรุดจำหน่าย (Decommissioned)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Financial & Procurement (MOPH standard) */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1.5 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>3. ข้อมูลการเงิน การจัดซื้อ และการตัดค่าเสื่อมราคา (สธ.)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ประเภทเงิน *</label>
                  <select
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value as FundingSource)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="budget">เงินงบประมาณ</option>
                    <option value="non_budget">เงินนอกงบประมาณ (เงินบำรุงโรงพยาบาล)</option>
                    <option value="donation">เงินบริจาค / เงินช่วยเหลือ</option>
                    <option value="other">อื่น ๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วิธีการได้มา *</label>
                  <select
                    value={acquisitionMethod}
                    onChange={(e) => setAcquisitionMethod(e.target.value as AcquisitionMethod)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="specific">เฉพาะเจาะจง</option>
                    <option value="inquiry">สอบราคา</option>
                    <option value="bidding">ประกวดราคา (e-Bidding)</option>
                    <option value="special">วิธีพิเศษ</option>
                    <option value="donation">รับบริจาค</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ที่เอกสารจัดซื้อ / สัญญา / ตรวจรับ
                  </label>
                  <input
                    type="text"
                    value={documentNo}
                    onChange={(e) => setDocumentNo(e.target.value)}
                    placeholder="เช่น กจ 0032.2/142/2567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    วันที่ได้รับ / ตรวจรับ
                  </label>
                  <input
                    type="date"
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    วันสิ้นสุดการรับประกัน
                  </label>
                  <input
                    type="date"
                    value={warrantyExpiry}
                    onChange={(e) => setWarrantyExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จำนวน *</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="เช่น เครื่อง, ชุด, คัน"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ราคาต่อหน่วย (บาท) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">มูลค่ารวมทั้งสิ้น (บาท)</label>
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-mono font-bold text-right text-emerald-950">
                    {calculateTotalPrice().toLocaleString()} ฿
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อายุใช้งานตามเกณฑ์ (ปี)</label>
                  <input
                    type="number"
                    min="1"
                    value={usefulLifeYears}
                    onChange={(e) => {
                      const yrs = Number(e.target.value) || 1;
                      setUsefulLifeYears(yrs);
                      setDepreciationRatePercent(Number((100 / yrs).toFixed(2)));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อัตราค่าเสื่อมราคา (% ต่อปี)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={depreciationRatePercent}
                    onChange={(e) => setDepreciationRatePercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-center font-bold text-teal-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ค่าเสื่อมราคาประจำปี (คำนวณ)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono font-semibold text-right text-slate-800">
                    {calculateAnnualDeprec().toLocaleString()} ฿/ปี
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Vendor Information */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>4. ข้อมูลผู้ขาย / ตัวแทนจำหน่าย และการติดต่อ</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อผู้ขาย / ผู้บริจาค</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="ชื่อบริษัทหรือห้างหุ้นส่วนจำกัด"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ที่อยู่</label>
                  <input
                    type="text"
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="ที่อยู่บริษัท"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="02-xxx-xxxx หรือ 08x-xxx-xxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Preventive Maintenance (PM) & Aircon Details */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1.5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>5. แผนการบำรุงรักษาเชิงป้องกัน (PM) และการสอบเทียบ (Calibration)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ความถี่ PM (เดือน)</label>
                  <select
                    value={pmFrequencyMonths}
                    onChange={(e) => setPmFrequencyMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="1">ทุก 1 เดือน (รายเดือน)</option>
                    <option value="3">ทุก 3 เดือน (ไตรมาส)</option>
                    <option value="6">ทุก 6 เดือน (ครึ่งปี)</option>
                    <option value="12">ทุก 12 เดือน (รายปี)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันที่ทำ PM ล่าสุด</label>
                  <input
                    type="date"
                    value={lastPMDate}
                    onChange={(e) => setLastPMDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">กำหนดทำ PM ถัดไป</label>
                  <input
                    type="date"
                    value={nextPMDate}
                    onChange={(e) => setNextPMDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* Air Conditioning Specific fields if category is hvac_aircon */}
              {category === 'hvac_aircon' && (
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900">
                    <Wind className="w-4 h-4 text-teal-700" />
                    <span>ข้อมูลเฉพาะสำหรับครุภัณฑ์เครื่องปรับอากาศ (HVAC)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">ขนาดบีทียู (BTU)</label>
                      <input
                        type="number"
                        value={btu}
                        onChange={(e) => setBtu(Number(e.target.value))}
                        placeholder="เช่น 18000, 24000, 36000"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">ประเภทเครื่องปรับอากาศ</label>
                      <select
                        value={acType}
                        onChange={(e) => setAcType(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      >
                        <option value="split">แยกส่วนติดผนัง (Wall Split)</option>
                        <option value="cassette">ฝังฝ้า 4 ทิศทาง (Cassette)</option>
                        <option value="vrv">ระบบ VRV / VRF รวมศูนย์</option>
                        <option value="inverter">ระบบอินเวอร์เตอร์ (Inverter)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">ความถี่ล้างแอร์ (เดือน)</label>
                      <input
                        type="number"
                        value={cleaningFrequencyMonths}
                        onChange={(e) => setCleaningFrequencyMonths(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                ระบบจะบันทึกการแก้ไขลงฐานข้อมูลกลางและอัปเดตทะเบียนคุมทันที
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
