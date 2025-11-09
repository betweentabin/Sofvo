// Export data from Railway PostgreSQL to JSON for D1 migration
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DNqaDqFjyphTNKTtazhhsJyRDFrPtNWz@maglev.proxy.rlwy.net:49323/railway';

const client = new Client({ connectionString: DATABASE_URL });

async function exportData() {
  try {
    await client.connect();
    console.log('Connected to Railway PostgreSQL');

    const data = {};

    // Export users
    const usersResult = await client.query('SELECT * FROM users LIMIT 100');
    data.users = usersResult.rows;
    console.log(`Exported ${data.users.length} users`);

    // Export profiles
    const profilesResult = await client.query('SELECT * FROM profiles LIMIT 100');
    data.profiles = profilesResult.rows;
    console.log(`Exported ${data.profiles.length} profiles`);

    // Export posts
    const postsResult = await client.query('SELECT * FROM posts LIMIT 100');
    data.posts = postsResult.rows;
    console.log(`Exported ${data.posts.length} posts`);

    // Export tournaments
    const tournamentsResult = await client.query('SELECT * FROM tournaments LIMIT 100');
    data.tournaments = tournamentsResult.rows;
    console.log(`Exported ${data.tournaments.length} tournaments`);

    // Export tournament_results
    const resultsResult = await client.query('SELECT * FROM tournament_results LIMIT 100');
    data.tournament_results = resultsResult.rows;
    console.log(`Exported ${data.tournament_results.length} tournament results`);

    // Save to JSON file
    fs.writeFileSync('database/railway-export.json', JSON.stringify(data, null, 2));
    console.log('Data exported to database/railway-export.json');

  } catch (error) {
    console.error('Export error:', error);
  } finally {
    await client.end();
  }
}

exportData();
