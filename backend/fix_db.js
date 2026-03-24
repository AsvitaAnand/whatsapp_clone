const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/whatsapp-clone').then(async () => {
  const result = await User.updateMany(
    { profilePic: { $regex: '^http' } },
    { $set: { profilePic: '' } }
  );
  console.log(`Updated ${result.modifiedCount} users with broken profile pictures.`);
  mongoose.disconnect();
}).catch(console.error);
