// Import exported Railway data to D1
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('database/railway-export.json', 'utf8'));

// Generate SQL INSERT statements for D1
let sql = '';

// Import users
if (data.users && data.users.length > 0) {
  data.users.forEach(user => {
    const values = [
      `'${user.id}'`,
      `'${user.email.replace(/'/g, "''")}'`,
      `'${user.encrypted_password.replace(/'/g, "''")}'`,
      user.email_confirmed_at ? `'${user.email_confirmed_at}'` : 'NULL',
      `'${user.created_at}'`,
      `'${user.updated_at}'`
    ].join(', ');
    sql += `INSERT INTO users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES (${values});\n`;
  });
}

// Import profiles
if (data.profiles && data.profiles.length > 0) {
  data.profiles.forEach(profile => {
    const values = [
      `'${profile.id}'`,
      `'${profile.username.replace(/'/g, "''")}'`,
      profile.display_name ? `'${profile.display_name.replace(/'/g, "''")}'` : 'NULL',
      profile.avatar_url ? `'${profile.avatar_url}'` : 'NULL',
      profile.bio ? `'${profile.bio.replace(/'/g, "''")}'` : 'NULL',
      profile.sport_type ? `'${profile.sport_type}'` : 'NULL',
      profile.phone ? `'${profile.phone}'` : 'NULL',
      profile.furigana ? `'${profile.furigana}'` : 'NULL',
      profile.followers_count || 0,
      profile.following_count || 0,
      `'${profile.created_at}'`,
      `'${profile.updated_at}'`
    ].join(', ');
    sql += `INSERT INTO profiles (id, username, display_name, avatar_url, bio, sport_type, phone, furigana, followers_count, following_count, created_at, updated_at) VALUES (${values});\n`;
  });
}

// Import tournaments
if (data.tournaments && data.tournaments.length > 0) {
  data.tournaments.forEach(t => {
    const values = [
      `'${t.id}'`,
      `'${t.name.replace(/'/g, "''")}'`,
      t.description ? `'${t.description.replace(/'/g, "''")}'` : 'NULL',
      t.sport_type ? `'${t.sport_type}'` : 'NULL',
      t.location ? `'${t.location.replace(/'/g, "''")}'` : 'NULL',
      t.start_date ? `'${t.start_date}'` : 'NULL',
      t.end_date ? `'${t.end_date}'` : 'NULL',
      t.max_participants || 'NULL',
      t.registration_deadline ? `'${t.registration_deadline}'` : 'NULL',
      t.status ? `'${t.status}'` : "'upcoming'",
      t.created_by ? `'${t.created_by}'` : 'NULL',
      `'${t.created_at}'`,
      `'${t.updated_at}'`
    ].join(', ');
    sql += `INSERT INTO tournaments (id, name, description, sport_type, location, start_date, end_date, max_participants, registration_deadline, status, created_by, created_at, updated_at) VALUES (${values});\n`;
  });
}

// Import posts
if (data.posts && data.posts.length > 0) {
  data.posts.forEach(post => {
    const values = [
      `'${post.id}'`,
      `'${post.user_id}'`,
      post.tournament_id ? `'${post.tournament_id}'` : 'NULL',
      post.content ? `'${post.content.replace(/'/g, "''")}'` : 'NULL',
      post.visibility ? `'${post.visibility}'` : "'public'",
      post.file_url ? `'${post.file_url}'` : 'NULL',
      post.image_urls ? `'${JSON.stringify(post.image_urls).replace(/'/g, "''")}'` : 'NULL',
      post.like_count || 0,
      post.comment_count || 0,
      `'${post.created_at}'`,
      `'${post.updated_at}'`
    ].join(', ');
    sql += `INSERT INTO posts (id, user_id, tournament_id, content, visibility, file_url, image_urls, like_count, comment_count, created_at, updated_at) VALUES (${values});\n`;
  });
}

// Import tournament_results
if (data.tournament_results && data.tournament_results.length > 0) {
  data.tournament_results.forEach(result => {
    const values = [
      `'${result.id}'`,
      `'${result.tournament_id}'`,
      result.user_id ? `'${result.user_id}'` : 'NULL',
      result.team_id ? `'${result.team_id}'` : 'NULL',
      result.position || 'NULL',
      result.points || 0,
      result.memo ? `'${result.memo.replace(/'/g, "''")}'` : 'NULL',
      `'${result.created_at}'`
    ].join(', ');
    sql += `INSERT INTO tournament_results (id, tournament_id, user_id, team_id, position, points, memo, created_at) VALUES (${values});\n`;
  });
}

fs.writeFileSync('database/d1-import.sql', sql);
console.log(`Generated SQL import file with ${sql.split('\n').length - 1} INSERT statements`);
console.log('File saved to database/d1-import.sql');
