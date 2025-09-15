import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return(
    <Tabs screenOptions={{
      tabBarStyle: { 
        position: 'absolute',
        backgroundColor: 'rgba(192, 192, 192, 0.3)',
        borderTopWidth: 0,
      },
      tabBarBackground: () => (
        <BlurView tint="light" intensity={50} style={{ flex: 1 }} experimentalBlurMethod='dimezisBlurView'/>  
      ),
      
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Counter',
          headerShown: true,
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="History"
        options={{
          title: 'History',
          headerShown: true,
          tabBarIcon: ({ color }) => <Ionicons size={28} name="time" color={color} />,
        }}
      />
    </Tabs>
  );
}