import { useColorScheme, StyleSheet, View, Switch, Text } from "react-native"
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';


const SettingsPage = () => {
  const scheme = useColorScheme()
  return(
    <View style={scheme==='dark' ? styles.pageContainerDark : styles.pageContainerLight}>
      <SafeAreaProvider>
        <SafeAreaView>
          <Switch></Switch>
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  pageContainerLight: {
    flex: 1,
    backgroundColor: 'white',
  },
  pageContainerDark: {
    flex: 1,
    backgroundColor: 'black',
  }
})

export default SettingsPage