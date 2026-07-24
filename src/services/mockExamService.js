const pool = require('../config/db')

async function selectQuestions(subject, limit) {
    if (subject === undefined) {
        const selectQuestions = await pool.query('SELECT id FROM question_bank ORDER BY RANDOM() LIMIT $1',
            [limit]
        )

        return selectQuestions.rows
    }

    const selectQuestionsBySubject = await pool.query('SELECT id FROM question_bank WHERE subject = $1 ORDER BY RANDOM() LIMIT $2',
        [subject, limit]
    )

    return selectQuestionsBySubject.rows
}

module.exports = { selectQuestions }