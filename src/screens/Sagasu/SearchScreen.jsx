import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { HeaderTabsSearch } from "../../components/HeaderTabsSearch";
import { Footer } from "../../components/Footer";
// Supabase removed: Railway-only
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const SearchScreen = () => {
  const { user } = useAuth();
  const USE_RAILWAY = true;
  const RUNTIME = typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {};
  const RAILWAY_TEST_USER = RUNTIME.testUserId || import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'individual'
  const mainContentTop = useHeaderOffset();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    yearMonth: '',
    area: '',
    type: '',
    followingOnly: false
  });

  // ランタイム設定から選択肢を供給（なければ既存固定のまま）
  const areaOptions = Array.isArray(RUNTIME.searchAreas) && RUNTIME.searchAreas.length
    ? RUNTIME.searchAreas
    : ['静岡県', '東京都', '大阪府'];
  const typeOptions = Array.isArray(RUNTIME.searchTypes) && RUNTIME.searchTypes.length
    ? RUNTIME.searchTypes
    : ['レディース', 'メンズ', '混合', 'スポレク'];
  const yearMonthOptions = (() => {
    const now = new Date();
    const list = ['']; // '' = 全て
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push(`${d.getFullYear()}年${d.getMonth()+1}月`);
    }
    return list;
  })();

  // Search tournaments
  const searchTournaments = async () => {
    setLoading(true);
    try {
      const asUserId = RAILWAY_TEST_USER || user?.id || null;
      const { data } = await api.railwayTournaments.search({
        status: 'upcoming',
        area: filters.area || '',
        type: filters.type || '',
        followingOnly: filters.followingOnly ? 'true' : 'false',
        as_user: asUserId,
        limit: 50,
      });
      setTournaments(data || []);
    } catch (error) {
      console.error('Error searching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  
  // Load tournaments on mount and when filters/tab change
  useEffect(() => {
    searchTournaments();
  }, [activeTab, filters.area, filters.type, filters.followingOnly, filters.yearMonth]);

  console.log('SearchScreen - current mainContentTop:', mainContentTop);

  return (
    <div className="search-screen">
      <HeaderContent />
      <HeaderTabsSearch onTabChange={setActiveTab} activeTab={activeTab} />
      
      {/* 本文セクション - ヘッダーとフッターの間 */}
      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        {activeTab === 'team' ? (


          // チーム参加の内容
          <div className="team-content">
            <div className="frame-21">
              <div className="frame-22">
                <div className="frame-23">
                  <div className="magnifying-glass-wrapper">
                    <div className="magnifying-glass">
                      <img className="search-icon" alt="検索" src="/img/検索黒.png" />
                    </div>
                  </div>
                  <div className="text-wrapper-39">大会を検索（チーム参加）</div>
                </div>

                <div className="frame-24">
                  <div className="frame-box1">
                    <label className="dropdown-label" htmlFor="select-year-month">年月</label>
                    <select 
                      id="select-year-month" 
                      className="custom-select"
                      value={filters.yearMonth}
                      onChange={(e) => setFilters({...filters, yearMonth: e.target.value})}
                    >
                      {yearMonthOptions.map((ym, idx) => (
                        <option key={idx} value={ym}>{ym || '全て'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="frame-box2">
                    <label className="dropdown-label" htmlFor="select-area">地域</label>
                    <select 
                      id="select-area" 
                      className="custom-select"
                      value={filters.area}
                      onChange={(e) => setFilters({...filters, area: e.target.value})}
                    >
                      <option value="">全て</option>
                      {areaOptions.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="frame-box3">
                    <label className="dropdown-label" htmlFor="select-type">種別</label>
                    <select 
                      id="select-type" 
                      className="custom-select"
                      value={filters.type}
                      onChange={(e) => setFilters({...filters, type: e.target.value})}
                    >
                      <option value="">全て</option>
                      {typeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>


                <div className="frame-29">
                  <input 
                    type="checkbox" 
                    id="follow-checkbox" 
                    className="rectangle-3"
                    checked={filters.followingOnly}
                    onChange={(e) => setFilters({...filters, followingOnly: e.target.checked})}
                  />
                  <label htmlFor="follow-checkbox" className="text-wrapper-42">フォロー中</label>
                </div>


                <div className="frame-30" onClick={searchTournaments} style={{ cursor: 'pointer' }}>
                  <div className="text-wrapper-43">{loading ? '検索中...' : '検索'}</div>
                </div>
              </div>
            </div>


            {/* チーム参加の大会一覧 */}
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>検索中...</div>
            ) : tournaments.length > 0 ? (
              tournaments.map((tournament) => {
                const participantCount = tournament.tournament_participants?.[0]?.count || 0;
                const remainingSlots = (tournament.max_participants || 0) - participantCount;
                const isDeadlinePassed = tournament.registration_deadline && new Date(tournament.registration_deadline) < new Date();
                
                return (
                  <div className="frame-31" key={tournament.id}>
                    <div className="frame-32">
                      <div className="frame-33">
                        <div className="text-wrapper-39">{tournament.name}</div>
                        <div className="frame-34">
                          {tournament.sport_type && (
                            <div className="frame-35">
                              <div className="text-wrapper-44">{tournament.sport_type}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="frame-36">
                        <div className="text-wrapper-45">
                          開催日時：{tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ja-JP') : '未定'}
                        </div>
                        <div className="text-wrapper-45">開催地：{tournament.location || '未定'}</div>

                        <div className="frame-37">
                          <select className="select-genre">
                            <option>{tournament.sport_type || 'スポーツ'}</option>
                          </select>
                          <img className="vector-5" src="/img/vector-1.svg" alt="▼" />
                        </div>

                        <div className="text-wrapper-45">募集枠：{tournament.max_participants || '無制限'}チーム</div>
                        <div className="text-wrapper-45">
                          募集期限：{tournament.registration_deadline ? new Date(tournament.registration_deadline).toLocaleDateString('ja-JP') : '未定'}
                        </div>
                        <div className="text-wrapper-45">
                          主催者：{tournament.organizer?.display_name || tournament.organizer?.username || 'アカウント名'}
                        </div>
                      </div>

                      <div className="text-wrapper-46">
                        {isDeadlinePassed ? '募集終了' : remainingSlots > 0 ? `残り枠：${remainingSlots}チーム` : '満員'}
                      </div>

                      <div className="frame-33">
                        <Link to={`/tournament-detail/${tournament.id}`} className="frame-38">
                          <div className="text-wrapper-43">大会概要</div>
                        </Link>
                        <div className="frame-39">
                          <div className="heart">
                            <img className="vector-6" alt="Vector" src="/img/vector-7.svg" />
                          </div>
                          <div className="text-wrapper-47">0 いいね</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                該当する大会が見つかりませんでした
              </div>
            )}
          </div>
        ) : (

          
          // 個人参加の内容
          <div className="individual-content">
            <div className="frame-21">
              <div className="frame-22">
                <div className="frame-23">
                  <div className="magnifying-glass-wrapper">
                    <div className="magnifying-glass">
                      <img className="search-icon" alt="検索" src="/img/検索黒.png" />
                    </div>
                  </div>
                  <div className="text-wrapper-39">大会を検索（個人参加）</div>
                </div>

                <div className="frame-24">
                  <div className="frame-box1">
                    <label className="dropdown-label" htmlFor="select-year-month">年月</label>
                    <select 
                      id="select-year-month" 
                      className="custom-select"
                      value={filters.yearMonth}
                      onChange={(e) => setFilters({...filters, yearMonth: e.target.value})}
                    >
                      <option value="">全て</option>
                      <option value="2025年5月">2025年5月</option>
                      <option value="2025年6月">2025年6月</option>
                      <option value="2025年7月">2025年7月</option>
                    </select>
                  </div>

                  <div className="frame-box2">
                    <label className="dropdown-label" htmlFor="select-area">地域</label>
                    <select 
                      id="select-area" 
                      className="custom-select"
                      value={filters.area}
                      onChange={(e) => setFilters({...filters, area: e.target.value})}
                    >
                      <option value="">全て</option>
                      <option value="静岡県">静岡県</option>
                      <option value="東京都">東京都</option>
                      <option value="大阪府">大阪府</option>
                    </select>
                  </div>

                  <div className="frame-box3">
                    <label className="dropdown-label" htmlFor="select-type">種別</label>
                    <select 
                      id="select-type" 
                      className="custom-select"
                      value={filters.type}
                      onChange={(e) => setFilters({...filters, type: e.target.value})}
                    >
                      <option value="">全て</option>
                      <option value="レディース">レディース</option>
                      <option value="メンズ">メンズ</option>
                      <option value="混合">混合</option>
                      <option value="スポレク">スポレク</option>
                    </select>
                  </div>
                </div>


                <div className="frame-29">
                  <input 
                    type="checkbox" 
                    id="follow-checkbox" 
                    className="rectangle-3"
                    checked={filters.followingOnly}
                    onChange={(e) => setFilters({...filters, followingOnly: e.target.checked})}
                  />
                  <label htmlFor="follow-checkbox" className="text-wrapper-42">フォロー中</label>
                </div>


                <div className="frame-30" onClick={searchTournaments} style={{ cursor: 'pointer' }}>
                  <div className="text-wrapper-43">{loading ? '検索中...' : '検索'}</div>
                </div>
              </div>
            </div>

            {/* 個人参加の大会一覧（動的） */}
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>検索中...</div>
            ) : tournaments.length > 0 ? (
              tournaments.map((tournament) => {
                const individualCount = tournament.individual_count || 0;
                const max = tournament.capacity_individual || tournament.max_participants || 0;
                const remaining = Math.max(0, max - individualCount);
                const isDeadlinePassed = tournament.registration_deadline && new Date(tournament.registration_deadline) < new Date();
                return (
                  <div className="frame-31" key={tournament.id}>
                    <div className="frame-32">
                      <div className="frame-33">
                        <div className="text-wrapper-39">{tournament.name}</div>
                        <div className="frame-34">
                          {tournament.sport_type && (
                            <div className="frame-35">
                              <div className="text-wrapper-44">{tournament.sport_type}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="frame-36">
                        <div className="text-wrapper-45">開催日時：{tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ja-JP') : '未定'}</div>
                        <div className="text-wrapper-45">開催地：{tournament.location || '未定'}</div>
                        <div className="text-wrapper-45">募集人数：{max || '未設定'}</div>
                        <div className="text-wrapper-45">募集期限：{tournament.registration_deadline ? new Date(tournament.registration_deadline).toLocaleDateString('ja-JP') : '未定'}</div>
                        <div className="text-wrapper-45">主催者：{tournament.organizer_display_name || tournament.organizer_username || 'アカウント名'}</div>
                      </div>
                      <div className="text-wrapper-46">
                        {isDeadlinePassed ? '募集終了' : remaining > 0 ? `残り人数：${remaining}名` : '満員'}
                      </div>
                      <div className="frame-33">
                        <Link to={`/tournament-detail/${tournament.id}`} className="frame-38">
                          <div className="text-wrapper-43">大会概要</div>
                        </Link>
                        <div className="frame-39">
                          <div className="heart">
                            <img className="vector-6" alt="Vector" src="/img/vector-7.svg" />
                          </div>
                          <div className="text-wrapper-47">{tournament.like_count || 0} いいね</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>該当する大会が見つかりませんでした</div>
            )}
          </div>
        )}
      </div>

      <Footer currentPage="search" />
    </div>
  );
}; 
