const express = require('express')
require('dotenv').config()

const app = express()
const authRoutes = require('./routes/authRoutes')
const mockExamRoutes = require('./routes/mockExamRoutes')

app.use(express.json())
app.use('/auth', authRoutes)
app.use('/mockExam', mockExamRoutes)

app.listen(8000, () => {
    console.log('Servidor rodando na porta 8000.')
})