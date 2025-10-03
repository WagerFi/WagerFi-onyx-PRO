import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const backgroundWorkerUrl = process.env.NEXT_PUBLIC_BACKGROUND_WORKER_URL || 'https://backgroundworker-ltw3.onrender.com';

        const response = await fetch(`${backgroundWorkerUrl}/trending-tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Background worker responded with status: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tokens' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const backgroundWorkerUrl = process.env.NEXT_PUBLIC_BACKGROUND_WORKER_URL || 'https://backgroundworker-ltw3.onrender.com';

        // Default to top 100 tokens for GET requests
        const response = await fetch(`${backgroundWorkerUrl}/trending-tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ limit: 100 })
        });

        if (!response.ok) {
            throw new Error(`Background worker responded with status: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tokens' },
            { status: 500 }
        );
    }
}

