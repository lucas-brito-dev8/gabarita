const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const { register, login, profile } = require('../controllers/authControllers')

router.post('/register', register)
router.post('/login', login)
router.get('/profile', verifyToken, profile)

module.exports = router