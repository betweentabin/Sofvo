import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import api from "../../services/api";
import "./style.css";

export const Screen20 = () => {
  const mainContentTop = useHeaderOffset();
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!tournamentId) return;
      setLoading(true);
      try {
        const [{ data: t }, { data: r }, { data: likes }, matchesRes] = await Promise.all([
          api.railwayTournaments.getOne(tournamentId),
          api.railwayTournaments.results(tournamentId),
          api.railwayTournaments.getLikes(tournamentId),
          api.railwayTournaments.matches(tournamentId).catch(() => ({ data: [] }))
        ]);
        setTournament(t);
        setResults(r || []);
        setLikeCount(likes?.count || 0);
        // Optionally use matches for future precise rendering (stored but not yet wired into layout)
        // const matches = Array.isArray(matchesRes?.data) ? matchesRes.data : [];
      } catch (e) {
        console.error('Failed to load results', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

  const nameOf = (r) => r.team_name || r.user_display_name || r.user_username || '不明';
  const parseNotes = (notes) => {
    if (!notes) return {};
    // JSON優先
    try {
      const j = JSON.parse(notes);
      return j && typeof j === 'object' ? j : {};
    } catch {}
    // テキストの簡易パース: "ステージ:本選; ラウンド:1; 相手:ABC; スコア:21-19; 結果:勝"
    const out = {};
    const mStage = notes.match(/(本選|決勝|予選|リーグ)/);
    if (mStage) out.stage = mStage[1];
    const mRound = notes.match(/ラウンド[:：]\s*(\d+)/);
    if (mRound) out.round = Number(mRound[1]);
    const mOpp = notes.match(/相手[:：]\s*([^;、\n]+)/);
    if (mOpp) out.opponent = mOpp[1].trim();
    const mScore = notes.match(/スコア[:：]\s*([0-9]+\s*[-–]\s*[0-9]+)/);
    if (mScore) out.score = mScore[1].replace(/–/, '-');
    const mRes = notes.match(/結果[:：]\s*([勝敗引分WinLoseDraw〇×△]+)/i);
    if (mRes) out.result = mRes[1];
    return out;
  };
  const fmtScore = (r) => {
    const n = parseNotes(r.notes);
    return n.score || r.score || '-';
  };
  const fmtOpponent = (r) => {
    const n = parseNotes(r.notes);
    return n.opponent || nameOf(r);
  };
  const fmtOutcome = (r) => {
    const n = parseNotes(r.notes);
    if (n.result) return n.result;
    if (typeof r.points === 'number') return `${r.points}P`;
    // 簡易: スコア比較で勝敗(自分側を判別できないため保留)
    return '-';
  };
  const stageOf = (r) => {
    const n = parseNotes(r.notes);
    if (n.stage) return n.stage;
    // フォールバック: position上位を本選、下位を予選とみなす
    return null;
  };
  const finals = (results || []).filter(r => /本選|決勝/.test(stageOf(r) || ''));
  const prelims = (results || []).filter(r => /予選|リーグ/.test(stageOf(r) || ''));
  const fallbackFinals = results.slice(0, Math.ceil((results || []).length / 2));
  const fallbackPrelims = results.slice(Math.ceil((results || []).length / 2));

  
  return (
    <div className="screen-20">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {/* エントリー受付中 */}
        <div className="frame-164">
          <div className="text-wrapper-96">{tournament?.status === 'completed' ? '大会終了' : '大会情報'}</div>
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

            <div className="frame-84">
              <div className="heart-2">
                    <img className="vector-16" alt="Vector" src="/img/vector-25.svg" />
              </div>
              <div className="text-wrapper-67">{likeCount} いいね</div>
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
              <div className="text-wrapper-94-1">試合球：-</div>
              <div className="text-wrapper-94-2">種別：{tournament?.sport_type || '-'}</div>
              <div className="text-wrapper-94-3">競技方法：-</div>
              <div className="text-wrapper-94-4">順位方法：-</div>
            </div>
          </div>
        </div>

        {/* 大会結果 */}
        <div className="frame-164">
          <div className="text-wrapper-96">大会結果</div>
        </div>

        <div className="frame-159">
          <div className="frame-160">
            <div className="frame-161">
              {(results || []).length > 0 ? (
                (results || []).map((r, i) => (
                  <div key={i} className="text-wrapper-95-1">
                    第{r.position ?? '-'}位：{r.team_name || r.user_display_name || r.user_username || '不明'}
                    {typeof r.points === 'number' ? `（${r.points}P）` : ''}
                  </div>
                ))
              ) : (
                <div className="text-wrapper-95-1">結果は未登録です</div>
              )}
            </div>
          </div>
        </div>

        {/* 大会結果 */}

        <div className="frame-180">
          <div className="frame-181">
            <div className="row row-1"><div className="cell-1">本選</div></div>
            <div className="row row-2" key={2}>
              <div className="sub-row">
                <div className="sub-cell-2-1"></div>
                <div className="sub-cell-2-2">対戦相手</div>
                <div className="sub-cell-2-3">スコア</div>
              </div>
              <div className="cell-2">結果</div>
            </div>
            {(finals.length > 0 ? finals : fallbackFinals).map((r, idx) => (
              <div className="row row-3" key={`fin-${idx}`}>
                <div className="sub-row">
                  <div className="sub-cell-3-1">第{parseNotes(r.notes).round ?? r.position ?? (idx+1)}試合</div>
                  <div className="sub-cell-3-2">{fmtOpponent(r)}</div>
                  <div className="sub-cell-3-3">{fmtScore(r)}</div>
                </div>
                <div className="cell-3">{fmtOutcome(r)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="frame-182">
          <div className="frame-181">
            <div className="row row-6"><div className="cell-6">順位決定戦</div></div>
            <div className="row row-7" key={2}>
              <div className="sub-row">
                <div className="sub-cell-7-1"></div>
                <div className="sub-cell-7-2">対戦相手</div>
                <div className="sub-cell-7-3">スコア</div>
              </div>
              <div className="cell-7">結果</div>
            </div>
            {(prelims.length > 0 ? prelims : fallbackPrelims).map((r, idx) => (
              <div className="row row-8" key={`pre-${idx}`}>
                <div className="sub-row">
                  <div className="sub-cell-8-1">第{parseNotes(r.notes).round ?? r.position ?? (idx+1)}試合</div>
                  <div className="sub-cell-8-2">{fmtOpponent(r)}</div>
                  <div className="sub-cell-8-3">{fmtScore(r)}</div>
                </div>
                <div className="cell-8">{fmtOutcome(r)}</div>
              </div>
            ))}
          </div>
        </div>

        <Footer currentPage="schedule" />
      </div>
    </div>
  );
};
