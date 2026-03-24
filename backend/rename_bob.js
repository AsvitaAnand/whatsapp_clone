const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/whatsapp-clone').then(async () => {
  const result = await User.updateMany(
    { username: 'Bob' }, 
    { $set: { username: 'Boopesh', email: 'boopesh@test.com' } }
  );
  console.log(`Renamed ${result.modifiedCount} Bobs to Boopesh in DB.`);
  mongoose.disconnect();
}).catch(console.error);
