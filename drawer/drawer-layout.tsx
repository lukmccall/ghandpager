import * as React from 'react';
import { I18nManager, Platform, useWindowDimensions } from 'react-native';

import { Drawer } from './drawer';
import { DrawerProps } from './drawer.d';

export function DrawerLayout({
  drawerPosition = I18nManager.getConstants().isRTL ? 'right' : 'left',
  swipeEnabled = Platform.OS !== 'web',
  drawerWidth,
  ...rest
}: DrawerProps) {
  const windowDimensions = useWindowDimensions();
  const layout = windowDimensions;

  return (
    <Drawer
      {...rest}
      layout={layout}
      drawerPosition={drawerPosition}
      drawerWidth={drawerWidth ?? layout.width}
      swipeEnabled={swipeEnabled}
    />
  );
}
