const jwt = require('jsonwebtoken')
const pool = require('../config/db')

const SECRET = process.env.JWT_SECRET

async function register(req, res) {
    try {
        const { email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)

        const existing = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        )

        if (existing.rows.length > 0) {
            return res.status(401).send("Email is already registered.")
        }

        const result = await pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
            [email, hashedPassword]
        )

        const user = result.rows[0]

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET)

        res.send('User created!')
    } catch (e) {
        console.log(e)
        return res.status(500).send('Internal server error.')
    }
}

async function login(req, res) {
    try {

    } catch(e) {
        
    }
}