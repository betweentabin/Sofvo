import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { HeaderTabsSearch } from "../../components/HeaderTabsSearch";
import { Footer } from "../../components/Footer";
import "./style.css";

export const SearchScreen = () => {
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'individual'
  const [mainContentTop, setMainContentTop] = useState(201);

  useEffect(() => {
    const updateMainContentPosition = () => {
      const headerTabsSearch = document.querySelector('.header-tabs-search-outer');
      if (headerTabsSearch) {
        const headerTabsSearchRect = headerTabsSearch.getBoundingClientRect();
        const headerTabsSearchBottom = headerTabsSearchRect.bottom;
        console.log('SearchScreen - headerTabsSearchRect:', headerTabsSearchRect);
        console.log('SearchScreen - headerTabsSearchBottom:', headerTabsSearchBottom);
        setMainContentTop(headerTabsSearchBottom);
      } else {
        console.log('SearchScreen - header-tabs-search-outer not found');
      }
    };

    // 少し遅延させてDOMが完全に読み込まれてから実行
    const timer = setTimeout(updateMainContentPosition, 200);
    window.addEventListener('resize', updateMainContentPosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateMainContentPosition);
    };
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
                      <img className="search-icon" alt="検索" src="/images/300ppi/検索黒.png" />
                    </div>
                  </div>
                  <div className="text-wrapper-39">大会を検索（チーム参加）</div>
                </div>

                <div className="frame-24">
                  <div className="frame-box1">
                    <label className="dropdown-label" htmlFor="select-year-month">年月</label>
                    <select id="select-year-month" className="custom-select">
                      <option>2025年5月</option>
                      <option>2025年6月</option>
                      <option>2025年7月</option>
                    </select>
                  </div>

                  <div className="frame-box2">
                    <label className="dropdown-label" htmlFor="select-day">日</label>
                    <select id="select-day" className="custom-select">
                      <option>18日</option>
                      <option>19日</option>
                      <option>20日</option>
                    </select>
                  </div>

                  <div className="frame-box3">
                    <label className="dropdown-label" htmlFor="select-area">地域</label>
                    <select id="select-area" className="custom-select">
                      <option>静岡県</option>
                      <option>東京都</option>
                      <option>大阪府</option>
                    </select>
                  </div>
                </div>


                <div className="frame-29">
                  <input type="checkbox" id="follow-checkbox" className="rectangle-3" />
                  <label htmlFor="follow-checkbox" className="text-wrapper-42">フォロー中</label>
                </div>


                <div className="frame-30">
                  <div className="text-wrapper-43">検索</div>
                </div>
              </div>
            </div>


            {/* チーム参加の大会一覧 */}
            <div className="frame-31">
              <div className="frame-32">
                <div className="frame-33">
                  <div className="text-wrapper-39">第15回 〇〇カップ</div>
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

                <div className="text-wrapper-46">残り枠：2チーム → 募集終了</div>

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
        ) : (

          
          // 個人参加の内容
          <div className="individual-content">
            <div className="frame-21">
              <div className="frame-22">
                <div className="frame-23">
                  <div className="magnifying-glass-wrapper">
                    <div className="magnifying-glass">
                      <img className="search-icon" alt="検索" src="/images/300ppi/検索黒.png" />
                    </div>
                  </div>
                  <div className="text-wrapper-39">大会を検索（個人参加）</div>
                </div>

                <div className="frame-24">
                  <div className="frame-box1">
                    <label className="dropdown-label" htmlFor="select-year-month">年月</label>
                    <select id="select-year-month" className="custom-select">
                      <option>2025年5月</option>
                      <option>2025年6月</option>
                      <option>2025年7月</option>
                    </select>
                  </div>

                  <div className="frame-box2">
                    <label className="dropdown-label" htmlFor="select-day">日</label>
                    <select id="select-day" className="custom-select">
                      <option>18日</option>
                      <option>19日</option>
                      <option>20日</option>
                    </select>
                  </div>

                  <div className="frame-box3">
                    <label className="dropdown-label" htmlFor="select-area">地域</label>
                    <select id="select-area" className="custom-select">
                      <option>静岡県</option>
                      <option>東京都</option>
                      <option>大阪府</option>
                    </select>
                  </div>
                </div>


                <div className="frame-29">
                  <input type="checkbox" id="follow-checkbox" className="rectangle-3" />
                  <label htmlFor="follow-checkbox" className="text-wrapper-42">フォロー中</label>
                </div>


                <div className="frame-30">
                  <div className="text-wrapper-43">検索</div>
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