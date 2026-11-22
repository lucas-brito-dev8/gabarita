const pool = require('../config/db')
const { selectQuestions } = require('../services/mockExamService')

const VALID_SUBJECTS = ['ciencias-natureza', 'ciencias-humanas', 'matematica', 'linguagens']
const STATUS_IN_PROGRESS = 'Em andamento.'

async function createMockExam(req, res) {
    try {
        const userId = req.user.id
        const subject = req.body.subject
        const limit = Number(req.body.limit)

        if (!Number.isInteger(limit) || limit < 1 || limit > 180) {
            return res.status(400).send('O limite de questões por simulado é entre 1 e 180.')
        }

        if (subject !== undefined && !VALID_SUBJECTS.includes(subject)) {
            return res.status(400).send('Matéria inválida. Opções: ' + VALID_SUBJECTS.join(', ') + '.')
        }

        const questions = await selectQuestions(subject, limit)

        const insertMockExam = await pool.query('INSERT INTO mock_exam (user_id, used_filters, status) VALUES ($1, $2, $3) RETURNING id',
            [userId, subject, STATUS_IN_PROGRESS]
        )

        const mockExamId = insertMockExam.rows[0].id

        for (let objects of questions) {
            const insertQuestions = await pool.query('INSERT INTO mock_exam_questions (mock_exam_id, question_id) VALUES ($1, $2)',
                [mockExamId, objects.id]
            )
        }

        res.status(200).json({ mockExamId: mockExamId })
    } catch (e) {
        console.log(e)
        return res.status(500).send('Erro interno do servidor.')
    }
}

async function getQuestions(req, res) {
    try {
        const mockExamId = Number(req.params.id)

        if (!Number.isInteger(mockExamId) || mockExamId <= 0) {
            return res.status(400).send('Id de simulado inválido.')
        }

        const fetchMockExam = await pool.query(
            'SELECT id, user_id FROM mock_exam WHERE id = $1',
            [mockExamId]
        )

        if (fetchMockExam.rows.length === 0) {
            return res.status(404).send('Simulado não existe.')
        }

        if (fetchMockExam.rows[0].user_id !== req.user.id) {
            return res.status(403).send('Acesso negado.')
        }

        const questions = await pool.query(
            `SELECT
                meq.id AS mock_exam_question_id,
                qb.id AS question_id,
                qb.subject,
                qb.year,
                qb.question_number,
                qb.statement,
                qb.language,
                qc.context AS context_text,
                a.letter,
                a.text AS alternative_text,
                a.file_url
            FROM mock_exam_questions meq
            JOIN question_bank qb ON qb.id = meq.question_id
            LEFT JOIN question_context qc ON qc.id = qb.context_id
            JOIN alternatives a ON a.question_id = qb.id
            WHERE meq.mock_exam_id = $1
            ORDER BY meq.id, a.letter`,
            [mockExamId]
        )

        return res.status(200).json(questions.rows)
    } catch (e) {
        console.log(e)
        return res.status(500).send('Erro interno do servidor.')
    }
}

const STATUS_FINISHED = 'Finalizado.'
const VALID_LETTERS = ['A', 'B', 'C', 'D', 'E']

async function submitAnswers(req, res) {
    try {
        const mockExamId = Number(req.params.id)
        const answers = req.body.answers

        if (!Number.isInteger(mockExamId) || mockExamId <= 0) {
            return res.status(400).send('Id de simulado inválido.')
        }

        if (!Array.isArray(answers) || answers.length > 180) {
            return res.status(400).send('Envie uma lista de respostas com no máximo 180 itens.')
        }

        for (const item of answers) {
            if (!item || !Number.isInteger(item.mock_exam_question_id) || !VALID_LETTERS.includes(item.answered_alternative)) {
                return res.status(400).send('Formato de resposta inválido.')
            }
        }

        const fetchMockExam = await pool.query(
            'SELECT id, user_id, status FROM mock_exam WHERE id = $1',
            [mockExamId]
        )

        if (fetchMockExam.rows.length === 0) {
            return res.status(404).send('Simulado não existe.')
        }

        if (fetchMockExam.rows[0].user_id !== req.user.id) {
            return res.status(403).send('Acesso negado.')
        }

        if (fetchMockExam.rows[0].status !== STATUS_IN_PROGRESS) {
            return res.status(409).send('Simulado já finalizado.')
        }

        const examQuestions = await pool.query(
            `SELECT meq.id, qb.correct_alternative
            FROM mock_exam_questions meq
            JOIN question_bank qb ON qb.id = meq.question_id
            WHERE meq.mock_exam_id = $1`,
            [mockExamId]
        )

        const validIds = new Set(examQuestions.rows.map(q => q.id))
        const answersById = new Map()

        for (const item of answers) {
            if (!validIds.has(item.mock_exam_question_id)) {
                return res.status(400).send('Questão não pertence ao simulado.')
            }
            if (answersById.has(item.mock_exam_question_id)) {
                return res.status(400).send('Questão repetida na lista de respostas.')
            }
            answersById.set(item.mock_exam_question_id, item.answered_alternative)
        }

        const client = await pool.connect()
        let correct = 0

        try {
            await client.query('BEGIN')

            const finish = await client.query(
                'UPDATE mock_exam SET status = $1 WHERE id = $2 AND status = $3 RETURNING id',
                [STATUS_FINISHED, mockExamId, STATUS_IN_PROGRESS]
            )

            if (finish.rowCount === 0) {
                await client.query('ROLLBACK')
                return res.status(409).send('Simulado já finalizado.')
            }

            for (const q of examQuestions.rows) {
                const letter = answersById.get(q.id) ?? null

                await client.query(
                    'INSERT INTO answers (mock_exam_question_id, answered_alternative) VALUES ($1, $2)',
                    [q.id, letter]
                )

                if (letter === q.correct_alternative) correct++
            }

            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }

        return res.status(200).json({ total: examQuestions.rows.length, correct })
    } catch (e) {
        console.log(e)
        return res.status(500).send('Erro interno do servidor.')
    }
}

module.exports = { createMockExam, getQuestions, submitAnswers }