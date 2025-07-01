'use strict';
require('dotenv').config();

const Fastify = require('fastify');
const fastify = Fastify({ logger: true });

const cors   = require('@fastify/cors');
const jwt    = require('@fastify/jwt');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// CORS (dev: любой, prod: по FRONTEND_ORIGIN)
fastify.register(cors, {
  origin: process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',')
    : true
});

// JWT
fastify.register(jwt, { secret: process.env.JWT_SECRET });

// Postgres pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()')
  .then(res => fastify.log.info('DB connected at', res.rows[0].now))
  .catch(err => fastify.log.error('DB connection error', err));

// --- Хуки ---

// 1) Проверка JWT
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.send(err);
  }
});

// 2) Проверка роли admin
fastify.decorate('authorizeAdmin', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.send(err);
  }
  if (request.user.role !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden: requires admin role' });
  }
});

// === Public ===

// Health-check
fastify.get('/health', async () => ({ status: 'ok' }));

// Sign Up
fastify.post('/signup', async (request, reply) => {
  const { name, email, password } = request.body || {};
  if (!name || !email || !password) {
    return reply
      .status(400)
      .send({ error: 'Name, email and password are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users(name,email,password_hash)
         VALUES($1,$2,$3)
       RETURNING id,name,email,role,created_at`,
      [name, email, hash]
    );
    const user = rows[0];
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role
    });
    return reply.status(201).send({ user, token });
  } catch (err) {
    fastify.log.error('Error signing up', err);
    if (err.code === '23505') {
      return reply.status(409).send({ error: 'Email already exists' });
    }
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Login
fastify.post('/login', async (request, reply) => {
  const { email, password } = request.body || {};
  if (!email || !password) {
    return reply
      .status(400)
      .send({ error: 'Email and password are required' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id,email,password_hash,role FROM users WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role
    });
    return { token };
  } catch (err) {
    fastify.log.error('Error logging in', err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Protected profile (любой залогиненный)
fastify.get(
  '/profile',
  { preValidation: [fastify.authenticate] },
  async (request, reply) => {
    const { id } = request.user;
    const { rows } = await pool.query(
      `SELECT id,name,email,role,created_at
         FROM users
        WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return rows[0];
  }
);

// === CRUD для users (только admin) ===

// GET /users
fastify.get(
  '/users',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    try {
      const { rows } = await pool.query(
        `SELECT id,name,email,role,created_at
           FROM users
          ORDER BY id`
      );
      return rows;
    } catch (err) {
      fastify.log.error('Error fetching users', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// GET /users/:id
fastify.get(
  '/users/:id',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const { rows } = await pool.query(
        `SELECT id,name,email,role,created_at
           FROM users
          WHERE id = $1`,
        [id]
      );
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return rows[0];
    } catch (err) {
      fastify.log.error('Error fetching user by id', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// PUT /users/:id
fastify.put(
  '/users/:id',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    const { id } = request.params;
    const { name, email, role } = request.body || {};
    if (!name && !email && !role) {
      return reply
        .status(400)
        .send({ error: 'At least one of name, email or role must be provided' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (name)  { fields.push(`name = $${idx++}`);  values.push(name); }
    if (email) { fields.push(`email = $${idx++}`); values.push(email); }
    if (role)  { fields.push(`role = $${idx++}`);  values.push(role); }
    values.push(id);

    const query = `
      UPDATE users
        SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id,name,email,role,created_at
    `;
    try {
      const { rows } = await pool.query(query, values);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return rows[0];
    } catch (err) {
      fastify.log.error('Error updating user', err);
      if (err.code === '23505') {
        return reply.status(409).send({ error: 'Email already exists' });
      }
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// DELETE /users/:id
fastify.delete(
  '/users/:id',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const { rows } = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return reply.status(204).send();
    } catch (err) {
      fastify.log.error('Error deleting user', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// === CRUD для listing_types (только admin) ===

// GET /listing-types
fastify.get(
  '/listing-types',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    try {
      const { rows } = await pool.query(
        `SELECT id,name,schema,created_at
           FROM listing_types
          ORDER BY id`
      );
      return rows;
    } catch (err) {
      fastify.log.error('Error fetching listing types', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// GET /listing-types/:id
fastify.get(
  '/listing-types/:id',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const { rows } = await pool.query(
        `SELECT id,name,schema,created_at
           FROM listing_types
          WHERE id = $1`,
        [id]
      );
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'ListingType not found' });
      }
      return rows[0];
    } catch (err) {
      fastify.log.error('Error fetching listing type by id', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// POST /listing-types
fastify.post(
  '/listing-types',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    const { name, schema } = request.body || {};
    if (!name || !schema) {
      return reply
        .status(400)
        .send({ error: 'Name and schema are required' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO listing_types(name,schema)
           VALUES($1,$2)
         RETURNING id,name,schema,created_at`,
        [name, JSON.stringify(schema)]
      );
      return reply.status(201).send(rows[0]);
    } catch (err) {
      fastify.log.error('Error creating listing type', err);
      if (err.code === '23505') {
        return reply.status(409).send({ error: 'ListingType already exists' });
      }
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// PUT /listing-types/:id
fastify.put(
  '/listing-types/:id',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    const { id } = request.params;
    const { name, schema } = request.body || {};
    if (!name && !schema) {
      return reply
        .status(400)
        .send({ error: 'At least one of name or schema must be provided' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (name)   { fields.push(`name = $${idx++}`);   values.push(name); }
    if (schema) { fields.push(`schema = $${idx++}`); values.push(JSON.stringify(schema)); }
    values.push(id);

    const query = `
      UPDATE listing_types
        SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id,name,schema,created_at
    `;
    try {
      const { rows } = await pool.query(query, values);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'ListingType not found' });
      }
      return rows[0];
    } catch (err) {
      fastify.log.error('Error updating listing type', err);
      if (err.code === '23505') {
        return reply.status(409).send({ error: 'ListingType already exists' });
      }
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// DELETE /listing-types/:id
fastify.delete(
  '/listing-types/:id',
  { preValidation: [fastify.authenticate, fastify.authorizeAdmin] },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const { rows } = await pool.query(
        'DELETE FROM listing_types WHERE id = $1 RETURNING id',
        [id]
      );
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'ListingType not found' });
      }
      return reply.status(204).send();
    } catch (err) {
      fastify.log.error('Error deleting listing type', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// === CRUD для listings ===

// GET /listings — публично
fastify.get('/listings', async (request, reply) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM listings ORDER BY created_at DESC`
    );
    return rows;
  } catch (err) {
    fastify.log.error('Error fetching listings', err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// GET /listings/:id — публично
fastify.get('/listings/:id', async (request, reply) => {
  const { id } = request.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM listings WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Listing not found' });
    }
    return rows[0];
  } catch (err) {
    fastify.log.error('Error fetching listing by id', err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// POST /listings — только авторизованные
fastify.post(
  '/listings',
  { preValidation: [fastify.authenticate] },
  async (request, reply) => {
    const { type_id, title, description, location, price, gallery, fields } = request.body || {};
    if (!type_id || !title) {
      return reply.status(400).send({ error: 'type_id и title обязательны' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO listings(owner_id,type_id,title,description,location,price,gallery,fields)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          request.user.id,
          type_id,
          title,
          description || null,
          location || null,
          price || null,
          gallery || [],
          fields ? JSON.stringify(fields) : null
        ]
      );
      return reply.status(201).send(rows[0]);
    } catch (err) {
      fastify.log.error('Error creating listing', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// PUT /listings/:id — только владелец или admin
fastify.put(
  '/listings/:id',
  { preValidation: [fastify.authenticate] },
  async (request, reply) => {
    const { id } = request.params;
    // сначала проверяем владельца
    const { rows: exist } = await pool.query(
      'SELECT owner_id FROM listings WHERE id = $1',
      [id]
    );
    if (exist.length === 0) {
      return reply.status(404).send({ error: 'Listing not found' });
    }
    const ownerId = exist[0].owner_id;
    if (request.user.id !== ownerId && request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    // собираем обновления
    const { type_id, title, description, location, price, gallery, fields } = request.body || {};
    const sets = [], vals = [], idx = 1;
    if (type_id    != null) { sets.push(`type_id=$${idx++}`);    vals.push(type_id); }
    if (title      != null) { sets.push(`title=$${idx++}`);      vals.push(title); }
    if (description!= null) { sets.push(`description=$${idx++}`);vals.push(description); }
    if (location   != null) { sets.push(`location=$${idx++}`);   vals.push(location); }
    if (price      != null) { sets.push(`price=$${idx++}`);      vals.push(price); }
    if (gallery    != null) { sets.push(`gallery=$${idx++}`);    vals.push(gallery); }
    if (fields     != null) { sets.push(`fields=$${idx++}`);     vals.push(JSON.stringify(fields)); }
    if (sets.length === 0) {
      return reply.status(400).send({ error: 'Нет полей для обновления' });
    }
    vals.push(id);
    try {
      const { rows } = await pool.query(
        `UPDATE listings SET ${sets.join(', ')} WHERE id=$${idx} RETURNING *`,
        vals
      );
      return rows[0];
    } catch (err) {
      fastify.log.error('Error updating listing', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// DELETE /listings/:id — только владелец или admin
fastify.delete(
  '/listings/:id',
  { preValidation: [fastify.authenticate] },
  async (request, reply) => {
    const { id } = request.params;
    const { rows: exist } = await pool.query(
      'SELECT owner_id FROM listings WHERE id = $1',
      [id]
    );
    if (exist.length === 0) {
      return reply.status(404).send({ error: 'Listing not found' });
    }
    const ownerId = exist[0].owner_id;
    if (request.user.id !== ownerId && request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    try {
      await pool.query('DELETE FROM listings WHERE id = $1', [id]);
      return reply.status(204).send();
    } catch (err) {
      fastify.log.error('Error deleting listing', err);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
);

// Запуск
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';
fastify.listen({ host: HOST, port: PORT })
  .then(() => fastify.log.info(`Server listening on ${HOST}:${PORT}`))
  .catch(err => {
    fastify.log.error(err);
    process.exit(1);
  });
