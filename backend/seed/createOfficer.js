require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const dns = require("dns");
dns.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Remove old (double-hashed) officer if exists
  await User.deleteOne({ email: "officer@crimson.lk" });

  // Let the model's pre-save hook hash the password automatically
  const officer = new User({
    fullName:    "SP Nimal Perera",
    email:       "officer@crimson.lk",
    password:    "Officer@1234",
    role:        "officer",
    phone:       "0771234567",
    district:    "Colombo",
    badgeNumber: "SP-2024-001",
    division:    "Colombo South",
    isActive:    true,
    isVerified:  true,
  });

  await officer.save();

  console.log("Officer created successfully!");
  console.log("  Email   :", officer.email);
  console.log("  Password: Officer@1234");
  console.log("  Badge   :", officer.badgeNumber);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
