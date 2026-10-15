export interface PurchasedPlayer {
  registration_id: string;
  player_name: string;
  role_or_pos: string;
  sold_price: number;
  poster_url?: string | null;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  logo_url?: string | null;
  owner_name: string;
  owner_phone: string;
  representative_user_id?: string | null;
  initial_budget: number;
  remaining_budget: number;
  roster_limit: number;
  purchased_players_count: number;
  purchased_players: PurchasedPlayer[];
  created_at: string;
  updated_at: string;
}

export interface AuctionPlayerLot {
  registration_id: string;
  player_id: string;
  player_name: string;
  sport: string;
  role_or_pos: string;
  jersey_number?: string | null;
  poster_url?: string | null;
  serial_number?: number | null;
  serial_str?: string | null;
  village?: string | null;
  role?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  base_price: number;
  current_bid: number;
  highest_bidder_team_id?: string | null;
  highest_bidder_team_name?: string | null;
  status: "AVAILABLE" | "IN_AUCTION" | "SOLD" | "UNSOLD";
  sold_price?: number | null;
  sold_to_team_id?: string | null;
  sold_to_team_name?: string | null;
}

export interface BidRecord {
  id: string;
  auction_id: string;
  lot_registration_id: string;
  team_id: string;
  team_name: string;
  amount: number;
  timestamp: string;
}

export interface AuctionState {
  id: string;
  tournament_id: string;
  name: string;
  sport?: string | null;
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  base_price_default: number;
  min_bid_increment: number;
  timer_seconds: number;
  timer_deadline?: string | null;
  current_lot_index: number;
  current_lot?: AuctionPlayerLot | null;
  all_lots?: AuctionPlayerLot[];
  total_lots_count: number;
  sold_lots_count: number;
  unsold_lots_count: number;
  bids_history: BidRecord[];
  teams: Team[];
}
