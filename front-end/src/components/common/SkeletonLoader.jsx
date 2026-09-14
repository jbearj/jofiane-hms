import React from 'react';
import './UiFeedback.css';

export function SkeletonBlock({ className = '', style = {}, ...props }) {
  return <span aria-hidden="true" className={`ui-skeleton ${className}`.trim()} style={style} {...props} />;
}

export function PageSkeleton({ rows = 5 }) {
  return (
    <div className="ui-page-skeleton" role="status" aria-label="Loading content">
      <SkeletonBlock className="ui-page-skeleton__heading" />
      <SkeletonBlock className="ui-page-skeleton__subheading" />
      <div className="ui-page-skeleton__grid">
        {Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="ui-page-skeleton__kpi" />)}
      </div>
      <SkeletonBlock className="ui-page-skeleton__table" style={{ height: Math.max(180, rows * 42) }} />
    </div>
  );
}

export default SkeletonBlock;
