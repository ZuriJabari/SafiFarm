import "@testing-library/jest-native/extend-expect"

// Mock the expo-image-picker module
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn()
}))

// Mock the react-native-reanimated module
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock")
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock the react-native-gesture-handler module
jest.mock("react-native-gesture-handler", () => {
  const View = require("react-native").View
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    /* Buttons */
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    /* Other */
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {}
  }
}) 