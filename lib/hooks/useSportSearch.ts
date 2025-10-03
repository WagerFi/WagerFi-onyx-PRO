import { useState, useCallback, useEffect } from 'react';
import { TeamResult, Game } from '../types/sports';

export interface UseSportSearchProps {
  sportId: string;
  sportName: string;
}

// Extract fetchSportsApi as a standalone function and export it
export const fetchSportsApi = async (endpoint: string, params?: Record<string, any>, sportId?: string, sportTypeOverride?: string): Promise<any> => {
  const backgroundWorkerUrl = import.meta.env.VITE_BACKGROUND_WORKER_URL || 'https://backgroundworker-ltw3.onrender.com';

  try {
    const response = await fetch(`${backgroundWorkerUrl}/sports-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint,
        params,
        sportId: sportTypeOverride || sportId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Error fetching sports data from ${endpoint}:`, err);
    throw err;
  }
};

export const useSportSearch = ({ sportId }: UseSportSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamResult | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showWagerModal, setShowWagerModal] = useState(false);
  const [isVsSearch, setIsVsSearch] = useState(false);

  // New state for search results shown in dropdown
  const [searchResults, setSearchResults] = useState<TeamResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use the exported fetchSportsApi function but memoize it with the current sportId
  const fetchSportsApiWithSportId = useCallback(
    (endpoint: string, params?: Record<string, any>, sportTypeOverride?: string): Promise<any> => {
      return fetchSportsApi(endpoint, params, sportId, sportTypeOverride);
    },
    [sportId]
  );


  // Function to decode HTML entities and fix UTF-8 character encoding issues
  const decodeHtmlEntities = useCallback((text: string): string => {
    if (!text) return '';

    // First decode standard HTML entities
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;

    // Get the value after basic HTML entity decoding
    let decoded = textArea.value;

    // Handle unicode character references and problematic character encodings
    decoded = decoded
      // Replace decimal character references (e.g., &#241; for ñ)
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      // Replace specific problematic characters and encodings
      .replace(/&(#x[0-9a-f]+|[a-z]+);/gi, match => {
        if (match === '&amp;') return '&';
        if (match === '&lt;') return '<';
        if (match === '&gt;') return '>';
        if (match === '&quot;') return '"';
        if (match === '&apos;' || match === '&#39;') return "'";
        if (match === '&ntilde;' || match === '&#241;' || match === '&#x00F1;') return 'ñ';
        if (match === '&Ntilde;' || match === '&#209;' || match === '&#x00D1;') return 'Ñ';
        return match;
      })
      // Replace problematic UTF-8 encodings that might appear
      .replace(/Pe(Ã±|Ã'|ñ)a/g, 'Peña')
      .replace(/PeÃ±a/g, 'Peña')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã'/g, 'Ñ');

    // Normalize Unicode (NFC combines characters and their diacritical marks)
    return decoded.normalize('NFC');
  }, []);

  // Function to normalize search queries - properly handle special characters
  const normalizeQuery = useCallback((query: string): string => {
    // We preserve special characters but trim whitespace
    // This helps with names containing apostrophes (e.g., O'Malley, D'Amato)
    return query.trim();
  }, []);

  // Search for teams as user types
  useEffect(() => {
    // Debounce function to prevent too many API calls
    const debounceSearch = setTimeout(async () => {
      // Updated to require at least 4 characters before searching
      if (searchQuery.trim().length < 4 || isVsSearch) {
        setSearchResults([]);
        return;
      }

      // Don't search if it looks like a vs search
      if (/\s+(?:v|vs|VS)\s+/.test(searchQuery)) {
        return;
      }

      setIsSearching(true);

      try {
        // Choose the appropriate endpoint based on the sport
        let endpoint;
        let params: Record<string, any> = { search: searchQuery };

        if (sportId === 'soccer') {
          endpoint = 'teams';
        } else if (sportId === 'mma') {
          endpoint = 'fighters';
        } else {
          endpoint = 'teams';
        }

        // Use the fetchSportsApi function which now calls the backgroundWorker
        const data = await fetchSportsApiWithSportId(endpoint, params);

        if (data.response && Array.isArray(data.response)) {
          let results: TeamResult[];

          // Parse based on sport type
          if (sportId === 'soccer') {
            results = data.response.map((item: any) => ({
              id: item.team.id,
              name: item.team.name,
              country: item.team.country || 'Unknown',
              logo: item.team.logo
            }));
          } else if (sportId === 'mma') {
            results = data.response.map((fighter: any) => {
              // Handle country data which might be an object or string
              let countryStr = 'Unknown';
              if (fighter.country) {
                if (typeof fighter.country === 'object' && fighter.country.name) {
                  countryStr = fighter.country.name;
                } else if (typeof fighter.country === 'string') {
                  countryStr = fighter.country;
                }
              }

              return {
                id: fighter.id,
                name: decodeHtmlEntities(fighter.name),
                country: countryStr,
                logo: fighter.photo || fighter.image || fighter.logo || null,
                nickname: fighter.nickname ? decodeHtmlEntities(fighter.nickname) : null,
                weightClass: fighter.category || fighter.weight?.class || null
              };
            });
          } else {
            results = data.response.map((team: any) => {
              // Handle team country which might be an object or string
              let countryStr = 'Unknown';
              if (team.country) {
                if (typeof team.country === 'object' && team.country.name) {
                  countryStr = team.country.name;
                } else if (typeof team.country === 'string') {
                  countryStr = team.country;
                }
              }

              return {
                id: team.id,
                name: team.name,
                country: countryStr,
                logo: team.logo
              };
            });
          }

          // Limit to 5 results for better UX
          const limitedResults = results.slice(0, 5);
          setSearchResults(limitedResults);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceSearch);
  }, [searchQuery, sportId, decodeHtmlEntities, fetchSportsApiWithSportId, isVsSearch]);

  const handleQueryChange = useCallback((query: string) => {
    setSearchQuery(query);

    // Check if the query contains "vs", "v", or "VS"
    const isVsPattern = /\b\s*(?:v|vs|VS)\s*\b/.test(query);
    setIsVsSearch(isVsPattern);
  }, []);

  const handleCreateWager = useCallback((game: Game) => {
    setSelectedGame(game);
    setShowWagerModal(true);
  }, []);

  const closeWagerModal = useCallback(() => {
    setShowWagerModal(false);
    setSelectedGame(null);
  }, []);

  // New function to handle search result selection
  const handleSearchResultSelect = useCallback((result: TeamResult) => {
    setSearchQuery(result.name);
    setSelectedTeam(result);
    setSearchResults([]);

    // If there's a handler function in the specific sport component, it will be called after the state is updated
  }, []);

  // Helper function to format match scores
  const formatScore = useCallback((score: { home: number | null; away: number | null }): string => {
    if (score.home === null || score.away === null) return '-';
    return `${score.home} - ${score.away}`;
  }, []);

  return {
    searchQuery,
    isGenerating,
    result,
    isLoading,
    error,
    teams,
    selectedTeam,
    upcomingGames,
    selectedGame,
    showWagerModal,
    isVsSearch,
    searchResults,
    isSearching,
    handleQueryChange,
    handleCreateWager,
    closeWagerModal,
    handleSearchResultSelect,
    formatScore,
    fetchSportsApi: fetchSportsApiWithSportId, // Return the memoized version with sportId
    decodeHtmlEntities,
    normalizeQuery,
    setTeams,
    setSelectedTeam,
    setUpcomingGames,
    setIsLoading,
    setError,
    setResult,
    setIsGenerating,
    setSearchQuery
  };
};

export default useSportSearch;