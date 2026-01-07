const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');

        // Delete existing
        await User.deleteMany({ username: { $in: ['admin', 'user'] } });
        console.log('Deleted old users');

        // Create Admin
        const adminPass = await bcrypt.hash('password123', 10);
        const admin = new User({ username: 'admin', password: adminPass, role: 'admin' });
        await admin.save();
        console.log('Created admin');

        // Create User
        const userPass = await bcrypt.hash('password123', 10);
        const user = new User({ username: 'user', password: userPass, role: 'user' });
        await user.save();
        console.log('Created user');

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
