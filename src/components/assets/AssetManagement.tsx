import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  Wrench, 
  Download, 
  Upload,
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Building2,
  ScanLine,
  TrendingUp,
  FileSpreadsheet,
  Wind,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Asset, AssetCategory, CriticalityLevel, AssetStatus } from '../../types';
import { HOSPITAL_DEPARTMENTS, ASSET_CATEGORIES_CONFIG } from '../../data/mockData';
import { NewAssetModal } from './NewAssetModal';
import { EditAssetModal } from './EditAssetModal';
import { ProcurementPlanReportModal } from './ProcurementPlanReportModal';
import { BatchAssetLedgerModal } from './BatchAssetLedgerModal';
import { ImportAssetModal } from './ImportAssetModal';

export const AssetManagement: React.FC<{
  onOpenNewRepairForAsset: (asset: Asset) => void;
}> = ({ onOpenNewRepairForAsset }) => {
  const { 
    assets, 
    setSelectedAssetForDetail, 
    setSelectedAssetForQR,
    setSelectedAssetForLedger
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ทั้งหมด');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');
  const [selectedCriticality, setSelectedCriticality] = useState<string>('ทั้งหมด');
  
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false);
  const [isBatchLedgerModalOpen, setIsBatchLedgerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [scannerSimulationInput, setScannerSimulationInput] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Filter logic
  const filteredAssets = assets.filter((asset) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      asset.code.toLowerCase().includes(query) ||
      asset.serialNumber.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query) ||
      asset.brand.toLowerCase().includes(query) ||
      asset.model.toLowerCase().includes(query) ||
      asset.department.toLowerCase().includes(query);

    const matchesDept = selectedDept === 'ทั้งหมด' || asset.department.includes(selectedDept);
    const matchesCategory = selectedCategory === 'ทั้งหมด' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ทั้งหมด' || asset.status === selectedStatus;
    const matchesCriticality = selectedCriticality === 'ทั้งหมด' || asset.criticality === selectedCriticality;

    return matchesSearch && matchesDept && matchesCategory && matchesStatus && matchesCriticality;
  });

  // Quick scanner simulation handler
  const handleScanLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerSimulationInput.trim()) return;

    const cleaned = scannerSimulationInput.trim().toUpperCase().replace('SKH-ASSET:', '');
    const found = assets.find(
      a => a.code.toUpperCase() === cleaned || 
           a.serialNumber.toUpperCase() === cleaned ||
           a.code.toUpperCase().includes(cleaned)
    );

    if (found) {
      setScanMessage(`พบครุภัณฑ์: ${found.code} (${found.name})`);
      setSelectedAssetForDetail(found);
      setScannerSimulationInput('');
      setTimeout(() => setScanMessage(null), 3000);
    } else {
      setScanMessage(`ไม่พบรหัสครุภัณฑ์หรือ S/N '${cleaned}' ในฐานข้อมูล`);
      setTimeout(() => setScanMessage(null), 3000);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'รหัสครุภัณฑ์',
      'หมายเลขซีเรียล',
      'ชื่อครุภัณฑ์',
      'ยี่ห้อ',
      'รุ่น',
      'หมวดหมู่',
      'แผนก',
      'สถานที่ติดตั้ง',
      'ระดับความสำคัญ',
      'สถานะ',
      'มูลค่า(บาท)',
      'วันตรวจ PM ล่าสุด',
      'วันตรวจ PM ครั้งถัดไป'
    ];

    const rows = filteredAssets.map(a => [
      `"${a.code}"`,
      `"${a.serialNumber}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.brand}"`,
      `"${a.model}"`,
      `"${a.category}"`,
      `"${a.department}"`,
      `"${a.locationDetail || '-'}"`,
      `"${a.criticality}"`,
      `"${a.status}"`,
      a.price,
      `"${a.lastPMDate}"`,
      `"${a.nextPMDate}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ทะเบียนครุภัณฑ์_รพ_สังขละบุรี_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Action Header & QR Scanner Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ระบบจัดการทะเบียนครุภัณฑ์ (Asset & Equipment Management)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามประวัติ จัดการสถานะ พิมพ์ฉลาก QR Code และวิเคราะห์ตัวชี้วัดแผนจัดซื้อครุภัณฑ์ประจำปี โรงพยาบาลสังขละบุรี
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Batch MOPH Asset Ledger Report */}
            <button
              onClick={() => setIsBatchLedgerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
              <span>พิมพ์สมุดทะเบียนคุมทรัพย์สิน (ตามแบบ สธ.)</span>
            </button>

            {/* Annual Procurement & Replacement Justification Report */}
            <button
              onClick={() => setIsProcurementModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>รายงานตัวชี้วัดแผนจัดซื้อประจำปี</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>ส่งออก CSV</span>
            </button>

            {/* New: Import Data Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-2xs cursor-pointer"
              title="นำเข้าข้อมูลทะเบียนครุภัณฑ์จากไฟล์ Excel (.xlsx), PDF (.pdf) หรือ CSV"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>นำเข้าข้อมูล (Excel / PDF)</span>
            </button>

            <button
              onClick={() => setIsNewAssetModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ลงทะเบียนครุภัณฑ์ใหม่</span>
            </button>
          </div>
        </div>

        {/* Quick QR / Barcode Scanner Simulator */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleScanLookup} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <ScanLine className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="สแกน QR Code หรือพิมพ์รหัสครุภัณฑ์ / Serial Number เพื่อค้นหาด่วน..."
                value={scannerSimulationInput}
                onChange={(e) => setScannerSimulationInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-950 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium transition cursor-pointer shrink-0"
            >
              ค้นหาจาก QR
            </button>
          </form>

          {scanMessage && (
            <div className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 shrink-0">
              {scanMessage}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar with Full Standard Categories */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, S/N..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Standard Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">หมวดหมู่ครุภัณฑ์ทั้งหมด (11 หมวดมาตรฐาน)</option>
              {ASSET_CATEGORIES_CONFIG.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">แผนกทั้งหมด</option>
              {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              <option value="ready">พร้อมใช้งาน (Ready)</option>
              <option value="in_repair">กำลังซ่อม (In Repair)</option>
              <option value="wait_parts">รออะไหล่ (Awaiting Parts)</option>
              <option value="external">ส่งซ่อมภายนอก (External)</option>
              <option value="decommission">ปลดระวาง (Decommissioned)</option>
            </select>
          </div>

          {/* Criticality Filter */}
          <div>
            <select
              value={selectedCriticality}
              onChange={(e) => setSelectedCriticality(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">ระดับความสำคัญทั้งหมด</option>
              <option value="life_support">วิกฤต/ช่วยชีวิต (Life Support)</option>
              <option value="high_risk">ความเสี่ยงสูง (High Risk)</option>
              <option value="general">ทั่วไป (General)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>พบครุภัณฑ์ตรงเงื่อนไข: <strong>{filteredAssets.length}</strong> จาก {assets.length} รายการ</span>
          {(searchQuery || selectedDept !== 'ทั้งหมด' || selectedCategory !== 'ทั้งหมด' || selectedStatus !== 'ทั้งหมด' || selectedCriticality !== 'ทั้งหมด') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('ทั้งหมด');
                setSelectedCategory('ทั้งหมด');
                setSelectedStatus('ทั้งหมด');
                setSelectedCriticality('ทั้งหมด');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">รหัส / S/N</th>
                <th className="py-3 px-4">ชื่อครุภัณฑ์ / ยี่ห้อ รุ่น</th>
                <th className="py-3 px-4">หมวดหมู่มาตรฐาน</th>
                <th className="py-3 px-4">แผนก / ที่ตั้ง</th>
                <th className="py-3 px-4">ระดับความวิกฤต</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">รอบ PM ถัดไป</th>
                <th className="py-3 px-4 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบรายการครุภัณฑ์ตามเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const categoryObj = ASSET_CATEGORIES_CONFIG.find(c => c.id === asset.category);
                  return (
                    <tr 
                      key={asset.id} 
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-emerald-950">{asset.code}</div>
                        <div className="text-[11px] font-mono text-slate-400">SN: {asset.serialNumber}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate" title={asset.name}>
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {asset.brand} · {asset.model} {asset.btu ? `(${asset.btu.toLocaleString()} BTU)` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {categoryObj ? categoryObj.label.split('(')[0] : asset.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{asset.department}</div>
                        <div className="text-[10px] text-slate-400 truncate">{asset.locationDetail || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold ${
                          asset.criticality === 'life_support' ? 'text-rose-600' :
                          asset.criticality === 'high_risk' ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          {asset.criticality === 'life_support' ? '● วิกฤต/ช่วยชีวิต' :
                           asset.criticality === 'high_risk' ? '● เสี่ยงสูง' : '● ทั่วไป'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          asset.status === 'ready' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          asset.status === 'in_repair' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          asset.status === 'wait_parts' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          asset.status === 'external' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {asset.status === 'ready' ? 'พร้อมใช้งาน' :
                           asset.status === 'in_repair' ? 'กำลังซ่อม' :
                           asset.status === 'wait_parts' ? 'รออะไหล่' :
                           asset.status === 'external' ? 'ส่งศูนย์นอก' : 'ปลดระวาง'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {asset.nextPMDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAssetForDetail(asset)}
                            title="ดูประวัติและรายละเอียด"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingAsset(asset)}
                            title="แก้ไขและเติมเต็มข้อมูลครุภัณฑ์"
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedAssetForLedger(asset)}
                            title="พิมพ์แบบฟอร์มทะเบียนคุมทรัพย์สิน (ตามแบบ สธ.)"
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded transition cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedAssetForQR(asset)}
                            title="พิมพ์ฉลาก QR Code"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenNewRepairForAsset(asset)}
                            title="เปิดใบแจ้งซ่อมเครื่องนี้"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Asset Modal */}
      {isNewAssetModalOpen && (
        <NewAssetModal onClose={() => setIsNewAssetModalOpen(false)} />
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <EditAssetModal asset={editingAsset} onClose={() => setEditingAsset(null)} />
      )}

      {/* Annual Procurement & Replacement Justification Report Modal */}
      {isProcurementModalOpen && (
        <ProcurementPlanReportModal onClose={() => setIsProcurementModalOpen(false)} />
      )}

      {/* Batch MOPH Asset Ledger Modal */}
      {isBatchLedgerModalOpen && (
        <BatchAssetLedgerModal assets={filteredAssets} onClose={() => setIsBatchLedgerModalOpen(false)} />
      )}

      {/* Import Asset Data Modal */}
      {isImportModalOpen && (
        <ImportAssetModal onClose={() => setIsImportModalOpen(false)} />
      )}
    </div>
  );
};
