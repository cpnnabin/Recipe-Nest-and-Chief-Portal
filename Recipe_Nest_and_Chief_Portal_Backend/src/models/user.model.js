const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');


const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a name"],
            trim: true,
            maxlength: [50, "Name cannot be more than 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        role: {
            type: String,
            enum: ["customer", "user", "admin", "chief"],
            default: "customer",
        },
        avatar: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
            default: undefined,
            trim: true,
        },
        address: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        resetPasswordToken: {
            type: String,
            default: null,
            select: false,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);


// hased password before saving

UserSchema.pre("save", async function () {
    const user = this;

    if (!user.isModified("password")) {
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
    } catch (error) {
        throw error;
    }
});

// compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// generate JWT token
UserSchema.methods.generateJWT = function () {
    return jwt.sign(
        {
            id : this._id,
            email : this.email,
            role : this.role
        },
        JWT_SECRET,
        {
            expiresIn : JWT_EXPIRES_IN
        }
    );
};

UserSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete  userObject.__v;
    return userObject;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;