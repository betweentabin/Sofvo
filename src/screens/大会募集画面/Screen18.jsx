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
      } catch (e) {
        console.error('Failed to load tournament', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

  
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

        {/* 大会結果 */}
        <div className="frame-164">
          <div className="text-wrapper-96">大会結果</div>
        </div>

        <div className="frame-180-1">
          <div className="frame-181">

            {/* 1行目：横幅いっぱい */}
            <div className="row row-1">
              <div className="cell-1">本選</div>
            </div>

            {/* 2行目：左列は3列分の幅 */}
            <div className="row row-2">
              <div className="cell-span-2">対戦相手</div>
              <div className="cell-2">スコア</div>
            </div>

            {/* 3行目 */}
            <div className="row row-3" key={3}>
              <div className="sub-row">
                <div className="sub-cell-3-1">3-1-1</div>
                <div className="sub-cell-3-2">VS</div>
                <div className="sub-cell-3-3">3-1-3</div>
              </div>
              <div className="cell-3">3-2</div>
            </div>

            {/* 4行目 */}
            <div className="row row-4" key={4}>
              <div className="sub-row">
                <div className="sub-cell-4-1">4-1-1</div>
                <div className="sub-cell-4-2">VS</div>
                <div className="sub-cell-4-3">4-1-3</div>
              </div>
              <div className="cell-4">4-2</div>
            </div>

            {/* 5行目 */}
            <div className="row row-5" key={5}>
              <div className="sub-row">
                <div className="sub-cell-5-1">5-1-1</div>
                <div className="sub-cell-5-2">VS</div>
                <div className="sub-cell-5-3">5-1-3</div>
              </div>
              <div className="cell-5">5-2</div>
            </div>

            {/* 6行目 */}
            <div className="row row-6" key={6}>
              <div className="sub-row">
                <div className="sub-cell-6-1">6-1-1</div>
                <div className="sub-cell-6-2">VS</div>
                <div className="sub-cell-6-3">6-1-3</div>
              </div>
              <div className="cell-6">6-2</div>
            </div>
          </div>
        </div>

        <div className="frame-182">
          <div className="frame-181">
            {/* 1行目：横幅いっぱい */}
            <div className="row row-7">
              <div className="cell-7">予選</div>
            </div>

            {/* 2行目：左列は3列分の幅 */}
            <div className="row row-8">
              <div className="cell-span-8">対戦相手</div>
              <div className="cell-8">スコア</div>
            </div>

            {/* 3行目 */}
            <div className="row row-9" key={3}>
              <div className="sub-row">
                <div className="sub-cell-9-1">3-1-1</div>
                <div className="sub-cell-9-2">VS</div>
                <div className="sub-cell-9-3">3-1-3</div>
              </div>
              <div className="cell-9">3-2</div>
            </div>

            {/* 4行目 */}
            <div className="row row-10" key={4}>
              <div className="sub-row">
                <div className="sub-cell-10-1">4-1-1</div>
                <div className="sub-cell-10-2">VS</div>
                <div className="sub-cell-10-3">4-1-3</div>
              </div>
              <div className="cell-10">4-2</div>
            </div>

            {/* 5行目 */}
            <div className="row row-11" key={5}>
              <div className="sub-row">
                <div className="sub-cell-11-1">5-1-1</div>
                <div className="sub-cell-11-2">VS</div>
                <div className="sub-cell-11-3">5-1-3</div>
              </div>
              <div className="cell-11">5-2</div>
            </div>

            {/* 6行目 */}
            <div className="row row-12" key={6}>
              <div className="sub-row">
                <div className="sub-cell-12-1">6-1-1</div>
                <div className="sub-cell-12-2">VS</div>
                <div className="sub-cell-12-3">6-1-3</div>
              </div>
              <div className="cell-12">6-2</div>
            </div>
          </div>
        </div>

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

        <Footer currentPage="schedule" />
      </div>
    </div>
  );
};
