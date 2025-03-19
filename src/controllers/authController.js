const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../Config/db");
const transporter = require("../../Config/mailer");
const socket = require("../../Config/socket");

const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/"); // Folder where files will be saved
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file name with original extension
  },
});


const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|mp4|mp3|wav/; // Allow images, audio, and video types
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, audio, and video files are allowed."
        )
      );
    }
  },
}).array("media", 5);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


async function sendOTP(email, otp) {
  try {
    await transporter.sendMail({
      from: "golupatel23723@gmail.com",
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is <span style="color: black; font-size:30px; font-weight: bold;">${otp}</span>. It is valid for 10 minutes.</p>`,
    });
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
}

// -----------------------------------------------------register user------------------------------------------------------------


exports.register = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "File upload error", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Server error", error: err });
    }

    const { name, email, password, phone } = req.body;
    let profile_image;

    if (req.file) {
      profile_image = req.file.path; // Get the uploaded file path
    } else {
      profile_image =
        "https://th.bing.com/th/id/OIP.xo-BCC1ZKFpLL65D93eHcgAAAA?rs=1&pid=ImgDetMain"; // Default image URL
    }

    // Check if the email or phone number already exists in the database
    db.query(
      "SELECT email, phone FROM user_data WHERE email = ? OR phone = ?",
      [email, phone],
      (err, results) => {
        if (err) return res.status(500).json("Server error");

        if (results.length > 0) {
          // Separate validation for email and phone
          let emailExists = false;
          let phoneExists = false;

          results.forEach((user) => {
            if (user.email === email) emailExists = true;
            if (user.phone === phone) phoneExists = true;
          });

          // Respond with specific validation messages
          if (emailExists && phoneExists) {
            return res
              .status(400)
              .json({
                error: "Both email and phone number are already registered",
              });
          } else if (emailExists) {
            return res
              .status(400)
              .json({ error: "Email is already registered" });
          } else if (phoneExists) {
            return res
              .status(400)
              .json({ error: "Phone number is already registered" });
          }
        }
        const about  = "Hey ! I have created Account  "

        // Hash the password before saving to the database
        const hashedPassword = bcrypt.hashSync(password, 8);

        // Insert new user into the database
        db.query(
          "INSERT INTO user_data (name, email, profile_image, password, phone,about) VALUES (?, ?, ?, ?, ?,?)",
          [name, email, profile_image, hashedPassword, phone,about],
          (err, result) => {
            if (err) return res.status(500).send("Server error");

            // Fetch the newly registered user data
            db.query(
              "SELECT id, name, email, profile_image, phone FROM user_data WHERE id = ?",
              [result.insertId],
              (err, newUserResults) => {
                if (err) return res.status(500).send("Server error");

                const newUser = newUserResults[0];
                res
                  .status(201)
                  .json({ message: "User registered", user: newUser });
              }
            );
          }
        );
      }
    );
  });
};


// -----------------------------------------------------update user------------------------------------------------------------


exports.updateProfile = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "File upload error", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Server error", error: err });
    }

    const { name, about } = req.body;
    let profile_image;

    // Check if an image file was uploaded
    if (req.file) {
      profile_image = req.file.path; // Store uploaded image file path
    }

    // Verify that name is provided
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Update user in the database
    const updateQuery = profile_image
      ? "UPDATE user_data SET name = ?,about = ?, profile_image = ? WHERE id = ?"
      : "UPDATE user_data SET name = ? WHERE id = ?";

    const queryParams = profile_image
      ? [name,about, profile_image, req.userId]
      : [name, req.userId];

    db.query(updateQuery, queryParams, (err, result) => {
      if (err) {
        return res.status(500).send({ message: "Server error", error: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "User not found" });
      }

      res
        .status(200)
        .json({ message: "Profile updated successfully",});
    });
  });
};



// -----------------------------------------------------login user from password------------------------------------------------------------



exports.loginPassword = (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM user_data WHERE email = ?', [email], (error, result) => {
    if (error) return res.status(500).send({error:'Server Error'});
    if (result.length === 0) {
      return res.status(404).send({error:'User Not Found'});
    }
    const user = result[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send({error:'Invaild password'});
    
    const token = jwt.sign({ id: user.id }, "secret", { expiresIn: 86400 });
    res.status(200).send({ user, auth: true, token: `${token}` });

  });
}


// -----------------------------------------------------logout------------------------------------------------------------

exports.logout = (req, res) => {
  // On the server side, JWT tokens are stateless, so logout happens on the client.
  res.status(200).json({ message: "Logged out successfully" });
};



// -----------------------------------------------------send OTP------------------------------------------------------------

exports.sendOtp = (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM user_data WHERE email = ?", [email], (error, results) => {
    if (error) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(404).json({error:"User not found"});

    const user = results[0];
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    db.query(
      "INSERT INTO user_otp (user_id, otp, expires_at) VALUES (?, ?, ?)",
      [user.id, otp, expiresAt],
      async (err) => {
        if (err) return res.status(500).send("Server error");

        await sendOTP(email, otp);
        res.status(200).send({ message: "OTP sent to email", otp: otp });
      }
    );
  });
};


// -----------------------------------------------------login user send otp------------------------------------------------------------


exports.loginOtp = (req, res) => {
  const { email, otp } = req.body;

  db.query("SELECT * FROM user_data WHERE email = ?", [email], (error, results) => {
    if (error) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(404).send("User not found");

    const user = results[0];

    db.query(
      "SELECT * FROM user_otp WHERE user_id = ? AND otp = ?",
      [user.id, otp],
      (err, otpResults) => {
        if (err) return res.status(500).send("Server error");
        if (otpResults.length === 0) return res.status(400).send("Invalid OTP");

        const otpEntry = otpResults[0];
        const currentTime = new Date();
        const otpExpiryTime = new Date(otpEntry.expires_at);

        console.log(`Current Time: ${currentTime}`);
        console.log(`OTP Expiry Time: ${otpExpiryTime}`);

        if (currentTime > otpExpiryTime) {
          return res.status(400).send("OTP expired");
        }
        const token = jwt.sign({ id: user.id }, "secret", { expiresIn: 86400 });

        // Clean up: delete the OTP after successful verification
        db.query(
          "DELETE FROM user_otp WHERE id = ?",
          [otpEntry.id],
          (deleteErr) => {
            if (deleteErr) console.error("Error deleting OTP:", deleteErr);
          }
        );

        delete user.password;

        res.status(200).send({ user, auth: true, token: `Bearer ${token}` });
      }
    );
  });
};

// -----------------------------------------------------verify otp ------------------------------------------------------------


exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  db.query("SELECT * FROM user_data WHERE email = ?", [email], (error, results) => {
    if (error) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(404).json({error:"User not found"});

    const user = results[0];

    db.query(
      "SELECT * FROM user_otp WHERE user_id = ? AND otp = ?",
      [user.id, otp],
      (err, otpResults) => {
        if (err) return res.status(500).send("Server error");
        if (otpResults.length === 0) return res.status(400).json({error:"Invalid OTP"});

        const otpEntry = otpResults[0];
        if (new Date() > new Date(otpEntry.expires_at))
          return res.status(400).json({error:"OTP expired"});

        // Clean up: delete the OTP after successful verification
        db.query("DELETE FROM otp WHERE id = ?", [otpEntry.id], (deleteErr) => {
          if (deleteErr) console.error("Error deleting OTP:", deleteErr);
        });

        res.status(200).send({message:"OTP verified, proceed to reset password"});
      }
    );
  });
};

// -----------------------------------------------------reset password------------------------------------------------------------



exports.resetPassword = (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    console.error("Missing email or newPassword:", { email, newPassword });
    return res.status(400).send("Email and new password are required");
  }
  try {
   // console.log("Reset Password Request:", { email, newPassword });

    const hashedPassword = bcrypt.hashSync(newPassword, 8);

    db.query(
      "UPDATE user_data SET password = ? WHERE email = ?",
      [hashedPassword, email],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Server error");
        }

        if (result.affectedRows === 0) {
          return res.status(404).send("User not found");
        }

        res.status(200).send({ message: "Password have Updated successfully" });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    return res.status(500).send("Error processing request");
  }
};



// -----------------------------------------------------all user------------------------------------------------------------


exports.allusers = (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).send({ message: "No token provided" });
  }
  jwt.verify(token, "secret", (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Failed to authenticate token" });
    }

    const loggedInUserId = decoded.id;

    // Query to get all users except the logged-in user
    db.query(
      "SELECT * FROM user_data WHERE id != ?",
      [loggedInUserId],
      (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Server Error" });
        }

        res.status(200).json({ data: result });
      }
    );
  });
};


// -----------------------------------------------------get login info user------------------------------------------------------------


exports.getUserInfo = (req, res) => {
  const userId = req.userId; // We get userId from the token after verification

  db.query(
    "SELECT id, name, email, about, profile_image, phone FROM user_data WHERE id = ?",
    [userId],
    (err, userResults) => {
      if (err) return res.status(500).send("Server error");

      if (userResults.length === 0) {
        return res.status(404).send("User not found");
      }

      const user = userResults[0];
      const profileImageUrl = `https://chat-backend-s5z0.onrender.com/${user.profile_image}`;

      // Send user data back
      res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        about:user.about,
        profile_image: profileImageUrl,
      });
    }
  );
};


