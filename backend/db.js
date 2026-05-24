const knex = require('knex');
const path = require('path');

const db = knex({
  client: 'sqlite3',
  connection: { filename: path.join(__dirname, 'perfkit.db') },
  useNullAsDefault: true,
});

async function initDb() {
  const exists = await db.schema.hasTable('runs');
  if (!exists) {
    await db.schema.createTable('runs', t => {
      t.string('id').primary();
      t.string('url').notNullable().index();
      t.bigInteger('created_at').notNullable().index();
      t.string('status').notNullable().defaultTo('pending');
      t.text('error');

      t.integer('score_performance');
      t.integer('score_accessibility');
      t.integer('score_best_practices');
      t.integer('score_seo');

      t.float('lcp_value');   t.string('lcp_rating');
      t.float('cls_value');   t.string('cls_rating');
      t.float('fid_value');   t.string('fid_rating');
      t.float('inp_value');   t.string('inp_rating');
      t.float('ttfb_value');  t.string('ttfb_rating');
      t.float('fcp_value');   t.string('fcp_rating');
      t.float('tbt_value');   t.string('tbt_rating');
      t.float('speed_index_value'); t.string('speed_index_rating');

      t.integer('total_bytes');
      t.integer('total_requests');
      t.integer('dom_size');
      t.integer('fully_loaded_ms');

      t.text('audits_json');
      t.text('har_json');
      t.text('filmstrip_json');
      t.string('screenshot_path');
    });
    console.log('[DB] Tables created.');
  }
}

const Runs = {
  async create(id, url) {
    await db('runs').insert({ id, url, created_at: Date.now(), status: 'pending' });
  },

  async updateResult(id, data) {
    await db('runs').where({ id }).update({ status: 'done', ...data });
  },

  async updateError(id, error) {
    await db('runs').where({ id }).update({ status: 'error', error });
  },

  async getById(id) {
    const row = await db('runs').where({ id }).first();
    if (!row) return null;
    if (row.audits_json) row.audits = JSON.parse(row.audits_json);
    if (row.har_json) row.har = JSON.parse(row.har_json);
    if (row.filmstrip_json) row.filmstrip = JSON.parse(row.filmstrip_json);
    return row;
  },

  async getHistory(limit = 50, url = null) {
    const cols = [
      'id','url','created_at','status',
      'score_performance','score_accessibility','score_best_practices','score_seo',
      'lcp_value','cls_value','fcp_value','ttfb_value','tbt_value',
      'fully_loaded_ms','total_bytes','total_requests'
    ];
    let q = db('runs').select(cols).whereIn('status', ['done','error']).orderBy('created_at','desc').limit(limit);
    if (url) q = db('runs').select(cols).where({ url, status: 'done' }).orderBy('created_at','desc').limit(limit);
    return q;
  },

  async getUrls() {
    return db('runs')
      .where({ status: 'done' })
      .groupBy('url')
      .select(db.raw('url, COUNT(*) as run_count, MAX(created_at) as last_run, AVG(score_performance) as avg_perf'))
      .orderBy('last_run', 'desc');
  },

  async getTrend(url, limit = 20) {
    return db('runs')
      .where({ url, status: 'done' })
      .select('id','created_at','score_performance','score_accessibility',
              'lcp_value','cls_value','fcp_value','ttfb_value','tbt_value','fully_loaded_ms')
      .orderBy('created_at', 'asc')
      .limit(limit);
  },

  async deleteRun(id) {
    await db('runs').where({ id }).delete();
  }
};

module.exports = { db, Runs, initDb };
