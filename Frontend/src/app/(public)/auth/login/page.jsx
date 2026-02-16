
'use client';
import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import link from 'next/link';
import { useAuth } from '@/app/context/AuthContext'; 


export default function Login ()  { 


    const router = useRouter();        // Access the Next.js router
    const { login } = useAuth();      // Access the login function from AuthContext


    const [email , setEmail] = useState('');           // State for email input
    const [password , setPassword] = useState('');     // State for password input
    const[loading , setLoading] = useState(false);      // State for loading indicator
    const [error , setError] = useState(null);          // State for error messages


    const handeLogin = async (e) => {
        setError("");
        if(!email || !password){
            setError("Please fill in all fields");
            return;
        }
        try {
            setLoading (true);
            await login (email , password);
            router.push('/dashboard'); // Redirect to dashboard on successful login
        } catch (err) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    } ;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded shadow">

            <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="space-y-4">
                <input type="email"
                 placeholder="Email"  
                 className="w-full px-3 py-2 border rounded"
                 value ={email}
                    onChange={(e) => setEmail(e.target.value)}
                            
                />
                <input type="password"
                 placeholder="Password"  
                 className="w-full px-3 py-2 border rounded"
                 value ={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                <button onClick={handeLogin} 
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </div>

            <div className="mt-4 text-center">
                <p className="text-sm">
                    Don&apos;t have an account? 
                    <a href="/auth/register" className="text-blue-500 hover:underline ml-1">Register here</a>
                </p>
            </div>

        </div>  
        </div>
    );
}

