import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging'

// A push that arrives while the app is in the background or closed is shown by the
// system from its `notification` part; tapping it is handled in PushManager. Nothing
// to do here, but React Native Firebase expects a handler to be set.
setBackgroundMessageHandler(getMessaging(), async () => undefined)
