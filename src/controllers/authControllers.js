const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const bcrypt = require('bcrypt')

const SECRET = process.env.JWT_SECRET

async function register(req, res) {
    try {
        const { name, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)

        const existing = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        )

        if (existing.rows.length > 0) {
            return res.status(401).send("Esse email já foi registrado.")
        }

        const result = await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]
        )

        const user = result.rows[0]

        const token = jwt.sign({ name: user.name, id: user.id, email: user.email }, SECRET)

        res.status(201).json({ name: user.name, id: user.id, email: user.email, token: token })
    } catch (e) {
        console.log(e)
        return res.status(500).send('Erro interno do servidor.')
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body

        const user = await pool.query('SELECT * FROM users WHERE email = $1',
            [email]
        )

        if (user.rows.length === 0) {
            return res.status(401).send('Usuário não encontrado.')
        }

        const userPassword = user.rows[0].password_hash
        const compare = await bcrypt.compare(password, userPassword)

        if (!compare) {
            return res.status(403).send('Senha inválida.')
        }

        const token = jwt.sign({ name: user.rows[0].name, id: user.rows[0].id, email: user.rows[0].email }, SECRET)

        res.status(201).json({ name: user.rows[0].name, id: user.rows[0].id, email: user.rows[0].email, token: token })
    } catch (e) {
        console.log(e)
        return res.status(500).send('Erro interno do servidor.')
    }
}

async function profile(req, res) {
    try {
        const fetchUser = await pool.query('SELECT id, name, email FROM users WHERE id = $1',
            [req.user.id]
        )

        if (fetchUser.rows.length === 0) {
            return res.status(404).send('Usuário não existe.')
        }

        const user = fetchUser.rows[0]

        res.json({ name: user.name, id: user.id, email: user.email })
    } catch (e) {
        console.log(e)
        return res.status(500).send('Erro interno do servidor')
    }
}

module.exports = { register, login, profile }