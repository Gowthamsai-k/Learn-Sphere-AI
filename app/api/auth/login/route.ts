import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/config/supabase';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Look up user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
        }

        // Sign token and return as HTTP-only cookie
        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name
        });

        const res = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

        res.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return res;
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
