import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { HeaderTabsSearch } from "../../components/HeaderTabsSearch";
import { Footer } from "../../components/Footer";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import "./style.css";

export const SearchScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'individual'
  const mainContentTop = useHeaderOffset();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    yearMonth: '2025年5月',
    day: '',
    area: '',
    followingOnly: false
  });

  // Search tournaments
  const searchTournaments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tournaments')
        .select(`
          *,
          organizer:organizer_id(username, display_name),
          tournament_participants(count)
        `)
        .eq('status', 'upcoming')
        .order('start_date', { ascending: true });

      // Apply filters
      if (filters.area) {
        query = query.ilike('location', `%${filters.area}%`);
      }

      // Filter by following if checked
      if (filters.followingOnly && user) {
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (following && following.length > 0) {
          const followingIds = following.map(f => f.following_id);
          query = query.in('organizer_id', followingIds);
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error searching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  
  // Load tournaments on mount
  useEffect(() => {
    searchTournaments();
  }, []);

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
                      <option value="">全て</option>
                      <option value="2025年5月">2025年5月</option>
                      <option value="2025年6月">2025年6月</option>
                      <option value="2025年7月">2025年7月</option>
                    </select>
                  </div>

                  <div className="frame-box2">
                    <label className="dropdown-label" htmlFor="select-day">日</label>
                    <select 
                      id="select-day" 
                      className="custom-select"
                      value={filters.day}
                      onChange={(e) => setFilters({...filters, day: e.target.value})}
                    >
                      <option value="">全て</option>
                      <option value="18">18日</option>
                      <option value="19">19日</option>
                      <option value="20">20日</option>
                    </select>
                  </div>

                  <div className="frame-box3">
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
                    <label className="dropdown-label" htmlFor="select-day">日</label>
                    <select 
                      id="select-day" 
                      className="custom-select"
                      value={filters.day}
                      onChange={(e) => setFilters({...filters, day: e.target.value})}
                    >
                      <option value="">全て</option>
                      <option value="18">18日</option>
                      <option value="19">19日</option>
                      <option value="20">20日</option>
                    </select>
                  </div>

                  <div className="frame-box3">
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

            {/* 個人参加の大会一覧 */}
            <div className="frame-31">
              <div className="frame-32">
                <div className="frame-33">
                  <div className="frame-77">
                    <div className="frame-78" />
                    <div className="text-wrapper-39">アカウント名</div>
                  </div>
                  <div className="frame-34">
                    <div className="frame-35">
                      <div className="text-wrapper-44">混合</div>
                    </div>
                    <div className="frame-35">
                      <div className="text-wrapper-44">メンズ</div>
                    </div>
                  </div>
                </div>

                <div className="frame-36">
                  <div className="text-wrapper-45">大会名：第15回 〇〇カップ</div>
                  <div className="text-wrapper-45">開催日時：2025年5月18日（日）</div>
                  <div className="text-wrapper-45">開催地：静岡県掛川市</div>

                  <div className="frame-37">
                    <select className="select-genre">
                      <option>混合 スポレク</option>
                      <option>男子</option>
                      <option>女子</option>
                      <option>ミックス</option>
                    </select>
                    <img className="vector-5" src="/img/vector-1.svg" alt="▼" />
                  </div>

                  <div className="text-wrapper-45">募集枠：10チーム</div>
                  <div className="text-wrapper-45">募集期限：2025年5月4日 (日)</div>
                  <div className="text-wrapper-45">主催者：アカウント名</div>
                </div>

                <div className="text-wrapper-46">残り人数：1名 → 募集終了</div>

                <div className="frame-33">
                  <div className="frame-38">
                    <div className="text-wrapper-43">大会概要</div>
                  </div>
                  <div className="frame-39">
                    <div className="heart">
                      <img className="vector-6" alt="Vector" src="/img/vector-7.svg" />
                    </div>
                    <div className="text-wrapper-47">10 いいね</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer currentPage="search" />
    </div>
  );
}; 