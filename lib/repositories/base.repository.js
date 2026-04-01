import { connectDB } from '../database.js';
import { NotFoundError } from '../errors/index.js';

export class BaseRepository {
  constructor(tableName, primaryKey) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  async findById(id) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT * FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      throw new NotFoundError(`${this.tableName} introuvable`);
    }
    return rows[0];
  }

  async findOneBy(where, params = []) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT * FROM \`${this.tableName}\` WHERE ${where} LIMIT 1`,
      params
    );
    return rows[0] || null;
  }

  async findAll({ page = 1, limit = 20, orderBy = `${this.primaryKey} DESC`, where = '1', params = [] } = {}) {
    const offset = (page - 1) * limit;
    const db = await connectDB();
    const queryParams = [...(params || []), parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await db.query(
      `SELECT * FROM \`${this.tableName}\` WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      queryParams
    );
    return rows;
  }

  async findBy(criteria = {}) {
    const keys = Object.keys(criteria);
    const where = keys.length
      ? keys.map(key => `\`${key}\` = ?`).join(' AND ')
      : '1';
    const params = keys.map(key => criteria[key]);
    return this.findAll({ where, params, limit: 1000 });
  }

  async create(data) {
    const keys = Object.keys(data);
    const columns = keys.map(key => `\`${key}\``).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => data[key]);
    const db = await connectDB();
    const [result] = await db.query(
      `INSERT INTO \`${this.tableName}\` (${columns}) VALUES (${placeholders})`,
      values
    );
    return { [this.primaryKey]: result.insertId, ...data };
  }

  async update(id, data) {
    const keys = Object.keys(data);
    if (!keys.length) {
      return null;
    }
    const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
    const values = keys.map(key => data[key]);
    const db = await connectDB();
    const [result] = await db.query(
      `UPDATE \`${this.tableName}\` SET ${setClause} WHERE \`${this.primaryKey}\` = ?`,
      [...values, id]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError(`${this.tableName} introuvable`);
    }
    return result;
  }

  async delete(id) {
    const db = await connectDB();
    const [result] = await db.query(
      `DELETE FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError(`${this.tableName} introuvable`);
    }
    return true;
  }

  async count(where = '1', params = []) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM \`${this.tableName}\` WHERE ${where}`,
      params
    );
    return rows[0]?.total ?? 0;
  }

  async raw(sql, params = []) {
    const db = await connectDB();
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async transaction(callback) {
    const pool = await connectDB();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
