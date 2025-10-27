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
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState(null);
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
            const t = Array.isArray(teams) ? teams[0] : null;
            if (t?.id) {
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
    if (entryStatus === 'entered') {
      // Withdraw
      try {
        setEntryStatus('entering');
        await api.railwayTournaments.withdraw(tournamentId, 'individual');
        setEntryStatus('not_entered');
      } catch (e) {
        console.error('withdraw failed', e);
        setEntryStatus('entered');
      }
      return;
    }
    setShowConfirmModal(true);
  };

  // エントリー確認処理
  const confirmEntry = async () => {
    if (!tournamentId) return;
    setEntryStatus('entering');
    setShowConfirmModal(false);
    try {
      await api.railwayTournaments.apply(tournamentId, 'individual');
      setEntryStatus('entered');
    } catch (e) {
      console.error('apply failed', e);
      alert('エントリーに失敗しました');
      setEntryStatus('not_entered');
    }
  };

  const toggleTeamEntry = async () => {
    if (!tournamentId || !teamId) return;
    try {
      if (teamEntryStatus === 'entered') {
        setTeamEntryStatus('entering');
        await api.railwayTournaments.withdraw(tournamentId, 'team', teamId);
        setTeamEntryStatus('not_entered');
      } else if (teamEntryStatus === 'not_entered') {
        setTeamEntryStatus('entering');
        await api.railwayTournaments.apply(tournamentId, 'team', teamId);
        setTeamEntryStatus('entered');
      }
    } catch (e) {
      console.error('team toggle failed', e);
      alert('チームのエントリーに失敗しました');
      setTeamEntryStatus('not_entered');
    }
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
              cursor: entryStatus === "entering" ? "wait" : "pointer",
              opacity: entryStatus === "entered" ? 0.7 : 1,
              backgroundColor: entryStatus === "entered" ? "#28a745" : ""
            }}
            disabled={entryStatus === "entering"}
          >
            <div className="text-wrapper-206">
              {entryStatus === "not_entered" && "エントリー"}
              {entryStatus === "entering" && "処理中..."}
              {entryStatus === "entered" && "エントリー解除"}
            </div>
          </button>

          <button 
            onClick={handleInquiry}
            className="frame-311"
            style={{ border: "none", cursor: "pointer" }}
          >
            <div className="text-wrapper-207">お問い合わせ</div>
          </button>
          {teamEntryStatus !== 'no_team' && (
            <button
              onClick={toggleTeamEntry}
              className="frame-310"
              style={{ 
                border: "none", 
                cursor: teamEntryStatus === "entering" ? "wait" : "pointer",
                opacity: teamEntryStatus === "entered" ? 0.7 : 1,
                backgroundColor: teamEntryStatus === "entered" ? "#28a745" : "",
                marginLeft: 8
              }}
              disabled={teamEntryStatus === "entering" || !teamId}
            >
              <div className="text-wrapper-206">
                {!teamId ? 'チームなし' : teamEntryStatus === 'entered' ? 'チームエントリー解除' : 'チームでエントリー'}
              </div>
            </button>
          )}
        </div>

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
              <h3 style={{ marginBottom: "20px" }}>エントリー確認</h3>
              <p style={{ marginBottom: "30px" }}>
                「{tournament?.name || 'この大会'}」にエントリーしますか？
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setShowConfirmModal(false)}
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
                    backgroundColor: "#007bff",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  エントリーする
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
