import { NextResponse } from 'next/server';

export async function POST() {
    const res = NextResponse.json({ success: true });
    
    // Clear token cookie
    res.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Invalidate instantly
        path: '/'
    });

    return res;
}