// -----------------------------------------------------message user------------------------------------------------------------


exports.sendmessage = (req, res) => {
  // Use the multer upload middleware to handle multiple media files
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: "Failed to upload media" });
    }

    const { sender_id, receiver_id, message } = req.body;
    const files = req.files; // Media files uploaded by multer (array)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    if (!message && (!files || files.length === 0)) {
      return res.status(400).json({ error: "Message or media required" });
    }

    // Insert message into newmessage table
    db.query(
      "INSERT INTO newmessage (sender_id, receiver_id, message, timestamp) VALUES (?, ?, ?, NOW())",
      [sender_id, receiver_id, message || ""], // Insert empty message if not provided
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: "Failed to send message" });
        }

        const messageId = result.insertId;

        // If there are media files, insert each file into the media table
        if (files && files.length > 0) {
          files.forEach((file) => {
            const mediaUrl = `uploads/${file.filename}`; // Path to uploaded file
            const mediaType = file.mimetype.split("/")[0]; // Get type like 'image', 'audio', 'video'

            db.query(
              "INSERT INTO media (message_id, media_url, media_type, file_size) VALUES (?, ?, ?, ?)",
              [messageId, mediaUrl, mediaType, file.size],
              (err) => {
                if (err) {
                  console.error("Failed to store media:", err);
                }
              }
            );
          });
        }

        // Emit the message and notification to the receiver, including media if any
        const io = socket.getIo();
        io.to(receiver_id).emit("receiveMessage", {
          id: messageId,
          sender_id,
          receiver_id,
          message,
          media:
            files && files.length > 0
              ? files.map((file) => ({
                  url: `uploads/${file.filename}`,
                  type: file.mimetype.split("/")[0],
                }))
              : null, // Send media array if available
          timestamp: new Date(),
        });

        io.to(receiver_id).emit("receiveNotification", {
          id: messageId,
          sender_id,
          message,
          media:
            files && files.length > 0
              ? files.map((file) => ({
                  url: `uploads/${file.filename}`,
                  type: file.mimetype.split("/")[0],
                }))
              : null,
          timestamp: new Date(),
        });

        res
          .status(200)
          .json({ success: true, message: "Message sent successfully" });
      }
    );
  });
};




