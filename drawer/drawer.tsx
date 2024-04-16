import React from "react";
import {
  I18nManager,
  InteractionManager,
  Keyboard,
  Platform,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  State as GestureState,
  GestureType,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { View } from "react-native";
import useLatestCallback from "use-latest-callback";
import { DrawerContext } from "./drawer-context";
import { DrawerOverlay } from "./drawer-overlay";
import { DrawerProps } from "./drawer.d";

const SWIPE_MIN_OFFSET = 5;
const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MIN_VELOCITY = 500;

const minmax = (value: number, start: number, end: number) => {
  "worklet";

  return Math.min(Math.max(value, start), end);
};

const AnimatedView = Animated.createAnimatedComponent(View);

function normalizeDrawerWidth(
  drawerWidth: number | `${string}%`,
  layout: { width: number }
): number {
  if (typeof drawerWidth === "string") {
    // Try to calculate width if a percentage is given
    const percentage = Number(drawerWidth.replace(/%$/, ""));

    if (Number.isFinite(percentage)) {
      return layout.width * (percentage / 100);
    }
  }

  return typeof drawerWidth === "number" ? drawerWidth : 0;
}

export function Drawer({
  layout,
  drawerPosition,
  keyboardDismissMode = "on-drag",
  onClose,
  onOpen,
  onGestureStart,
  onGestureCancel,
  onGestureEnd,
  onTransitionStart,
  onTransitionEnd,
  open,
  overlayAccessibilityLabel,
  swipeEnabled = true,
  swipeEdgeWidth = 32,
  swipeMinDistance = SWIPE_MIN_DISTANCE,
  swipeMinVelocity = SWIPE_MIN_VELOCITY,
  renderDrawerContent,
  children,
  drawerWidth,
}: DrawerProps & {
  layout: NonNullable<DrawerProps["layout"]>;
  drawerWidth: NonNullable<DrawerProps["drawerWidth"]>;
}) {
  const normalizedDrawerWidth = normalizeDrawerWidth(drawerWidth, layout);

  const isOpen = open;
  const isRight = drawerPosition === "right";
  const translationXSign = isRight ? 1 : -1;

  const getDrawerTranslationX = React.useCallback(
    (open: boolean) => {
      "worklet";
      return open ? 0 : translationXSign * normalizedDrawerWidth;
    },
    [translationXSign, normalizedDrawerWidth]
  );

  const interactionHandleRef = React.useRef<number | null>(null);

  const startInteraction = React.useCallback(() => {
    interactionHandleRef.current = InteractionManager.createInteractionHandle();
  }, [interactionHandleRef]);

  const endInteraction = React.useCallback(() => {
    if (interactionHandleRef.current != null) {
      InteractionManager.clearInteractionHandle(interactionHandleRef.current);
      interactionHandleRef.current = null;
    }
  }, [interactionHandleRef]);

  const hideKeyboard = React.useCallback(() => {
    if (keyboardDismissMode === "on-drag") {
      Keyboard.dismiss();
    }
  }, [keyboardDismissMode]);

  const onGestureBegin = React.useCallback(() => {
    onGestureStart?.();
    startInteraction();
    hideKeyboard();
  }, [hideKeyboard, onGestureStart, startInteraction]);

  const onGestureFinish = React.useCallback(() => {
    onGestureEnd?.();
    endInteraction();
  }, [endInteraction, onGestureEnd]);

  const onGestureAbort = React.useCallback(() => {
    onGestureCancel?.();
    endInteraction();
  }, [endInteraction, onGestureCancel]);

  // FIXME: Currently hitSlop is broken when on Android when drawer is on right
  // https://github.com/software-mansion/react-native-gesture-handler/issues/569
  const hitSlop = React.useMemo(
    () =>
      isRight
        ? // Extend hitSlop to the side of the screen when drawer is closed
          // This lets the user drag the drawer from the side of the screen
          { right: 0, width: isOpen ? undefined : swipeEdgeWidth }
        : { left: 0, width: isOpen ? undefined : swipeEdgeWidth },
    [isRight, isOpen, swipeEdgeWidth]
  );

  const touchStartX = useSharedValue(0);
  const touchX = useSharedValue(0);
  const translationX = useSharedValue(getDrawerTranslationX(open));
  const gestureState = useSharedValue<GestureState>(GestureState.UNDETERMINED);

  const handleAnimationStart = useLatestCallback((open: boolean) => {
    onTransitionStart?.(!open);
  });

  const handleAnimationEnd = useLatestCallback(
    (open: boolean, finished?: boolean) => {
      if (!finished) return;
      onTransitionEnd?.(!open);
    }
  );

  const toggleDrawer = React.useCallback(
    (open: boolean, velocity?: number) => {
      "worklet";

      const translateX = getDrawerTranslationX(open);

      if (velocity === undefined) {
        runOnJS(handleAnimationStart)(open);
      }

      touchStartX.value = 0;
      touchX.value = 0;
      translationX.value = withSpring(
        translateX,
        {
          velocity,
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
        (finished) => runOnJS(handleAnimationEnd)(open, finished)
      );

      if (open) {
        runOnJS(onOpen)();
      } else {
        runOnJS(onClose)();
      }
    },
    [
      getDrawerTranslationX,
      handleAnimationEnd,
      handleAnimationStart,
      onClose,
      onOpen,
      touchStartX,
      touchX,
      translationX,
    ]
  );

  React.useEffect(() => toggleDrawer(open), [open, toggleDrawer]);

  const translateX = useDerivedValue(() => {
    // Comment stolen from react-native-gesture-handler/DrawerLayout
    //
    // While closing the drawer when user starts gesture outside of its area (in greyed
    // out part of the window), we want the drawer to follow only once finger reaches the
    // edge of the drawer.
    // E.g. on the diagram below drawer is illustrate by X signs and the greyed out area by
    // dots. The touch gesture starts at '*' and moves left, touch path is indicated by
    // an arrow pointing left
    // 1) +---------------+ 2) +---------------+ 3) +---------------+ 4) +---------------+
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|.<-*..|    |XXXXXXXX|<--*..|    |XXXXX|<-----*..|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    +---------------+    +---------------+    +---------------+    +---------------+
    //
    // For the above to work properly we define animated value that will keep start position
    // of the gesture. Then we use that value to calculate how much we need to subtract from
    // the translationX. If the gesture started on the greyed out area we take the distance from the
    // edge of the drawer to the start position. Otherwise we don't subtract at all and the
    // drawer be pulled back as soon as you start the pan.
    //
    // This is used only when drawerType is "front"
    const touchDistance =
      gestureState.value === GestureState.ACTIVE
        ? minmax(
            drawerPosition === "left"
              ? touchStartX.value - normalizedDrawerWidth
              : layout.width - normalizedDrawerWidth - touchStartX.value,
            0,
            layout.width
          )
        : 0;

    const translateX =
      drawerPosition === "left"
        ? minmax(translationX.value + touchDistance, -normalizedDrawerWidth, 0)
        : minmax(translationX.value - touchDistance, 0, normalizedDrawerWidth);

    return translateX;
  });

  const isRTL = I18nManager.getConstants().isRTL;
  const drawerAnimatedStyle = useAnimatedStyle(() => {
    const distanceFromEdge = layout.width - normalizedDrawerWidth;

    return {
      transform: [
        {
          translateX:
            translateX.value +
            (drawerPosition === "left"
              ? isRTL
                ? -distanceFromEdge
                : 0
              : isRTL
              ? 0
              : distanceFromEdge),
        },
      ],
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: 0,
        },
      ],
    };
  });

  const progress = useDerivedValue(() => {
    return interpolate(
      translateX.value,
      [getDrawerTranslationX(false), getDrawerTranslationX(true)],
      [0, 1]
    );
  });

  const startX = useSharedValue(0);
  const panGestureRef = React.useRef<GestureType | undefined>(undefined);

  const panGesture = React.useMemo(() => {
    return Gesture.Pan()
      .withRef(panGestureRef)
      .activeOffsetX([-SWIPE_MIN_OFFSET, SWIPE_MIN_OFFSET])
      .failOffsetY([-SWIPE_MIN_OFFSET, SWIPE_MIN_OFFSET])
      .hitSlop(hitSlop)
      .enabled(swipeEnabled)
      .minDistance(swipeMinDistance)
      .minVelocity(swipeMinVelocity)
      .onBegin((event) => {
        startX.value = translateX.value;
        gestureState.value = event.state;
        touchStartX.value = event.x;
      })
      .onTouchesCancelled(() => {
        runOnJS(onGestureAbort)();
      })
      .onStart(() => {
        runOnJS(onGestureBegin)();
      })
      .onUpdate((event) => {
        if (event.state !== GestureState.ACTIVE) {
          return;
        }

        touchX.value = event.x;
        translationX.value = startX.value + event.translationX;
        gestureState.value = event.state;
      })
      .onEnd((event) => {
        gestureState.value = event.state;
        const nextOpen =
          (Math.abs(event.translationX) > SWIPE_MIN_OFFSET &&
            Math.abs(event.translationX) > swipeMinVelocity) ||
          Math.abs(event.translationX) > swipeMinDistance
            ? drawerPosition === "left"
              ? // If swiped to right, open the drawer, otherwise close it
                (event.velocityX === 0 ? event.translationX : event.velocityX) >
                0
              : // If swiped to left, open the drawer, otherwise close it
                (event.velocityX === 0 ? event.translationX : event.velocityX) <
                0
            : open;
        toggleDrawer(nextOpen, event.velocityX);
      })
      .onFinalize(() => {
        runOnJS(onGestureFinish)();
      });
  }, [
    drawerPosition,
    gestureState,
    hitSlop,
    onGestureAbort,
    onGestureBegin,
    onGestureFinish,
    open,
    startX,
    swipeEnabled,
    swipeMinDistance,
    swipeMinVelocity,
    toggleDrawer,
    touchStartX,
    touchX,
    translateX,
    translationX,
  ]);

  const context = React.useMemo(
    () => ({
      progress,
      gestureHandlerRef: panGestureRef,
    }),
    [progress]
  );
  return (
    <DrawerContext.Provider value={context}>
      <GestureDetector gesture={panGesture}>
        {/* Immediate child of gesture handler needs to be an Animated.View */}
        <AnimatedView
          style={[
            {
              overflow: "hidden",
              flexDirection: "row",
              flex: 1,
            },
          ]}
        >
          <AnimatedView style={[contentAnimatedStyle, { flex: 1 }]}>
            <View
              style={{ flex: 1 }}
              aria-hidden={isOpen}
              importantForAccessibility={
                isOpen ? "no-hide-descendants" : "auto"
              }
            >
              {children}
            </View>

            <DrawerOverlay
              progress={progress}
              onPress={() => toggleDrawer(false)}
              accessibilityLabel={overlayAccessibilityLabel}
            />
          </AnimatedView>
          <AnimatedView
            removeClippedSubviews={Platform.OS !== "ios"}
            style={[
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                maxWidth: "100%",
                zIndex: 0,
                width: normalizedDrawerWidth,
                backgroundColor: "white",
              },
              drawerAnimatedStyle,
            ]}
          >
            {renderDrawerContent()}
          </AnimatedView>
        </AnimatedView>
      </GestureDetector>
    </DrawerContext.Provider>
  );
}
