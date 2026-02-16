"use client";

import{createContext , use, useContext , useEffect , useState} from 'react';
import api from '../api/axios'; 

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => 
    {
    const [user , setUser] = useState(null);
    const [loading , setLoading] = useState(true);

    const isBrowser = typeof window !== 'undefined';


    const login = async (email , password) => {
        const res = await api.post('/auth/login' , {email , password}); // Make the API call to login

        if (isBrowser){
            localStorage.setItem('token' , res.data.token); // Store the token in localStorage
        }
        setUser(res.data.user); // Assuming the response contains user data
        return res.data.user;

    };

    const logout = async () => {
        try {
            await api.post('/logout'); // Make the API call to logout
        } finally {
            if (isBrowser) {
                localStorage.removeItem('token'); // Remove the token from localStorage
            }
            setUser(null);
        }
    };

    const fetchUser = async () => 
    {
        if
    (!isBrowser || !localStorage.getItem('token'))
    {
            setLoading(false);
            return;
        }
        try{
            const res = await api.get('/me'); // Make the API call to fetch user data
            setUser(res.data); // Assuming the response contains user data
        }catch(error){ 
            localStorage.removeItem('token'); // Remove the token if fetching user data fails
            setUser(null);

        }finally{
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchUser(); // Fetch user data on component mount


    }   , []);

    return(
        <AuthContext.Provider value={{user , loading , login , logout}}>
            {children}
            </AuthContext.Provider> 
            
    );


    };

    export const useAuth = () => {
        const ctx  = useContext(AuthContext);
        if(!ctx) throw new Error('useAuth must be used within an AuthProvider');
        return ctx;

    };