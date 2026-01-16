import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs API endpoint - using streaming for lower latency
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Turkish female voices from ElevenLabs
// Lily - multilingual, great for Turkish
const DEFAULT_VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku';

// Cache for audio to avoid regenerating
const audioCache = new Map<string, { audio: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getCacheKey(text: string, voiceId: string): string {
  return `${voiceId}:${text.toLowerCase().trim()}`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      // Fallback indicator - client will use browser TTS
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured', fallback: true },
        { status: 200 }
      );
    }

    const body = await request.json();
    const { text, voiceId } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const selectedVoiceId = voiceId || DEFAULT_VOICE_ID;
    const cacheKey = getCacheKey(text, selectedVoiceId);

    // Check cache
    const cached = audioCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ 
        audio: cached.audio,
        contentType: 'audio/mpeg',
        cached: true,
      });
    }

    // Call ElevenLabs API with optimizations
    const response = await fetch(`${ELEVENLABS_API_URL}/${selectedVoiceId}?optimize_streaming_latency=3&output_format=mp3_22050_32`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Faster model for low latency
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', response.status, errorText);
      
      // Fallback to browser TTS
      return NextResponse.json(
        { error: 'TTS generation failed', fallback: true },
        { status: 200 }
      );
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Return audio as base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    // Cache the result
    // Limit cache size
    if (audioCache.size > 100) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, { audio: base64Audio, timestamp: Date.now() });
    
    return NextResponse.json({ 
      audio: base64Audio,
      contentType: 'audio/mpeg',
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: 'TTS generation failed', fallback: true },
      { status: 200 }
    );
  }
}

// GET endpoint to list available voices (optional utility)
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch voices' }, { status: response.status });
    }

    const data = await response.json();
    
    // Filter for multilingual voices
    const voices = data.voices?.map((v: { voice_id: string; name: string; labels: Record<string, string> }) => ({
      id: v.voice_id,
      name: v.name,
      labels: v.labels,
    })) || [];

    return NextResponse.json({ voices });
  } catch (error) {
    console.error('Voices Error:', error);
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
  }
}
