import React, { useEffect, useMemo, useState } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Screen35 = () => {
  const mainContentTop = useHeaderOffset();
  const { user } = useAuth();
  const USE_RAILWAY = import.meta.env.VITE_RAILWAY_DATA === 'true';
  const RAILWAY_TEST_USER = import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;

  const [ownerTeamId, setOwnerTeamId] = useState(null);
  const [membersRaw, setMembersRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!USE_RAILWAY) return; // 従来の静的表示のまま
      const asUserId = RAILWAY_TEST_USER || user?.id;
      if (!asUserId) return;
      setLoading(true);
      try {
        const { data: ownerTeams } = await api.railwayTeams.getOwnerTeam(asUserId);
        const teamId = ownerTeams?.[0]?.id || null;
        setOwnerTeamId(teamId);
        if (teamId) {
          const { data } = await api.railwayTeams.getMembers(teamId);
          setMembersRaw(data || []);
        }
      } catch (e) {
        console.error('Failed to load team members:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [USE_RAILWAY, RAILWAY_TEST_USER, user]);

  const currentRailId = useMemo(() => (RAILWAY_TEST_USER || user?.id) || null, [RAILWAY_TEST_USER, user]);

  const mappedMembers = useMemo(() => {
    if (!USE_RAILWAY) return [];
    return (membersRaw || []).map((m) => {
      const display = m.display_name || m.username || 'メンバー';
      const area = m.location || '';
      const gender = m.gender || '';
      const isOwner = m.role === 'owner';
      const isSelf = currentRailId && (m.user_id === currentRailId);
      const showButton = !isOwner; // オーナーは削除不可
      return {
        _user_id: m.user_id,
        name: `${display}`,
        age: '',
        gender: gender || '',
        history: '',
        area: area || '',
        showButton,
        _isSelf: !!isSelf,
      };
    });
  }, [USE_RAILWAY, membersRaw, currentRailId]);

  const handleRemove = async (targetUserId) => {
    if (!USE_RAILWAY || !ownerTeamId || !currentRailId) return;
    try {
      await api.railwayTeams.removeMember(currentRailId, ownerTeamId, targetUserId);
      const { data } = await api.railwayTeams.getMembers(ownerTeamId);
      setMembersRaw(data || []);
    } catch (e) {
      console.error('Failed to remove member:', e);
      alert('メンバーを削除できませんでした');
    }
  };

  return (
    <div className="screen-35">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        <div className="frame-166">
          <div className="text-wrapper-96-2">メンバー管理</div>
        </div>

        <div className="frame-21">
          <div className="frame-22">
            <div className="frame-23">
              <div className="magnifying-glass-wrapper">
                <div className="magnifying-glass">
                  <img
                    className="search-icon"
                    alt="検索"
                    src="/img/検索黒.png"
                  />
                </div>
              </div>
              <div className="text-wrapper-39">大会を検索（チーム参加）</div>
            </div>

            <div className="frame-24">
              <div className="frame-box1">
                <input
                  type="text"
                  id="search-year-month"
                  className="custom-input"
                />
              </div>
            </div>

            <div className="frame-30">
              <div className="text-wrapper-43">検索</div>
            </div>
          </div>
        </div>

        <div className="frame-167">
          <div className="frame-168">
            {(USE_RAILWAY ? mappedMembers : []).map((member, index) => (
              <details key={index} className="member-item">
                <summary className="member-name">{member.name}</summary>
                <div className="member-details">
                  <p><strong>年齢：</strong>{member.age}歳</p>
                  <p><strong>性別：</strong>{member.gender}</p>
                  <p><strong>競技歴：</strong>{member.history}年</p>
                  <p><strong>活動地域：</strong>{member.area}</p>
                </div>

                {member.showButton && (
                  <div className="frame-628">
                    <div className="frame-629" onClick={() => handleRemove(member._user_id)} style={{ cursor: 'pointer' }}>
                      <div className="text-wrapper-312">チームから削除</div>
                    </div>
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      </div>

      <Footer currentPage="schedule" />
    </div>
  );
};
