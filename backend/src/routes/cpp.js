const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/cpp/stats/summary — must be before /:id
router.get('/stats/summary', auth, async (req, res) => {
  try {
    if (db.isMemory()) {
      const list = db.memoryStore.cpp;
      res.json({
        total: String(list.length),
        draft: String(list.filter(c => c.status === 'draft').length),
        in_transit: String(list.filter(c => c.status === 'in_transit').length),
        completed: String(list.filter(c => c.status === 'completed').length),
        at_entry: String(list.filter(c => ['entry_pi', 'entry_im'].includes(c.status)).length),
        at_exit: String(list.filter(c => c.status === 'exit').length),
      });
    } else {
      const result = await db.query(`
        SELECT COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'draft') as draft,
          COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status IN ('entry_pi', 'entry_im')) as at_entry,
          COUNT(*) FILTER (WHERE status = 'exit') as at_exit
        FROM cpp
      `);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/cpp — list all CPPs
router.get('/', auth, async (req, res) => {
  try {
    const { status, search } = req.query;

    if (db.isMemory()) {
      let list = [...db.memoryStore.cpp];
      if (status) list = list.filter(c => c.status === status);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(c =>
          c.number.toLowerCase().includes(s) ||
          c.sender_name.toLowerCase().includes(s) ||
          c.receiver_name.toLowerCase().includes(s) ||
          c.cargo_description.toLowerCase().includes(s)
        );
      }
      // Add creator_name and step counts
      const result = list.map(c => {
        const user = db.memoryStore.users.find(u => u.id === c.created_by);
        const cps = db.memoryStore.checkpoints.filter(cp => cp.cpp_id === c.id);
        return {
          ...c,
          creator_name: user?.full_name || null,
          completed_steps: cps.filter(cp => cp.status === 'completed').length,
          total_steps: cps.length,
        };
      });
      result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      return res.json(result);
    }

    let query = `
      SELECT c.*, u.full_name as creator_name,
        (SELECT COUNT(*) FROM checkpoints ch WHERE ch.cpp_id = c.id AND ch.status = 'completed') as completed_steps,
        (SELECT COUNT(*) FROM checkpoints ch WHERE ch.cpp_id = c.id) as total_steps
      FROM cpp c LEFT JOIN users u ON c.created_by = u.id WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND c.status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (c.number ILIKE $${params.length} OR c.sender_name ILIKE $${params.length} OR c.receiver_name ILIKE $${params.length} OR c.cargo_description ILIKE $${params.length})`; }
    query += ' ORDER BY c.updated_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List CPP error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/cpp/:id — single CPP with checkpoints
router.get('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (db.isMemory()) {
      const cpp = db.memoryStore.cpp.find(c => c.id === id);
      if (!cpp) return res.status(404).json({ error: 'ЦПП не найден' });
      const user = db.memoryStore.users.find(u => u.id === cpp.created_by);
      const checkpoints = db.memoryStore.checkpoints.filter(cp => cp.cpp_id === id).sort((a, b) => a.step_order - b.step_order);
      const documents = db.memoryStore.documents.filter(d => d.cpp_id === id);
      return res.json({ ...cpp, creator_name: user?.full_name || null, checkpoints, documents });
    }

    const cppResult = await db.query('SELECT c.*, u.full_name as creator_name FROM cpp c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1', [id]);
    if (!cppResult.rows[0]) return res.status(404).json({ error: 'ЦПП не найден' });
    const checkpoints = await db.query('SELECT * FROM checkpoints WHERE cpp_id = $1 ORDER BY step_order ASC', [id]);
    const documents = await db.query('SELECT * FROM documents WHERE cpp_id = $1 ORDER BY created_at DESC', [id]);
    res.json({ ...cppResult.rows[0], checkpoints: checkpoints.rows, documents: documents.rows });
  } catch (err) {
    console.error('Get CPP error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/cpp — create CPP
router.post('/', auth, async (req, res) => {
  try {
    const { sender_name, sender_country, receiver_name, receiver_country, cargo_description, cargo_weight, cargo_volume, vehicle_number, driver_name, driver_document, entry_point, exit_point } = req.body;
    if (!sender_name || !receiver_name || !cargo_description) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const now = new Date().toISOString();

    if (db.isMemory()) {
      const num = String(db.memoryStore.cpp.length + 1).padStart(6, '0');
      const number = `CPP-${new Date().getFullYear()}-${num}`;
      const id = ++db.memoryStore._cppId;
      const cpp = { id, number, status: 'draft', sender_name, sender_country: sender_country || '', receiver_name, receiver_country: receiver_country || '', cargo_description, cargo_weight, cargo_volume, vehicle_number, driver_name, driver_document, entry_point, exit_point, created_by: req.user.id, created_at: now, updated_at: now };
      db.memoryStore.cpp.push(cpp);

      for (const t of db.CHECKPOINT_TEMPLATES) {
        const cpId = ++db.memoryStore._checkpointId;
        db.memoryStore.checkpoints.push({
          id: cpId, cpp_id: id, step_order: t.order, name: t.name, description: t.description,
          status: t.order === 1 ? 'completed' : 'pending',
          completed_at: t.order === 1 ? now : null,
          completed_by: t.order === 1 ? req.user.id : null,
          notes: null, created_at: now,
        });
      }

      const user = db.memoryStore.users.find(u => u.id === req.user.id);
      const checkpoints = db.memoryStore.checkpoints.filter(cp => cp.cpp_id === id).sort((a, b) => a.step_order - b.step_order);
      return res.status(201).json({ ...cpp, creator_name: user?.full_name || null, checkpoints });
    }

    const countRes = await db.query('SELECT COUNT(*) FROM cpp');
    const num = String(Number(countRes.rows[0].count) + 1).padStart(6, '0');
    const number = `CPP-${new Date().getFullYear()}-${num}`;
    const result = await db.query(`INSERT INTO cpp (number, sender_name, sender_country, receiver_name, receiver_country, cargo_description, cargo_weight, cargo_volume, vehicle_number, driver_name, driver_document, entry_point, exit_point, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [number, sender_name, sender_country, receiver_name, receiver_country, cargo_description, cargo_weight, cargo_volume, vehicle_number, driver_name, driver_document, entry_point, exit_point, req.user.id]);
    const cppId = result.rows[0].id;

    for (const t of db.CHECKPOINT_TEMPLATES) {
      await db.query('INSERT INTO checkpoints (cpp_id, step_order, name, description, status, completed_at, completed_by) VALUES ($1,$2,$3,$4,$5,$6,$7)', [cppId, t.order, t.name, t.description, t.order === 1 ? 'completed' : 'pending', t.order === 1 ? new Date() : null, t.order === 1 ? req.user.id : null]);
    }
    const full = await db.query('SELECT c.*, u.full_name as creator_name FROM cpp c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1', [cppId]);
    const checkpoints = await db.query('SELECT * FROM checkpoints WHERE cpp_id = $1 ORDER BY step_order ASC', [cppId]);
    res.status(201).json({ ...full.rows[0], checkpoints: checkpoints.rows });
  } catch (err) {
    console.error('Create CPP error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/cpp/:id — update CPP
router.put('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fields = req.body;
    const allowed = ['sender_name', 'sender_country', 'receiver_name', 'receiver_country', 'cargo_description', 'cargo_weight', 'cargo_volume', 'vehicle_number', 'driver_name', 'driver_document', 'entry_point', 'exit_point', 'status'];

    if (db.isMemory()) {
      const cpp = db.memoryStore.cpp.find(c => c.id === id);
      if (!cpp) return res.status(404).json({ error: 'ЦПП не найден' });
      for (const key of allowed) {
        if (fields[key] !== undefined) cpp[key] = fields[key];
      }
      cpp.updated_at = new Date().toISOString();
      return res.json(cpp);
    }

    const sets = [], params = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) { params.push(fields[key]); sets.push(`${key} = $${params.length}`); }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Нет полей для обновления' });
    params.push(new Date()); sets.push(`updated_at = $${params.length}`);
    params.push(id);
    const result = await db.query(`UPDATE cpp SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!result.rows[0]) return res.status(404).json({ error: 'ЦПП не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update CPP error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/cpp/:id/checkpoint/:checkpointId — update checkpoint
router.put('/:id/checkpoint/:checkpointId', auth, async (req, res) => {
  try {
    const checkpointId = Number(req.params.checkpointId);
    const { status, notes } = req.body;

    if (db.isMemory()) {
      const cp = db.memoryStore.checkpoints.find(c => c.id === checkpointId);
      if (!cp) return res.status(404).json({ error: 'Этап не найден' });
      cp.status = status;
      if (notes) cp.notes = notes;
      if (status === 'completed') { cp.completed_at = new Date().toISOString(); cp.completed_by = req.user.id; }

      // Auto-update CPP status
      const statusMap = { 1: 'draft', 2: 'entry_pi', 3: 'entry_im', 4: 'in_transit', 5: 'exit', 6: 'completed' };
      if (status === 'completed' && statusMap[cp.step_order]) {
        const cpp = db.memoryStore.cpp.find(c => c.id === cp.cpp_id);
        if (cpp) {
          cpp.status = cp.step_order === 6 ? 'completed' : (statusMap[cp.step_order + 1] || 'in_transit');
          cpp.updated_at = new Date().toISOString();
        }
      }
      return res.json(cp);
    }

    const result = await db.query(`UPDATE checkpoints SET status = $1, notes = $2, completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END, completed_by = CASE WHEN $1 = 'completed' THEN $3 ELSE completed_by END WHERE id = $4 RETURNING *`, [status, notes || null, req.user.id, checkpointId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Этап не найден' });
    const checkpoint = result.rows[0];
    const statusMap = { 1: 'draft', 2: 'entry_pi', 3: 'entry_im', 4: 'in_transit', 5: 'exit', 6: 'completed' };
    if (status === 'completed' && statusMap[checkpoint.step_order]) {
      const nextStatus = checkpoint.step_order === 6 ? 'completed' : (statusMap[checkpoint.step_order + 1] || 'in_transit');
      await db.query('UPDATE cpp SET status = $1, updated_at = NOW() WHERE id = $2', [nextStatus, checkpoint.cpp_id]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update checkpoint error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
