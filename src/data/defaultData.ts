import { Participant, Prize } from '../types';

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'p-01', sequence: 1, name: '陳建銘', department: '研發處' },
  { id: 'p-02', sequence: 2, name: '林怡君', department: '行銷推廣部' },
  { id: 'p-03', sequence: 3, name: '黃冠宇', department: '雲端架構組' },
  { id: 'p-04', sequence: 4, name: '張雅雯', department: '人力資源部' },
  { id: 'p-05', sequence: 5, name: '李俊毅', department: '財務管理部' },
  { id: 'p-06', sequence: 6, name: '王敏婷', department: '使用者體驗組' },
  { id: 'p-07', sequence: 7, name: '吳承翰', department: '研發處' },
  { id: 'p-08', sequence: 8, name: '蔡佳純', department: '行銷推廣部' },
  { id: 'p-09', sequence: 9, name: '劉子豪', department: '產品規劃處' },
  { id: 'p-10', sequence: 10, name: '鄭惠芬', department: '法務專利組' },
  { id: 'p-11', sequence: 11, name: '楊宗翰', department: '營運工程部' },
  { id: 'p-12', sequence: 12, name: '許文綺', department: '行政總務部' },
  { id: 'p-13', sequence: 13, name: '謝政宏', department: '研發處' },
  { id: 'p-14', sequence: 14, name: '曾心怡', department: '客戶成功部' },
  { id: 'p-15', sequence: 15, name: '洪嘉鴻', department: '數據分析組' },
  { id: 'p-16', sequence: 16, name: '郭亭妤', department: '視覺設計組' },
  { id: 'p-17', sequence: 17, name: '邱建邦', department: '資訊安全課' },
  { id: 'p-18', sequence: 18, name: '周佩芬', department: '海外拓展部' },
  { id: 'p-19', sequence: 19, name: '廖柏翰', department: '研發處' },
  { id: 'p-20', sequence: 20, name: '賴詩涵', department: '行銷推廣部' },
  { id: 'p-21', sequence: 21, name: '江啟銘', department: '系統運維部' },
  { id: 'p-22', sequence: 22, name: '葉佳蓉', department: '公關溝通組' },
  { id: 'p-23', sequence: 23, name: '蘇育賢', department: '產品規劃處' },
  { id: 'p-24', sequence: 24, name: '潘佩君', department: '品質保證部' },
  { id: 'p-25', sequence: 25, name: '呂志強', department: '研發處' },
  { id: 'p-26', sequence: 26, name: '盧雅婷', department: '財務管理部' },
  { id: 'p-27', sequence: 27, name: '梁廷宇', department: '數位轉型處' },
  { id: 'p-28', sequence: 28, name: '顏佳恩', department: '客戶成功部' },
  { id: 'p-29', sequence: 29, name: '柯智凱', department: '商業情報組' },
  { id: 'p-30', sequence: 30, name: '翁美玉', department: '人力資源部' },
];

export const DEFAULT_PRIZES: Prize[] = [
  {
    id: 'prize-1',
    name: '特等獎',
    content: 'Apple iPhone 16 Pro 256GB',
    quota: 1,
    color: '#F59E0B', // Amber Gold
    batchSize: 1,
  },
  {
    id: 'prize-2',
    name: '頭等獎',
    content: 'Dyson Supersonic 吹風機旗艦組',
    quota: 2,
    color: '#EC4899', // Pink / Rose
    batchSize: 1,
  },
  {
    id: 'prize-3',
    name: '貳獎',
    content: '日本東京雙人來回機票兌換券',
    quota: 2,
    color: '#8B5CF6', // Purple
    batchSize: 1,
  },
  {
    id: 'prize-4',
    name: '參獎',
    content: '現金獎勵 NT$ 10,000 元',
    quota: 3,
    color: '#3B82F6', // Blue
    batchSize: 1,
  },
  {
    id: 'prize-5',
    name: '幸運獎',
    content: '遠東SOGO百貨禮券 NT$ 2,000 元',
    quota: 5,
    color: '#10B981', // Emerald
    batchSize: 1,
  },
];
