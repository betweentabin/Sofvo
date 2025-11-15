import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const Screen18 = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  const mainContentTop = useHeaderOffset();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [entryStatus, setEntryStatus] = useState("not_entered"); // not_entered, entering, entered
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null); // 'individual' or 'team'
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamEntryStatus, setTeamEntryStatus] = useState('unknown');
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchScore1, setMatchScore1] = useState('');
  const [matchScore2, setMatchScore2] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!tournamentId) return;
      setLoading(true);
      try {
        const { data } = await api.railwayTournaments.getOne(tournamentId);
        setTournament(data);
        // Load likes with auth
        const { data: likes } = await api.railwayTournaments.getLikes(tournamentId);
        setLikeCount(likes?.count || 0);
        setIsLiked(!!likes?.liked);
        // Load participation status (individual)
        try {
          const { data: part } = await api.railwayTournaments.isParticipating(tournamentId, 'individual');
          setEntryStatus(part?.participating ? 'entered' : 'not_entered');
        } catch {}
        // Load owner team and team participation status
        try {
          if (user?.id) {
            const { data: teams } = await api.railwayTeams.getOwnerTeam(user.id);
            const t = Array.isArray(teams) ? teams[0] : teams;
            if (t?.id) {
              setTeam(t);
              setTeamId(t.id);
              const { data: tpart } = await api.railwayTournaments.isParticipating(tournamentId, 'team', t.id);
              setTeamEntryStatus(tpart?.participating ? 'entered' : 'not_entered');
            } else {
              setTeamEntryStatus('no_team');
            }
          }
        } catch (e) {
          console.warn('team load failed', e);
          setTeamEntryStatus('error');
        }
        // Load matches
        try {
          const { data: matchData } = await api.railwayTournaments.matches(tournamentId);
          setMatches(matchData || []);
        } catch (e) {
          console.warn('Failed to load matches', e);
        }
        // Load participants
        try {
          const { data: partData } = await api.railwayTournaments.listParticipants(tournamentId);
          setParticipants(partData || []);
        } catch (e) {
          console.warn('Failed to load participants', e);
        }
      } catch (e) {
        console.error('Failed to load tournament', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId, user?.id]);

  
  // いいねボタンの処理（API）
  const handleLike = async () => {
    if (!tournamentId) return;
    try {
      if (isLiked) {
        const { data } = await api.railwayTournaments.unlike(tournamentId);
        setIsLiked(false);
        setLikeCount(data?.count ?? Math.max(0, likeCount - 1));
      } else {
        const { data } = await api.railwayTournaments.like(tournamentId);
        setIsLiked(true);
        setLikeCount(data?.count ?? (likeCount + 1));
      }
    } catch (e) {
      console.error('Failed to toggle like', e);
    }
  };

  // エントリー処理
  const handleEntry = async () => {
    if (!tournamentId) return;

    // 既にエントリー済みの場合は解除確認を表示
    if (entryStatus === 'entered') {
      setSelectedMode('individual');
      setShowConfirmModal(true);
      return;
    }

    if (teamEntryStatus === 'entered') {
      setSelectedMode('team');
      setShowConfirmModal(true);
      return;
    }

    // 新規エントリーの場合、モード選択モーダルを表示
    setShowModeSelectionModal(true);
  };

  // モード選択後の処理
  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
    setShowModeSelectionModal(false);
    setShowConfirmModal(true);
  };

  // エントリー確認処理
  const confirmEntry = async () => {
    if (!tournamentId) return;
    setShowConfirmModal(false);

    // 解除処理
    if (entryStatus === 'entered' && selectedMode === 'individual') {
      try {
        setEntryStatus('entering');
        await api.railwayTournaments.withdraw(tournamentId, 'individual');
        setEntryStatus('not_entered');
        setSelectedMode(null);
      } catch (e) {
        console.error('withdraw failed', e);
        setEntryStatus('entered');
      }
      return;
    }

    if (teamEntryStatus === 'entered' && selectedMode === 'team') {
      try {
        setTeamEntryStatus('entering');
        await api.railwayTournaments.withdraw(tournamentId, 'team', teamId);
        setTeamEntryStatus('not_entered');
        setSelectedMode(null);
      } catch (e) {
        console.error('team withdraw failed', e);
        setTeamEntryStatus('entered');
      }
      return;
    }

    // 新規エントリー処理
    if (selectedMode === 'individual') {
      try {
        setEntryStatus('entering');
        await api.railwayTournaments.apply(tournamentId, 'individual');
        setEntryStatus('entered');
      } catch (e) {
        console.error('apply failed', e);
        alert('エントリーに失敗しました');
        setEntryStatus('not_entered');
      }
    } else if (selectedMode === 'team') {
      try {
        setTeamEntryStatus('entering');
        await api.railwayTournaments.apply(tournamentId, 'team', teamId);
        setTeamEntryStatus('entered');
      } catch (e) {
        console.error('team apply failed', e);
        alert('チームのエントリーに失敗しました');
        setTeamEntryStatus('not_entered');
      }
    }

    setSelectedMode(null);
  };

  // お問い合わせ処理
  const handleInquiry = () => {
    navigate("/dm");
  };

  // 対戦表生成処理
  const handleGenerateMatches = async () => {
    if (!tournamentId) return;
    if (!window.confirm('対戦表を生成しますか？既に参加登録されているチーム/個人で総当たり戦の対戦表を作成します。')) {
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.railwayTournaments.generateMatches(tournamentId);
      setMatches(data.matches || []);
      alert(`対戦表を生成しました（${data.count}試合）`);
      // Reload matches from server to get full details
      const { data: matchData } = await api.railwayTournaments.matches(tournamentId);
      setMatches(matchData || []);
    } catch (e) {
      console.error('Failed to generate matches', e);
      alert(e.response?.data?.error || '対戦表の生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 試合結果入力モーダルを開く
  const openMatchModal = (match) => {
    setSelectedMatch(match);
    setMatchScore1(match.score1 !== null ? String(match.score1) : '');
    setMatchScore2(match.score2 !== null ? String(match.score2) : '');
    setShowMatchModal(true);
  };

  // 試合結果を更新
  const handleUpdateMatch = async () => {
    if (!selectedMatch || !tournamentId) return;

    const score1 = parseInt(matchScore1, 10);
    const score2 = parseInt(matchScore2, 10);

    if (isNaN(score1) || isNaN(score2)) {
      alert('スコアは数値で入力してください');
      return;
    }

    try {
      await api.railwayTournaments.updateMatch(tournamentId, selectedMatch.id, {
        score1,
        score2,
        status: 'completed'
      });

      // Reload matches
      const { data: matchData } = await api.railwayTournaments.matches(tournamentId);
      setMatches(matchData || []);
      setShowMatchModal(false);
      setSelectedMatch(null);
    } catch (e) {
      console.error('Failed to update match', e);
      alert(e.response?.data?.error || '試合結果の更新に失敗しました');
    }
  };

  // 試合の参加者かどうかをチェック
  const isMatchParticipant = (match) => {
    if (!user?.id) return false;
    if (match.player1_id === user.id || match.player2_id === user.id) return true;
    // Check if user is member of participating teams
    // This would require team membership data - simplified for now
    return false;
  };

  // 大会主催者かどうかをチェック
  const isOrganizer = () => {
    return tournament?.organizer_id === user?.id;
  };

  return (
    <div className="screen-18">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {/* エントリー受付中 */}
        <div className="frame-164">
          <div className="text-wrapper-96">エントリー受付中</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="gray-box"></div>

            <div className="frame-161">
              <div className="text-wrapper-93-1">大会名：{tournament?.name || '-'}</div>
              <div className="text-wrapper-93-2">開催日時：{tournament?.start_date ? new Date(tournament.start_date).toLocaleDateString('ja-JP') : '-'}</div>
              <div className="text-wrapper-93-3">開催地域：{tournament?.location || '-'}</div>
              <div className="text-wrapper-93-4">開催場所：{tournament?.location?.split(' ')?.[1] || '-'}</div>
              <div className="text-wrapper-93-5">住所：-</div>
              <div className="text-wrapper-93-6">主催者：{tournament?.organizer_display_name || tournament?.organizer_username || '-'}</div>
            </div>

            <div className="gray-box2"></div>

            <div 
              className="frame-84"
              onClick={handleLike}
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <div className="heart-2" style={{ color: isLiked ? "#ff0066" : "inherit" }}>
                    <img 
                      className="vector-16" 
                      alt="Vector" 
                      src="/img/vector-25.svg" 
                      style={{ filter: isLiked ? "brightness(0) saturate(100%) invert(34%) sepia(82%) saturate(6000%) hue-rotate(330deg) brightness(100%) contrast(101%)" : "none" }}
                    />
              </div>
              <div className="text-wrapper-67">{likeCount} いいね</div>
            </div>

          </div>
        </div>

        {/* スケジュール */}
        <div className="frame-164">
          <div className="text-wrapper-96">スケジュール</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="frame-161">
              {tournament?.description ? (
                <div className="text-wrapper-94-1">{tournament.description}</div>
              ) : (
                <div className="text-wrapper-94-1">スケジュールは未設定です</div>
              )}
            </div>
          </div>
        </div>

        {/* 概要 */}
        <div className="frame-164">
          <div className="text-wrapper-96">概要</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="frame-161">
              <div className="text-wrapper-95-1">試合球：-</div>
              <div className="text-wrapper-95-2">種別：{tournament?.sport_type || '-'}</div>
              <div className="text-wrapper-95-3">順位方法：-</div>
              <div className="frame-170">
                <div className="text-wrapper-93-3">順位方法：</div>
                <div className="text-wrapper-95-5">（未設定）</div>
              </div>
              <div className="frame-170">
                <div className="text-wrapper-96-1">獲得ポイント：</div>
                <div className="text-wrapper-95-6">（未設定）</div>
              </div>
              <div className="frame-170">
                <div className="text-wrapper-96-1">残り枠（チーム）：</div>
                <div className="text-wrapper-95-6">{typeof tournament?.remaining_team === 'number' ? `${tournament.remaining_team}チーム` : '未設定'}</div>
              </div>
              <div className="frame-170">
                <div className="text-wrapper-96-1">残り枠（個人）：</div>
                <div className="text-wrapper-95-6">{typeof tournament?.remaining_individual === 'number' ? `${tournament.remaining_individual}名` : '未設定'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 対戦表 */}
        <div className="frame-164">
          <div className="text-wrapper-96">対戦表</div>
        </div>

        {/* 主催者のみ：対戦表生成ボタン */}
        {isOrganizer() && matches.length === 0 && participants.length >= 2 && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <button
              onClick={handleGenerateMatches}
              style={{
                padding: "12px 24px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              対戦表を生成する（{participants.length}名/チームで総当たり戦）
            </button>
            <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
              現在参加登録されている {participants.length} 名/チームで総当たり戦の対戦表を作成します
            </p>
          </div>
        )}

        {/* 対戦表表示 */}
        {matches.length > 0 ? (
          <div className="frame-180-1">
            <div className="frame-181">
              {/* ヘッダー */}
              <div className="row row-1">
                <div className="cell-1">総当たり戦</div>
              </div>

              <div className="row row-2">
                <div className="cell-span-2">対戦カード</div>
                <div className="cell-2">スコア</div>
              </div>

              {/* 試合一覧 */}
              {matches.map((match, index) => {
                const participant1Name = match.team1_name || match.player1_display_name || match.player1_username || '参加者1';
                const participant2Name = match.team2_name || match.player2_display_name || match.player2_username || '参加者2';
                const canEdit = isOrganizer() || isMatchParticipant(match);

                return (
                  <div
                    className="row row-3"
                    key={match.id}
                    onClick={() => canEdit && openMatchModal(match)}
                    style={{
                      cursor: canEdit ? "pointer" : "default",
                      backgroundColor: canEdit ? "#f8f9fa" : "inherit"
                    }}
                  >
                    <div className="sub-row">
                      <div className="sub-cell-3-1">{participant1Name}</div>
                      <div className="sub-cell-3-2">VS</div>
                      <div className="sub-cell-3-3">{participant2Name}</div>
                    </div>
                    <div className="cell-3">
                      {match.score1 !== null && match.score2 !== null
                        ? `${match.score1} - ${match.score2}`
                        : '未入力'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            {participants.length < 2
              ? '対戦表を生成するには2名以上の参加登録が必要です'
              : '対戦表はまだ生成されていません'}
          </div>
        )}

        <div className="frame-309">
          <button
            onClick={handleEntry}
            className="frame-310"
            style={{
              border: "none",
              cursor: (entryStatus === "entering" || teamEntryStatus === "entering") ? "wait" : "pointer",
              opacity: (entryStatus === "entered" || teamEntryStatus === "entered") ? 0.7 : 1,
              backgroundColor: (entryStatus === "entered" || teamEntryStatus === "entered") ? "#28a745" : ""
            }}
            disabled={entryStatus === "entering" || teamEntryStatus === "entering"}
          >
            <div className="text-wrapper-206">
              {(entryStatus === "not_entered" && teamEntryStatus === "not_entered") && "エントリー"}
              {(entryStatus === "not_entered" && teamEntryStatus === "no_team") && "エントリー"}
              {(entryStatus === "entering" || teamEntryStatus === "entering") && "処理中..."}
              {entryStatus === "entered" && "個人エントリー解除"}
              {teamEntryStatus === "entered" && "チームエントリー解除"}
            </div>
          </button>

          <button
            onClick={handleInquiry}
            className="frame-311"
            style={{ border: "none", cursor: "pointer" }}
          >
            <div className="text-wrapper-207">お問い合わせ</div>
          </button>
        </div>

        {/* モード選択モーダル */}
        {showModeSelectionModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "400px",
              width: "90%"
            }}>
              <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>参加方法を選択</h3>
              <p style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
                「{tournament?.name || 'この大会'}」にどのように参加しますか？
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <button
                  onClick={() => handleModeSelection('individual')}
                  style={{
                    padding: "16px",
                    border: "2px solid #007bff",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f8ff"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                >
                  <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>個人で参加</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>自分一人で大会にエントリーします</div>
                </button>

                {teamEntryStatus !== 'no_team' && team && (
                  <button
                    onClick={() => handleModeSelection('team')}
                    style={{
                      padding: "16px",
                      border: "2px solid #28a745",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fff4"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>チームで参加</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {team.name} として大会にエントリーします
                    </div>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowModeSelectionModal(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* エントリー確認モーダル */}
        {showConfirmModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "400px",
              width: "90%"
            }}>
              <h3 style={{ marginBottom: "20px" }}>
                {(entryStatus === 'entered' || teamEntryStatus === 'entered') ? 'エントリー解除確認' : 'エントリー確認'}
              </h3>
              <p style={{ marginBottom: "30px" }}>
                {entryStatus === 'entered' && '個人エントリーを解除しますか？'}
                {teamEntryStatus === 'entered' && `チーム「${team?.name || 'チーム'}」のエントリーを解除しますか？`}
                {selectedMode === 'individual' && entryStatus !== 'entered' && '個人で「' + (tournament?.name || 'この大会') + '」にエントリーしますか？'}
                {selectedMode === 'team' && teamEntryStatus !== 'entered' && `チーム「${team?.name || 'チーム'}」で「${tournament?.name || 'この大会'}」にエントリーしますか？`}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedMode(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmEntry}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "5px",
                    backgroundColor: (entryStatus === 'entered' || teamEntryStatus === 'entered') ? "#dc3545" : "#007bff",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  {(entryStatus === 'entered' || teamEntryStatus === 'entered') ? '解除する' : 'エントリーする'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 試合結果入力モーダル */}
        {showMatchModal && selectedMatch && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "90%"
            }}>
              <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>試合結果を入力</h3>

              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px"
                }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                      {selectedMatch.team1_name || selectedMatch.player1_display_name || selectedMatch.player1_username || '参加者1'}
                    </div>
                    <input
                      type="number"
                      value={matchScore1}
                      onChange={(e) => setMatchScore1(e.target.value)}
                      style={{
                        width: "80px",
                        padding: "8px",
                        fontSize: "18px",
                        textAlign: "center",
                        border: "2px solid #007bff",
                        borderRadius: "5px"
                      }}
                      placeholder="0"
                    />
                  </div>

                  <div style={{ padding: "0 20px", fontSize: "24px", fontWeight: "bold", color: "#666" }}>
                    VS
                  </div>

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
                      {selectedMatch.team2_name || selectedMatch.player2_display_name || selectedMatch.player2_username || '参加者2'}
                    </div>
                    <input
                      type="number"
                      value={matchScore2}
                      onChange={(e) => setMatchScore2(e.target.value)}
                      style={{
                        width: "80px",
                        padding: "8px",
                        fontSize: "18px",
                        textAlign: "center",
                        border: "2px solid #007bff",
                        borderRadius: "5px"
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    setSelectedMatch(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdateMatch}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "5px",
                    backgroundColor: "#007bff",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer currentPage="schedule" />
      </div>
    </div>
  );
};
