import React, { useEffect, useState } from "react";
import "./HeaderTabs.css";

export const HeaderTabs = ({ onTabChange, activeTab = 'following' }) => {
  const [topPosition, setTopPosition] = useState(80);

  useEffect(() => {
    const updatePosition = () => {
      const headerContent = document.querySelector('.header-content-outer');
      if (headerContent) {
        const headerHeight = headerContent.offsetHeight;
        console.log('HeaderTabs - headerHeight:', headerHeight);
        setTopPosition(headerHeight);
      } else {
        console.log('HeaderTabs - header-content-outer not found');
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

  console.log('HeaderTabs - current topPosition:', topPosition);

  return (
    <div className="header-tabs-outer" style={{ top: `${topPosition}px` }}>
      <div className="header-tabs-tabs">
        <div className="tabs-container">
          <div 
            className={`text-wrapper-61 ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('following')}
            style={{ cursor: 'pointer' }}
          >
            フォロー中
          </div>
          <div 
            className={`text-wrapper-62 ${activeTab === 'recommend' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('recommend')}
            style={{ cursor: 'pointer' }}
          >
            おすすめ
          </div>
        </div>
      </div>
    </div>
  );
}; 