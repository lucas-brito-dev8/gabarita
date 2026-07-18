# Gabarita

**Gabarita** is a study platform for Brazilian students preparing for the **ENEM** (Exame Nacional do Ensino Médio), Brazil's national high school exam used for university admissions. The goal is to give students a focused, data-driven way to practice with real past exam questions, track their performance, and identify where they need to improve.

This project is being built from scratch as a learning exercise in back-end architecture, relational database design, and REST API development, and is currently a work in progress.

## Motivation

ENEM prep resources are often scattered, paywalled, or don't give students meaningful insight into their own performance over time. Gabarita aims to centralize real historical ENEM questions into a single platform where students can build custom practice exams, review their answers, and eventually get a clear picture of their readiness relative to the cutoff scores (*notas de corte*) of the universities and programs they're targeting.

## Current Status

The project is in active development. Completed so far:

- **Database schema**: a normalized PostgreSQL schema (7 tables) covering users, questions, question context/support text, alternatives, associated files, mock exams, and answers.
- **ETL pipeline**: a script that imports questions from the public [enem.dev](https://api.enem.dev/v1) API, covering exams from 2009 to 2023 (~2,700 questions), with rate limiting, pagination, and idempotent inserts.
- **REST API (in progress)**: authentication routes (register, login, JWT-based session validation) are implemented; question and mock exam routes are next.

## Planned Features

- **Mock exams (simulados)**: students assemble practice exams filtered by subject, year, or difficulty, and get scored results.
- **Performance statistics**: dashboards tracking accuracy over time, by subject and by topic, to highlight strengths and weaknesses.
- **Cutoff score comparison (nota de corte)**: compare a student's simulated performance against historical admission cutoffs for specific university programs.
- **AI-powered essay (redação) grading**: automated feedback on ENEM-style essays, evaluated against the exam's official competency criteria.
- **Front-end (React)**: a web client consuming this API, planned once the back-end is stable.

## Tech Stack

- **Back-end**: Node.js + Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Front-end**: React (planned)

## Project Structure

```
src/
├── config/       # database connection (pg pool), environment setup
├── models/       # data access layer
├── controllers/  # request handlers
├── services/     # business logic
├── routes/       # route definitions
├── middlewares/  # e.g. JWT authentication
├── jobs/         # one-off/background scripts (e.g. question import ETL)
└── utils/        # shared helper functions
```

## Database Schema

The schema is normalized across 7 tables:

- `users` — student accounts and credentials
- `question_bank` — individual ENEM questions (subject, year, statement, correct answer)
- `question_context` — shared context/support text referenced by one or more questions
- `question_files` — media files (images, etc.) attached to a question
- `alternatives` — the answer options for each question
- `mock_exam` — a practice exam session created by a user
- `mock_exam_questions` — the specific questions selected for a given mock exam
- `answers` — a user's submitted answer for a question within a mock exam

Notable design decisions:
- Question context is kept in its own table since multiple questions can share the same supporting text.
- Answer alternatives are normalized into their own table rather than stored as fixed columns, to keep the schema flexible.
- Selected questions for a mock exam are persisted independently of answers, so a student's exam session survives a page refresh before any answer is submitted.

## Data Source

Questions are sourced from the public [enem.dev](https://api.enem.dev/v1) API. Note: at the time of import, this API only provides the Spanish-language version of ENEM questions (the English-language variant is not available in their dataset).

## Getting Started

> This section will be filled in as the API stabilizes and setup steps are finalized.

```bash
npm install
# configure your .env file (see .env.example)
npm run dev
```

## License

TBD