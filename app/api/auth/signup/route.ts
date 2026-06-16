import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/config/supabase';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const { data: newUser, error: insertErr } = await supabase
            .from('users')
            .insert({
                name,
                email,
                password_hash: passwordHash
            })
            .select()
            .single();

        if (insertErr) throw insertErr;

        // Initialize user progress
        await supabase.from('user_progress').insert({
            user_id: newUser.id,
            current_level: 'Medium',
            correct_streak: 0,
            total_questions_solved: 0
        });

        // Sign token and set HTTP-only cookie
        const token = await signToken({
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name
        });

        const res = NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
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
