import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { DrawerLayout } from "./drawer/drawer-layout";
import React from "react";
import {
  Gesture,
  GestureDetector,
  gestureHandlerRootHOC,
} from "react-native-gesture-handler";
import { useDrawerGestureHandlerRef } from "./drawer/drawer-context";
import Animated from "react-native-reanimated";
import PagerView from "react-native-pager-view";

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export function TabLayout() {
  const ref = useDrawerGestureHandlerRef();
  const gesture = Gesture.Native().blocksExternalGesture(ref);
  return (
    <GestureDetector gesture={gesture}>
      <AnimatedPagerView
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        initialPage={0}
      >
        <View
          key="1"
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>First page</Text>
        </View>
        <View
          key="2"
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>Second page</Text>
        </View>
      </AnimatedPagerView>
    </GestureDetector>
  );
}

function App() {
  const [open, setOpen] = React.useState(false);

  return (
    <DrawerLayout
      drawerPosition="left"
      swipeEdgeWidth={99999}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      renderDrawerContent={() => {
        return (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text>Drawer content</Text>
          </View>
        );
      }}
    >
      <View style={styles.container}>
        <TabLayout />
      </View>
    </DrawerLayout>
  );
}

export default gestureHandlerRootHOC(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