exports.getAllMessagesForUser = (req, res) => {
  const userId = req.userId;
  const otherUserId = req.params.otherUserId;

  // SQL query to fetch messages and associated media between the two users
  const query = `
    SELECT m.id, m.sender_id, m.receiver_id, m.message, m.timestamp, m.status, 
           GROUP_CONCAT(media.media_url SEPARATOR ',') AS media_urls,
           GROUP_CONCAT(media.media_type SEPARATOR ',') AS media_types
    FROM newmessage AS m
    LEFT JOIN media ON media.message_id = m.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    GROUP BY m.id
    ORDER BY m.timestamp ASC
  `;

  db.query(query, [userId, otherUserId, otherUserId, userId], (err, results) => {
    if (err) {
      return res.status(500).send({ message: "Server error" });
    }

    // Format the result to include media as an array of objects
    const formattedResults = results.map((msg) => {
      const mediaUrls = msg.media_urls ? msg.media_urls.split(",") : [];
      const mediaTypes = msg.media_types ? msg.media_types.split(",") : [];

      // Combine media URLs and types into an array of objects
      const mediaFiles = mediaUrls.map((url, index) => ({
        media_url: url,
        media_type: mediaTypes[index],
      }));

      return {
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        message: msg.message,
        timestamp: msg.timestamp,
        status: msg.status,
        media_files: mediaFiles,
      };
    });

    res.status(200).json({ messages: formattedResults });
  });
};



