const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    passwordHash: {
        type: String,
        required: [true, 'Please provide a password']
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    role: {
        type: String,
        enum: ['Employee', 'Department Head', 'Asset Manager', 'Admin'],
        default: 'Employee'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Pre-save hook: hash password with bcryptjs if modified
employeeSchema.pre('save', function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    this.passwordHash = bcrypt.hashSync(this.passwordHash, 10);
    next();
});

// Instance method: compare password
employeeSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.passwordHash);
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
