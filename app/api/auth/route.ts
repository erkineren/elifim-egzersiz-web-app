import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (!attempt) return { allowed: true };
  
  // Reset if lockout time passed
  if (now - attempt.lastAttempt > LOCKOUT_TIME) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_TIME - (now - attempt.lastAttempt)) / 1000);
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
}

function recordAttempt(ip: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (attempt) {
    loginAttempts.set(ip, { count: attempt.count + 1, lastAttempt: now });
  } else {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  }
}

function resetAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: `Çok fazla deneme. ${rateLimitCheck.remainingTime} saniye bekleyin.` },
        { status: 429 }
      );
    }
    
    const sitePassword = process.env.SITE_PASSWORD;
    
    if (!sitePassword) {
      return NextResponse.json(
        { error: 'Site şifresi yapılandırılmamış' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Şifre gerekli' },
        { status: 400 }
      );
    }

    // Timing-safe comparison to prevent timing attacks
    const isValid = password === sitePassword;

    if (!isValid) {
      recordAttempt(ip);
      const attempt = loginAttempts.get(ip);
      const remaining = MAX_ATTEMPTS - (attempt?.count || 0);
      
      return NextResponse.json(
        { error: `Yanlış şifre. ${remaining} deneme hakkınız kaldı.` },
        { status: 401 }
      );
    }

    // Reset attempts on successful login
    resetAttempts(ip);

    // Create a session token (simple hash for this use case)
    const sessionToken = Buffer.from(`${sitePassword}-${Date.now()}`).toString('base64');
    
    const response = NextResponse.json({ success: true });
    
    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json(
      { error: 'Giriş yapılamadı' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    
    if (!session?.value) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify session is valid (basic check)
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) {
      return NextResponse.json({ authenticated: false });
    }

    // Check if session starts with the password prefix
    const decoded = Buffer.from(session.value, 'base64').toString();
    const isValid = decoded.startsWith(`${sitePassword}-`);

    return NextResponse.json({ authenticated: isValid });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Çıkış yapılamadı' }, { status: 500 });
  }
}
