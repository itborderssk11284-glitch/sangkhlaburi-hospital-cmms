import React, { useState } from 'react';
import { X, Save, PlusCircle, Wind, FileText, CheckSquare } from 'lucide-react';
import { Asset, AssetCategory, CriticalityLevel, AssetStatus, FundingSource, AcquisitionMethod } from '../../types';
import { HOSPITAL_DEPARTMENTS, ASSET_CATEGORIES_CONFIG } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export const NewAssetModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { addAsset } = useApp();

  const [code, setCode] = useState(`SK-MD-67-${Math.floor(1000 + Math.random() * 9000)}`);
  const [gfmisCode, setGfmisCode] = useState(`11050100-67-${Math.floor(1000 + Math.random() * 9000)}`);
  const [serialNumber, setSerialNumber] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<AssetCategory>('medical_health');
  const [department, setDepartment] = useState('5. อุบัติเหตุฉุกเฉิน');
  const [locationDetail, setLocationDetail] = useState('');
  const [specification, setSpecification] = useState('');
  const [criticality, setCriticality] = useState<CriticalityLevel>('high_risk');
  const [status, setStatus] = useState<AssetStatus>('ready');

  // MOPH Asset Ledger specific fields
  const [fundingSource, setFundingSource] = useState<FundingSource>('budget');
  const [acquisitionMethod, setAcquisitionMethod] = useState<AcquisitionMethod>('specific');
  const [documentNo, setDocumentNo] = useState(`กจ 0032.2/${Math.floor(100 + Math.random() * 900)}/2567`);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('เครื่อง');
  const [price, setPrice] = useState<number>(180000);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(8);
  const [depreciationRatePercent, setDepreciationRatePercent] = useState<number>(12.5);
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [warrantyExpiry, setWarrantyExpiry] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString().slice(0, 10)
  );

  const [vendor, setVendor] = useState('');
  const [vendorAddress, setVendorAddress] = useState('กรุงเทพมหานคร');
  const [vendorPhone, setVendorPhone] = useState('02-xxx-xxxx');
  const [pmFrequencyMonths, setPmFrequencyMonths] = useState<number>(6);

  // AC specific states
  const [btu, setBtu] = useState<number>(24000);
  const [acType, setAcType] = useState<'split' | 'cassette' | 'vrv' | 'inverter'>('split');
  const [cleaningFrequencyMonths, setCleaningFrequencyMonths] = useState<number>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !serialNumber) {
      alert('กรุณากรอกข้อมูลสำคัญ: รหัสครุภัณฑ์, หมายเลขซีเรียล (S/N) และชื่อครุภัณฑ์');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const nextPM = new Date();
    nextPM.setMonth(nextPM.getMonth() + Number(pmFrequencyMonths));

    const nextClean = new Date();
    nextClean.setMonth(nextClean.getMonth() + Number(cleaningFrequencyMonths));

    const totalPrice = (Number(price) || 0) * (Number(quantity) || 1);
    const annualDepreciation = Math.round((totalPrice * (Number(depreciationRatePercent) || 12.5)) / 100);

    addAsset({
      code,
      gfmisCode: gfmisCode || `11050100-${code}`,
      serialNumber,
      name,
      brand,
      model,
      category,
      department,
      locationDetail,
      specification: specification || name,
      criticality,
      status,
      fundingSource,
      acquisitionMethod,
      documentNo: documentNo || 'กจ 0032.2/2567',
      quantity: Number(quantity) || 1,
      unit: unit || 'เครื่อง',
      price: Number(price) || 0,
      totalPrice,
      usefulLifeYears: Number(usefulLifeYears) || 8,
      depreciationRatePercent: Number(depreciationRatePercent) || 12.5,
      annualDepreciation,
      accumulatedDepreciation: 0,
      netBookValue: totalPrice,
      expectedLifeYears: Number(usefulLifeYears) || 8,
      acquisitionDate,
      warrantyExpiry,
      vendor: vendor || 'บริษัทผู้จัดจำหน่ายมาตรฐาน',
      vendorAddress: vendorAddress || 'กรุงเทพมหานคร',
      vendorPhone: vendorPhone || '02-xxx-xxxx',
      lastPMDate: today,
      nextPMDate: nextPM.toISOString().slice(0, 10),
      pmFrequencyMonths: Number(pmFrequencyMonths),
      lastCalibrationDate: today,
      nextCalibrationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      ...(category === 'hvac_aircon' ? {
        btu: Number(btu) || 24000,
        acType,
        cleaningFrequencyMonths: Number(cleaningFrequencyMonths),
        lastCleanedDate: today,
        nextCleanDate: nextClean.toISOString().slice(0, 10),
      } : {}),
      depreciationHistory: [
        {
          fiscalYear: '2567',
          date: acquisitionDate,
          documentNo: documentNo || 'กจ 0032.2/2567',
          description: name,
          quantity: Number(quantity) || 1,
          unitPrice: Number(price) || 0,
          totalPrice,
          usefulLifeYears: Number(usefulLifeYears) || 8,
          depreciationRate: Number(depreciationRatePercent) || 12.5,
          annualDepreciation,
          accumulatedDepreciation: 0,
          netBookValue: totalPrice,
          remarks: 'ตรวจรับเข้าบัญชีคุมทรัพย์สินใหม่'
        }
      ]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200">
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base">ลงทะเบียนครุภัณฑ์และเปิดทะเบียนคุมทรัพย์สิน (สธ.)</h3>
              <p className="text-xs text-emerald-200/80">บันทึกข้อมูลตามมาตรฐานกลุ่มตรวจสอบภายใน สำนักงานปลัดกระทรวงสาธารณสุข</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {/* Section 1: Standard Identification */}
          <div className="space-y-3">
            <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1 flex items-center gap-1.5">
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
                  รหัส GFMIS สินทรัพย์ *
                </label>
                <input
                  type="text"
                  value={gfmisCode}
                  onChange={(e) => setGfmisCode(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  หมายเลขซีเรียล (S/N) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น SN-8839210"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  หมวดหมู่ครุภัณฑ์ตามมาตรฐานทั่วไป (13 หมวด สธ.) *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value as AssetCategory;
                    setCategory(val);
                    const cfg = ASSET_CATEGORIES_CONFIG.find(c => c.id === val);
                    if (cfg) {
                      setCode(`${cfg.codePrefix}-67-${Math.floor(1000 + Math.random() * 9000)}`);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                >
                  {ASSET_CATEGORIES_CONFIG.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อครุภัณฑ์ *
                </label>
                <input
                  type="text"
                  placeholder="ระบุชื่อครุภัณฑ์ตามเอกสารจัดซื้อ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ลักษณะ / คุณสมบัติเฉพาะ (ตามทะเบียนคุมทรัพย์สิน)
              </label>
              <textarea
                rows={2}
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                placeholder="ระบุขนาด, ความจุ, สเปกทางเทคนิค, ฟังก์ชั่นการใช้งาน..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Acquisition & Funding (PDF Form Fields) */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1 flex items-center gap-1.5">
              <span>2. แหล่งเงินและวิธีการได้มา (ตามแบบฟอร์มทะเบียนคุมทรัพย์สิน สธ.)</span>
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
                <label className="block text-slate-700 font-semibold mb-1">ที่เอกสารจัดซื้อ / ตรวจรับ *</label>
                <input
                  type="text"
                  value={documentNo}
                  onChange={(e) => setDocumentNo(e.target.value)}
                  placeholder="เช่น กจ 0032.2/2567"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">วันที่ได้รับ / ตรวจรับ *</label>
                <input
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">วันสิ้นสุดรับประกัน</label>
                <input
                  type="date"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Depreciation Schedule */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1 flex items-center gap-1.5">
              <span>3. มูลค่าทรัพย์สินและการตัดค่าเสื่อมราคา</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">จำนวน *</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">หน่วยนับ</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="เช่น เครื่อง, ชุด, คัน"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-center"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ราคาต่อหน่วย (บาท) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">มูลค่ารวม (บาท)</label>
                <div className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-mono font-bold text-right text-emerald-900">
                  {((Number(price) || 0) * (Number(quantity) || 1)).toLocaleString()} ฿
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">อายุใช้งานตามเกณฑ์ (ปี) *</label>
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
                <label className="block text-slate-700 font-semibold mb-1">อัตราค่าเสื่อมราคา (% ต่อปี) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={depreciationRatePercent}
                  onChange={(e) => setDepreciationRatePercent(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-center font-bold text-teal-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ค่าเสื่อมราคาประจำปี (ประมาณการ)</label>
                <div className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 font-mono font-semibold text-right text-slate-800">
                  {(Math.round(((Number(price) || 0) * (Number(depreciationRatePercent) || 12.5)) / 100)).toLocaleString()} ฿/ปี
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Vendor & Location Details */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-emerald-950 border-b border-emerald-800 pb-1 flex items-center gap-1.5">
              <span>4. หน่วยงานผู้รับผิดชอบและผู้จำหน่าย</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">สถานที่ตั้ง / แผนกผู้รับผิดชอบ *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ตำแหน่งติดตั้งระบุเฉพาะ</label>
                <input
                  type="text"
                  placeholder="เช่น ห้องตรวจ 2 หรือ อาคารสนับสนุน"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อผู้ขาย / ผู้รับจ้าง / ผู้บริจาค *</label>
                <input
                  type="text"
                  placeholder="ชื่อบริษัทหรือบุคคล"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ที่อยู่</label>
                <input
                  type="text"
                  placeholder="ที่อยู่บริษัท"
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  placeholder="เบอร์ติดต่อ"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกเข้าทะเบียนคุมทรัพย์สิน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
