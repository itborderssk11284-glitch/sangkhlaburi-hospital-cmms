import React from 'react';
import { Printer, X, Download } from 'lucide-react';

interface PrintableReportModalProps {
  reportType: 'repairs' | 'inventory' | 'replacement';
  periodLabel: string;
  departmentFilter: string;
  categoryFilter: string;
  summaryStats: {
    label: string;
    value: string | number;
    sub?: string;
  }[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  onClose: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  reportType,
  periodLabel,
  departmentFilter,
  categoryFilter,
  summaryStats,
  tableHeaders,
  tableRows,
  onClose,
}) => {
  const getReportTitle = () => {
    switch (reportType) {
      case 'repairs':
        return 'รายงานสรุปผลการปฏิบัติงานซ่อมบำรุงรักษาครุภัณฑ์';
      case 'inventory':
        return 'รายงานสรุปยอดคงเหลือคลังพัสดุและชิ้นส่วนอะไหล่ซ่อมบำรุง';
      case 'replacement':
        return 'แบบรายงานสรุปรายการครุภัณฑ์เสนอแผนจัดซื้อใหม่และจัดซื้อทดแทน';
      default:
        return 'รายงานระบบซ่อมบำรุงครุภัณฑ์';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvContent =
      '\uFEFF' +
      [
        `"${getReportTitle()}"`,
        `"ช่วงเวลา: ${periodLabel}"`,
        `"แผนก: ${departmentFilter}"`,
        `"หมวดหมู่: ${categoryFilter}"`,
        '',
        tableHeaders.map((h) => `"${h}"`).join(','),
        ...tableRows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getReportTitle()}_${periodLabel.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Action Controls (Hidden on print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 no-print">
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-md transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>ดาวน์โหลด CSV</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>พิมพ์เอกสารราชการ (Print)</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl shadow-md transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Official Thai Government Style Printable Sheet */}
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl p-6 sm:p-10 my-8 text-slate-900 border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-4 print:w-full">
        {/* Hospital Header & Emblem */}
        <div className="border-b-2 border-slate-800 pb-5 mb-6 text-center relative">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img
              src="/assets/aistudio/Logo_SK_-_______26693d5e.png"
              alt="โรงพยาบาลสังขละบุรี"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div>
              <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">
                โรงพยาบาลสังขละบุรี
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                สำนักงานสาธารณสุขจังหวัดกาญจนบุรี · กระทรวงสาธารณสุข
              </p>
              <p className="text-[11px] text-slate-500">
                กลุ่มงานบริหารทั่วไปและงานซ่อมบำรุงวิศวกรรมการแพทย์ โทรศัพท์ 034-595021 ต่อ 141
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 font-display">
              {getReportTitle()}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-1 text-xs text-slate-700 font-medium">
              <span>
                <strong>ช่วงเวลาการรายงาน:</strong> {periodLabel}
              </span>
              <span>
                <strong>หน่วยงาน/แผนก:</strong> {departmentFilter}
              </span>
              <span>
                <strong>หมวดหมู่:</strong> {categoryFilter}
              </span>
              <span>
                <strong>วันที่จัดพิมพ์:</strong>{' '}
                {new Date().toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 print:bg-slate-100">
          {summaryStats.map((stat, i) => (
            <div key={i} className="text-center sm:text-left">
              <div className="text-[11px] font-semibold text-slate-500">{stat.label}</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {stat.value}
              </div>
              {stat.sub && (
                <div className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto mb-8 border border-slate-300 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">
                  ลำดับ
                </th>
                {tableHeaders.map((th, i) => (
                  <th
                    key={i}
                    className={`py-2.5 px-3 border-r border-slate-300 last:border-r-0 ${
                      th.includes('บาท') || th.includes('ราคา') || th.includes('จำนวน')
                        ? 'text-right'
                        : ''
                    }`}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length + 1}
                    className="py-8 text-center text-slate-500 font-medium"
                  >
                    ไม่มีรายการข้อมูลในช่วงเวลาที่เลือก
                  </td>
                </tr>
              ) : (
                tableRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60 print:bg-white'}
                  >
                    <td className="py-2 px-3 border-r border-slate-300 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    {row.map((cell, cIdx) => {
                      const isNumber =
                        typeof cell === 'number' ||
                        String(cell).startsWith('฿') ||
                        String(cell).endsWith('%');
                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-3 border-r border-slate-300 last:border-r-0 text-slate-800 ${
                            isNumber ? 'text-right font-mono font-medium' : ''
                          }`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Official Endorsement Signature Section (MOPH Standard 3-Signatures) */}
        <div className="pt-6 border-t border-slate-300 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {/* Signature 1 */}
            <div className="flex flex-col items-center">
              <div className="text-slate-600 mb-12">
                ลงชื่อ..........................................................
                <br />
                <span className="text-[11px]">(นายธีรพัฒน์ สมบูรณ์ผล)</span>
              </div>
              <div className="font-semibold text-slate-800">ผู้รายงาน / นายช่างเครื่องมือแพทย์</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                วันที่ ........./........./............
              </div>
            </div>

            {/* Signature 2 */}
            <div className="flex flex-col items-center">
              <div className="text-slate-600 mb-12">
                ลงชื่อ..........................................................
                <br />
                <span className="text-[11px]">(นายอนุรักษ์ วงศ์สว่าง)</span>
              </div>
              <div className="font-semibold text-slate-800">
                ผู้ตรวจสอบ / หัวหน้างานซ่อมบำรุง
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                วันที่ ........./........./............
              </div>
            </div>

            {/* Signature 3 */}
            <div className="flex flex-col items-center">
              <div className="text-slate-600 mb-12">
                ลงชื่อ..........................................................
                <br />
                <span className="text-[11px]">(ผู้อำนวยการโรงพยาบาลสังขละบุรี)</span>
              </div>
              <div className="font-semibold text-slate-800">
                ผู้อนุมัติ / ผู้อำนวยการโรงพยาบาล
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                วันที่ ........./........./............
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
