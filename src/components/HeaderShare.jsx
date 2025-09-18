import React, { useEffect, useState } from "react";
import "./HeaderShare.css";

export const HeaderShare = ({
  filters = { yearMonth: 'all', region: 'all', category: 'all' },
  options = { yearMonths: [], regions: [], categories: [] },
  onFilterChange,
}) => {
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

  const handleSelectChange = (key) => (event) => {
    if (onFilterChange) {
      onFilterChange(key, event.target.value);
    }
  };

  const { yearMonths = [], regions = [], categories = [] } = options || {};

  return (
    <div className="header-share-outer" style={{ top: `${topPosition}px` }}>
      <div className="header-share-section">
        <div className="header-share-content">
          <img className="header-share-post-2" alt="Post" src="/img/post-5-1.png" />
          <div className="header-share-text-wrapper-63">気軽にみんなとシェアしよう</div>
        </div>
        {onFilterChange && (
          <div className="header-share-filters">
            <div className="header-share-filter-group">
              <label className="header-share-filter-label" htmlFor="filter-year-month">年月</label>
              <select
                id="filter-year-month"
                className="header-share-filter-select"
                value={filters.yearMonth}
                onChange={handleSelectChange('yearMonth')}
              >
                <option value="all">すべて</option>
                {yearMonths.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="header-share-filter-group">
              <label className="header-share-filter-label" htmlFor="filter-region">地域</label>
              <select
                id="filter-region"
                className="header-share-filter-select"
                value={filters.region}
                onChange={handleSelectChange('region')}
              >
                <option value="all">すべて</option>
                {regions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="header-share-filter-group">
              <label className="header-share-filter-label" htmlFor="filter-category">種別</label>
              <select
                id="filter-category"
                className="header-share-filter-select"
                value={filters.category}
                onChange={handleSelectChange('category')}
              >
                <option value="all">すべて</option>
                {categories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
