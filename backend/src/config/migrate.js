require('dotenv').config();
const pool = require('./database');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'operator',
        organization VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // CPP (Digital Transport Passport) table
    await client.query(`
      CREATE TYPE cpp_status AS ENUM (
        'draft', 'entry_pi', 'entry_im', 'in_transit', 'exit', 'completed', 'cancelled'
      );
    `).catch(() => {}); // ignore if type already exists

    await client.query(`
      CREATE TABLE IF NOT EXISTS cpp (
        id SERIAL PRIMARY KEY,
        number VARCHAR(50) UNIQUE NOT NULL,
        status cpp_status DEFAULT 'draft',
        sender_name VARCHAR(255) NOT NULL,
        sender_country VARCHAR(100) NOT NULL,
        receiver_name VARCHAR(255) NOT NULL,
        receiver_country VARCHAR(100) NOT NULL,
        cargo_description TEXT NOT NULL,
        cargo_weight DECIMAL(12,2),
        cargo_volume DECIMAL(12,2),
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(255),
        driver_document VARCHAR(100),
        entry_point VARCHAR(255),
        exit_point VARCHAR(255),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Checkpoints (timeline steps)
    await client.query(`
      CREATE TYPE checkpoint_status AS ENUM (
        'pending', 'in_progress', 'completed', 'skipped', 'error'
      );
    `).catch(() => {});

    await client.query(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id SERIAL PRIMARY KEY,
        cpp_id INTEGER REFERENCES cpp(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status checkpoint_status DEFAULT 'pending',
        location VARCHAR(255),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        completed_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Documents attached to CPP
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        cpp_id INTEGER REFERENCES cpp(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        file_url VARCHAR(500),
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
