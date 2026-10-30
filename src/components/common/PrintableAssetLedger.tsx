import React from 'react';
import { Printer, X, Download, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { Asset } from '../../types';
import { ASSET_CATEGORIES_CONFIG } from '../../data/mockData';

export const PrintableAssetLedger: React.FC<{
  asset: Asset;
  onClose: () => void;
}> = ({ asset, onClose }) => {
  const categoryObj = ASSET_CATEGORIES_CONFIG.find(c => c.id === asset.category);

  const handlePrint = () => {
    window.print();
  };

  // Generate depreciation rows if empty
  const depreciationHistory = asset.depreciationHistory && asset.depreciationHistory.length > 0 
    ? asset.depreciationHistory 
    : [
        {
          fiscalYear: '2566',
          date: asset.acquisitionDate,
          documentNo: asset.documentNo || 'กจ 0032.2/2566',
          description: asset.name,
          quantity: asset.quantity || 1,
          unitPrice: asset.price,
          totalPrice: asset.totalPrice || asset.price,
          usefulLifeYears: asset.usefulLifeYears || 8,
          depreciationRate: asset.depreciationRatePercent || 12.5,
          annualDepreciation: asset.annualDepreciation || Math.round((asset.price * (asset.depreciationRatePercent || 12.5)) / 100),
          accumulatedDepreciation: asset.accumulatedDepreciation || 0,
          netBookValue: asset.netBookValue || asset.price,
          remarks: 'ตรวจรับเข้าบัญชีคุมทรัพย์สิน'
        }
      ];

  // Fill up to 10 rows for official sheet look
  const totalRows = Math.max(10, depreciationHistory.length);
  const rows = [...depreciationHistory];
  while (rows.length < totalRows) {
    rows.push({
      fiscalYear: '',
      date: '',
      documentNo: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      usefulLifeYears: 0,
      depreciationRate: 0,
      annualDepreciation: 0,
      accumulatedDepreciation: 0,
      netBookValue: 0,
      remarks: ''
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-auto overflow-hidden border border-slate-300">
        {/* Modal Action Bar (hidden on print) */}
        <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              แบบฟอร์มทะเบียนคุมทรัพย์สิน (สำนักงานปลัดกระทรวงสาธารณสุข)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ทะเบียนคุมทรัพย์สิน (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Sheet matching the MOPH PDF Form */}
        <div className="p-8 sm:p-10 text-slate-900 bg-white font-sans text-xs" id="official-asset-ledger">
          {/* Header Title */}
          <div className="text-center mb-4 relative">
            <h1 className="text-lg font-bold tracking-wide text-black">
              ทะเบียนคุมทรัพย์สิน
            </h1>
            <div className="text-right text-[11px] absolute top-0 right-0 space-y-1">
              <div>ส่วนราชการ <span className="border-b border-dotted border-black px-4 font-semibold">โรงพยาบาลสังขละบุรี สสจ.กาญจนบุรี</span></div>
              <div>หน่วยงาน <span className="border-b border-dotted border-black px-4 font-semibold">{asset.department}</span></div>
            </div>
          </div>

          {/* Form Meta Fields Section */}
          <div className="space-y-2 mb-4 pt-2">
            {/* Row 1 */}
            <div className="grid grid-cols-12 gap-2 text-[11px]">
              <div className="col-span-3 flex items-baseline">
                <span className="shrink-0 font-medium">ประเภท:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 font-semibold truncate">
                  {categoryObj ? categoryObj.label : asset.category}
                </span>
              </div>
              <div className="col-span-3 flex items-baseline">
                <span className="shrink-0 font-medium">รหัส:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 font-mono font-bold">
                  {asset.code}
                </span>
              </div>
              <div className="col-span-3 flex items-baseline">
                <span className="shrink-0 font-medium">ลักษณะ/คุณสมบัติ:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 truncate" title={asset.specification || asset.name}>
                  {asset.specification || asset.name}
                </span>
              </div>
              <div className="col-span-3 flex items-baseline">
                <span className="shrink-0 font-medium">รุ่น/แบบ:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 font-semibold">
                  {asset.brand} {asset.model}
                </span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-12 gap-2 text-[11px]">
              <div className="col-span-4 flex items-baseline">
                <span className="shrink-0 font-medium">GFMIS:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 font-mono">
                  {asset.gfmisCode || '11050100-' + asset.code}
                </span>
              </div>
              <div className="col-span-8 flex items-baseline">
                <span className="shrink-0 font-medium">สถานที่ตั้ง/หน่วยงานผู้รับผิดชอบ:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 font-semibold">
                  {asset.department} {asset.locationDetail ? `(${asset.locationDetail})` : ''}
                </span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-12 gap-2 text-[11px]">
              <div className="col-span-6 flex items-baseline">
                <span className="shrink-0 font-medium">ชื่อผู้ขาย/ผู้รับจ้าง/ผู้บริจาค:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 font-medium">
                  {asset.vendor}
                </span>
              </div>
              <div className="col-span-4 flex items-baseline">
                <span className="shrink-0 font-medium">ที่อยู่:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 truncate">
                  {asset.vendorAddress || 'กรุงเทพมหานคร'}
                </span>
              </div>
              <div className="col-span-2 flex items-baseline">
                <span className="shrink-0 font-medium">โทรศัพท์:</span>
                <span className="border-b border-dotted border-black flex-1 ml-1 font-mono">
                  {asset.vendorPhone}
                </span>
              </div>
            </div>

            {/* Row 4: Checkboxes */}
            <div className="grid grid-cols-12 gap-2 text-[11px] pt-1">
              <div className="col-span-6 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-black">ประเภทเงิน:</span>
                <span className="inline-flex items-center gap-1">
                  {asset.fundingSource === 'budget' ? '☑' : '☐'} เงินงบประมาณ
                </span>
                <span className="inline-flex items-center gap-1">
                  {asset.fundingSource === 'non_budget' ? '☑' : '☐'} เงินนอกงบประมาณ (เงินบำรุง)
                </span>
                <span className="inline-flex items-center gap-1">
                  {asset.fundingSource === 'donation' ? '☑' : '☐'} เงินบริจาค/ช่วยเหลือ
                </span>
                <span className="inline-flex items-center gap-1">
                  {asset.fundingSource === 'other' ? '☑' : '☐'} อื่น ๆ
                </span>
              </div>

              <div className="col-span-6 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-black">วิธีการได้มา:</span>
                <span className="inline-flex items-center gap-1">
                  {asset.acquisitionMethod === 'specific' ? '☑' : '☐'} เฉพาะเจาะจง
                </span>
                <span className="inline-flex items-center gap-1">
                  {asset.acquisitionMethod === 'inquiry' ? '☑' : '☐'} สอบราคา
                </span>
                <span className="inline-flex items-center gap-1">
                  {asset.acquisitionMethod === 'bidding' ? '☑' : '☐'} ประกวดราคา (e-Bidding)
                </span>
                <span className="inline-flex items-center gap-1">
                  {asset.acquisitionMethod === 'special' ? '☑' : '☐'} วิธีพิเศษ
                </span>
                <span className="inline-flex items-center gap-1">
                  {asset.acquisitionMethod === 'donation' ? '☑' : '☐'} รับบริจาค
                </span>
              </div>
            </div>
          </div>

          {/* Official Ledger Table with exact MOPH columns */}
          <div className="border border-black overflow-hidden mb-6">
            <table className="w-full text-[10px] text-center border-collapse">
              <thead>
                <tr className="border-b border-black font-semibold text-black bg-slate-50">
                  <th className="py-2 px-1 border-r border-black w-18">วัน เดือน ปี</th>
                  <th className="py-2 px-1 border-r border-black w-24">ที่เอกสาร</th>
                  <th className="py-2 px-2 border-r border-black text-left">รายการ</th>
                  <th className="py-2 px-1 border-r border-black w-14">จำนวน (หน่วย)</th>
                  <th className="py-2 px-1 border-r border-black w-20">ราคาต่อ หน่วย/ชุด/กลุ่ม</th>
                  <th className="py-2 px-1 border-r border-black w-20">มูลค่ารวม</th>
                  <th className="py-2 px-1 border-r border-black w-14">อายุ ใช้งาน</th>
                  <th className="py-2 px-1 border-r border-black w-16">อัตรา ค่าเสื่อมราคา</th>
                  <th className="py-2 px-1 border-r border-black w-20">ค่าเสื่อมราคา ประจำปี</th>
                  <th className="py-2 px-1 border-r border-black w-20">ค่าเสื่อม ราคาสะสม</th>
                  <th className="py-2 px-1 border-r border-black w-20">มูลค่าสุทธิ</th>
                  <th className="py-2 px-1 w-20">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-black/30 h-7 text-black">
                    <td className="px-1 border-r border-black/30 font-mono text-[9px]">{row.date}</td>
                    <td className="px-1 border-r border-black/30 font-mono text-[9px] truncate">{row.documentNo}</td>
                    <td className="px-2 border-r border-black/30 text-left font-medium truncate max-w-xs">{row.description}</td>
                    <td className="px-1 border-r border-black/30">{row.quantity ? `${row.quantity} ${asset.unit || 'เครื่อง'}` : ''}</td>
                    <td className="px-1 border-r border-black/30 text-right font-mono">{row.unitPrice ? row.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-1 border-r border-black/30 text-right font-mono">{row.totalPrice ? row.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-1 border-r border-black/30">{row.usefulLifeYears ? `${row.usefulLifeYears} ปี` : ''}</td>
                    <td className="px-1 border-r border-black/30">{row.depreciationRate ? `${row.depreciationRate}%` : ''}</td>
                    <td className="px-1 border-r border-black/30 text-right font-mono">{row.annualDepreciation ? row.annualDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-1 border-r border-black/30 text-right font-mono">{row.accumulatedDepreciation ? row.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-1 border-r border-black/30 text-right font-mono font-semibold">{row.netBookValue ? row.netBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
                    <td className="px-1 text-left text-[9px] truncate">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note matching MOPH Audit specification */}
          <div className="flex items-center justify-between text-[10px] text-slate-600 border-t border-black/20 pt-2">
            <div>
              <span>สถานะสินทรัพย์: <strong>{asset.status === 'ready' ? 'พร้อมใช้งาน' : asset.status === 'in_repair' ? 'กำลังส่งซ่อม' : 'ปลดระวาง'}</strong></span>
              <span className="mx-2">·</span>
              <span>รหัสทรัพย์สิน GFMIS: <strong>{asset.gfmisCode}</strong></span>
            </div>
            <div className="font-serif italic text-black">
              ทะเบียนคุมทรัพย์สิน กลุ่มตรวจสอบภายใน สำนักงานปลัดกระทรวงสาธารณสุข ประจำปีงบประมาณ พ.ศ. ๒๕๖๔
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
