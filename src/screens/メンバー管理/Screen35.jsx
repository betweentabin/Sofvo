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
      console.log('=== メンバー管理画面: データ読み込み開始 ===');
      console.log('USE_RAILWAY:', USE_RAILWAY);
      console.log('User:', user);

      if (!USE_RAILWAY) {
        console.log('USE_RAILWAYがfalseのため、静的表示のまま');
        return;
      }

      const asUserId = RAILWAY_TEST_USER || user?.id;
      console.log('as_user ID:', asUserId);

      if (!asUserId) {
        console.log('ユーザーIDが取得できません');
        return;
      }

      setLoading(true);
      try {
        console.log('オーナーチームを取得中...');
        const { data: ownerTeams } = await api.railwayTeams.getOwnerTeam(asUserId);
        console.log('オーナーチームデータ:', ownerTeams);

        const teamId = ownerTeams?.id || null;
        console.log('チームID:', teamId);

        setOwnerTeamId(teamId);

        if (teamId) {
          console.log('チームメンバーを取得中...');
          const { data } = await api.railwayTeams.getMembers(teamId);
          console.log('取得したメンバーデータ:', data);
          console.log('メンバー数:', data?.length || 0);

          setMembersRaw(data || []);
        } else {
          console.log('チームIDが見つかりません（チーム未作成の可能性）');
        }
      } catch (e) {
        console.error('チームメンバーの読み込みに失敗:', e);
        console.error('エラー詳細:', e.response?.data);
        alert('チームメンバーの読み込みに失敗しました: ' + (e.response?.data?.error || e.message));
      } finally {
        setLoading(false);
        console.log('データ読み込み完了');
      }
    };
    load();
  }, [USE_RAILWAY, RAILWAY_TEST_USER, user]);

  const currentRailId = useMemo(() => (RAILWAY_TEST_USER || user?.id) || null, [RAILWAY_TEST_USER, user]);

  const mappedMembers = useMemo(() => {
    if (!USE_RAILWAY) return [];

    console.log('メンバーマッピング開始:', membersRaw);

    return (membersRaw || []).map((m) => {
      const display = m.display_name || m.username || 'メンバー';
      const area = m.location || '';
      const gender = m.gender === 'male' ? '男性' : m.gender === 'female' ? '女性' : m.gender === 'other' ? 'その他' : '';
      const age = m.age || '';
      const experience = m.experience_years || '';
      const isOwner = m.role === 'owner';
      const isSelf = currentRailId && (m.user_id === currentRailId);
      const showButton = !isOwner && !isSelf; // オーナーと自分自身は削除不可

      console.log(`メンバー ${display}:`, {
        user_id: m.user_id,
        role: m.role,
        age,
        gender,
        experience,
        area,
        isOwner,
        isSelf,
        showButton
      });

      return {
        _user_id: m.user_id,
        name: `${display}${isOwner ? ' (代表)' : ''}${isSelf ? ' (あなた)' : ''}`,
        age: age ? `${age}` : '未設定',
        gender: gender || '未設定',
        history: experience || '未設定',
        area: area || '未設定',
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
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
              }}>
                読み込み中...
              </div>
            )}

            {!loading && !ownerTeamId && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
              }}>
                チームが作成されていません。先にチームを作成してください。
              </div>
            )}

            {!loading && ownerTeamId && mappedMembers.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
              }}>
                メンバーがいません。
              </div>
            )}

            {!loading && mappedMembers.length > 0 && (
              <>
                <div style={{
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  marginBottom: '10px',
                  borderRadius: '4px'
                }}>
                  <strong>メンバー数:</strong> {mappedMembers.length}人
                </div>
                {mappedMembers.map((member, index) => (
                  <details key={index} className="member-item">
                    <summary className="member-name">{member.name}</summary>
                    <div className="member-details">
                      <p><strong>年齢：</strong>{member.age}{member.age !== '未設定' ? '歳' : ''}</p>
                      <p><strong>性別：</strong>{member.gender}</p>
                      <p><strong>競技歴：</strong>{member.history}{member.history !== '未設定' ? '年' : ''}</p>
                      <p><strong>活動地域：</strong>{member.area}</p>
                    </div>

                    {member.showButton && (
                      <div className="frame-628">
                        <div
                          className="frame-629"
                          onClick={() => {
                            if (window.confirm(`${member.name} をチームから削除しますか？`)) {
                              handleRemove(member._user_id);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="text-wrapper-312">チームから削除</div>
                        </div>
                      </div>
                    )}
                  </details>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer currentPage="schedule" />
    </div>
  );
};
