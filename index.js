// Registers the FCM background handler before the app (React Native Firebase
// requires it at the entry), then starts Expo Router.
import './src/push/background'
import 'expo-router/entry'
