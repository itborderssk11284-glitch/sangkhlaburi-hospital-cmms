import React from 'react';
import { Printer, X } from 'lucide-react';
import { Asset } from '../../types';
import { QRCodeView } from './QRCodeView';

export const PrintableQRBadge: React.FC<{
  asset: Asset;
  onClose: () => void;
}> = ({ asset, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Top Control Bar */}
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">พิมพ์ฉลากติดครุภัณฑ์ (Asset Identification Label)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>สั่งพิมพ์ฉลาก</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Label View */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-100">
          <div className="text-xs text-slate-500 mb-3 text-center no-print">
            ตัวอย่างฉลากมาตรฐานขนาด 8.5 x 5.0 ซม. (ใช้ติดบนตัวเครื่องครุภัณฑ์)
          </div>

          {/* Actual Badge Content */}
          <div 
            id="printable-badge"
            className="w-full max-w-sm bg-white border-2 border-emerald-900 rounded-lg p-4 shadow-sm text-slate-900 font-sans"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-emerald-900 pb-2 mb-2.5">
              <img
                src="/assets/aistudio/Logo_SK_-_______26693d5e.png"
                alt="Logo"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-emerald-950 uppercase leading-tight">
                  โรงพยาบาลสังขละบุรี
                </div>
                <div className="text-[9px] text-slate-600 font-medium">
                  งานซ่อมบำรุงวิศวกรรมการแพทย์
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  asset.criticality === 'life_support' ? 'bg-rose-100 text-rose-800' :
                  asset.criticality === 'high_risk' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {asset.criticality === 'life_support' ? 'LIFE SUPPORT' :
                   asset.criticality === 'high_risk' ? 'HIGH RISK' : 'GENERAL'}
                </span>
              </div>
            </div>

            {/* Body with QR Code */}
            <div className="flex gap-3 items-center">
              <div className="shrink-0 border border-slate-200 rounded p-1 bg-white">
                <QRCodeView value={`SKH-ASSET:${asset.code}`} size={76} />
                <span className="text-[8px] text-slate-500 block text-center mt-0.5 font-mono">SCAN INFO</span>
              </div>

              <div className="flex-1 min-w-0 space-y-1 text-[11px]">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">รหัสครุภัณฑ์ (Asset No.)</span>
                  <span className="font-bold font-mono text-emerald-900 text-sm leading-tight block truncate">
                    {asset.code}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-500 block">ชื่อครุภัณฑ์:</span>
                  <span className="font-semibold text-slate-900 line-clamp-2 leading-tight">
                    {asset.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] pt-0.5">
                  <div>
                    <span className="text-slate-500">S/N: </span>
                    <span className="font-mono font-medium">{asset.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ที่ตั้ง: </span>
                    <span className="font-medium truncate">{asset.department.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-600">
              <div>
                <span>รอบตรวจ PM: <strong>ทุก {asset.pmFrequencyMonths} เดือน</strong></span>
              </div>
              <div className="text-right">
                <span>แจ้งซ่อมโทร: <strong>034-595021 ต่อ 141</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
