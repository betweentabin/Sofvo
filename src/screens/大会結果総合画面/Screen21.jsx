import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import api from "../../services/api";
import "./style.css";

export const Screen21 = () => {
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
        const [{ data: t }, { data: r }, { data: likes }] = await Promise.all([
          api.railwayTournaments.getOne(tournamentId),
          api.railwayTournaments.results(tournamentId),
          api.railwayTournaments.getLikes(tournamentId)
        ]);
        setTournament(t);
        setResults(r || []);
        setLikeCount(likes?.count || 0);
      } catch (e) {
        console.error('Failed to load tournament results:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

  const nameOf = (r) => r.team_name || r.user_display_name || r.user_username || '不明';
  const finals = results.slice(0, Math.ceil((results || []).length / 2));
  const prelims = results.slice(Math.ceil((results || []).length / 2));
  const fmtScore = (r) => (r.score || '-');
  const fmtOutcome = (r) => (typeof r.points === 'number' ? `${r.points}P` : '-');

  
  return (
    <div className="screen-21">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {/* エントリー受付中 */}
        <div className="frame-164">
          <div className="text-wrapper-96">{tournament?.status === 'completed' ? '大会結果（総合）' : '大会情報'}</div>
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
              <div className="text-wrapper-94-3">順位方法：-</div>
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
                (results || []).map((r, idx) => (
                  <div key={idx} className={`text-wrapper-95-${Math.min(idx+1, 3)}`}>
                    第{r.position ?? '-'}位：{r.team_name || r.user_display_name || r.user_username || '不明'}（{r.points || 0}P）
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
            <div className="row row-2">
              <div className="cell-span-2">対戦相手</div>
              <div className="cell-2">スコア</div>
            </div>
            {(finals.length > 0 ? finals : results).map((r, idx) => (
              <div className="row row-3" key={`fin-${idx}`}>
                <div className="sub-row">
                  <div className="sub-cell-3-1">第{r.position ?? (idx+1)}試合</div>
                  <div className="sub-cell-3-2">{nameOf(r)}</div>
                  <div className="sub-cell-3-3">{fmtScore(r)}</div>
                </div>
                <div className="cell-3">{fmtOutcome(r)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="frame-182">
          <div className="frame-181">
            <div className="row row-7"><div className="cell-7">予選</div></div>
            <div className="row row-8">
              <div className="cell-span-8">対戦相手</div>
              <div className="cell-8">スコア</div>
            </div>
            {(prelims.length > 0 ? prelims : results).map((r, idx) => (
              <div className="row row-9" key={`pre-${idx}`}>
                <div className="sub-row">
                  <div className="sub-cell-9-1">第{r.position ?? (idx+1)}試合</div>
                  <div className="sub-cell-9-2">{nameOf(r)}</div>
                  <div className="sub-cell-9-3">{fmtScore(r)}</div>
                </div>
                <div className="cell-9">{fmtOutcome(r)}</div>
              </div>
            ))}
          </div>
        </div>

        <Footer currentPage="schedule" />
      </div>
    </div>
  );
};
