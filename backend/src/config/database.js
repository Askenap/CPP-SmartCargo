require('dotenv').config();
const bcrypt = require('bcryptjs');

let pool = null;
let useMemory = true;

try {
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT 1').then(() => {
    useMemory = false;
    console.log('Connected to PostgreSQL');
  }).catch(() => {
    console.warn('PostgreSQL not available, using in-memory storage');
  });
  pool.on('error', () => { useMemory = true; });
} catch {
  console.warn('pg module issue, using in-memory storage');
}

// In-memory storage
const memoryStore = {
  users: [],
  cpp: [],
  checkpoints: [],
  documents: [],
  _cppId: 0,
  _checkpointId: 0,
  _userId: 0,
};

const CHECKPOINT_TEMPLATES = [
  { order: 1, name: 'Регистрация ЦПП', description: 'Создание цифрового паспорта перевозки' },
  { order: 2, name: 'Въезд ПИ', description: 'Пограничный инспекционный пункт на въезде' },
  { order: 3, name: 'Въезд ИМ', description: 'Инспекционно-миграционный контроль на въезде' },
  { order: 4, name: 'Транзит', description: 'Транспортировка груза' },
  { order: 5, name: 'Выезд', description: 'Контрольные процедуры на выезде' },
  { order: 6, name: 'Завершение', description: 'Закрытие ЦПП' },
];

async function seedMemory() {
  const hash = await bcrypt.hash('password123', 10);
  memoryStore.users.push(
    { id: ++memoryStore._userId, email: 'admin@smartcargo.kz', password_hash: hash, full_name: 'Администратор Системы', role: 'admin', organization: 'SmartCargo KZ' },
    { id: ++memoryStore._userId, email: 'operator@smartcargo.kz', password_hash: hash, full_name: 'Оператор Иванов', role: 'operator', organization: 'SmartCargo KZ' },
  );

  const cpps = [
    { number: 'CPP-2024-000001', status: 'in_transit', sender_name: 'ТОО "КазТранс"', sender_country: 'Казахстан', receiver_name: 'ООО "РусЛогистик"', receiver_country: 'Россия', cargo_description: 'Электроника, бытовая техника', cargo_weight: 15400.50, vehicle_number: 'KZ 123 ABC', driver_name: 'Сериков Нурлан', entry_point: 'Хоргос', exit_point: 'Кольжат' },
    { number: 'CPP-2024-000002', status: 'draft', sender_name: 'ТОО "АлматыЭкспорт"', sender_country: 'Казахстан', receiver_name: 'China Import Co.', receiver_country: 'Китай', cargo_description: 'Зерно, пшеница', cargo_weight: 42000, vehicle_number: 'KZ 456 DEF', driver_name: 'Ли Вэй', entry_point: 'Достык', exit_point: 'Хоргос' },
    { number: 'CPP-2024-000003', status: 'completed', sender_name: 'ИП "Асанов"', sender_country: 'Узбекистан', receiver_name: 'ТОО "КазИмпорт"', receiver_country: 'Казахстан', cargo_description: 'Текстиль, хлопок', cargo_weight: 8200, vehicle_number: 'UZ 789 GHI', driver_name: 'Каримов Рустам', entry_point: 'Жибек Жолы', exit_point: 'Конаев' },
  ];

  const now = new Date().toISOString();
  for (const c of cpps) {
    const id = ++memoryStore._cppId;
    memoryStore.cpp.push({ id, ...c, created_by: 1, created_at: now, updated_at: now });

    for (const t of CHECKPOINT_TEMPLATES) {
      const cpId = ++memoryStore._checkpointId;
      let status = 'pending', completed_at = null;
      if (c.status === 'completed') { status = 'completed'; completed_at = now; }
      else if (c.status === 'in_transit' && t.order < 4) { status = 'completed'; completed_at = now; }
      else if (c.status === 'in_transit' && t.order === 4) { status = 'in_progress'; }
      else if (c.status === 'draft' && t.order === 1) { status = 'completed'; completed_at = now; }
      memoryStore.checkpoints.push({ id: cpId, cpp_id: id, step_order: t.order, name: t.name, description: t.description, status, completed_at, completed_by: completed_at ? 1 : null, notes: null, created_at: now });
    }
  }
  console.log('In-memory data seeded');
}

seedMemory();

module.exports = pool;
module.exports.memoryStore = memoryStore;
module.exports.CHECKPOINT_TEMPLATES = CHECKPOINT_TEMPLATES;
module.exports.isMemory = () => useMemory;
