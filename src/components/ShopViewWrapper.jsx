// src/components/ShopViewWrapper.jsx
import React, { memo } from 'react';
import { ShopView } from './ShopView';

export const ShopViewWrapper = memo((props) => {
  console.log('🛍️ ShopView renderizado (memoizado)');
  return <ShopView {...props} />;
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.coins === nextProps.coins &&
    prevProps.nativeTokenBalance === nextProps.nativeTokenBalance &&
    prevProps.activeSkin === nextProps.activeSkin &&
    prevProps.tokenPrice === nextProps.tokenPrice &&
    JSON.stringify(prevProps.ownedItems) === JSON.stringify(nextProps.ownedItems)
  );
});