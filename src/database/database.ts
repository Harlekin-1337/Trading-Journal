import * as SQLite from 'expo-sqlite';
import { Trade, JournalEntry, Stats, AssetType } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('trading_journal.db');
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = getDatabase();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY NOT NULL,
      symbol TEXT NOT NULL,
      assetType TEXT NOT NULL,
      direction TEXT NOT NULL,
      status TEXT NOT NULL,
      entryPrice REAL NOT NULL,
      exitPrice REAL,
      quantity REAL NOT NULL,
      fees REAL NOT NULL DEFAULT 0,
      entryDate TEXT NOT NULL,
      exitDate TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      screenshotUri TEXT,
      pnl REAL,
      pnlPercent REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT NOT NULL,
      linkedTradeIds TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
};

const calculatePnl = (
  direction: string,
  entryPrice: number,
  exitPrice: number | undefined,
  quantity: number,
  fees: number
): { pnl: number | undefined; pnlPercent: number | undefined } => {
  if (!exitPrice) return { pnl: undefined, pnlPercent: undefined };

  let rawPnl: number;
  if (direction === 'Long') {
    rawPnl = (exitPrice - entryPrice) * quantity;
  } else {
    rawPnl = (entryPrice - exitPrice) * quantity;
  }
  const pnl = rawPnl - fees;
  const pnlPercent = (pnl / (entryPrice * quantity)) * 100;
  return { pnl, pnlPercent };
};

