/**
 * Transforms API Sports image URLs to use WagerFi CDN
 * @param imageUrl - The original image URL from API Sports
 * @returns The transformed URL using WagerFi CDN, or null if no URL provided
 */
export const transformImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;

  // Replace all media.api-sports.io variants with wagerfi-sportsapi.b-cdn.net
  return imageUrl
    .replace('media-4.api-sports.io', 'wagerfi-sportsapi.b-cdn.net')
    .replace('media.api-sports.io', 'wagerfi-sportsapi.b-cdn.net');
};

/**
 * Transforms an object with logo properties to use WagerFi CDN
 * @param obj - Object that may contain logo properties
 * @returns Object with transformed logo URLs
 */
export const transformLogos = <T extends Record<string, any>>(obj: T): T => {
  if (!obj) return obj;

  const transformed = { ...obj };

  // Transform logo properties
  if (transformed.logo) {
    transformed.logo = transformImageUrl(transformed.logo);
  }

  // Transform nested objects that might have logos
  if (transformed.league?.logo) {
    transformed.league = {
      ...transformed.league,
      logo: transformImageUrl(transformed.league.logo)
    };
  }

  if (transformed.homeTeam?.logo) {
    transformed.homeTeam = {
      ...transformed.homeTeam,
      logo: transformImageUrl(transformed.homeTeam.logo)
    };
  }

  if (transformed.awayTeam?.logo) {
    transformed.awayTeam = {
      ...transformed.awayTeam,
      logo: transformImageUrl(transformed.awayTeam.logo)
    };
  }

  if (transformed.teams?.home?.logo) {
    transformed.teams = {
      ...transformed.teams,
      home: {
        ...transformed.teams.home,
        logo: transformImageUrl(transformed.teams.home.logo)
      }
    };
  }

  if (transformed.teams?.away?.logo) {
    transformed.teams = {
      ...transformed.teams,
      away: {
        ...transformed.teams.away,
        logo: transformImageUrl(transformed.teams.away.logo)
      }
    };
  }

  return transformed;
};

/**
 * Checks if an image URL is valid by attempting to load the image
 * @param url The image URL to check
 * @returns A promise that resolves to true if the image loads successfully, false otherwise
 */
export const checkImageURL = (url: string | undefined): Promise<boolean> => {
  if (!url) return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve(true);
    };

    img.onerror = () => {
      resolve(false);
    };

    img.src = url;
  });
};

/**
 * Filters items to only include those with valid logos
 * @param items Array of items that may have logo properties
 * @returns Promise that resolves to filtered array of items with valid logos
 */
export const filterItemsWithValidLogos = async <T extends { logo?: string }>(
  items: T[]
): Promise<T[]> => {
  if (!items || items.length === 0) return [];

  const logoChecks = await Promise.all(
    items.map(async (item) => {
      const hasValidLogo = await checkImageURL(item.logo);
      return { item, hasValidLogo };
    })
  );

  return logoChecks
    .filter(({ hasValidLogo }) => hasValidLogo)
    .map(({ item }) => item);
};