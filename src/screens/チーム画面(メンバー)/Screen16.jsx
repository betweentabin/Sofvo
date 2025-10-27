import React, { useEffect, useState } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Screen16 = () => {
  const mainContentTop = useHeaderOffset();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [todayTournament, setTodayTournament] = useState(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [loadingT, setLoadingT] = useState(false);
  const [teamStats, setTeamStats] = useState(null);

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
      if (!user?.id) return;
      setLoading(true);
      try {
        // 現状は参加チーム情報APIがないため、暫定でオーナーチームを表示
        const { data } = await api.railwayTeams.getOwnerTeam(user.id);
        const t = Array.isArray(data) ? data[0] : null;
        if (active) setTeam(t || null);
        if (t?.id) {
          try {
            const { data: members } = await api.railwayTeams.getMembers(t.id);
            if (active) setMemberCount(Array.isArray(members) ? members.length : null);
          } catch (e) {
            console.error('failed to load members', e);
            if (active) setMemberCount(null);
          }
          try {
            const { data: stats } = await api.railwayTeams.getStats(t.id);
            if (active) setTeamStats(stats || null);
          } catch (e) {
            console.warn('failed to load team stats', e);
            if (active) setTeamStats(null);
          }
        } else if (active) {
          setMemberCount(null);
        }
      } catch (e) {
        console.error('failed to load team for member view', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user]);

  // 本日/参加予定大会を取得
  useEffect(() => {
    let active = true;
    const loadT = async () => {
      setLoadingT(true);
      try {
        const params = { status: 'upcoming', limit: 50 };
        if (user?.id) params.as_user = user.id;
        const { data } = await api.railwayTournaments.search(params);
        const list = Array.isArray(data) ? data : [];
        const now = new Date();
        const todays = list.filter(t => t.start_date && isSameDay(t.start_date, now));
        if (active) setTodayTournament(todays[0] || null);
        const upcoming = list
          .filter(t => t.start_date && new Date(t.start_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
          .slice(0, 5);
        if (active) setUpcomingTournaments(upcoming);
      } catch (e) {
        console.error('failed to load upcoming tournaments', e);
        if (active) {
          setTodayTournament(null);
          setUpcomingTournaments([]);
        }
      } finally {
        if (active) setLoadingT(false);
      }
    };
    loadT();
    return () => { active = false; };
  }, [user]);

  
  return (
    <div className="screen-16">
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
                    <div className="text-wrapper-300">{loading ? 'ローディング中...' : (team?.name || 'チーム名未設定')}</div>
                    <div className="text-wrapper-301">{team?.location || '地域未設定'}</div>
                  </div>
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
            <div className="text-wrapper-304">{team?.description || '自己紹介が設定されていません'}</div>
            <div className="frame-611">
              <div className="frame-612">
                <div className="text-wrapper-305-1">所属メンバー：{memberCount ?? '-' }人</div>
                <div className="text-wrapper-305-2">チーム代表：{team?.owner_display_name || team?.owner_username || '未設定'}</div>
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
              <div className="frame-621">
                <div className="text-wrapper-308">エントリーする</div>
              </div>
              <div className="frame-622">
                <div className="frame-623">
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
