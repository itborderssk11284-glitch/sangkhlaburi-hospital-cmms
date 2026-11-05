import React, { useState } from 'react';
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
  Wind,
  Edit3,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  Upload
} from 'lucide-react';
import { Asset, WorkOrder, PMRecord } from '../../types';
import { QRCodeView } from '../common/QRCodeView';
import { useApp } from '../../context/AppContext';
import { ASSET_CATEGORIES_CONFIG } from '../../data/mockData';
import { EditAssetModal } from './EditAssetModal';

export const AssetDetailModal: React.FC<{
  asset: Asset;
  onClose: () => void;
  onOpenQRBadge: (asset: Asset) => void;
  onOpenNewRepairForAsset: (asset: Asset) => void;
}> = ({ asset, onClose, onOpenQRBadge, onOpenNewRepairForAsset }) => {
  const { workOrders, pmRecords, updateAsset, setSelectedOrderForDetail, setSelectedOrderForPrint, setSelectedAssetForLedger } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleQuickPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const file = files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 900;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          await updateAsset(asset.id, {
            imageUrl: compressed,
            images: [compressed, ...(asset.images || []).filter(x => x !== compressed)]
          });
        }
        setIsUploadingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-medium transition cursor-pointer"
                title="แก้ไขหรือเติมเต็มข้อมูลครุภัณฑ์"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>แก้ไขข้อมูล</span>
              </button>
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

            {/* Right Column: Asset Photo Card & QR Code */}
            <div className="space-y-4">
              {/* Asset Photo Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>ภาพถ่ายครุภัณฑ์</span>
                  </span>
                  <label className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>{asset.imageUrl ? 'เปลี่ยนภาพ' : 'แทรกภาพ'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQuickPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {asset.imageUrl ? (
                  <div 
                    className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-200 bg-white group cursor-pointer"
                    onClick={() => setZoomImage(asset.imageUrl || null)}
                    title="คลิกเพื่อดูภาพขยาย"
                  >
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-full h-full object-contain p-1 group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <ZoomIn className="w-4 h-4" />
                      <span>คลิกเพื่อดูภาพขยาย</span>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:bg-emerald-50/40 hover:text-emerald-700 transition cursor-pointer p-3 text-center">
                    <Camera className="w-8 h-8 mb-1.5 opacity-60 text-slate-400" />
                    <span className="text-xs font-semibold">ยังไม่มีรูปภาพครุภัณฑ์</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">คลิกเพื่อแทรกภาพถ่าย</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQuickPhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
                {isUploadingPhoto && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 animate-pulse flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>กำลังบันทึกภาพถ่ายขึ้น Firebase...</span>
                  </p>
                )}
              </div>

              {/* QR Code and Quick Scan Preview */}
              <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <QRCodeView value={`SKH-ASSET:${asset.code}`} size={110} />
                <span className="font-mono font-bold text-xs text-slate-800 mt-1.5">{asset.code}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  สแกนผ่านกล้องมือถือเพื่อเปิดประวัติการซ่อมบำรุง
                </p>
              </div>
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

        {/* Edit Asset Modal */}
        {isEditing && (
          <EditAssetModal asset={asset} onClose={() => setIsEditing(false)} />
        )}
      </div>

      {/* Enlarged Photo Lightbox Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" 
          onClick={() => setZoomImage(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={zoomImage} 
              alt={asset.name} 
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl" 
            />
            <div className="p-3 text-center text-xs font-semibold text-slate-700 bg-slate-50 border-t border-slate-100 mt-2 rounded-lg">
              <span className="font-mono text-emerald-800 font-bold">{asset.code}</span> · {asset.name} ({asset.brand} {asset.model})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
