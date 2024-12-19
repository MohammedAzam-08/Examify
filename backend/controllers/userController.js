import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide both email and password');
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.status || 500);
    throw error;
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      res.status(400);
      throw new Error('User with this email already exists');
    }
    if (error.name === 'ValidationError') {
      res.status(400);
      throw new Error(Object.values(error.errors).map(err => err.message).join(', '));
    }
    res.status(400);
    throw new Error(error.message || 'Registration failed');
  }
});

const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

export { authUser, registerUser, getUsers };
