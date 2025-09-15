import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite'
import { Text, View, StyleSheet, TouchableOpacity, SectionList } from 'react-native'
import React, { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import Moment from 'moment'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from 'expo-sqlite/kv-store';
import * as Haptics from 'expo-haptics';



const History = () => {
  return(
    <SQLiteProvider databaseName='database.db'>
      <GestureHandlerRootView>
        <HistoryList/>
      </GestureHandlerRootView>
    </SQLiteProvider>
  )
}



const HistoryList = () => {
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
    const dataArray = await db.getAllAsync('SELECT * FROM meal_history') as rawData[]
    let tempDataArray: SectionType[] = []

    // Loop through every element in history table
    let sectionIndex = -1
    let prevDate = ""
    for (let i = 0; i < dataArray.length; i++) {
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
    <SafeAreaView edges={['bottom']} style={{flex:1}}>
      <SectionList
        sections={data}
        renderItem={({item}) => <HistoryEntry id={item.id} date={item.date} mealsLeft={item.mealsLeft} updateData={getData}/>}
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.headerText}>{title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        style={styles.listBackground}
        contentInset={{ bottom: 80 }}
      />
    </SafeAreaView>
  )
}

interface HistoryEntryProps {
  id: number,
  date: string,
  mealsLeft: number,
  updateData: () => void
}
const HistoryEntry: React.FC<HistoryEntryProps> = ({ id, date, mealsLeft, updateData }) => {
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
            <Ionicons name="trash" color="#FFFFFF" size={28}></Ionicons>
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
      <View style={{backgroundColor: "#FFFFFF"}}>
        <TouchableOpacity style={styles.entryBackground}>
          <Text style={styles.entryText}>{mealLabel}</Text>
          <Text style={styles.entryTimeText}>{date}</Text>
          <Text style={styles.entryTimeText}>{mealsLeft} meals left</Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  listBackground: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    paddingBottom: 1
  },
  entryBackground: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    padding: 15,
    borderColor: "rgba(255, 255, 255, 1)",
    borderTopColor: "rgba(200, 200, 200, 1)",
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20
  },
  headerText: {
    fontSize: 30,
    alignSelf: 'center',
    fontWeight: 700,
    marginBlockEnd: 10,
    marginTop: 20,
  },
  entryText: {
    flex: 1.5,
    fontSize: 15,
  },
  entryTimeText: {
    flex: 1,
    fontSize: 15,
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
    padding: 10,
  }
})

export default History