const db = require("../../Config/db");

const User = {
  create: (name, email, profile_image, hashedPassword, phone, ) => {
    db.query(
      "INSERT INTO users (name, email, profile_image, password, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, profile_image, hashedPassword, phone],
      callback
    );
  },callback
};

module.exports = User;
