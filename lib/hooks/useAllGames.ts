import { useState, useEffect, useCallback } from 'react';
import type { Game } from '@/types/sports';

// Global state to prevent multiple simultaneous requests
let globalGames: { [sportId: string]: Game[] } = {};
let globalIsLoading = true;
let globalError: string | null = null;
let globalFetchPromise: Promise<void> | null = null;
let globalInterval: NodeJS.Timeout | null = null;
let globalSubscribers = 0;
let globalFetchCount = 0; // Track fetch count for debugging

/**
 * Fetches all games from the server endpoint
 */
const fetchAllGames = async (): Promise<{ [sportId: string]: Game[] }> => {
    try {
        console.log('🏈 Fetching all games from server...');

        const response = await fetch('/api/games', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch games');
        }

        console.log('🏈 Successfully fetched all games from server:', data.summary);
        console.log('🔍 Raw games data from server:', data.games);
        console.log('🔍 Games data keys:', Object.keys(data.games));
        return data.games;
    } catch (error) {
        console.error('❌ Error fetching all games from server:', error);
        throw error;
    }
};

/**
 * Custom hook to fetch all games (upcoming, live, and finished) from server
 * This hook provides unified access to all game data with automatic refresh
 */
export function useAllGames() {
    const [isLoading, setIsLoading] = useState<boolean>(globalIsLoading);
    const [error, setError] = useState<string | null>(globalError);
    const [games, setGames] = useState<{ [sportId: string]: Game[] }>(globalGames);

    const fetchGames = useCallback(async (isInitialLoad = false) => {
        // If there's already a fetch in progress, wait for it
        if (globalFetchPromise) {
            await globalFetchPromise;
            return;
        }

        // Create a new fetch promise
        globalFetchPromise = (async () => {
            if (isInitialLoad) {
                globalIsLoading = true;
                setIsLoading(true);
            }
            globalError = null;
            setError(null);

            try {
                const allGames = await fetchAllGames();
                globalFetchCount++;

                // Smart update: only update if data has actually changed
                const hasChanged = JSON.stringify(globalGames) !== JSON.stringify(allGames);

                // Force update every 10 fetches to ensure UI stays fresh (debugging)
                const shouldForceUpdate = globalFetchCount % 10 === 0;

                // TEMPORARY: Always update to test if comparison is the issue
                const alwaysUpdate = true;

                if (hasChanged || shouldForceUpdate || alwaysUpdate) {
                    if (shouldForceUpdate) {
                        console.log(`🔄 [useAllGames] Force update #${globalFetchCount}, updating games...`);
                    } else if (alwaysUpdate) {
                        console.log(`🔄 [useAllGames] Always update #${globalFetchCount}, updating games...`);
                    } else {
                        console.log('🔄 [useAllGames] Data changed, updating games...');
                    }

                    // Log specific changes for debugging
                    Object.entries(allGames).forEach(([sport, games]) => {
                        const oldGames = globalGames[sport] || [];
                        if (games.length !== oldGames.length) {
                            console.log(`📊 [useAllGames] ${sport}: ${oldGames.length} → ${games.length} games`);
                        }

                        // Check for score changes in live games
                        games.forEach((game, index) => {
                            const oldGame = oldGames[index];
                            if (oldGame && game.id === oldGame.id) {
                                if (game.goals?.home !== oldGame.goals?.home || game.goals?.away !== oldGame.goals?.away) {
                                    console.log(`⚽ [useAllGames] ${sport} game ${game.id} score changed: ${oldGame.goals?.home || 0}-${oldGame.goals?.away || 0} → ${game.goals?.home || 0}-${game.goals?.away || 0}`);
                                }
                                if (game.status?.elapsed !== oldGame.status?.elapsed) {
                                    console.log(`⏱️ [useAllGames] ${sport} game ${game.id} timer changed: ${oldGame.status?.elapsed || 'N/A'} → ${game.status?.elapsed || 'N/A'}`);
                                }
                            }
                        });
                    });

                    globalGames = allGames;
                    setGames(allGames);
                } else {
                    console.log('🔄 [useAllGames] No data changes detected, skipping update...');
                }
            } catch (err) {
                console.error('❌ Error fetching all games:', err);
                globalError = 'Failed to load games. Please try again later.';
                setError(globalError);
            } finally {
                if (isInitialLoad) {
                    globalIsLoading = false;
                    setIsLoading(false);
                }
                globalFetchPromise = null;
            }
        })();

        await globalFetchPromise;
    }, []);

    const startAutoRefresh = useCallback(() => {
        // Only start interval if this is the first subscriber
        if (globalSubscribers === 0 && !globalInterval) {
            console.log('🔄 [useAllGames] Starting auto-refresh every 15 seconds to match background worker...');
            // Set up auto-refresh every 15 seconds to match background worker polling
            globalInterval = setInterval(() => {
                console.log('🔄 [useAllGames] Auto-refresh triggered...');
                fetchGames(false); // Not initial load
            }, 15000); // 15 seconds to match background worker
        }
    }, [fetchGames]);

    const stopAutoRefresh = useCallback(() => {
        // Only stop interval if this is the last subscriber
        if (globalSubscribers === 1 && globalInterval) {
            clearInterval(globalInterval);
            globalInterval = null;
        }
    }, []);

    const refreshGames = useCallback(() => {
        fetchGames(true);
    }, [fetchGames]);

    // Subscribe/unsubscribe logic
    useEffect(() => {
        globalSubscribers++;

        // Start auto-refresh when first component mounts
        if (globalSubscribers === 1) {
            startAutoRefresh();
        }

        // Initial fetch if no data exists
        if (Object.keys(globalGames).length === 0) {
            fetchGames(true);
        } else {
            // Use existing data immediately
            setGames(globalGames);
            setIsLoading(false);
        }

        return () => {
            globalSubscribers--;

            // Stop auto-refresh when last component unmounts
            if (globalSubscribers === 0) {
                stopAutoRefresh();
            }
        };
    }, [fetchGames, startAutoRefresh, stopAutoRefresh]);

    return {
        isLoading,
        error,
        games,
        refreshGames
    };
}

