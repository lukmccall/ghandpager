import React, { RefObject } from 'react';
import { GestureType } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

type DrawerContextType = {
  progress?: Readonly<SharedValue<number>>;
  gestureHandlerRef?: RefObject<GestureType | undefined>;
};

export const DrawerContext = React.createContext<DrawerContextType>({
  progress: undefined,
  gestureHandlerRef: undefined,
});

export function useDrawerGestureHandlerRef(): RefObject<GestureType | undefined> {
  const { gestureHandlerRef } = React.useContext(DrawerContext);
  return gestureHandlerRef!;
}
