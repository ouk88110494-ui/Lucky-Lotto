import * as XLSX from 'xlsx';
import { Participant, WinnerRecord } from '../types';

/**
 * Parses an Excel (.xlsx, .xls) or CSV file into Participant[]
 */
export async function parseExcelParticipants(file: File): Promise<Participant[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel 檔案內未找到任何工作表！');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('工作表內容為空！');
  }

  // Find header row or infer columns
  let headerIndex = -1;
  let seqCol = -1;
  let nameCol = -1;
  let deptCol = -1;

  // Check first 5 rows for matching header keywords
  for (let r = 0; r < Math.min(5, rawRows.length); r++) {
    const row = rawRows[r].map((c) => String(c).trim().toLowerCase());
    const foundSeq = row.findIndex((c) =>
      ['序號', '編號', '號碼', '員工編號', '工號', 'no', 'id', 'seq', 'num'].some((k) => c.includes(k))
    );
    const foundName = row.findIndex((c) =>
      ['姓名', '名字', '員工姓名', 'name', '人員'].some((k) => c.includes(k))
    );
    const foundDept = row.findIndex((c) =>
      ['部門', '單位', '組別', '處別', '課別', 'dept', 'department', 'team'].some((k) => c.includes(k))
    );

    if (foundName !== -1) {
      headerIndex = r;
      seqCol = foundSeq;
      nameCol = foundName;
      deptCol = foundDept;
      break;
    }
  }

  const participants: Participant[] = [];
  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;

  // Default column positions if headers weren't explicitly matched
  const finalSeqCol = seqCol >= 0 ? seqCol : 0;
  const finalNameCol = nameCol >= 0 ? nameCol : (finalSeqCol === 0 ? 1 : 0);
  const finalDeptCol = deptCol >= 0 ? deptCol : 2;

  let autoSeq = 1;
  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawName = row[finalNameCol] !== undefined ? String(row[finalNameCol]).trim() : '';
    // Skip empty names
    if (!rawName) continue;

    let rawSeq = row[finalSeqCol] !== undefined ? String(row[finalSeqCol]).trim() : '';
    if (!rawSeq) {
      rawSeq = String(autoSeq);
    }
    const parsedSeqNum = Number(rawSeq);
    const sequence = !isNaN(parsedSeqNum) && parsedSeqNum > 0 ? parsedSeqNum : rawSeq;

    const department = row[finalDeptCol] !== undefined ? String(row[finalDeptCol]).trim() : '未分配';

    participants.push({
      id: `p-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 7)}`,
      sequence,
      name: rawName,
      department: department || '全體同仁',
    });

    autoSeq++;
  }

  if (participants.length === 0) {
    throw new Error('未能從檔案中解析出有效的人員名單，請確認包含「序號」、「姓名」、「部門」欄位。');
  }

  return participants;
}

/**
 * Exports the winner list as an Excel (.xlsx) file
 */
export function exportWinnersToExcel(winners: WinnerRecord[], appTitle = '幸運抽獎機'): void {
  if (winners.length === 0) {
    alert('目前尚無中獎資料可供下載！');
    return;
  }

  const exportData = winners.map((w, index) => ({
    中獎順位: index + 1,
    中獎球號: w.ballNumber,
    人員序號: w.sequence,
    姓名: w.name,
    部門: w.department,
    中獎獎項: w.prizeName,
    獎品內容: w.prizeContent,
    中獎時間: w.drawnAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for optimal reading
  worksheet['!cols'] = [
    { wch: 10 }, // 中獎順位
    { wch: 12 }, // 中獎球號
    { wch: 12 }, // 人員序號
    { wch: 14 }, // 姓名
    { wch: 18 }, // 部門
    { wch: 16 }, // 中獎獎項
    { wch: 32 }, // 獎品內容
    { wch: 22 }, // 中獎時間
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '中獎清冊');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `${appTitle}_中獎清冊_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Exports a blank template with headers and example data for user reference
 */
export function exportParticipantsTemplate(): void {
  const templateData = [
    { 序號: 1, 姓名: '王小明', 部門: '技術研發部' },
    { 序號: 2, 姓名: '李美華', 部門: '行銷業務部' },
    { 序號: 3, 姓名: '張大千', 部門: '人力資源處' },
    { 序號: 4, 姓名: '陳思穎', 部門: '財務管理部' },
    { 序號: 5, 姓名: '林志豪', 部門: '營運維護組' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '名單範本');

  XLSX.writeFile(workbook, '抽獎人員名單_範本.xlsx');
}

/**
 * Export current participants list to Excel
 */
export function exportParticipantsToExcel(participants: Participant[]): void {
  if (participants.length === 0) {
    alert('目前人員名單為空！');
    return;
  }

  const exportData = participants.map((p) => ({
    序號: p.sequence,
    姓名: p.name,
    部門: p.department,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '人員名單');

  XLSX.writeFile(workbook, '現有人員名單.xlsx');
}
