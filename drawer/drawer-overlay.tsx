import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { View } from "react-native";

const AnimatedView = Animated.createAnimatedComponent(View);

type OverlayProps = {
  progress: SharedValue<number>;
  onPress: () => void;
  accessibilityLabel?: string;
};

const PROGRESS_EPSILON = 0.05;

export function DrawerOverlay({
  progress,
  onPress,
  accessibilityLabel = "Close drawer",
}: OverlayProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      // We don't want the user to be able to press through the overlay when drawer is open
      // We can send the overlay behind the screen to avoid it
      zIndex: progress.value > PROGRESS_EPSILON ? 0 : -1,
    };
  });

  const animatedProps = useAnimatedProps(() => {
    const active = progress.value > PROGRESS_EPSILON;

    return {
      pointerEvents: active ? "auto" : "none",
      accessibilityElementsHidden: !active,
      importantForAccessibility: active ? "auto" : "no-hide-descendants",
    } as const;
  });

  return (
    <AnimatedView
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
        },
        animatedStyle,
      ]}
      animatedProps={animatedProps}
    >
      <View
        onPress={onPress}
        flex={1}
        pointerEvents="auto"
        role="button"
        arial-label={accessibilityLabel}
      />
    </AnimatedView>
  );
}