/**
 * Helper function to filter games by status
 */
export const filterGamesByStatus = (games: { [sportId: string]: Game[] }, status: 'upcoming' | 'live' | 'finished'): { [sportId: string]: Game[] } => {
    const filteredGames: { [sportId: string]: Game[] } = {};

    Object.entries(games).forEach(([sport, sportGames]) => {
        filteredGames[sport] = sportGames.filter(game => {
            // Debug: Log only first few games for problematic sports
            if ((sport === 'soccer' || sport === 'american-football') && game.id && game.id < 1000) {
                console.log(`🔍 ${sport} game ${game.id} status:`, {
                    short: game.status?.short,
                    long: game.status?.long,
                    hasFixture: 'fixture' in game
                });
            }

            if (status === 'upcoming') {
                // Upcoming statuses for all sports
                const upcomingStatuses = [
                    'NS', // Not Started (all sports)
                    'TBD', // Time To Be Defined (Soccer)
                    'CANC', // Cancelled (all sports)
                    'SUSP', // Suspended (Soccer, NBA)
                    'ABD', // Abandoned (all sports)
                    'AWD', // Awarded (Soccer, NBA)
                    'WO', // Walkover (Soccer, MMA)
                    'INTR', // Interrupted (MLB, NHL)
                    'IN', // Intros (MMA)
                    'PF', // Pre-fight (MMA)
                    'WO' // Walkouts (MMA)
                ];

                // Check for status in different possible locations
                let statusShort = game.status?.short;
                if (!statusShort && (game as any).fixture?.status?.short) {
                    statusShort = (game as any).fixture.status.short;
                }

                // If no status.short, do NOT assume it's upcoming - skip it
                if (!statusShort) {
                    return false;
                }

                const isUpcomingStatus = upcomingStatuses.includes(statusShort);

                // Also check if the game is actually in the future (UTC time)
                const currentTime = Date.now() / 1000; // Current time in seconds
                const gameTime = game.timestamp;
                const isFutureGame = gameTime && gameTime > currentTime;

                const isUpcoming = isUpcomingStatus && isFutureGame;

                // Log only NS status games for soccer and american-football (limit to first 5)
                if (statusShort === 'NS' && (sport === 'soccer' || sport === 'american-football') && game.id && game.id < 1000) {
                    console.log(`✅ Found NS game: ${sport} game ${game.id} - ${game.homeTeam?.name || 'Home'} vs ${game.awayTeam?.name || 'Away'} (timestamp: ${gameTime}, current: ${currentTime}, future: ${isFutureGame})`);
                }

                return isUpcoming;
            } else if (status === 'live') {
                // Live statuses for all sports
                const liveStatuses = [
                    // Soccer
                    '1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'SUSP', 'INT',
                    // NBA
                    'Q1', 'Q2', 'Q3', 'Q4', 'OT', 'BT', 'HT',
                    // MLB
                    'IN1', 'IN2', 'IN3', 'IN4', 'IN5', 'IN6', 'IN7', 'IN8', 'IN9',
                    // NHL
                    'P1', 'P2', 'P3', 'OT', 'PT', 'BT',
                    // NFL
                    'Q1', 'Q2', 'Q3', 'Q4', 'OT', 'HT',
                    // MMA
                    'LIVE', 'EOR'
                ];

                // Check for status in different possible locations
                let statusShort = game.status?.short;
                if (!statusShort && (game as any).fixture?.status?.short) {
                    statusShort = (game as any).fixture.status.short;
                }

                // If no status.short, assume it's not live
                if (!statusShort) {
                    return false;
                }

                // Check if game has live status
                const hasLiveStatus = liveStatuses.includes(statusShort);

                // Special case for soccer: exclude games that should be considered finished
                // even if they have live status (e.g., "2H" with elapsed >= 90 and winner values)
                if (sport === 'soccer' && hasLiveStatus && game.status?.elapsed && game.status.elapsed >= 90) {
                    const homeWinner = game.homeTeam?.winner;
                    const awayWinner = game.awayTeam?.winner;

                    // If we have winner values (true/false), the game is finished, not live
                    if ((homeWinner === true && awayWinner === false) ||
                        (homeWinner === false && awayWinner === true) ||
                        (homeWinner === false && awayWinner === false)) {
                        console.log(`⚽ Soccer game ${game.id} with elapsed ${game.status.elapsed} minutes has winner values - excluding from live games`);
                        return false;
                    }
                }

                return hasLiveStatus;
            } else if (status === 'finished') {
                // Finished statuses for all sports
                // NOTE: These are the statuses that trigger wager resolution
                // When any game has status 'FT' (Finished), all wagers for that event must be resolved
                const finishedStatuses = [
                    // Soccer
                    'FT', 'AET', 'PEN',
                    // NBA
                    'FT', 'AOT',
                    // MLB
                    'FT',
                    // NHL
                    'FT', 'AOT', 'AP',
                    // NFL
                    'FT', 'AOT',
                    // MMA
                    'FT'
                ];

                // Check for status in different possible locations
                let statusShort = game.status?.short;
                if (!statusShort && (game as any).fixture?.status?.short) {
                    statusShort = (game as any).fixture.status.short;
                }

                // Check if game has explicit finished status
                if (statusShort && finishedStatuses.includes(statusShort)) {
                    return true;
                }

                // Special case for soccer: check if game has winner values and elapsed >= 90
                // This handles cases where the game is technically finished but status hasn't updated to "FT"
                if (sport === 'soccer' && game.status?.elapsed && game.status.elapsed >= 90) {
                    const homeWinner = game.homeTeam?.winner;
                    const awayWinner = game.awayTeam?.winner;

                    // If we have winner values (true/false), the game is finished
                    if ((homeWinner === true && awayWinner === false) ||
                        (homeWinner === false && awayWinner === true) ||
                        (homeWinner === false && awayWinner === false)) {
                        console.log(`⚽ Soccer game ${game.id} with elapsed ${game.status.elapsed} minutes has winner values - treating as finished`);
                        return true;
                    }
                }

                return false;
            }
            return false;
        });
    });

    // Log summary of filtered games (only for upcoming)
    if (status === 'upcoming') {
        const totalUpcoming = Object.values(filteredGames).flat().length;
        console.log(`📊 Upcoming games summary: ${totalUpcoming} total games`);
        // Only log sports with games
        Object.entries(filteredGames).forEach(([sport, games]) => {
            if (games.length > 0) {
                console.log(`📊 ${sport}: ${games.length} upcoming games`);
            }
        });
    }

    return filteredGames;
};

/**
 * Helper function to get all games across all sports
 */
export const getAllGamesFlat = (games: { [sportId: string]: Game[] }): Game[] => {
    return Object.values(games).flat();
};

/**
 * Helper function to get games count by status
 */
export const getGamesCountByStatus = (games: { [sportId: string]: Game[] }) => {
    const allGames = getAllGamesFlat(games);

    return {
        total: allGames.length,
        upcoming: allGames.filter(game => game.status.short === 'NS').length,
        live: allGames.filter(game => {
            const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'Q1', 'Q2', 'Q3', 'Q4', 'OT', 'IN1', 'IN2', 'IN3', 'IN4', 'IN5', 'IN6', 'IN7', 'IN8', 'IN9', 'P1', 'P2', 'P3', 'PT'];
            return liveStatuses.includes(game.status.short);
        }).length,
        finished: allGames.filter(game => game.status.short === 'FT').length
    };
};
