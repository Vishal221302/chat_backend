const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  // Split 'Bearer ' from the actual token if 'Bearer ' exists
  const bearerToken = token.split(" ")[1] || token;

  // Verify the token
  jwt.verify(bearerToken, "secret", (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    // If valid, attach user ID to the request for further use
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
