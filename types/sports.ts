export interface TeamInGame {
  id: number;
  name: string;
  logo?: string;
  winner?: boolean;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface Scores {
  halftime: Score;
  fulltime: Score;
  extratime: Score;
  penalty: Score;
}

export interface Venue {
  id?: number | null;
  name: string;
  city: string;
  capacity?: number | null;
  surface?: string | null;
  location?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo?: string;
  round: string;
  season: number;
}

export interface Game {
  id: number;
  sport: string;
  sportId?: string;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  status: {
    long: string;
    short: string;
    elapsed?: number | null;
    timer?: string | null;
    extra?: number | null;
  };
  league: League;
  homeTeam: TeamInGame;
  awayTeam: TeamInGame;
  goals: Score;
  scores: Scores;
  venue: Venue;
  referee?: string | null;
  attendance?: number | null;
  basketballScores?: any;
  baseballScores?: any;
  hockeyScores?: any;
  periods?: any;
  quarters?: any;
  fight?: any;
  fighter1?: any;
  fighter2?: any;
}

export interface SportsWagerCreate {
  game_id: number;
  team: 'home' | 'away';
  wager_amount: number;
  expires_at: string;
  reserved_for?: string;
}
