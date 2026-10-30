import React, { useState } from 'react';
import { 
  PackageSearch, 
  AlertTriangle, 
  Plus, 
  Download, 
  Search, 
  PlusCircle, 
  PackagePlus, 
  CheckCircle2, 
  MapPin, 
  Tag, 
  X,
  TrendingDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SparePart } from '../../types';

export const InventoryManagement: React.FC = () => {
  const { spareParts, addSparePart, restockPart } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Restock modal
  const [restockTargetPart, setRestockTargetPart] = useState<SparePart | null>(null);
  const [restockQty, setRestockQty] = useState(5);

  // New part modal
  const [isNewPartModalOpen, setIsNewPartModalOpen] = useState(false);
  const [code, setCode] = useState(`SP-MED-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('สายสัญญาณและเซ็นเซอร์');
  const [quantity, setQuantity] = useState(10);
  const [minimumQuantity, setMinimumQuantity] = useState(3);
  const [unit, setUnit] = useState('ชิ้น');
  const [unitPrice, setUnitPrice] = useState(1500);
  const [location, setLocation] = useState('ตู้ A-01 ชั้น 2 ห้องช่างเครื่องมือแพทย์');
  const [supplier, setSupplier] = useState('');

  // Extract unique categories
  const categories = ['ทั้งหมด', ...Array.from(new Set(spareParts.map(p => p.category)))];

  // Filtering
  const filteredParts = spareParts.filter((part) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      part.code.toLowerCase().includes(q) ||
      part.name.toLowerCase().includes(q) ||
      part.location.toLowerCase().includes(q) ||
      part.supplier.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'ทั้งหมด' || part.category === categoryFilter;
    const matchesLowStock = !filterLowStockOnly || part.quantity <= part.minimumQuantity;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = spareParts.filter(p => p.quantity <= p.minimumQuantity).length;
  const totalStockValue = spareParts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTargetPart) return;
    restockPart(restockTargetPart.id, Number(restockQty));
    setRestockTargetPart(null);
  };

  const handleCreateNewPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    addSparePart({
      code,
      name,
      category,
      quantity: Number(quantity) || 0,
      minimumQuantity: Number(minimumQuantity) || 1,
      unit,
      unitPrice: Number(unitPrice) || 0,
      location,
      supplier: supplier || 'บริษัทเวชภัณฑ์การแพทย์',
      lastRestockedDate: new Date().toISOString().slice(0, 10),
    });

    setIsNewPartModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['รหัสอะไหล่', 'ชื่ออะไหล่', 'หมวดหมู่', 'จำนวนคงเหลือ', 'จุดสั่งซื้อขั้นต่ำ', 'หน่วย', 'ราคาต่อหน่วย(บาท)', 'มูลค่ารวม(บาท)', 'ตำแหน่งจัดเก็บ'];
    const rows = filteredParts.map(p => [
      `"${p.code}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.quantity,
      p.minimumQuantity,
      `"${p.unit}"`,
      p.unitPrice,
      p.quantity * p.unitPrice,
      `"${p.location}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `คลังอะไหล่ครุภัณฑ์_รพ_สังขละบุรี_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            ระบบจัดการอะไหล่และคลังวัสดุ (Spare Parts Inventory)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ควบคุมสต็อกชิ้นส่วนและวัสดุสิ้นเปลืองทางการแพทย์ การเบิกจ่ายผูกกับใบแจ้งซ่อม และการเตือนจุดสั่งซื้อขั้นต่ำ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={() => setIsNewPartModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการอะไหล่ใหม่</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">จำนวนรายการอะไหล่ทั้งหมด</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{spareParts.length}</span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ครอบคลุมทั้งเครื่องมือแพทย์และระบบสนับสนุน</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">มูลค่าอะไหล่คงคลังรวม</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-800">
              {totalStockValue.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">บาท</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">มูลค่าทรัพย์สินตามราคาต้นทุนต่อหน่วย</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${
          lowStockCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">รายการที่ใกล้หมด (Low Stock)</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800">{lowStockCount}</span>
            <span className="text-xs text-amber-700">รายการต่ำกว่า Safety Stock</span>
          </div>
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 mt-1 underline cursor-pointer"
          >
            {filterLowStockOnly ? 'แสดงรายการทั้งหมด' : 'กรองเฉพาะรายการที่ต้องสั่งซื้อด่วน'}
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหารหัสอะไหล่, ชื่อ, ตำแหน่งจัดเก็บ, ผู้จำหน่าย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterLowStockOnly}
                onChange={(e) => setFilterLowStockOnly(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded"
              />
              <span className="font-medium">แสดงเฉพาะอะไหล่ใกล้หมด (Reorder Needed)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">รหัสอะไหล่</th>
                <th className="py-3 px-4">ชื่ออะไหล่ / ชิ้นส่วน</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4 text-center">คงเหลือ / ขั้นต่ำ</th>
                <th className="py-3 px-4 text-right">ราคาต่อหน่วย</th>
                <th className="py-3 px-4">ตำแหน่งจัดเก็บ (Shelf)</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบรายการอะไหล่ตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const isLow = part.quantity <= part.minimumQuantity;
                  return (
                    <tr key={part.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {part.code}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{part.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">บ.ผู้จำหน่าย: {part.supplier}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {part.category}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-bold font-mono text-sm ${
                            isLow ? 'text-rose-600' : 'text-slate-900'
                          }`}>
                            {part.quantity}
                          </span>
                          <span className="text-slate-400">/ {part.minimumQuantity} {part.unit}</span>
                          {isLow && (
                            <span className="p-0.5 rounded bg-rose-100 text-rose-700" title="สต็อกต่ำกว่าจุดสั่งซื้อขั้นต่ำ">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {part.unitPrice.toLocaleString()} ฿
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{part.location}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setRestockTargetPart(part);
                            setRestockQty(5);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-xs border border-emerald-200 transition cursor-pointer"
                        >
                          รับเข้าสต็อก (+)
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockTargetPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-auto overflow-hidden border border-slate-200">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">รับอะไหล่เข้าคลัง (Goods Receipt)</h3>
                <p className="text-xs text-emerald-200/80">{restockTargetPart.name}</p>
              </div>
              <button
                onClick={() => setRestockTargetPart(null)}
                className="p-1 text-emerald-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">รหัสอะไหล่: <strong className="text-slate-800 font-mono">{restockTargetPart.code}</strong></div>
                <div className="text-slate-500">ยอดคงเหลือปัจจุบัน: <strong className="text-slate-800">{restockTargetPart.quantity} {restockTargetPart.unit}</strong></div>
                <div className="text-slate-500">ตำแหน่งจัดเก็บ: <strong className="text-slate-800">{restockTargetPart.location}</strong></div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  จำนวนที่รับเข้าคลัง ({restockTargetPart.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-sm text-center"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRestockTargetPart(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  ยืนยันเพิ่มสต็อก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Spare Part Modal */}
      {isNewPartModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-auto overflow-hidden border border-slate-200">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">เพิ่มรายการอะไหล่ในคลังใหม่</h3>
              <button
                onClick={() => setIsNewPartModalOpen(false)}
                className="p-1 text-emerald-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPart} className="p-6 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รหัสอะไหล่ *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">หมวดหมู่</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="สายสัญญาณและเซ็นเซอร์">สายสัญญาณและเซ็นเซอร์</option>
                    <option value="แบตเตอรี่ทางการแพทย์">แบตเตอรี่ทางการแพทย์</option>
                    <option value="ไส้กรองและฟิลเตอร์">ไส้กรองและฟิลเตอร์</option>
                    <option value="ชิ้นส่วนอิเล็กทรอนิกส์">ชิ้นส่วนอิเล็กทรอนิกส์</option>
                    <option value="ชิ้นส่วนแมคคาทรอนิกส์">ชิ้นส่วนแมคคาทรอนิกส์</option>
                    <option value="อุปกรณ์ไอทีและเครือข่าย">อุปกรณ์ไอทีและเครือข่าย</option>
                    <option value="อุปกรณ์เสริม">อุปกรณ์เสริม</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่ออะไหล่ / วัสดุสิ้นเปลือง *</label>
                <input
                  type="text"
                  placeholder="เช่น แผ่นตรวจ ECG Lead Cable 5-wire"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จำนวนตั้งต้น</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จุดสั่งซื้อขั้นต่ำ</label>
                  <input
                    type="number"
                    value={minimumQuantity}
                    onChange={(e) => setMinimumQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    placeholder="เช่น ชิ้น, ก้อน, เส้น"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ราคาต่อหน่วย (บาท)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ตำแหน่งเก็บในห้องช่าง</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">บริษัทผู้จัดจำหน่าย / ซัพพลายเออร์</label>
                <input
                  type="text"
                  placeholder="เช่น บ.เมดิคอล ซัพพลาย จำกัด"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPartModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกอะไหล่ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
