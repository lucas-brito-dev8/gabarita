const pool = require('../config/db')
const sleep = require('./sleep')

async function importQuestions() {
    let year = 2009

    while (year <= 2023) {
        let limit = 50
        let offset = 0
        let hasMore = true

        try {
            while (hasMore) {
                const response = await fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=${limit}&offset=${offset}`)
                const data = await response.json()

                for (let question of data.questions) {
                    const exists = await pool.query(
                        'SELECT id FROM question_bank WHERE year = $1 AND question_number = $2',
                        [question.year, question.index]
                    )

                    if (exists.rows.length > 0) {
                        continue
                    }

                    const insertContext = await pool.query('INSERT INTO question_context (context) VALUES ($1) RETURNING id',
                        [question.context]
                    )
                    const context_id = insertContext.rows[0].id

                    const insertQuestion = await pool.query('INSERT INTO question_bank (subject, year, question_number, statement, context_id, language, correct_alternative) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                        [question.discipline, question.year, question.index, question.alternativesIntroduction, context_id, question.language, question.correctAlternative]
                    )
                    const question_id = insertQuestion.rows[0].id

                    for (let file of question.files) {
                        const insertFiles = await pool.query('INSERT INTO question_files (question_id, file_url) VALUES ($1, $2)',
                            [question_id, file]
                        )
                    }

                    for (let alternative of question.alternatives) {
                        const insertAlternatives = await pool.query('INSERT INTO alternatives (question_id, letter, text, file_url) VALUES ($1, $2, $3, $4)',
                            [question_id, alternative.letter, alternative.text, alternative.file]
                        )
                    }
                }

                offset = offset + limit
                hasMore = data.metadata.hasMore

                await sleep(1000)
            }
        } catch (error) {
            console.error(`Error in ${year}, offset ${offset}: `, error)
            throw error
        }

        year++
    }

    return 'Done!'
}

importQuestions()
    .then(() => console.log('Done!'))
    .catch((error) => console.error('ETL failed:', error))