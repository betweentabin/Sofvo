import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// Supabase removed: Railway-only
import api from "../../services/api";
import "./style.css";

export const Screen17 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mainContentTop = useHeaderOffset();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(null);
  const [todayTournament, setTodayTournament] = useState(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [loadingT, setLoadingT] = useState(false);
  const [teamStats, setTeamStats] = useState(null);
  const USE_RAILWAY = true;
  const RAILWAY_TEST_USER = import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;

  
  // チームデータを取得
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user) return;

      try {
        const asUserId = RAILWAY_TEST_USER || user.id;
        const { data } = await api.railwayTeams.getOwnerTeam(asUserId);
        if (Array.isArray(data) && data.length > 0) {
          const team = data[0];
          setTeamData(team);
          try {
            const { data: members } = await api.railwayTeams.getMembers(team.id);
            setMemberCount(Array.isArray(members) ? members.length : null);
          } catch (e) {
            console.error('メンバー取得エラー:', e);
            setMemberCount(null);
          }
          try {
            const { data: stats } = await api.railwayTeams.getStats(team.id);
            setTeamStats(stats || null);
          } catch (e) {
            console.warn('チーム統計取得エラー:', e);
            setTeamStats(null);
          }
          // 本日/参加予定大会
          try {
            setLoadingT(true);
            const params = { status: 'upcoming', limit: 50 };
            if (asUserId) params.as_user = asUserId;
            const { data: tt } = await api.railwayTournaments.search(params);
            const list = Array.isArray(tt) ? tt : [];
            const now = new Date();
            const isSameDay = (a, b) => {
              const da = new Date(a);
              const db = new Date(b);
              if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
              return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
            };
            const todays = list.filter(t => t.start_date && isSameDay(t.start_date, now));
            setTodayTournament(todays[0] || null);
            const upcoming = list
              .filter(t => t.start_date && new Date(t.start_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
              .slice(0, 5);
            setUpcomingTournaments(upcoming);
          } catch (e) {
            console.error('大会取得エラー:', e);
            setTodayTournament(null);
            setUpcomingTournaments([]);
          } finally {
            setLoadingT(false);
          }
        }
      } catch (error) {
        console.error('チームデータ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user]);

  const formatDateJP = (iso) => {
    if (!iso) return "未定";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "未定";
    return d.toLocaleDateString('ja-JP');
  };

  return (
    <div className="screen-17">
      <HeaderContent />

      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px", // フッター高さ
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="frame-600">
          <div className="frame-601">
            <div className="frame-602">
              <div className="frame-603"/>
              <div className="frame-604">
                <div className="frame-605">
                  <div className="frame-606">
                    <div className="text-wrapper-300">
                      {loading ? 'ローディング中...' : teamData?.name || 'チーム名未設定'}
                    </div>
                    <div className="text-wrapper-301">{teamData?.location || '地域未設定'}</div>
                  </div>
                  <Link to="/team-management" className="frame-607">
                    <div className="text-wrapper-302">管理画面</div>
                  </Link>
                </div>
                <div className="frame-608">
                  <div className="frame-609">
                    <div className="text-wrapper-303-1">{(teamStats?.yearlyPoints ?? 0)} ポイント(一年間)</div>
                    <div className="text-wrapper-303-2">{(teamStats?.totalPoints ?? 0)} ポイント（通算）</div>
                  </div>
                  <div className="frame-610">
                    <div className="text-wrapper-303-3">{(teamStats?.followingCount ?? 0)} フォロー</div>
                    <div className="text-wrapper-303-4">{(teamStats?.followersCount ?? 0)} フォロワー</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-wrapper-304">
              {loading ? 'ローディング中...' : teamData?.description || '自己紹介が設定されていません'}
            </div>
            <div className="frame-611">
                <div className="frame-612">
                <div className="text-wrapper-305-1">所属メンバー：{memberCount ?? '-'}人</div>
                <div className="text-wrapper-305-2">
                  作成日：{teamData?.created_at ? new Date(teamData.created_at).toLocaleDateString('ja-JP') : '未設定'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-613">
          <div className="text-wrapper-306">本日の参加予定大会</div>
        </div>

            <div className="frame-617">
          <div className="frame-618">
            <div className="frame-619">
              <div className="text-wrapper-307-1">大会名：{todayTournament ? (todayTournament.name || '不明') : '該当なし'}</div>
              <div className="text-wrapper-307-2">開催日時：{todayTournament ? formatDateJP(todayTournament.start_date) : '-'}</div>
            </div>
            <div className="frame-620">
              <div className="frame-621" onClick={() => navigate('/tournament-schedule')} style={{ cursor: 'pointer' }}>
                <div className="text-wrapper-308">エントリーする</div>
              </div>
              <div className="frame-622">
                <div className="frame-623" onClick={() => navigate('/team-members')} style={{ cursor: 'pointer' }}>
                  <div className="text-wrapper-309">エントリー済みメンバー</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="frame-624">
          <div className="text-wrapper-310">参加予定大会</div>
        </div>

        <div className="frame-625">
          {loadingT ? (
            <div style={{ padding: '12px', textAlign: 'center' }}>読み込み中...</div>
          ) : upcomingTournaments.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center' }}>直近の参加予定はありません</div>
          ) : (
            upcomingTournaments.slice(0, 3).map((t) => (
              <div className="frame-626" key={t.id}>
                <div className="frame-627">
                  <div className="text-wrapper-311-1">大会名：{t.name}</div>
                  <div className="text-wrapper-311-2">開催日時：{formatDateJP(t.start_date)}</div>
                </div>
                <div className="frame-628">
                  <div className="frame-629">
                    <Link to={`/tournament-detail/${t.id}`} className="frame-38">
                      <div className="text-wrapper-312">大会概要</div>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="frame-690">
          <div className="frame-691">
            <div className="text-wrapper-390">活動記録</div>
          </div>
          <div className="frame-692">
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
            <div className="rectangle-4" />
          </div>
        </div>
      </div>

      <Footer currentPage="team-create" />
    </div>
  );
};
