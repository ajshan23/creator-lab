import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel Serverless Function for OpenAI Image Generation
// This bypasses CORS restrictions in production

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    try {
        const { prompt, size = '1024x1024', quality = 'hd' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size,
                response_format: 'b64_json',
                quality,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
            return res.status(response.status).json({ error: errorMessage });
        }

        const data = await response.json();

        if (data.data && data.data.length > 0 && data.data[0].b64_json) {
            return res.status(200).json({
                image: `data:image/png;base64,${data.data[0].b64_json}`
            });
        }

        return res.status(500).json({ error: 'No image data returned' });

    } catch (error: any) {
        console.error('OpenAI API Error:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
}