// exports.sendmessage = (req, res) => {
//   const { sender_id, receiver_id, message } = req.body;
//    const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header
//    if (!token) {
//      return res.status(401).json({ message: "No token provided" });
//    }
//   if (!message || !sender_id || !receiver_id) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }
//        db.query(
//          "INSERT INTO newmessage (sender_id, receiver_id, message, timestamp) VALUES (?, ?, ?, NOW())",
//          [sender_id, receiver_id, message],
//          (err, result) => {
//            if (err) {
//              return res.status(500).json({ error: "Failed to send message" });
//            }
//            const messageId = result.insertId;
//            console.log("messageId", messageId);

//            // Get the io object and emit to the receiver's room
//            const io = socket.getIo(); // Get the initialized io instance
//            io.to(receiver_id).emit("receiveMessage", {
//              id:messageId,
//              sender_id,
//              receiver_id,
//              message,
//              timestamp: new Date(),
//            });

//            io.to(receiver_id).emit("receiveNotification", {
//              id: messageId,
//              sender_id,
//              message,
//              timestamp: new Date(),
//            });

//            res.status(200).json({ success: true, message: "Message sent and notification created" });
//          }
//        );    

// };

// -----------------------------------------------------get message user------------------------------------------------------------



// exports.getAllMessagesForUser = (req, res) => {
//   const userId = req.userId; // Extracted from the token after verification
//   const otherUserId = req.params.otherUserId; // The user ID sent in the request params

//   // SQL query to fetch messages between the logged-in user and the other user, ordered by timestamp ASC for chat-like behavior
//   const query = `
//     SELECT * FROM newmessage 
//     WHERE (sender_id = ? AND receiver_id = ?) 
//        OR (sender_id = ? AND receiver_id = ?)
//     ORDER BY timestamp ASC
//   `;

//   // Execute the query with both userId and otherUserId as parameters
//   db.query(
//     query,
//     [userId, otherUserId, otherUserId, userId],
//     (err, results) => {
//       if (err) {
//         // Return a 500 status if there's a server error
//         return res.status(500).send({ message: "Server error" });
//       }

//       // If messages are found, return them, otherwise return an empty array
//       res.status(200).json({ messages: results.length > 0 ? results : [] });
//     }
//   );
// };

// ------------------------------------get notification----------------------------------------

