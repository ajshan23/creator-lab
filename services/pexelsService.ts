import { useState, useEffect, useCallback } from 'react';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';

export interface PexelsPhoto {
    id: number;
    url: string;
    photographer: string;
    src: {
        original: string;
        large: string;
        medium: string;
        small: string;
        tiny: string;
    };
    alt: string;
}

interface PexelsSearchResponse {
    photos: PexelsPhoto[];
    total_results: number;
    page: number;
    per_page: number;
}

/**
 * Search for photos on Pexels
 */
export const searchPexelsPhotos = async (query: string, perPage: number = 6): Promise<PexelsPhoto[]> => {
    if (!PEXELS_API_KEY) {
        console.warn('Pexels API key is missing');
        return [];
    }

    if (!query.trim()) {
        return [];
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`);
        }

        const data: PexelsSearchResponse = await response.json();
        return data.photos;
    } catch (error) {
        console.error('Pexels search error:', error);
        return [];
    }
};

/**
 * Custom hook for debounced Pexels search
 */
export const usePexelsSearch = (query: string, debounceMs: number = 500) => {
    const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            setPhotos([]);
            return;
        }

        setIsLoading(true);
        const results = await searchPexelsPhotos(searchQuery);
        setPhotos(results);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            debouncedSearch(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, debounceMs, debouncedSearch]);

    return { photos, isLoading };
};
