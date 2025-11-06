import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Screen11 = () => {
  const mainContentTop = useHeaderOffset();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todayTournament, setTodayTournament] = useState(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);

  const formatDateJP = (iso) => {
    if (!iso) return "未定";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "未定";
    return d.toLocaleDateString('ja-JP');
  };

  const isSameDay = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const params = { status: 'upcoming', limit: 50 };
        if (user?.id) params.as_user = user.id;
        const { data } = await api.railwayTournaments.search(params);
        const list = Array.isArray(data) ? data : [];
        const now = new Date();
        // 今日開催の大会
        const todays = list.filter(t => t.start_date && isSameDay(t.start_date, now));
        if (active) setTodayTournament(todays[0] || null);
        // 参加予定（単純に今後の上位数件を表示）
        const upcoming = list
          .filter(t => t.start_date && new Date(t.start_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
          .slice(0, 5);
        if (active) setUpcomingTournaments(upcoming);
      } catch (e) {
        console.error('Failed to load upcoming tournaments:', e);
        if (active) {
          setTodayTournament(null);
          setUpcomingTournaments([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user]);

  
  return (
    <div className="screen-11">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
  <div className="frame-164">
    <div className="text-wrapper-96">本日の大会</div>
  </div>

  <div className="frame-159">
    <div className="frame-160">
      <div className="frame-161">
        <div className="text-wrapper-93-1">大会名：{todayTournament ? (todayTournament.name || '不明') : '該当なし'}</div>
        <div className="text-wrapper-93-2">開催日時：{todayTournament ? formatDateJP(todayTournament.start_date) : '-'}</div>
        <div className="text-wrapper-93-3">チーム名：{todayTournament ? (todayTournament.team_name || '未設定') : '-'}</div>
      </div>

      <div className="frame-151">
        <div className="frame-162-1">
          <div className="text-wrapper-92">大会概要</div>
        </div>

        <div className="frame-163">
          <div className="text-wrapper-95">チェックインを取り消す</div>
        </div>
      </div>
    </div>
  </div>

  <div className="frame-166">
    <div className="text-wrapper-96-2">参加予定の大会</div>
  </div>

　<div className="frame-21">
    <div className="frame-22">
      <div className="frame-23">
        <div className="magnifying-glass-wrapper">
          <div className="magnifying-glass">
            <img className="search-icon" alt="検索" src="/img/検索黒.png" />
          </div>
        </div>
        <div className="text-wrapper-39">大会を検索（チーム参加）</div>
      </div>

      <div className="frame-24">
        <div className="frame-box1">
          <label className="dropdown-label" htmlFor="select-year-month">年月</label>
          <select id="select-year-month" className="custom-select">
            <option>2025年5月</option>
            <option>2025年6月</option>
            <option>2025年7月</option>
          </select>
        </div>

        <div className="frame-box2">
          <label className="dropdown-label" htmlFor="select-day">日</label>
          <select id="select-day" className="custom-select">
            <option>18日</option>
            <option>19日</option>
            <option>20日</option>
          </select>
        </div>

        <div className="frame-box3">
          <label className="dropdown-label" htmlFor="select-area">地域</label>
          <select id="select-area" className="custom-select">
            <option>静岡県</option>
            <option>東京都</option>
            <option>大阪府</option>
          </select>
        </div>
      </div>


      <div className="frame-29">
        <input type="checkbox" id="follow-checkbox" className="rectangle-3" />
        <label htmlFor="follow-checkbox" className="text-wrapper-42">フォロー中</label>
      </div>


      <div className="frame-30">
        <div className="text-wrapper-43">検索</div>
      </div>
    </div>
  </div>



  <div className="frame-167">
    <div className="frame-160-1">
      {loading ? (
        <div style={{ padding: '12px', textAlign: 'center' }}>読み込み中...</div>
      ) : upcomingTournaments.length === 0 ? (
        <div style={{ padding: '12px', textAlign: 'center' }}>直近の参加予定はありません</div>
      ) : (
        upcomingTournaments.slice(0, 3).map((t) => (
          <div key={t.id}>
            <div className="frame-168">
              <div className="text-wrapper-89">{t.name}</div>
              <div className="frame-169">
                <div className="frame-35">
                  <div className="text-wrapper-95-2">{t.sport_type || '種別'}</div>
                </div>
              </div>
            </div>

            <div className="frame-170">
              <div className="text-wrapper-94-1">開催日時：{formatDateJP(t.start_date)}</div>
              <div className="text-wrapper-94-2">開催地：{t.location || '未定'}</div>
              <div className="text-wrapper-94-3">チーム名：{t.team_name || '未設定'}</div>
              <div className="text-wrapper-94-4">募集枠：{t.max_participants || '未設定'}</div>
            </div>

            <div className="frame-171">
              <div className="frame-162-2">
                <Link to={`/tournament-detail/${t.id}`} className="text-wrapper-92-1" style={{ textDecoration: 'none' }}>大会概要</Link>
              </div>
              <div className="frame-162-3">
                <div className="text-wrapper-92-2">大会エントリーをキャンセル</div>
              </div>
              <div className="frame-162-4">
                <div className="text-wrapper-92-3">個人エントリーをキャンセル</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
</div>



      <Footer currentPage="schedule" />
    </div>
  );
};
