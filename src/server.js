const express = require('express')
require('dotenv').config()

const app = express()
const authRoutes = require('./routes/authRoutes')

app.use(express.json())
app.use('/auth', authRoutes)

app.listen(8000, () => {
    console.log('Servidor rodando na porta 8000.')
})