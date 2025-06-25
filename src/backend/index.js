'use strict';

// если хочешь локально без Docker, раскомментируй:
// require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');

// Инициализация пула подключений к БД
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Пробный запрос при старте для проверки подключения
pool
  .query('SELECT NOW()')
  .then(res => fastify.log.info('DB connected at', res.rows[0].now))
  .catch(err => fastify.log.error('DB connection error', err));

// Health-check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// GET /users — список всех пользователей
fastify.get('/users', async (request, reply) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY id'
    );
    return result.rows;
  } catch (err) {
    fastify.log.error('Error fetching users', err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// POST /users — создание нового пользователя
fastify.post('/users', async (request, reply) => {
  const { name, email } = request.body || {};
  if (!name || !email) {
    return reply.status(400).send({ error: 'Name and email are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO users(name, email) VALUES($1, $2) RETURNING id, name, email, created_at',
      [name, email]
    );
    reply.status(201).send(result.rows[0]);
  } catch (err) {
    fastify.log.error('Error creating user', err);
    if (err.code === '23505') {
      return reply.status(409).send({ error: 'Email already exists' });
    }
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// GET /users/:id — получить пользователя по ID
fastify.get('/users/:id', async (request, reply) => {
  const { id } = request.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return result.rows[0];
  } catch (err) {
    fastify.log.error('Error fetching user by id', err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// PUT /users/:id — обновление пользователя
fastify.put('/users/:id', async (request, reply) => {
  const { id } = request.params;
  const { name, email } = request.body || {};

  if (!name && !email) {
    return reply
      .status(400)
      .send({ error: 'At least one of name or email must be provided' });
  }

  // Динамически собираем SET-часть
  const fields = [];
  const values = [];
  let idx = 1;

  if (name) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (email) {
    fields.push(`email = $${idx++}`);
    values.push(email);
  }

  // id для WHERE
  values.push(id);

  const query = `
    UPDATE users
       SET ${fields.join(', ')}
     WHERE id = $${idx}
  RETURNING id, name, email, created_at
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return result.rows[0];
  } catch (err) {
    fastify.log.error('Error updating user', err);
    if (err.code === '23505') {
      return reply.status(409).send({ error: 'Email already exists' });
    }
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// DELETE /users/:id — удаление пользователя
fastify.delete('/users/:id', async (request, reply) => {
  const { id } = request.params;
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }
    // 204 No Content
    return reply.status(204).send();
  } catch (err) {
    fastify.log.error('Error deleting user', err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
