import { auth } from "../auth.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized - Please log in" });
    }

    if (session.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    req.user = session.user; // Attach user to request
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const requireAuth = async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
  
      if (!session || !session.user) {
        return res.status(401).json({ message: "Unauthorized - Please log in" });
      }
  
      req.user = session.user; // Attach user to request
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  };
