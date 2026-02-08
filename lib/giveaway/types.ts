/**
 * Types for the Giveaway Roulette Wheel system
 */

/**
 * Represents a single tag in the parsed comments
 * (the tagger and the tagged person)
 */
export interface ParsedTag {
  tagger: string;
  tagged: string;
  commentIndex: number; // Original comment line index
}

/**
 * Result of parsing Instagram comments
 */
export interface ParsedEntry {
  tags: ParsedTag[];
  totalEntries: number;
  errors: string[];
}

/**
 * An individual entry in the wheel
 * Each tag = one entry
 */
export interface WheelEntry {
  id: string; // Unique ID for this entry
  tagger: string;
  tagged: string;
  displayName: string; // "Tagger tagged Tagged"
}

/**
 * Represents a winner of the giveaway
 */
export interface Winner {
  type: 'tagger' | 'tagged';
  username: string;
}

/**
 * Complete winner information for both people
 */
export interface GiveawayWinner {
  tagger: string;
  tagged: string;
  wheelEntryId: string;
  selectedAt: Date;
}

/**
 * Data structure stored in Supabase entry_data column
 */
export interface GiveawayEntryData {
  tags: ParsedTag[];
  totalEntries: number;
  wheelEntries: WheelEntry[];
}

/**
 * Data structure stored in Supabase winner_data column
 */
export interface GiveawayWinnerData {
  tagger: string;
  tagged: string;
  wheelEntryId: string;
  selectedAt: string; // ISO timestamp
}

/**
 * Database giveaway record
 */
export interface GiveawayRecord {
  id: string;
  giveaway_name: string;
  entry_data: GiveawayEntryData;
  winner_data: GiveawayWinnerData | null;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

/**
 * Result from the giveaway process
 */
export interface GiveawayResult {
  giveawayId: string;
  giveawayName: string;
  winner: GiveawayWinner;
  totalEntries: number;
  timestamp: Date;
}

/**
 * Response from parse API
 */
export interface ParseResponse {
  success: boolean;
  data?: ParsedEntry;
  wheelEntries?: WheelEntry[];
  error?: string;
}

/**
 * Response from save API
 */
export interface SaveResponse {
  success: boolean;
  giveawayId?: string;
  message?: string;
  error?: string;
}

/**
 * Response from history API
 */
export interface HistoryResponse {
  success: boolean;
  data?: GiveawayRecord[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}
