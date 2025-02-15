import React, { useEffect } from 'react';
import {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { widthPercentageToDP } from 'react-native-responsive-screen';

export interface TileProps {
  /** Styles of the default tile */
  style: ViewStyle;
  /** The React Native Reanimated transform style with translateX */
  transform: ViewStyle['transform'];
  /** The full width of tile */
  width: number;
}

export interface Segment {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}

export interface SegmentedControlProps {
  /**
   * An array of Segments. Can be a mix of strings for the Segment labels, or an object with a `label` and accessibility props.
   */
  segments: Array<string | Segment>;
  /**
   * The Current Active Segment Index
   */
  currentIndex: number;
  /**
   * A callback onPress of a Segment
   */
  onChange: (index: number) => void;
  /**
   * An array of Badge Values corresponding to the Segment
   */
  badgeValues?: Array<number | null>;
  /**
   * Is right-to-left mode.
   */
  isRTL?: boolean;
  /**
   * The container margin for the segmented control
   * Used to calculate the width of Segmented Control
   */
  containerMargin?: number;
  /**
   * Active Segment Text Style
   */
  activeTextStyle?: TextStyle;
  /**
   * InActive Segment Text Style
   */
  inactiveTextStyle?: TextStyle;
  /**
   * Segment Container Styles
   */
  segmentedControlWrapper?: ViewStyle;
  /**
   * Pressable Container Styles
   */
  pressableWrapper?: ViewStyle;
  /**
   * The moving Tile Container Styles
   */
  tileStyle?: ViewStyle;
  /**
   * Active Badge Styles
   */
  activeBadgeStyle?: ViewStyle;
  /**
   * Inactive Badge Styles
   */
  inactiveBadgeStyle?: ViewStyle;
  /**
   * Badge Text Styles
   */
  badgeTextStyle?: TextStyle;
  /**
   * Render a custom tile component
   */
  renderTile?: (props: TileProps) => React.ReactNode;
}

const defaultShadowStyle = {
  shadowColor: '#000',
  shadowOffset: {
    width: 1,
    height: 1,
  },
  shadowOpacity: 0.025,
  shadowRadius: 1,

  elevation: 1,
};

const DEFAULT_SPRING_CONFIG = {
  stiffness: 150,
  damping: 20,
  mass: 1,
  overshootClamping: false,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
};

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  currentIndex,
  onChange,
  badgeValues = [],
  isRTL = false,
  containerMargin = 0,
  activeTextStyle,
  inactiveTextStyle,
  segmentedControlWrapper,
  pressableWrapper,
  tileStyle,
  activeBadgeStyle,
  inactiveBadgeStyle,
  badgeTextStyle,
  renderTile,
}: SegmentedControlProps) => {
  const width = widthPercentageToDP('100%') - containerMargin * 2;
  const translateValue = width / segments.length;
  const tabTranslateValue = useSharedValue(0);

  // Transform and memoize all segments into a `Segment` array.
  // This allows for the segments to be transformed only when they change, and to be treated as `Segment` on render.
  const memoizedSegments = React.useMemo<Segment[]>(() => {
    return segments.map((segment) =>
      typeof segment === 'string' ? { label: segment } : segment
    );
  }, [segments]);

  // useCallBack with an empty array as input, which will call inner lambda only once and memoize the reference for future calls
  const memoizedTabPressCallback = React.useCallback(
    (index) => {
      onChange(index);
    },
    [onChange]
  );
  useEffect(() => {
    // If phone is set to RTL, make sure the animation does the correct transition.
    const transitionMultiplier = isRTL ? -1 : 1;
    tabTranslateValue.value = withSpring(
      currentIndex * (translateValue * transitionMultiplier),
      DEFAULT_SPRING_CONFIG
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const tabTranslateAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabTranslateValue.value }],
    };
  });

  const finalisedActiveTextStyle: TextStyle = {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    ...activeTextStyle,
  };

  const finalisedInActiveTextStyle: TextStyle = {
    fontSize: 15,
    textAlign: 'center',
    color: '#4b5563',
    ...inactiveTextStyle,
  };

  const finalisedActiveBadgeStyle: ViewStyle = {
    backgroundColor: '#27272a',
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...activeBadgeStyle,
  };

  const finalisedInActiveBadgeStyle: ViewStyle = {
    backgroundColor: '#6b7280',
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...inactiveBadgeStyle,
  };

  const finalisedBadgeTextStyle: TextStyle = {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: '#FFFFFF',
    ...badgeTextStyle,
  };

  const flattenedTileStyle: ViewStyle = StyleSheet.flatten<ViewStyle>([
    styles.movingSegmentStyle,
    defaultShadowStyle,
    StyleSheet.absoluteFill,
    {
      width: width / segments.length - 4,
    },
    tileStyle,
  ]);

  const memoizedTile = React.useMemo<React.ReactNode>(() => {
    if (renderTile) {
      return renderTile({
        style: flattenedTileStyle,
        transform: tabTranslateAnimatedStyles.transform,
        width: translateValue,
      });
    }

    return (
      <Animated.View style={[flattenedTileStyle, tabTranslateAnimatedStyles]} />
    );
  }, [
    flattenedTileStyle,
    renderTile,
    tabTranslateAnimatedStyles,
    translateValue,
  ]);

  return (
    <Animated.View
      style={[styles.defaultSegmentedControlWrapper, segmentedControlWrapper]}
    >
      {memoizedTile}
      {memoizedSegments.map((segment, index) => {
        const isSelected = currentIndex === index;
        const { label, ...accessibilityProps } = segment;

        return (
          <Pressable
            onPress={() => memoizedTabPressCallback(index)}
            key={index}
            style={[styles.touchableContainer, pressableWrapper]}
            accessibilityState={{ selected: isSelected }}
            accessibilityHint={!isSelected ? `Selects ${label} option` : ''}
            accessibilityLabel={`${label}, option, ${index + 1} of ${
              segments.length
            }`}
            accessibilityRole="button"
            {...accessibilityProps}
          >
            <View style={styles.textWrapper}>
              <Text
                style={[
                  currentIndex === index
                    ? finalisedActiveTextStyle
                    : finalisedInActiveTextStyle,
                ]}
              >
                {label}
              </Text>
              {typeof badgeValues[index] === 'number' && (
                <View
                  style={[
                    styles.defaultBadgeContainerStyle,
                    currentIndex === index
                      ? finalisedActiveBadgeStyle
                      : finalisedInActiveBadgeStyle,
                  ]}
                >
                  <Text style={finalisedBadgeTextStyle}>
                    {badgeValues[index]}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  defaultSegmentedControlWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  touchableContainer: {
    flex: 1,
    elevation: 9,
    paddingVertical: 12,
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  movingSegmentStyle: {
    top: 0,
    marginVertical: 2,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  // Badge Styles
  defaultBadgeContainerStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
    width: 16,
    borderRadius: 9999,
    alignContent: 'flex-end',
  },
});

export default SegmentedControl;
