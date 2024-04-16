import React from 'react';

export type DrawerProps = {
  /**
   * Whether the drawer is open or not.
   */
  open: boolean;

  /**
   * Callback which is called when the drawer is opened.
   */
  onOpen: () => void;

  /**
   * Callback which is called when the drawer is closed.
   */
  onClose: () => void;

  /**
   * Callback which is called when a gesture starts.
   */
  onGestureStart?: () => void;

  /**
   * Callback which is called when a gesture is cancelled.
   */
  onGestureCancel?: () => void;

  /**
   * Callback which is called when a gesture ends.
   */
  onGestureEnd?: () => void;

  /**
   * Callback which is called when the opening/closing transition starts.
   */
  onTransitionStart?: (closing: boolean) => void;

  /**
   * Callback which is called when the opening/closing transition ends.
   */
  onTransitionEnd?: (closing: boolean) => void;

  /**
   * Callback which returns a react element to render as the content of the drawer.
   */
  renderDrawerContent: () => React.ReactNode;

  /**
   * Object containing the layout of the container.
   * Defaults to the dimensions of the application's window.
   */
  layout?: { width: number; height: number };

  /**
   * Position of the drawer on the screen.
   * Defaults to `right` in RTL mode, otherwise `left`.
   */
  drawerPosition?: 'left' | 'right';

  /**
   * Accessibility label for the overlay. This is read by the screen reader when the user taps the overlay.
   * Defaults to "Close drawer".
   */
  overlayAccessibilityLabel?: string;

  /**
   * Whether the keyboard should be dismissed when the swipe gesture begins.
   * Defaults to `'on-drag'`. Set to `'none'` to disable keyboard handling.
   */
  keyboardDismissMode?: 'none' | 'on-drag';

  /**
   * Whether you can use swipe gestures to open or close the drawer.
   * Defaults to `true`.
   * This is not supported on Web.
   */
  swipeEnabled?: boolean;

  /**
   * How far from the edge of the screen the swipe gesture should activate.
   * Defaults to `32`.
   * This is not supported on Web.
   */
  swipeEdgeWidth?: number;

  /**
   * Minimum swipe distance that should activate opening the drawer.
   * Defaults to `60`.
   * This is not supported on Web.
   */
  swipeMinDistance?: number;

  /**
   * Minimum swipe velocity that should activate opening the drawer.
   * Defaults to `500`.
   * This is not supported on Web.
   */
  swipeMinVelocity?: number;

  /**
   * Content that the drawer should wrap.
   */
  children: React.ReactNode;

  drawerWidth?: number | `${string}%`;
};
