const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/whatsapp-clone').then(async () => {
  const users = await User.find({}).lean();
  console.log("USERS:");
  users.slice(0, 5).forEach(u => {
    console.log(`- ${u.username}: profilePic='${u.profilePic}' (length: ${u.profilePic ? u.profilePic.length : 0})`);
  });
  
  const bobs = await User.find({ username: 'Bob' }).lean();
  console.log("\nBOBS:");
  bobs.forEach(b => console.log(JSON.stringify(b, null, 2)));

  mongoose.disconnect();
}).catch(console.error);
