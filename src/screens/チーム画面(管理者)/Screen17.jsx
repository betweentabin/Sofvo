import React, { useState, useEffect } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import "./style.css";

export const Screen17 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mainContentTop = useHeaderOffset();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  
  // チームデータを取得
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user) return;

      try {
        // ユーザーが作成したチームを取得
        const { data: teams, error } = await supabase
          .from('teams')
          .select(`
            *,
            team_members!inner(
              user_id,
              role
            )
          `)
          .eq('team_members.user_id', user.id)
          .eq('team_members.role', 'owner')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('チームデータ取得エラー:', error);
          return;
        }

        if (teams && teams.length > 0) {
          setTeamData(teams[0]);
        }
      } catch (error) {
        console.error('チームデータ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user]);

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
                    <div className="text-wrapper-301">静岡市</div>
                  </div>
                  <Link to="/team-management" className="frame-607">
                    <div className="text-wrapper-302">管理画面</div>
                  </Link>
                </div>
                <div className="frame-608">
                  <div className="frame-609">
                    <div className="text-wrapper-303-1">00 ポイント(一年間)</div>
                    <div className="text-wrapper-303-2">00 ポイント（通算）</div>
                  </div>
                  <div className="frame-610">
                    <div className="text-wrapper-303-3">00 フォロー</div>
                    <div className="text-wrapper-303-4">00 フォロワー</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-wrapper-304">
              {loading ? 'ローディング中...' : teamData?.description || '自己紹介が設定されていません'}
            </div>
            <div className="frame-611">
              <div className="frame-612">
                <div className="text-wrapper-305-1">所属メンバー：1人</div>
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
              <div className="text-wrapper-307-1">大会名：第15回 〇〇カップ</div>
              <div className="text-wrapper-307-2">開催日時：2025年5月18日（日）</div>
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
          <div className="frame-626">
            <div className="frame-627">
              <div className="text-wrapper-311-1">大会名：第15回 〇〇カップ</div>
              <div className="text-wrapper-311-2">開催日時：2025年5月18日（日）</div>
            </div>
            <div className="frame-628">
              <div className="frame-629">
                <Link to="/tournament-result-team" className="frame-38">
                  <div className="text-wrapper-312">大会概要</div>
                </Link>
              </div>
            </div>
          </div>
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
