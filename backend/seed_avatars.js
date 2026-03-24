const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/whatsapp-clone').then(async () => {
  const users = await User.find({});
  let count = 0;

  for (const user of users) {
    // Generate a sleek UI Avatar with initials based on their username
    const bgColors = ['00a884', '53bdeb', 'ff8a8c', '54656f', '8e3596', '128C7E'];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=${randomBg}&color=fff&size=150&font-size=0.4`;

    user.profilePic = avatarUrl;
    await user.save();
    count++;
  }

  console.log(`Successfully added working profile pictures for ${count} users.`);
  mongoose.disconnect();
}).catch(console.error);
