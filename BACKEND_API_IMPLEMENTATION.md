# バックエンドAPI実装・修正案

## 現状の問題点

1. **Supabase依存**: 現在のコードはSupabaseに依存しているが、Railway PostgreSQLを使用
2. **認証システム**: Supabase認証からJWT認証への移行が必要
3. **APIエンドポイント**: フロントエンドが期待するエンドポイントとの整合性

## 修正実装案

### 1. 認証システムの実装

#### `/backend/src/routes/auth.js`
```javascript
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const router = express.Router();

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ユーザー検索
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // パスワード検証
    const isValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // JWT生成
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // プロフィール取得
    const profileResult = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [user.id]
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: profileResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// サインアップ
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username, displayName, phone, furigana } = req.body;
    
    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // トランザクション開始
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // ユーザー作成
      const userResult = await client.query(
        'INSERT INTO users (email, encrypted_password, email_confirmed_at) VALUES ($1, $2, NOW()) RETURNING id',
        [email, hashedPassword]
      );
      
      const userId = userResult.rows[0].id;
      
      // プロフィール作成
      await client.query(
        'INSERT INTO profiles (id, username, display_name, phone, furigana) VALUES ($1, $2, $3, $4, $5)',
        [userId, username, displayName, phone, furigana]
      );
      
      await client.query('COMMIT');
      
      // JWT生成
      const token = jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      res.status(201).json({
        token,
        user: { id: userId, email, username, displayName }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email or username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
```

### 2. 認証ミドルウェア

#### `/backend/src/middleware/auth.js`
```javascript
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

### 3. プロフィールAPI

#### `/backend/src/routes/profiles.js`
```javascript
import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 現在のユーザーのプロフィール取得
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プロフィール更新
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { display_name, bio, sport_type, avatar_url } = req.body;
    
    const result = await query(
      `UPDATE profiles 
       SET display_name = $1, bio = $2, sport_type = $3, avatar_url = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [display_name, bio, sport_type, avatar_url, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### 4. フロントエンド連携修正

#### `/src/lib/api.js` (新規作成)
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // 認証
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async signup(userData) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  // プロフィール
  async getProfile() {
    return this.request('/profiles/me');
  }

  async updateProfile(profileData) {
    return this.request('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // チーム
  async getTeams() {
    return this.request('/teams');
  }

  async createTeam(teamData) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  // 大会
  async getTournaments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tournaments?${params}`);
  }

  async createTournament(tournamentData) {
    return this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  // 通知
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // 投稿
  async getPosts(type = 'following') {
    return this.request(`/posts?type=${type}`);
  }

  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }
}

export default new ApiService();
```

### 5. AuthContext修正

#### `/src/contexts/AuthContext.jsx` (修正)
```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        api.setToken(token);
        const profile = await api.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      api.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (userData) => {
    try {
      const data = await api.signup(userData);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    api.clearToken();
    setUser(null);
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## デプロイ設定

### Railway.yml (ルートディレクトリ)
```yaml
services:
  frontend:
    build:
      dockerfile: Dockerfile.frontend
    port: 3000
    healthcheck:
      path: /
      
  backend:
    build:
      dockerfile: Dockerfile.backend
    port: 3001
    healthcheck:
      path: /api/health
    envs:
      - DATABASE_URL=${{Postgres.DATABASE_URL}}
      - NODE_ENV=production
      - JWT_SECRET=${{shared.JWT_SECRET}}
```

### Dockerfile.backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3001
CMD ["npm", "start"]
```

### Dockerfile.frontend
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

## 実装手順

1. **バックエンドのパッケージインストール**
```bash
cd backend
npm install
```

2. **環境変数設定**
```bash
# .env
DATABASE_URL_EXTERNAL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3001
```

3. **ローカルテスト**
```bash
# バックエンド起動
cd backend
npm run dev

# フロントエンド起動（別ターミナル）
npm run dev
```

4. **Railwayへデプロイ**
```bash
git add .
git commit -m "Add backend API server with Railway PostgreSQL"
git push
```

## 期待される結果

- ✅ 認証機能が動作
- ✅ プロフィール取得・更新が可能
- ✅ チーム・大会の作成と表示
- ✅ 通知機能の動作
- ✅ Railway PostgreSQLとの完全な連携