exports.getNotifications = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const decoded = jwt.verify(token, "secret");
  const userId = decoded.id;

  db.query(
    "SELECT * FROM newmessage WHERE receiver_id = ? AND status = false ORDER BY timestamp DESC",
    [userId],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Failed to retrieve notifications" });
      }
      res.status(200).json({ success: true, notifications: result });
    }
  );
};



// ------------------------------------------seen notification-------------------------------------------------------------


exports.markNotificationAsSeen = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const decoded = jwt.verify(token, "secret");
  const userId = decoded.id;
  const { notification_id } = req.params; // Getting notification_id from the URL params

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  db.query(
    "UPDATE newmessage SET status = true WHERE receiver_id = ? AND id = ?",
    [userId, notification_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to update notification" });
      }
      res
        .status(200)
        .json({ success: true, message: "Notification marked as seen" });
    }
  );
};



// ---------------------------------------------seen message-----------------------------------------------------------

exports.markMessageSeen = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const decoded = jwt.verify(token, "secret");
  const userId = decoded.id; // The receiver (current user)
  const { senderId } = req.params; // Get the senderId from the request params

  if (!senderId) {
    return res.status(400).json({ error: "Sender ID is required" });
  }

  // Update the status of all messages sent by senderId to the current user (userId)
  db.query(
    "UPDATE newmessage SET status = true WHERE sender_id = ? AND receiver_id = ?",
    [senderId, userId], // Update based on senderId and receiverId (current user)
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Failed to update message status" });
      }

      res
        .status(200)
        .json({
          success: true,
          message: "All messages from sender marked as seen",
        });
    }
  );
};



// exports.markMessageSeen = (req, res) => {
//   // Get token from headers
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   // Verify and decode the JWT token
//   try {
//     const decoded = jwt.verify(token, "secret");
//     const userId = decoded.id; // Extract user ID from the token

//     // Get messageId from the URL params
//     const { messageId } = req.params;

//     if (!messageId) {
//       return res.status(400).json({ error: "Message ID is required" });
//     }

//     // Update the message's seen status
//     const query =
//       "UPDATE newmessage SET status = true WHERE id = ? AND receiver_id = ?";
//     db.query(query, [messageId, userId], (err, result) => {
//       if (err) {
//         return res
//           .status(500)
//           .json({ error: "Failed to update message status" });
//       }

//       if (result.affectedRows === 0) {
//         return res
//           .status(404)
//           .json({ message: "Message not found or unauthorized" });
//       }

//       return res
//         .status(200)
//         .json({ success: true, message: "Message marked as seen" });
//     });
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// --------------------------------------------------unseen count message--------------------------------------
exports.countUnseenMessages = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, "secret");
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const user_id = decoded.id; // Get the logged-in user ID from the decoded token
  const { userId } = req.params; // Get the sender's ID from the request parameters

  // First query to count unseen messages
  db.query(
    `SELECT COUNT(*) AS unseenCount 
     FROM newmessage 
     WHERE receiver_id = ? AND sender_id = ? AND status = 0`,
    [user_id, userId], // user_id should match receiver_id, and userId should match sender_id
    (errCount, countResult) => {
      if (errCount) {
        console.error("Error counting unseen messages:", errCount);
        return res
          .status(500)
          .json({ error: "Failed to count unseen messages" });
      }

      const unseenCount = countResult[0].unseenCount;

      // Second query to get all unseen messages
      db.query(
        `SELECT * FROM newmessage 
         WHERE receiver_id = ? AND sender_id = ? AND status = 0`,
        [user_id, userId], // Same condition as above for retrieving the unseen messages
        (errMessages, messagesResult) => {
          if (errMessages) {
            console.error("Error retrieving unseen messages:", errMessages);
            return res
              .status(500)
              .json({ error: "Failed to retrieve unseen messages" });
          }

          res.status(200).json({ unseenCount, unseenMessages: messagesResult });
        }
      );
    }
  );
};























