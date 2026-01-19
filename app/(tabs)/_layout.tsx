import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { SQLiteProvider } from 'expo-sqlite';
import { Platform } from 'react-native';

export default function TabLayout() {
  return(
    <SQLiteProvider databaseName="database.db">
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Counter</Label>
          {Platform.select({
            ios: <Icon sf="house.fill"/>,
            android: <Icon src={<VectorIcon family={MaterialIcons} name="home"/>}/>
          })}
          
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="History">
          <Label>History</Label>
          {Platform.select({
            ios: <Icon sf="clock.fill"/>,
            android: <Icon src={<VectorIcon family={MaterialIcons} name="access-time-filled"/>}/>
          })}
        </NativeTabs.Trigger>
      </NativeTabs>
    </SQLiteProvider>
  );
}