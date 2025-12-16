import { useState, useEffect, useCallback } from 'react';

// Using nekos.best API - High quality anime images with CORS support
const NEKOS_BEST_API = 'https://nekos.best/api/v2';

export interface NekosImage {
    id: string;
    url: string;
    artist: {
        id: string;
        name: string;
    } | null;
    source: string | null;
    categories: Array<{ id: string; name: string }>;
}

// Available categories from nekos.best
const AVAILABLE_CATEGORIES = [
    'neko', 'husbando', 'kitsune', 'waifu'
];

// Keyword to category mappings
const CATEGORY_MAPPINGS: Record<string, string> = {
    'catgirl': 'neko',
    'cat': 'neko',
    'neko': 'neko',
    'fox': 'kitsune',
    'foxgirl': 'kitsune',
    'kitsune': 'kitsune',
    'waifu': 'waifu',
    'girl': 'waifu',
    'anime': 'waifu',
    'cute': 'waifu',
    'kawaii': 'waifu',
    'husbando': 'husbando',
    'boy': 'husbando',
    'guy': 'husbando',
};

/**
 * Get anime images from nekos.best API
 */
export const getRandomAnimeImages = async (limit: number = 6, category: string = 'neko'): Promise<NekosImage[]> => {
    try {
        const response = await fetch(`${NEKOS_BEST_API}/${category}?amount=${limit}`);

        if (!response.ok) {
            throw new Error(`nekos.best error: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results.map((item: any, index: number) => ({
                id: `${category}-${Date.now()}-${index}`,
                url: item.url,
                artist: item.artist_name ? { id: item.artist_href || '', name: item.artist_name } : null,
                source: item.source_url || null,
                categories: [{ id: category, name: category }],
            }));
        }

        return [];
    } catch (error) {
        console.error('nekos.best error:', error);
        return [];
    }
};

/**
 * Get mixed anime images from multiple categories
 */
export const getMixedAnimeImages = async (limit: number = 6): Promise<NekosImage[]> => {
    try {
        // Fetch from multiple categories for variety
        const categories = ['neko', 'waifu', 'kitsune'];
        const perCategory = Math.ceil(limit / categories.length);

        const promises = categories.map(cat =>
            fetch(`${NEKOS_BEST_API}/${cat}?amount=${perCategory}`)
                .then(res => res.ok ? res.json() : { results: [] })
                .then(data => data.results?.map((item: any, idx: number) => ({
                    id: `${cat}-${Date.now()}-${idx}`,
                    url: item.url,
                    artist: item.artist_name ? { id: item.artist_href || '', name: item.artist_name } : null,
                    source: item.source_url || null,
                    categories: [{ id: cat, name: cat }],
                })) || [])
                .catch(() => [])
        );

        const results = await Promise.all(promises);
        const allImages = results.flat();

        // Shuffle and limit
        return allImages.sort(() => Math.random() - 0.5).slice(0, limit);
    } catch (error) {
        console.error('Mixed anime images error:', error);
        return getRandomAnimeImages(limit, 'neko');
    }
};

/**
 * Search anime images by matching query to categories
 */
export const searchAnimeImagesByQuery = async (
    query: string,
    limit: number = 6
): Promise<NekosImage[]> => {
    const queryLower = query.toLowerCase();
    let matchedCategory: string | null = null;

    // Find matching category from query
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS)) {
        if (queryLower.includes(keyword) || keyword.includes(queryLower)) {
            matchedCategory = category;
            break;
        }
    }

    if (matchedCategory) {
        return getRandomAnimeImages(limit, matchedCategory);
    }

    // Fallback to mixed images
    return getMixedAnimeImages(limit);
};

/**
 * Custom hook for anime images based on search query
 */
export const useNekosSearch = (query: string, isAnimeTheme: boolean, debounceMs: number = 500) => {
    const [images, setImages] = useState<NekosImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useCallback(async (searchQuery: string) => {
        if (!isAnimeTheme) {
            setImages([]);
            return;
        }

        setIsLoading(true);

        if (searchQuery.trim().length >= 3) {
            const results = await searchAnimeImagesByQuery(searchQuery);
            setImages(results);
        } else {
            const results = await getMixedAnimeImages();
            setImages(results);
        }

        setIsLoading(false);
    }, [isAnimeTheme]);

    useEffect(() => {
        if (!isAnimeTheme) {
            setImages([]);
            return;
        }

        const timer = setTimeout(() => {
            debouncedSearch(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, isAnimeTheme, debounceMs, debouncedSearch]);

    return { images, isLoading };
};
