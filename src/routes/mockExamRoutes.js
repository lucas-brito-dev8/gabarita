const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const { createMockExam, getQuestions, submitAnswers } = require('../controllers/mockExamControllers')

router.post('/createMockExam', verifyToken, createMockExam)
router.get('/getQuestions/:id', verifyToken, getQuestions)
router.post('/submitAnswers/:id', verifyToken, submitAnswers)

module.exports = router