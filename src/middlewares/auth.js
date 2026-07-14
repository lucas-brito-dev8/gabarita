const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET

function verifyToken(req, res, next) {
    try {
        const headersAuth = req.headers.authorization

        if (!headersAuth) {
            return res.status(401).send('Token not provided.')
        }

        const token = headersAuth.split(' ')[1]
        const decoded = jwt.verify(token, SECRET)

        req.user = decoded

        next()
    } catch(e) {
        if (e.name === 'JsonWebTokenError') {
            return res.status(403).send('Invalid token.')
        }

        if (e.name === 'TokenExpiredError') {
            return res.status(403).send('Token expired. Log in again.')
        }

        return res.status(401).send(e.message)
    }
}

module.exports = { verifyToken }