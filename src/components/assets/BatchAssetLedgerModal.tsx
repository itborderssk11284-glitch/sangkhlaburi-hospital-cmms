import React, { useState } from 'react';
import { Printer, X, Download, Filter, CheckSquare, Square, FileSpreadsheet, Eye, Building2, CheckCircle2 } from 'lucide-react';
import { Asset } from '../../types';
import { HOSPITAL_DEPARTMENTS, ASSET_CATEGORIES_CONFIG } from '../../data/mockData';

export const BatchAssetLedgerModal: React.FC<{
  assets: Asset[];
  onClose: () => void;
}> = ({ assets, onClose }) => {
  const [selectedDept, setSelectedDept] = useState('ทั้งหมด');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    assets.map(a => a.id)
  );
  const [viewMode, setViewMode] = useState<'preview' | 'list'>('preview');

  // Filter available assets
  const filteredAssets = assets.filter(a => {
    const matchesDept = selectedDept === 'ทั้งหมด' || a.department === selectedDept || a.department.includes(selectedDept);
    const matchesCategory = selectedCategory === 'ทั้งหมด' || a.category === selectedCategory;
    return matchesDept && matchesCategory;
  });

  // Assets that are currently selected for printing/exporting
  const targetAssets = filteredAssets.filter(a => selectedAssetIds.includes(a.id));

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map(a => a.id));
    }
  };

  const toggleAsset = (id: string) => {
    if (selectedAssetIds.includes(id)) {
      setSelectedAssetIds(selectedAssetIds.filter(x => x !== id));
    } else {
      setSelectedAssetIds([...selectedAssetIds, id]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'รหัสครุภัณฑ์',
      'รหัส GFMIS',
      'ชื่อครุภัณฑ์',
      'คุณลักษณะ/รายละเอียด',
      'ยี่ห้อ/รุ่น',
      'หมวดหมู่',
      'แผนก/สถานที่ตั้ง',
      'ผู้ขาย/ผู้บริจาค',
      'โทรศัพท์',
      'ประเภทเงิน',
      'วิธีการได้มา',
      'เลขที่เอกสาร',
      'วันที่ตรวจรับ',
      'จำนวน',
      'ราคาต่อหน่วย(บาท)',
      'มูลค่ารวม(บาท)',
      'อายุใช้งาน(ปี)',
      'อัตราค่าเสื่อม(%)',
      'ค่าเสื่อมราคาประจำปี(บาท)',
      'ค่าเสื่อมราคาสะสม(บาท)',
      'มูลค่าสุทธิทางบัญชี(บาท)'
    ];

    const rows = targetAssets.map(a => [
      `"${a.code}"`,
      `"${a.gfmisCode || ''}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${(a.specification || a.name).replace(/"/g, '""')}"`,
      `"${a.brand} ${a.model}"`,
      `"${a.category}"`,
      `"${a.department} ${a.locationDetail || ''}"`,
      `"${a.vendor || ''}"`,
      `"${a.vendorPhone || ''}"`,
      `"${a.fundingSource === 'budget' ? 'เงินงบประมาณ' : a.fundingSource === 'non_budget' ? 'เงินนอกงบประมาณ' : a.fundingSource === 'donation' ? 'เงินบริจาค' : 'อื่น ๆ'}"`,
      `"${a.acquisitionMethod === 'bidding' ? 'ประกวดราคา' : a.acquisitionMethod === 'specific' ? 'เฉพาะเจาะจง' : a.acquisitionMethod === 'inquiry' ? 'สอบราคา' : a.acquisitionMethod === 'donation' ? 'รับบริจาค' : 'วิธีพิเศษ'}"`,
      `"${a.documentNo || ''}"`,
      `"${a.acquisitionDate}"`,
      a.quantity || 1,
      a.price,
      a.totalPrice || a.price,
      a.usefulLifeYears || 8,
      a.depreciationRatePercent || 12.5,
      a.annualDepreciation || Math.round((a.price * (a.depreciationRatePercent || 12.5)) / 100),
      a.accumulatedDepreciation || 0,
      a.netBookValue || a.price
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `สมุดทะเบียนคุมทรัพย์สิน_สธ_รพ_สังขละบุรี_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-auto overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        
        {/* Modal Action Bar (hidden on print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-sm leading-tight flex items-center gap-2">
                <span>สมุดทะเบียนคุมทรัพย์สินรวม (แบบฟอร์ม สธ. สำนักงานปลัดกระทรวงสาธารณสุข)</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 font-normal">
                  เลือกแล้ว {targetAssets.length} / {filteredAssets.length} รายการ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                จัดพิมพ์ตามมาตรฐานกลุ่มตรวจสอบภายใน สป.สธ. พร้อมตารางคำนวณค่าเสื่อมราคาและช่องลงนามผู้ตรวจสอบ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'preview' ? 'list' : 'preview')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{viewMode === 'preview' ? 'สลับเป็นรายการเลือก' : 'ดูตัวอย่างหน้าพิมพ์'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={targetAssets.length === 0}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์สมุดทะเบียนคุม ({targetAssets.length} ฉบับ)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (hidden on print) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">กรองตามแผนก (17 แผนก):</span>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {HOSPITAL_DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">หมวดหมู่ (13 หมวด สธ.):</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none max-w-xs truncate"
              >
                <option value="ทั้งหมด">ทุกหมวดหมู่</option>
                {ASSET_CATEGORIES_CONFIG.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded font-medium flex items-center gap-1 cursor-pointer transition"
            >
              {selectedAssetIds.length === filteredAssets.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ยกเลิกการเลือกทั้งหมด</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>เลือกทั้งหมด ({filteredAssets.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          
          {/* Quick Selection List Mode */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs no-print">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">เลือก</th>
                    <th className="py-2.5 px-3">รหัสครุภัณฑ์</th>
                    <th className="py-2.5 px-3">รหัส GFMIS</th>
                    <th className="py-2.5 px-3">ชื่อครุภัณฑ์</th>
                    <th className="py-2.5 px-3">แผนกผู้รับผิดชอบ</th>
                    <th className="py-2.5 px-3 text-right">มูลค่าทรัพย์สิน</th>
                    <th className="py-2.5 px-3 text-center">ประเภทเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map(asset => {
                    const isChecked = selectedAssetIds.includes(asset.id);
                    return (
                      <tr 
                        key={asset.id} 
                        onClick={() => toggleAsset(asset.id)}
                        className={`hover:bg-emerald-50/50 cursor-pointer transition ${isChecked ? 'bg-emerald-50/20' : ''}`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAsset(asset.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{asset.code}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{asset.gfmisCode || '-'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{asset.name}</td>
                        <td className="py-2.5 px-3 text-slate-700">{asset.department}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {asset.price.toLocaleString()} ฿
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {asset.fundingSource === 'budget' ? 'งบประมาณ' : asset.fundingSource === 'non_budget' ? 'เงินบำรุง' : 'บริจาค'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Printable Official Sheets Preview */}
          {(viewMode === 'preview' || viewMode === 'list') && (
            <div className={`space-y-8 ${viewMode === 'list' ? 'hidden print:block' : ''}`}>
              {targetAssets.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                  ไม่มีครุภัณฑ์ที่เลือกสำหรับจัดพิมพ์ กรุณาเลือกรายการจากตัวกรองด้านบน
                </div>
              ) : (
                targetAssets.map((asset, index) => {
                  const categoryObj = ASSET_CATEGORIES_CONFIG.find(c => c.id === asset.category);
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

                  // Fill up to 8 rows for official sheet look
                  const totalRows = Math.max(8, depreciationHistory.length);
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
                    <div 
                      key={asset.id} 
                      className="bg-white p-8 sm:p-10 text-slate-900 border border-slate-300 shadow-md rounded-lg max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none page-break"
                      style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
                    >
                      {/* Top Header of MOPH standard form */}
                      <div className="flex items-start justify-between border-b border-black pb-2 mb-3">
                        <div className="text-[10px] text-black">
                          แบบฟอร์ม กลุ่มตรวจสอบภายใน สำนักงานปลัดกระทรวงสาธารณสุข
                        </div>
                        <div className="text-right text-[10px] text-black">
                          หน้า {index + 1} / {targetAssets.length}
                        </div>
                      </div>

                      {/* Header Title */}
                      <div className="text-center mb-3 relative">
                        <h1 className="text-base sm:text-lg font-bold tracking-wide text-black">
                          ทะเบียนคุมทรัพย์สิน
                        </h1>
                        <div className="text-right text-[11px] sm:absolute sm:top-0 sm:right-0 space-y-0.5 mt-1 sm:mt-0">
                          <div>ส่วนราชการ <span className="border-b border-dotted border-black px-3 font-semibold">โรงพยาบาลสังขละบุรี สสจ.กาญจนบุรี</span></div>
                          <div>หน่วยงาน <span className="border-b border-dotted border-black px-3 font-semibold">{asset.department}</span></div>
                        </div>
                      </div>

                      {/* Form Meta Fields Section */}
                      <div className="space-y-1.5 mb-3 text-[11px]">
                        {/* Row 1 */}
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4 flex items-baseline">
                            <span className="shrink-0 font-medium">ประเภท:</span>
                            <span className="border-b border-dotted border-black flex-1 ml-1 font-semibold truncate">
                              {categoryObj ? categoryObj.label : asset.category}
                            </span>
                          </div>
                          <div className="col-span-4 flex items-baseline">
                            <span className="shrink-0 font-medium">รหัสครุภัณฑ์:</span>
                            <span className="border-b border-dotted border-black flex-1 ml-1 font-mono font-bold">
                              {asset.code}
                            </span>
                          </div>
                          <div className="col-span-4 flex items-baseline">
                            <span className="shrink-0 font-medium">รหัส GFMIS:</span>
                            <span className="border-b border-dotted border-black flex-1 ml-1 font-mono font-bold">
                              {asset.gfmisCode || '11050100-' + asset.code}
                            </span>
                          </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-6 flex items-baseline">
                            <span className="shrink-0 font-medium">ลักษณะ/คุณสมบัติ:</span>
                            <span className="border-b border-dotted border-black flex-1 ml-1 truncate" title={asset.specification || asset.name}>
                              {asset.specification || asset.name}
                            </span>
                          </div>
                          <div className="col-span-6 flex items-baseline">
                            <span className="shrink-0 font-medium">รุ่น/แบบ:</span>
                            <span className="border-b border-dotted border-black flex-1 ml-1 font-semibold">
                              {asset.brand} {asset.model} (S/N: {asset.serialNumber})
                            </span>
                          </div>
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-12 flex items-baseline">
                            <span className="shrink-0 font-medium">สถานที่ตั้ง/หน่วยงานที่รับผิดชอบ:</span>
                            <span className="border-b border-dotted border-black flex-1 ml-1 font-semibold">
                              {asset.department} {asset.locationDetail ? `(${asset.locationDetail})` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Row 4 */}
                        <div className="grid grid-cols-12 gap-2">
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

                        {/* Row 5: Checkboxes */}
                        <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-200 mt-1">
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

                      {/* Official 12-Column Table */}
                      <div className="overflow-x-auto my-3">
                        <table className="w-full text-[10px] border-collapse border border-black text-center">
                          <thead>
                            <tr className="bg-slate-100 font-bold border-b border-black">
                              <th className="border border-black p-1 w-16" rowSpan={2}>วัน เดือน ปี</th>
                              <th className="border border-black p-1 w-20" rowSpan={2}>ที่เอกสาร</th>
                              <th className="border border-black p-1" rowSpan={2}>รายการ</th>
                              <th className="border border-black p-1 w-12" rowSpan={2}>จำนวนหน่วย</th>
                              <th className="border border-black p-1 w-20" rowSpan={2}>ราคาต่อหน่วย/ชุด/กลุ่ม (บาท)</th>
                              <th className="border border-black p-1 w-20" rowSpan={2}>มูลค่ารวม (บาท)</th>
                              <th className="border border-black p-1 w-12" rowSpan={2}>อายุใช้งาน (ปี)</th>
                              <th className="border border-black p-1 w-14" rowSpan={2}>อัตราค่าเสื่อมราคา (%)</th>
                              <th className="border border-black p-1" colSpan={3}>ค่าเสื่อมราคา (บาท)</th>
                              <th className="border border-black p-1 w-20" rowSpan={2}>หมายเหตุ</th>
                            </tr>
                            <tr className="bg-slate-50 font-bold border-b border-black">
                              <th className="border border-black p-1 w-18">ประจำปี</th>
                              <th className="border border-black p-1 w-18">สะสม</th>
                              <th className="border border-black p-1 w-18">มูลค่าสุทธิ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, rIdx) => (
                              <tr key={rIdx} className="h-6">
                                <td className="border border-black p-1 font-mono">{r.date || ''}</td>
                                <td className="border border-black p-1">{r.documentNo || ''}</td>
                                <td className="border border-black p-1 text-left px-1.5 truncate max-w-xs">{r.description || ''}</td>
                                <td className="border border-black p-1 font-mono">{r.quantity > 0 ? r.quantity : ''}</td>
                                <td className="border border-black p-1 text-right font-mono px-1">
                                  {r.unitPrice > 0 ? r.unitPrice.toLocaleString() : ''}
                                </td>
                                <td className="border border-black p-1 text-right font-mono px-1 font-semibold">
                                  {r.totalPrice > 0 ? r.totalPrice.toLocaleString() : ''}
                                </td>
                                <td className="border border-black p-1 font-mono">{r.usefulLifeYears > 0 ? r.usefulLifeYears : ''}</td>
                                <td className="border border-black p-1 font-mono">{r.depreciationRate > 0 ? `${r.depreciationRate}%` : ''}</td>
                                <td className="border border-black p-1 text-right font-mono px-1">
                                  {r.annualDepreciation > 0 ? r.annualDepreciation.toLocaleString() : ''}
                                </td>
                                <td className="border border-black p-1 text-right font-mono px-1">
                                  {r.accumulatedDepreciation > 0 ? r.accumulatedDepreciation.toLocaleString() : ''}
                                </td>
                                <td className="border border-black p-1 text-right font-mono px-1 font-bold">
                                  {r.netBookValue > 0 ? r.netBookValue.toLocaleString() : ''}
                                </td>
                                <td className="border border-black p-1 text-left px-1 truncate">{r.remarks || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Official Signatures Footer */}
                      <div className="grid grid-cols-2 gap-8 pt-4 mt-2 text-xs">
                        <div className="text-center space-y-1">
                          <div className="flex justify-center items-end">
                            <span>(ลงชื่อ)</span>
                            <span className="w-48 border-b border-dotted border-black mx-1"></span>
                            <span>ผู้บันทึก</span>
                          </div>
                          <div>(นายวรพจน์ ธนสารพาณิชย์)</div>
                          <div className="text-[11px] text-black">ตำแหน่ง เจ้าพนักงานพัสดุชำนาญงาน</div>
                          <div className="text-[11px]">วันที่ ....... เดือน .................. พ.ศ. ...........</div>
                        </div>

                        <div className="text-center space-y-1">
                          <div className="flex justify-center items-end">
                            <span>(ลงชื่อ)</span>
                            <span className="w-48 border-b border-dotted border-black mx-1"></span>
                            <span>ผู้ตรวจสอบ</span>
                          </div>
                          <div>(นายสมเกียรติ มณีโชติ)</div>
                          <div className="text-[11px] text-black">ตำแหน่ง หัวหน้ากลุ่มงานบริหารทั่วไป</div>
                          <div className="text-[11px]">วันที่ ....... เดือน .................. พ.ศ. ...........</div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
