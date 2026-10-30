import React from 'react';
import { 
  X, 
  QrCode, 
  Wrench, 
  CalendarCheck, 
  ShieldCheck, 
  Building, 
  Phone, 
  Clock, 
  Tag, 
  AlertCircle,
  FileText,
  Wind
} from 'lucide-react';
import { Asset, WorkOrder, PMRecord } from '../../types';
import { QRCodeView } from '../common/QRCodeView';
import { useApp } from '../../context/AppContext';
import { ASSET_CATEGORIES_CONFIG } from '../../data/mockData';

export const AssetDetailModal: React.FC<{
  asset: Asset;
  onClose: () => void;
  onOpenQRBadge: (asset: Asset) => void;
  onOpenNewRepairForAsset: (asset: Asset) => void;
}> = ({ asset, onClose, onOpenQRBadge, onOpenNewRepairForAsset }) => {
  const { workOrders, pmRecords, setSelectedOrderForDetail, setSelectedOrderForPrint, setSelectedAssetForLedger } = useApp();

  const assetWorkOrders = workOrders.filter(w => w.assetId === asset.id || w.assetCode === asset.code);
  const assetPMRecords = pmRecords.filter(p => p.assetId === asset.id || p.assetCode === asset.code);

  const categoryObj = ASSET_CATEGORIES_CONFIG.find(c => c.id === asset.category);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-xl border border-emerald-700/60">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                  {asset.code}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  asset.criticality === 'life_support' ? 'bg-rose-500/20 text-rose-200 border border-rose-400/30' :
                  asset.criticality === 'high_risk' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' :
                  'bg-emerald-800 text-emerald-200'
                }`}>
                  {asset.criticality === 'life_support' ? 'วิกฤต/ช่วยชีวิต (Life Support)' :
                   asset.criticality === 'high_risk' ? 'ความเสี่ยงสูง (High Risk)' : 'ครุภัณฑ์ทั่วไป (General)'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {asset.name}
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {asset.brand} รุ่น {asset.model} · S/N: {asset.serialNumber} {asset.btu ? `(${asset.btu.toLocaleString()} BTU)` : ''}
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

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Quick Actions & Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">สถานะปัจจุบัน:</span>
              <span className={`font-semibold px-2.5 py-1 rounded-md text-xs ${
                asset.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                asset.status === 'in_repair' ? 'bg-blue-100 text-blue-800' :
                asset.status === 'wait_parts' ? 'bg-amber-100 text-amber-800' :
                asset.status === 'external' ? 'bg-purple-100 text-purple-800' :
                'bg-slate-200 text-slate-700'
              }`}>
                {asset.status === 'ready' ? '● พร้อมใช้งาน' :
                 asset.status === 'in_repair' ? '● กำลังซ่อมบำรุง' :
                 asset.status === 'wait_parts' ? '● รออะไหล่' :
                 asset.status === 'external' ? '● ส่งซ่อมศูนย์นอก' : 'ปลดระวาง'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenNewRepairForAsset(asset)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>เปิดใบแจ้งซ่อมเครื่องนี้</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAssetForLedger(asset);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-300 text-teal-900 hover:bg-teal-100 rounded-lg font-medium transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                <span>ทะเบียนคุมทรัพย์สิน (สธ.)</span>
              </button>
              <button
                onClick={() => onOpenQRBadge(asset)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg font-medium transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>พิมพ์ฉลาก QR</span>
              </button>
            </div>
          </div>

          {/* Asset Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 text-xs md:col-span-2">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                ข้อมูลจำเพาะและสถานที่ติดตั้ง
              </h4>
              <div className="grid grid-cols-2 gap-y-2.5 text-slate-700">
                <div>
                  <span className="text-slate-400 block">หมวดหมู่มาตรฐาน:</span>
                  <span className="font-semibold text-slate-900">{categoryObj?.label || asset.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">แผนกผู้รับผิดชอบ:</span>
                  <span className="font-semibold text-slate-900">{asset.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ตำแหน่งติดตั้งระบุเฉพาะ:</span>
                  <span className="font-semibold text-slate-900">{asset.locationDetail || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">วันที่เริ่มใช้งาน:</span>
                  <span className="font-semibold text-slate-900">{asset.acquisitionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">เกณฑ์อายุการใช้งาน สธ.:</span>
                  <span className="font-semibold text-slate-900">{asset.expectedLifeYears || 8} ปี</span>
                </div>
                <div>
                  <span className="text-slate-400 block">มูลค่าจัดซื้อ (บาท):</span>
                  <span className="font-semibold text-slate-900">{asset.price.toLocaleString()} ฿</span>
                </div>
                <div>
                  <span className="text-slate-400 block">รอบการบำรุงรักษา PM:</span>
                  <span className="font-semibold text-slate-900">ทุก {asset.pmFrequencyMonths} เดือน</span>
                </div>
                <div>
                  <span className="text-slate-400 block">บริษัทผู้จัดจำหน่าย/นำเข้า:</span>
                  <span className="font-semibold text-slate-900">{asset.vendor}</span>
                </div>
              </div>

              {/* Air conditioner specific info */}
              {(asset.category === 'hvac_aircon' || asset.btu) && (
                <div className="mt-3 p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                  <div className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
                    <Wind className="w-4 h-4 text-teal-700" />
                    ข้อมูลเครื่องปรับอากาศ & แผนการล้างแอร์
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">ขนาดความเย็น:</span>
                      <strong className="text-slate-800 font-mono">{asset.btu?.toLocaleString() || '-'} BTU</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ประเภท:</span>
                      <strong className="text-slate-800 uppercase">{asset.acType || 'Split'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">รอบล้างแอร์:</span>
                      <strong className="text-slate-800">ทุก {asset.cleaningFrequencyMonths || 3} เดือน</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">กำหนดล้างครั้งถัดไป:</span>
                      <strong className="text-teal-800 font-bold">{asset.nextCleanDate || asset.nextPMDate}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Schedule Notice */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">วันตรวจ PM ล่าสุด / ถัดไป:</span>
                  <span className="font-semibold text-slate-800">{asset.lastPMDate} → </span>
                  <span className="font-bold text-emerald-800">{asset.nextPMDate}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">วันสอบเทียบ (Calibration) ถัดไป:</span>
                  <span className="font-bold text-teal-800">
                    {asset.nextCalibrationDate || 'ไม่ระบุรอบสอบเทียบ'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code and Quick Scan Preview */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <QRCodeView value={`SKH-ASSET:${asset.code}`} size={130} />
              <span className="font-mono font-bold text-xs text-slate-800 mt-2">{asset.code}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                สแกนผ่านกล้องมือถือหรือเครื่องยิงบาร์โค้ดเพื่อเปิดประวัติการซ่อมบำรุง
              </p>
            </div>
          </div>

          {/* Maintenance & Repair History Timeline */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>ประวัติการแจ้งซ่อมย้อนหลัง ({assetWorkOrders.length} รายการ)</span>
              <span className="text-xs font-semibold text-slate-600">
                รวมค่าซ่อมสะสม: {assetWorkOrders.reduce((s, w) => s + w.totalCost, 0).toLocaleString()} ฿
              </span>
            </h4>

            {assetWorkOrders.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 text-xs">
                ไม่มีประวัติการแจ้งซ่อมสำหรับครุภัณฑ์ชิ้นนี้
              </div>
            ) : (
              <div className="space-y-2">
                {assetWorkOrders.map((wo) => (
                  <div key={wo.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{wo.orderNumber}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{wo.reportDate}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                          wo.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {wo.status === 'completed' ? 'ซ่อมสำเร็จ' : 'กำลังดำเนินการ'}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium mt-1">{wo.symptom}</p>
                      {wo.actionTaken && (
                        <p className="text-slate-500 text-[11px] mt-0.5">การแก้ไข: {wo.actionTaken}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => {
                          setSelectedOrderForDetail(wo);
                          onClose();
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                      >
                        ดูใบงาน
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrderForPrint(wo);
                          onClose();
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="พิมพ์ใบสั่งซ่อม"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PM & Calibration Records */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">
              ประวัติการตรวจเช็ค PM และการสอบเทียบ ({assetPMRecords.length} รายการ)
            </h4>

            {assetPMRecords.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 text-xs">
                ยังไม่มีบันทึกผลการบำรุงรักษาเชิงป้องกัน
              </div>
            ) : (
              <div className="space-y-2">
                {assetPMRecords.map(pm => (
                  <div key={pm.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {pm.type === 'pm' ? 'การตรวจบำรุงรักษาเชิงป้องกัน (PM)' : 
                           pm.type === 'ac_cleaning' ? 'การล้างเครื่องปรับอากาศ (AC Cleaning)' : 
                           'การสอบเทียบทางการแพทย์ (Calibration)'}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                          pm.status === 'passed' ? 'bg-emerald-100 text-emerald-800' :
                          pm.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pm.status === 'passed' ? 'ผ่านเกณฑ์มาตรฐาน' :
                           pm.status === 'overdue' ? 'เกินกำหนด' : 'รอตรวจเช็คตามแผน'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-3">
                        <span>กำหนดตรวจ: {pm.scheduledDate}</span>
                        {pm.deviationRate && <span>ค่าเบี่ยงเบน: {pm.deviationRate}</span>}
                        {pm.certificateNumber && <span>เลขที่ใบรับรอง: {pm.certificateNumber}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
