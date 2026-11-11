export interface Participant {
  id: string;
  sequence: number | string; // 序號
  name: string;             // 姓名
  department: string;       // 部門
}

export interface Prize {
  id: string;
  name: string;             // 獎項名稱 (如: 特獎、頭獎)
  content: string;          // 獎品內容 (如: iPhone 16 Pro)
  quota: number;            // 總名額
  color: string;            // 主題色彩
  batchSize: number;        // 單次抽取人數
}

export interface WinnerRecord {
  id: string;
  sequence: number | string; // 序號
  name: string;             // 姓名
  department: string;       // 部門
  prizeId: string;          // 獎項ID
  prizeName: string;        // 獎項名稱
  prizeContent: string;     // 獎品內容
  ballNumber: number | string; // 球號
  drawnAt: string;          // 抽中時間
  timestamp: number;
}

export interface DrawStepResult {
  ballNumber: number | string;
  participant: Participant;
  prize: Prize;
}
