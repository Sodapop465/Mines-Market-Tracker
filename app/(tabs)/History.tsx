import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite'
import { Text, View, StyleSheet, TouchableOpacity, SectionList, Platform, useColorScheme } from 'react-native'
import React, { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import Moment from 'moment'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from 'expo-sqlite/kv-store';
import * as Haptics from 'expo-haptics';



const History = () => {
  const scheme = useColorScheme()
  return(
    <SQLiteProvider databaseName='database.db'>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <HistoryList/>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </SQLiteProvider>
  )
}



const HistoryList = () => {
  const scheme = useColorScheme()
  interface MealHistory {
    id: number,
    date: string,
    mealsLeft: number
  }
  interface SectionType {
    title: string,
    data: MealHistory[]
  }
  const db = useSQLiteContext()
  const [ data, setData ] = useState<SectionType[]|null>(null)
  
  // Gets data from database and stores it in 'data' array
  async function getData() {
    interface rawData {
      id: number,
      date: string,
      meals_left: number
    }
    let dataArray: rawData[]
    try {
      dataArray = await db.getAllAsync('SELECT * FROM meal_history') as rawData[]
    } catch(error) {
      console.error("Could not select data from table: " + error)
      return
    }
    
    let tempDataArray: SectionType[] = []

    // Loop through every element in history table
    let sectionIndex = -1
    let prevDate = ""
    for (let i = dataArray.length - 1; i >= 0; i--) {
      // Date handling for sections
      let currDate = Moment(dataArray.at(i)?.date).format("MMM Do YY")
      const tempID = dataArray.at(i)?.id
      const tempMealsLeft = dataArray.at(i)?.meals_left
      const tempDate = Moment(dataArray.at(i)?.date).format("LT")

      // Check if new section needs to be created
      if (prevDate === currDate) {
        if (tempID !== undefined && tempMealsLeft !== undefined) {
          const tempMealHistory: MealHistory = { id: tempID, date: tempDate, mealsLeft: tempMealsLeft }
          tempDataArray.at(sectionIndex)?.data.push(tempMealHistory)
        } else {
          console.error("database table 'meal_history' contains undefined elements")
        }
      } else {
        const newDataArr: MealHistory[] = []
        if (tempID !== undefined && tempMealsLeft !== undefined) {
          const tempMealHistory: MealHistory = { id: tempID, date: tempDate, mealsLeft: tempMealsLeft }
          newDataArr.push(tempMealHistory)
        } else {
          console.error("database table 'meal_history' contains undefined elements")
        }
        const tempSection: SectionType = { title: currDate, data: newDataArr }
        tempDataArray.push(tempSection)
        sectionIndex += 1
      }
      prevDate = currDate
    }
    setData(tempDataArray)
  }

  useFocusEffect(
    useCallback(() => {
      getData()
    }, [])
  );

  if (data === null) {
    getData()
    return (
      <Text>Loading...</Text>
    )
  }

  return (
    <View style={[scheme == 'dark' ? styles.screenContainerDark : styles.screenContainerLight, {flex:1}]}>
      <SafeAreaView style={{flex:1}}>
        <SectionList
          sections={data}
          renderItem={({item}) => <HistoryEntry id={item.id} date={item.date} mealsLeft={item.mealsLeft} updateData={getData}/>}
          renderSectionHeader={({section: {title}}) => (
            <Text style={scheme==='dark' ? styles.headerTextDark : styles.headerTextLight}>{title}</Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[
            scheme === 'dark' ? styles.listBackgroundDark : styles.listBackgroundLight, 
            Platform.OS === 'android' ? { paddingBottom: 100 } : null
          ]}
        />
      </SafeAreaView>
    </View>
  )
}

interface HistoryEntryProps {
  id: number,
  date: string,
  mealsLeft: number,
  updateData: () => void
}
const HistoryEntry: React.FC<HistoryEntryProps> = ({ id, date, mealsLeft, updateData }) => {
  const scheme = useColorScheme()
  const entryTime = Moment(date, Moment.localeData().longDateFormat('LT'))
  const db = useSQLiteContext()
  const [size, setSize] = useState({ width: 0, height: 0 });
  const timeRanges = [
    { label: "Breakfast", start: "05:00", end: "10:00" },
    { label: "Lunch", start: "10:00", end: "16:00" },
    { label: "Dinner", start: "16:00", end: "22:00" },
  ]

  async function deleteEntry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Delete from table
    await db.runAsync("DELETE FROM meal_history WHERE id = ?;", id)
    updateData()
    // Update meal counter
    const numMeals = Number(await AsyncStorage.getItemAsync("numMeals")) + 1
    await AsyncStorage.setItemAsync("numMeals", String(numMeals))
  }

  const deleteView = () => {
    return(
      <View style={{ width: size.height}}>
        <TouchableOpacity
          style={ styles.deleteBackground } 
          onPress={ deleteEntry }
          onLayout={event => {
          const { width, height } = event.nativeEvent.layout;
            setSize({ width, height });
          }}
        >
          <View style={styles.trashIcon}>
            <Ionicons 
              name="trash" 
              color="#FFFFFF" 
              size={28}
              style={{marginTop: size.height/2 - 14}}
              />
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  // Changes the type of meal (e.g. breakfast, lunch, dinner) based on time
  const mealLabel =
    timeRanges.find(({ start, end }) =>
      entryTime.isBetween(Moment(start, "HH:mm"), Moment(end, "HH:mm"))
    )?.label || "Midnight Snack"
  return (
    <Swipeable renderRightActions={deleteView}>
      <View style={scheme==='dark' ? { backgroundColor: "#000000"} : { backgroundColor: "#FFFFFF"}}>
        <TouchableOpacity style={scheme==='dark' ? styles.entryBackgroundDark : styles.entryBackgroundLight}>
          <Text style={scheme === 'dark' ? styles.entryTextDark : styles.entryTextLight}>{mealLabel}</Text>
          <Text style={scheme === 'dark' ? styles.entryTimeTextDark : styles.entryTimeTextLight}>{date}</Text>
          <Text style={scheme === 'dark' ? styles.entryTimeTextDark : styles.entryTimeTextLight}>{mealsLeft} meals left</Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  screenContainerLight: {
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  screenContainerDark: {
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  listBackgroundLight: {
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  listBackgroundDark: {
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  pageHeaderTextLight: {
    color: 'black',
    fontWeight: 'bold',
  },
  pageHeaderTextDark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 50,
    textAlign: 'center',
  },
  pageHeaderLight: {
    backgroundColor: 'white',
    height: 100,
  },
  pageHeaderDark: {
    backgroundColor: 'black',
    height: 60,
    
  },
  entryBackgroundLight: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    padding: 15,
    borderColor: "rgba(255, 255, 255, 1)",
    borderTopColor: "rgba(200, 200, 200, 1)",
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20
  },
  entryBackgroundDark: {
    backgroundColor: "rgba(0, 0, 0, 1)",
    padding: 15,
    borderColor: "rgba(0, 0, 0, 1)",
    borderTopColor: "rgba(100, 100, 100, 1)",
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20
  },
  headerTextLight: {
    fontSize: 30,
    alignSelf: 'center',
    fontWeight: 700,
    marginBlockEnd: 10,
    marginTop: 20,
  },
  headerTextDark: {
    fontSize: 30,
    alignSelf: 'center',
    fontWeight: 700,
    marginBlockEnd: 10,
    marginTop: 20,
    color: 'white',
  },
  entryTextLight: {
    flex: 1.5,
    fontSize: 15,
  },
  entryTextDark: {
    flex: 1.5,
    fontSize: 15,
    color: 'white',
  },
  entryTimeTextLight: {
    flex: 1,
    fontSize: 15,
  },
  entryTimeTextDark: {
    flex: 1,
    fontSize: 15,
    color: 'white',
  },
  deleteBackground: {
    flex:1,
    backgroundColor: "rgba(255, 0, 0, 1)",
  },
  trashIcon: {
    flex:1,
    alignSelf: "flex-end",
    alignItems: "center",
    verticalAlign: "middle",
    paddingRight: 10,
  }
})

export default History