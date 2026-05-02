const express = require("express")
const passport = require("passport")
const jwt = require("jsonwebtoken")

const router = express.Router()

// Step 1: Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
)

// Step 2: Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    // Redirect back to frontend
    res.redirect(
      `${process.env.FRONTEND_URL}/google-success?token=${token}`
    )
  }
)

module.exports = router