const rowToTrade = (row: any): Trade => ({
  id: row.id,
  symbol: row.symbol,
  assetType: row.assetType as AssetType,
  direction: row.direction,
  status: row.status,
  entryPrice: row.entryPrice,
  exitPrice: row.exitPrice ?? undefined,
  quantity: row.quantity,
  fees: row.fees,
  entryDate: row.entryDate,
  exitDate: row.exitDate ?? undefined,
  tags: JSON.parse(row.tags || '[]'),
  notes: row.notes || '',
  screenshotUri: row.screenshotUri ?? undefined,
  pnl: row.pnl ?? undefined,
  pnlPercent: row.pnlPercent ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const rowToJournalEntry = (row: any): JournalEntry => ({
  id: row.id,
  date: row.date,
  title: row.title,
  content: row.content,
  mood: row.mood,
  linkedTradeIds: JSON.parse(row.linkedTradeIds || '[]'),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Trade CRUD
export const insertTrade = (trade: Trade): void => {
  const database = getDatabase();
  const { pnl, pnlPercent } = calculatePnl(
    trade.direction,
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity,
    trade.fees
  );

  database.runSync(
    `INSERT INTO trades (id, symbol, assetType, direction, status, entryPrice, exitPrice, quantity, fees, entryDate, exitDate, tags, notes, screenshotUri, pnl, pnlPercent, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trade.id,
      trade.symbol,
      trade.assetType,
      trade.direction,
      trade.status,
      trade.entryPrice,
      trade.exitPrice ?? null,
      trade.quantity,
      trade.fees,
      trade.entryDate,
      trade.exitDate ?? null,
      JSON.stringify(trade.tags),
      trade.notes,
      trade.screenshotUri ?? null,
      pnl ?? null,
      pnlPercent ?? null,
      trade.createdAt,
      trade.updatedAt,
    ]
  );
};

export const getTrades = (filters?: {
  assetType?: AssetType;
  searchSymbol?: string;
}): Trade[] => {
  const database = getDatabase();
  let query = 'SELECT * FROM trades';
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.assetType) {
    conditions.push('assetType = ?');
    params.push(filters.assetType);
  }

  if (filters?.searchSymbol) {
    conditions.push('symbol LIKE ?');
    params.push(`%${filters.searchSymbol.toUpperCase()}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY entryDate DESC, createdAt DESC';

  const rows = database.getAllSync(query, params);
  return rows.map(rowToTrade);
};

export const getTradeById = (id: string): Trade | null => {
  const database = getDatabase();
  const row = database.getFirstSync('SELECT * FROM trades WHERE id = ?', [id]);
  return row ? rowToTrade(row) : null;
};

export const updateTrade = (trade: Trade): void => {
  const database = getDatabase();
  const { pnl, pnlPercent } = calculatePnl(
    trade.direction,
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity,
    trade.fees
  );

  database.runSync(
    `UPDATE trades SET symbol=?, assetType=?, direction=?, status=?, entryPrice=?, exitPrice=?, quantity=?, fees=?, entryDate=?, exitDate=?, tags=?, notes=?, screenshotUri=?, pnl=?, pnlPercent=?, updatedAt=?
     WHERE id=?`,
    [
      trade.symbol,
      trade.assetType,
      trade.direction,
      trade.status,
      trade.entryPrice,
      trade.exitPrice ?? null,
      trade.quantity,
      trade.fees,
      trade.entryDate,
      trade.exitDate ?? null,
      JSON.stringify(trade.tags),
      trade.notes,
      trade.screenshotUri ?? null,
      pnl ?? null,
      pnlPercent ?? null,
      trade.updatedAt,
      trade.id,
    ]
  );
};

export const deleteTrade = (id: string): void => {
  const database = getDatabase();
  database.runSync('DELETE FROM trades WHERE id = ?', [id]);
};

// Journal CRUD
export const insertJournalEntry = (entry: JournalEntry): void => {
  const database = getDatabase();
  database.runSync(
    `INSERT INTO journal_entries (id, date, title, content, mood, linkedTradeIds, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.title,
      entry.content,
      entry.mood,
      JSON.stringify(entry.linkedTradeIds),
      entry.createdAt,
      entry.updatedAt,
    ]
  );
};

export const getJournalEntries = (moodFilter?: string): JournalEntry[] => {
  const database = getDatabase();
  let query = 'SELECT * FROM journal_entries';
  const params: any[] = [];

  if (moodFilter && moodFilter !== 'all') {
    query += ' WHERE mood = ?';
    params.push(moodFilter);
  }

  query += ' ORDER BY date DESC, createdAt DESC';

  const rows = database.getAllSync(query, params);
  return rows.map(rowToJournalEntry);
};

export const getJournalEntryById = (id: string): JournalEntry | null => {
  const database = getDatabase();
  const row = database.getFirstSync('SELECT * FROM journal_entries WHERE id = ?', [id]);
  return row ? rowToJournalEntry(row) : null;
};

export const updateJournalEntry = (entry: JournalEntry): void => {
  const database = getDatabase();
  database.runSync(
    `UPDATE journal_entries SET date=?, title=?, content=?, mood=?, linkedTradeIds=?, updatedAt=?
     WHERE id=?`,
    [
      entry.date,
      entry.title,
      entry.content,
      entry.mood,
      JSON.stringify(entry.linkedTradeIds),
      entry.updatedAt,
      entry.id,
    ]
  );
};

export const deleteJournalEntry = (id: string): void => {
  const database = getDatabase();
  database.runSync('DELETE FROM journal_entries WHERE id = ?', [id]);
};

// Stats
export const getStats = (): Stats => {
  const database = getDatabase();

  const allTrades = getTrades();
  const closedTrades = allTrades.filter(t => t.status === 'Closed' && t.pnl !== undefined);
  const openTrades = allTrades.filter(t => t.status === 'Open');

  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const winningTrades = closedTrades.filter(t => (t.pnl ?? 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl ?? 0) <= 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0) / winningTrades.length
    : 0;

  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0) / losingTrades.length)
    : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

  const pnlValues = closedTrades.map(t => t.pnl ?? 0);
  const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

  // Cumulative P&L series
  const sortedClosed = [...closedTrades].sort(
    (a, b) => new Date(a.exitDate ?? a.entryDate).getTime() - new Date(b.exitDate ?? b.entryDate).getTime()
  );
  let cumulative = 0;
  const cumulativePnlSeries = sortedClosed.map(t => {
    cumulative += t.pnl ?? 0;
    return { date: t.exitDate ?? t.entryDate, value: cumulative };
  });

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;
  for (const t of sortedClosed) {
    runningPnl += t.pnl ?? 0;
    if (runningPnl > peak) peak = runningPnl;
    const drawdown = peak - runningPnl;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Monthly data
  const monthlyMap: Record<string, { pnl: number; trades: number }> = {};
  for (const t of closedTrades) {
    const dateStr = t.exitDate ?? t.entryDate;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { pnl: 0, trades: 0 };
    monthlyMap[key].pnl += t.pnl ?? 0;
    monthlyMap[key].trades += 1;
  }
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Asset stats
  const assetMap: Partial<Record<AssetType, { pnl: number; trades: number; wins: number }>> = {};
  const assetTypes: AssetType[] = ['Stocks', 'Forex', 'Crypto', 'Options', 'Futures'];

  for (const t of closedTrades) {
    if (!assetMap[t.assetType]) assetMap[t.assetType] = { pnl: 0, trades: 0, wins: 0 };
    assetMap[t.assetType]!.pnl += t.pnl ?? 0;
    assetMap[t.assetType]!.trades += 1;
    if ((t.pnl ?? 0) > 0) assetMap[t.assetType]!.wins += 1;
  }

  const assetStats = assetTypes
    .filter(at => assetMap[at])
    .map(at => ({
      assetType: at,
      totalPnl: assetMap[at]!.pnl,
      trades: assetMap[at]!.trades,
      winRate: assetMap[at]!.trades > 0 ? (assetMap[at]!.wins / assetMap[at]!.trades) * 100 : 0,
    }));

  return {
    totalPnl,
    winRate,
    totalTrades: allTrades.length,
    openTrades: openTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin,
    avgLoss,
    profitFactor,
    maxDrawdown,
    bestTrade,
    worstTrade,
    cumulativePnlSeries,
    monthlyData,
    assetStats,
  };
};
