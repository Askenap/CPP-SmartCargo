require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./database');

const CHECKPOINT_TEMPLATES = [
  { order: 1, name: 'Регистрация ЦПП', description: 'Создание цифрового паспорта перевозки' },
  { order: 2, name: 'Въезд ПИ', description: 'Прохождение пограничного инспекционного пункта на въезде' },
  { order: 3, name: 'Въезд ИМ', description: 'Прохождение инспекционно-миграционного контроля на въезде' },
  { order: 4, name: 'Транзит', description: 'Транспортировка груза по территории' },
  { order: 5, name: 'Выезд', description: 'Прохождение контрольных процедур на выезде' },
  { order: 6, name: 'Завершение', description: 'Закрытие ЦПП и архивация' },
];

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create demo user
    const hash = await bcrypt.hash('password123', 10);
    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, organization)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id
    `, ['admin@smartcargo.kz', hash, 'Администратор Системы', 'admin', 'SmartCargo KZ']);

    const userId = userRes.rows[0].id;

    // Create demo operator
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, organization)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['operator@smartcargo.kz', hash, 'Оператор Иванов', 'operator', 'SmartCargo KZ']);

    // Create sample CPPs
    const cpps = [
      {
        number: 'CPP-2024-000001',
        status: 'in_transit',
        sender_name: 'ТОО "КазТранс"',
        sender_country: 'Казахстан',
        receiver_name: 'ООО "РусЛогистик"',
        receiver_country: 'Россия',
        cargo_description: 'Электроника, бытовая техника',
        cargo_weight: 15400.50,
        vehicle_number: 'KZ 123 ABC',
        driver_name: 'Сериков Нурлан',
        entry_point: 'Хоргос',
        exit_point: 'Кольжат',
      },
      {
        number: 'CPP-2024-000002',
        status: 'draft',
        sender_name: 'ТОО "АлматыЭкспорт"',
        sender_country: 'Казахстан',
        receiver_name: 'China Import Co.',
        receiver_country: 'Китай',
        cargo_description: 'Зерно, пшеница',
        cargo_weight: 42000.00,
        vehicle_number: 'KZ 456 DEF',
        driver_name: 'Ли Вэй',
        entry_point: 'Достык',
        exit_point: 'Хоргос',
      },
      {
        number: 'CPP-2024-000003',
        status: 'completed',
        sender_name: 'ИП "Асанов"',
        sender_country: 'Узбекистан',
        receiver_name: 'ТОО "КазИмпорт"',
        receiver_country: 'Казахстан',
        cargo_description: 'Текстиль, хлопок',
        cargo_weight: 8200.00,
        vehicle_number: 'UZ 789 GHI',
        driver_name: 'Каримов Рустам',
        entry_point: 'Жибек Жолы',
        exit_point: 'Конаев',
      },
    ];

    for (const cpp of cpps) {
      const cppRes = await client.query(`
        INSERT INTO cpp (number, status, sender_name, sender_country, receiver_name,
          receiver_country, cargo_description, cargo_weight, vehicle_number, driver_name,
          entry_point, exit_point, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (number) DO NOTHING
        RETURNING id
      `, [cpp.number, cpp.status, cpp.sender_name, cpp.sender_country,
          cpp.receiver_name, cpp.receiver_country, cpp.cargo_description,
          cpp.cargo_weight, cpp.vehicle_number, cpp.driver_name,
          cpp.entry_point, cpp.exit_point, userId]);

      if (cppRes.rows.length > 0) {
        const cppId = cppRes.rows[0].id;
        for (const tmpl of CHECKPOINT_TEMPLATES) {
          let status = 'pending';
          let completedAt = null;
          if (cpp.status === 'completed') {
            status = 'completed';
            completedAt = new Date();
          } else if (cpp.status === 'in_transit' && tmpl.order <= 4) {
            status = tmpl.order < 4 ? 'completed' : 'in_progress';
            if (tmpl.order < 4) completedAt = new Date();
          } else if (cpp.status === 'draft' && tmpl.order === 1) {
            status = 'completed';
            completedAt = new Date();
          }

          await client.query(`
            INSERT INTO checkpoints (cpp_id, step_order, name, description, status, completed_at, completed_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [cppId, tmpl.order, tmpl.name, tmpl.description, status, completedAt,
              completedAt ? userId : null]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('Seed completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
