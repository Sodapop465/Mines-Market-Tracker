import { useColorScheme, StyleSheet, View } from "react-native"


const SettingsPage = () => {
  const scheme = useColorScheme()
  return(
    <View style={scheme==='dark' ? styles.pageContainerDark : styles.pageContainerLight}>

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