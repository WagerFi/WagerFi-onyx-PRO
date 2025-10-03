import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const backgroundWorkerUrl = process.env.NEXT_PUBLIC_BACKGROUND_WORKER_URL || 'https://backgroundworker-ltw3.onrender.com';

        const response = await fetch(`${backgroundWorkerUrl}/all-games-cached`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Background worker responded with status: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching games:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch games' },
            { status: 500 }
        );
    }
}

