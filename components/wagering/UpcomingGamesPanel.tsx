'use client';

import React, { useState, useMemo } from 'react';
import { Search, Trophy, Clock, Calendar, RefreshCw } from 'lucide-react';
import type { Game } from '@/types/sports';
import { useAllGames, filterGamesByStatus, getAllGamesFlat } from '@/lib/hooks/useAllGames';

export type { Game } from '@/types/sports';

interface UpcomingGamesPanelProps {
  onCreateWager?: (game: Game, sport: string) => void;
  onWagerCreated?: () => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export function UpcomingGamesPanel({ onCreateWager, onWagerCreated }: UpcomingGamesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'live'>('upcoming');
  
  const { isLoading, error, games, refreshGames } = useAllGames();

  // Filter games by status
  const upcomingGames = useMemo(() => filterGamesByStatus(games, 'upcoming'), [games]);
  const liveGames = useMemo(() => filterGamesByStatus(games, 'live'), [games]);
  
  // Get active games based on tab
  const activeGames = activeTab === 'upcoming' ? upcomingGames : liveGames;
  
  // Flatten all games for display
  const allGamesFlat = useMemo(() => {
    if (selectedSport === 'all') {
      return getAllGamesFlat(activeGames);
    }
    return activeGames[selectedSport] || [];
  }, [activeGames, selectedSport]);

  // Filter by search query
  const filteredGames = useMemo(() => {
    if (!searchQuery) return allGamesFlat;
    
    const query = searchQuery.toLowerCase();
    return allGamesFlat.filter(game => 
      game.homeTeam?.name?.toLowerCase().includes(query) ||
      game.awayTeam?.name?.toLowerCase().includes(query) ||
      (typeof game.league === 'object' && game.league?.name?.toLowerCase().includes(query))
    );
  }, [allGamesFlat, searchQuery]);

  // Get unique sports for tabs
  const availableSports = useMemo(() => {
    const sports = Object.keys(activeGames).filter(sport => activeGames[sport].length > 0);
    return ['all', ...sports];
  }, [activeGames]);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'Varien, sans-serif' }}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            style={{ fontFamily: 'Varien, sans-serif' }}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={{ fontFamily: 'Varien, sans-serif' }}
        >
          Upcoming ({Object.values(upcomingGames).flat().length})
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'live'
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={{ fontFamily: 'Varien, sans-serif' }}
        >
          Live ({Object.values(liveGames).flat().length})
        </button>
        <button
          onClick={() => refreshGames()}
          className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          title="Refresh games"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sport Filters */}
      <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
        {availableSports.map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedSport === sport
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'Varien, sans-serif' }}
          >
            {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Games List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading games...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => refreshGames()}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No {activeTab} games found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredGames.map((game) => (
            <div
              key={game.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              style={{ background: 'rgba(255, 255, 255, 0.8)' }}
              onClick={() => onCreateWager?.(game, game.sport || 'unknown')}
            >
              {/* Game Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {typeof game.league === 'object' && game.league?.logo && (
                    <img src={game.league.logo} alt="" className="w-5 h-5" />
                  )}
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {typeof game.league === 'object' ? game.league?.name || 'Unknown League' : game.league}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{game.date}</span>
                  <Clock className="w-3 h-3 ml-1" />
                  <span>{game.time}</span>
                </div>
              </div>

              {/* Teams */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {game.homeTeam?.logo && (
                    <img src={game.homeTeam.logo} alt="" className="w-8 h-8 rounded-full object-contain" />
                  )}
                  <span className="font-medium text-gray-800">{game.homeTeam?.name || 'Home Team'}</span>
                </div>
                <span className="text-gray-400 font-bold mx-4">VS</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="font-medium text-gray-800">{game.awayTeam?.name || 'Away Team'}</span>
                  {game.awayTeam?.logo && (
                    <img src={game.awayTeam.logo} alt="" className="w-8 h-8 rounded-full object-contain" />
                  )}
                </div>
              </div>

              {/* Live Score */}
              {activeTab === 'live' && game.goals && (
                <div className="flex items-center justify-center mt-3 py-2 bg-red-50 rounded-lg">
                  <span className="text-red-600 font-bold text-lg">
                    {game.goals.home} - {game.goals.away}
                  </span>
                  {game.status && typeof game.status === 'object' && game.status.elapsed && (
                    <span className="ml-2 text-xs text-red-500">{game.status.elapsed}'</span>
                  )}
                </div>
              )}

              {/* Create Wager Button */}
              <button
                className="w-full mt-3 py-2 px-4 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #06ffa5 0%, #3a86ff 100%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateWager?.(game, game.sport || 'unknown');
                }}
              >
                Create Wager
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-center text-gray-500">
          Click on any game to create a wager
        </p>
      </div>
    </div>
  );
}

export default UpcomingGamesPanel;
