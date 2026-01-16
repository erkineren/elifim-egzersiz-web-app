import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs Music API endpoint - streaming version
const ELEVENLABS_MUSIC_STREAM_URL = 'https://api.elevenlabs.io/v1/music/stream';

// Workout music prompts
const MUSIC_PROMPTS: Record<string, string> = {
  warmup: 'Upbeat, energetic warm-up music for exercise. Moderate tempo around 110 BPM. Electronic beats with motivating melody. Instrumental only.',
  workout: 'High-energy workout music. Fast tempo around 130-140 BPM. Driving electronic beats, powerful bass. Perfect for intense training. Instrumental only.',
  cooldown: 'Calm, relaxing cool-down music for stretching. Slow tempo around 70 BPM. Ambient, peaceful, soothing instrumental.',
  motivation: 'Epic motivational music. Building intensity. Cinematic, inspiring. Perfect for pushing through tough exercises. Instrumental only.',
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { type = 'workout', durationMs = 60000 } = body;

    const prompt = MUSIC_PROMPTS[type] || MUSIC_PROMPTS.workout;

    // Call ElevenLabs streaming API
    const response = await fetch(ELEVENLABS_MUSIC_STREAM_URL, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        prompt,
        duration_ms: Math.min(Math.max(durationMs, 3000), 120000), // 3s - 2min for faster generation
        instrumental: true,
        output_format: 'mp3_44100_128',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs Music API Error:', error);
      return NextResponse.json(
        { error: 'Music generation failed' },
        { status: response.status }
      );
    }

    // Stream the response directly to client
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Transfer-Encoding', 'chunked');
    headers.set('Cache-Control', 'no-cache');
    
    // Return streaming response
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Music Generation Error:', error);
    return NextResponse.json(
      { error: 'Music generation failed' },
      { status: 500 }
    );
  }
}
