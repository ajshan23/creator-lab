import { useState, useEffect, useCallback } from 'react';

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';

export interface PixabayImage {
    id: number;
    pageURL: string;
    previewURL: string;
    webformatURL: string;
    largeImageURL: string;
    user: string;
    tags: string;
}

interface PixabaySearchResponse {
    hits: PixabayImage[];
    totalHits: number;
    total: number;
}

/**
 * Search for images on Pixabay
 */
export const searchPixabayImages = async (query: string, perPage: number = 6): Promise<PixabayImage[]> => {
    if (!PIXABAY_API_KEY) {
        console.warn('Pixabay API key is missing');
        return [];
    }

    if (!query.trim()) {
        return [];
    }

    try {
        const response = await fetch(
            `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=${perPage}&image_type=photo&safesearch=true`
        );

        if (!response.ok) {
            throw new Error(`Pixabay API error: ${response.status}`);
        }

        const data: PixabaySearchResponse = await response.json();
        return data.hits;
    } catch (error) {
        console.error('Pixabay search error:', error);
        return [];
    }
};

/**
 * Custom hook for debounced Pixabay search
 */
export const usePixabaySearch = (query: string, debounceMs: number = 500) => {
    const [images, setImages] = useState<PixabayImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            setImages([]);
            return;
        }

        setIsLoading(true);
        const results = await searchPixabayImages(searchQuery);
        setImages(results);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            debouncedSearch(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, debounceMs, debouncedSearch]);

    return { images, isLoading };
};
