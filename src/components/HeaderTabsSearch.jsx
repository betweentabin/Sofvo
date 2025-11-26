import React, { useEffect, useState } from "react";
import "./HeaderTabsSearch.css";

export const HeaderTabsSearch = ({ onTabChange, activeTab = 'team' }) => {
  const [topPosition, setTopPosition] = useState(80);

  useEffect(() => {
    const updatePosition = () => {
      const headerContent = document.querySelector('.header-content-outer');
      if (headerContent) {
        const headerHeight = headerContent.offsetHeight;
        console.log('HeaderTabsSearch - headerHeight:', headerHeight);
        setTopPosition(headerHeight);
      } else {
        console.log('HeaderTabsSearch - header-content-outer not found');
      }
    };

    // 少し遅延させてDOMが完全に読み込まれてから実行
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  console.log('HeaderTabsSearch - current topPosition:', topPosition);

  return (
    <div className="header-tabs-search-outer" style={{ top: `${topPosition}px` }}>
      <div className="header-tabs-search-tabs">
        <div className="tabs-container">
          <div 
            className={`text-wrapper-61 ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('team')}
            style={{ cursor: 'pointer' }}
          >
            チーム参加
          </div>
          <div
            className={`text-wrapper-62 ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('individual')}
            style={{ cursor: 'pointer' }}
          >
            メンバー募集
          </div>
        </div>
      </div>
    </div>
  );
}; 