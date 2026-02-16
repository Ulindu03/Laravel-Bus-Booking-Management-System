
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
        <div classname ="min-h-screen flex items-center justify-center bg-gray-100">
            <div classname = "w-full max-w-md bg-white p-8 rounded shadow">

            <h1 classname ="text-2xl font-bold mb-6 text-center">Login</h1>
        </div>  
        </div>
    );
}

