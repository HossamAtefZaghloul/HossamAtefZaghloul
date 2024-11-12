// pages/api/register.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import User from '../../server/models/User';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {   
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method Not Allowed' });
        }
        
        await connectToDatabase();

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if the user already exists
        const checkEmail = await User.findOne({ email }); 
        if (checkEmail) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save(); 
        return res.status(201).json({ message: 'User created successfully.' });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'An error occurred during registration' });
    }
}