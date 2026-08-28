const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validateNidaFormat } = require('../utils/gepgService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role, nidaNumber } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists',
        errorCode: 'USER_EXISTS'
      });
    }

    let isNidaVerified = false;
    let cleanNida = null;
    if (nidaNumber) {
      const nidaValidation = validateNidaFormat(nidaNumber);
      if (!nidaValidation.isValid) {
        return res.status(400).json({ success: false, message: nidaValidation.message });
      }
      cleanNida = nidaValidation.cleanNida;
      isNidaVerified = true;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role: role || 'TENANT',
        nidaNumber: cleanNida,
        isNidaVerified
      }
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          nidaNumber: newUser.nidaNumber,
          isNidaVerified: newUser.isNidaVerified
        }
      },
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is suspended', errorCode: 'ACCOUNT_SUSPENDED' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          nidaNumber: user.nidaNumber,
          isNidaVerified: user.isNidaVerified
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (picture && !user.profileImage) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { profileImage: picture }
        });
      }
    } else {
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Please select your account type to complete sign-up.',
          errorCode: 'ROLE_REQUIRED'
        });
      }

      const placeholderPhone = `G-${googleId.slice(0, 16)}`;

      user = await prisma.user.create({
        data: {
          firstName: given_name || 'Google',
          lastName: family_name || 'User',
          email,
          phone: placeholderPhone,
          passwordHash: await bcrypt.hash(googleId + process.env.JWT_SECRET, 10),
          role: role || 'TENANT',
          profileImage: picture || null,
          isVerified: true
        }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is suspended', errorCode: 'ACCOUNT_SUSPENDED' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          nidaNumber: user.nidaNumber,
          isNidaVerified: user.isNidaVerified
        }
      },
      message: 'Google login successful'
    });
  } catch (error) {
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ success: false, message: 'Google session expired. Please try again.' });
    }
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        nidaNumber: true,
        isNidaVerified: true,
        emergencyContact: true,
        isVerified: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// NIDA Verification & Profile Update
const verifyNida = async (req, res, next) => {
  try {
    const { nidaNumber, emergencyContact } = req.body;
    const userId = req.user.id;

    if (!nidaNumber) {
      return res.status(400).json({ success: false, message: 'Namba ya NIDA inahitajika.' });
    }

    const validation = validateNidaFormat(nidaNumber);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const existingNida = await prisma.user.findFirst({
      where: {
        nidaNumber: validation.cleanNida,
        NOT: { id: userId }
      }
    });

    if (existingNida) {
      return res.status(400).json({
        success: false,
        message: 'Namba hii ya NIDA tayari imesajiliwa kwenye akaunti nyingine.'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nidaNumber: validation.cleanNida,
        isNidaVerified: true,
        emergencyContact: emergencyContact || undefined
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        nidaNumber: true,
        isNidaVerified: true,
        emergencyContact: true
      }
    });

    res.json({
      success: true,
      message: 'Kitambulisho cha NIDA kimethibitishwa kikamilifu.',
      data: {
        user: updatedUser,
        nidaDetails: {
          formattedNida: validation.formattedNida,
          verifiedAt: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN: Get All Users (Manage Users)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { nidaNumber: { contains: search } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        nidaNumber: true,
        isNidaVerified: true,
        emergencyContact: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { users, count: users.length } });
  } catch (error) {
    next(error);
  }
};

// ADMIN: Toggle User Active Status (Suspend / Activate)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Mtumiaji hajakatika.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true }
    });

    res.json({
      success: true,
      message: `Akaunti ya ${updatedUser.firstName} ${updatedUser.lastName} sasa ni ${updatedUser.isActive ? 'Active (Inafanya kazi)' : 'Suspended (Imesitishwa)'}.`,
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getMe,
  verifyNida,
  getAllUsers,
  toggleUserStatus
};
