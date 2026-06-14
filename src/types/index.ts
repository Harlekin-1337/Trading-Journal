export type AssetType = 'Stocks' | 'Forex' | 'Crypto' | 'Options' | 'Futures';

export type TradeDirection = 'Long' | 'Short';

export type TradeStatus = 'Open' | 'Closed';

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface Trade {
  id: string;
  symbol: string;
  assetType: AssetType;
  direction: TradeDirection;
  status: TradeStatus;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  fees: number;
  entryDate: string; // ISO date string
  exitDate?: string; // ISO date string
  tags: string[];
  notes: string;
  screenshotUri?: string;
  pnl?: number;
  pnlPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  title: string;
  content: string;
  mood: Mood;
  linkedTradeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  cumulativePnlSeries: { date: string; value: number }[];
  monthlyData: { month: string; pnl: number; trades: number }[];
  assetStats: {
    assetType: AssetType;
    totalPnl: number;
    trades: number;
    winRate: number;
  }[];
}

export interface MoodOption {
  value: Mood;
  emoji: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'bad', emoji: '😟', label: 'Bad' },
  { value: 'terrible', emoji: '😫', label: 'Terrible' },
];

export const ASSET_TYPES: AssetType[] = ['Stocks', 'Forex', 'Crypto', 'Options', 'Futures'];

export const ASSET_ICONS: Record<AssetType, string> = {
  Stocks: '📈',
  Forex: '💱',
  Crypto: '₿',
  Options: '⚙️',
  Futures: '📊',
};
