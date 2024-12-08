import jwt  from "jsonwebtoken";


const config = process.env;

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({
      status: 108,
      message: "Token tidak tidak valid atau kadaluwarsa",
      data:null
    });
  }

  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    req.user = decoded.email;
  } catch (err) {
    return res.status(403).json({
      status: 108,
      message: "Token tidak tidak valid atau kadaluwarsa",
      data:null
    });
  }

  return next();
};

export default verifyToken