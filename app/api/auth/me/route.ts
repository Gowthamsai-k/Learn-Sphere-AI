import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const cookieHeader = req.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Fetch up-to-date user profile content from the database using the verified userId
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', payload.userId)
            .maybeSingle();

        if (error || !user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err: any) {
        return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
    }
}
