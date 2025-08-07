import React, { useEffect, useState } from "react";
import "./HeaderShare.css";

export const HeaderShare = () => {
  const [topPosition, setTopPosition] = useState(80);

  useEffect(() => {
    const updatePosition = () => {
      const headerTabs = document.querySelector('.header-tabs-outer');
      if (headerTabs) {
        const headerTabsRect = headerTabs.getBoundingClientRect();
        const headerTabsBottom = headerTabsRect.bottom;
        console.log('HeaderShare - headerTabsRect:', headerTabsRect);
        console.log('HeaderShare - headerTabsBottom:', headerTabsBottom);
        setTopPosition(headerTabsBottom);
      } else {
        console.log('HeaderShare - header-tabs-outer not found');
      }
    };

    // 少し遅延させてDOMが完全に読み込まれてから実行
    const timer = setTimeout(updatePosition, 200);
    
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  console.log('HeaderShare - current topPosition:', topPosition);

  return (
    <div className="header-share-outer" style={{ top: `${topPosition}px` }}>
      <div className="header-share-section">
        <div className="header-share-content">
          <img className="header-share-post-2" alt="Post" src="/img/post-5-1.png" />
          <div className="header-share-text-wrapper-63">気軽にみんなとシェアしよう</div>
        </div>
      </div>
    </div>
  );
}; 