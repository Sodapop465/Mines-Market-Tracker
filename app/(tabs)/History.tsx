import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite'
import { Text, View, StyleSheet, FlatList, SectionList } from 'react-native'
import React, { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import Moment from 'moment'
import Swipeable from 'react-native-gesture-handler/Swipeable';


const History = () => {
  return(
    <SQLiteProvider databaseName='database.db'>
      <HistoryList/>
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
    <SectionList
      sections={data}
      renderItem={({item}) => <HistoryEntry id={item.id} date={item.date} mealsLeft={item.mealsLeft}/>}
      renderSectionHeader={({section: {title}}) => (
        <Text style={styles.headerText}>{title}</Text>
      )}
      stickySectionHeadersEnabled={false}
      style={styles.listBackground}
    />
  )
}

interface HistoryEntryProps {
  id: number,
  date: string,
  mealsLeft: number
}
const HistoryEntry: React.FC<HistoryEntryProps> = ({ id, date, mealsLeft }) => {
  // If time (date) is between 5am to 10am, return breakfast
  // else if time is between 11am to 4pm, return lunch
  // else if time is between 4pm to 10pm, return dinner
  // else return midnight snack
  const entryTime = Moment(date, Moment.localeData().longDateFormat('LT'))
  if (entryTime.isBetween(Moment("5:00", "HH:mm"), Moment("10:00", "HH:mm"))) {
    return(
      <View style={styles.entryBackground}>
        <Text style={styles.entryText}>Breakfast</Text>
        <Text style={styles.entryTimeText}>{date}</Text>
      </View>
    )
  } else if (entryTime.isBetween(Moment("10:00", "HH:mm"), Moment("16:00", "HH:mm"))) {
    return(
      <View style={styles.entryBackground}>
        <Text style={styles.entryText}>Lunch</Text>
        <Text style={styles.entryTimeText}>{date}</Text>
      </View>
    )
  } else if (entryTime.isBetween(Moment("16:00", "HH:mm"), Moment("22:00", "HH:mm"))) {
    return(
      <View style={styles.entryBackground}>
        <Text style={styles.entryText}>Dinner</Text>
        <Text style={styles.entryTimeText}>{date}</Text>
      </View>
    )
  } else {
    return(
      <View style={styles.entryBackground}>
        <Text style={styles.entryText}>Midnight Snack</Text>
        <Text style={styles.entryTimeText}>{date}</Text>
      </View>
    )
  }  
}

const styles = StyleSheet.create({
  listBackground: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 1)",
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
    flex: 1,
    fontSize: 15,
  },
  entryTimeText: {
    flex: 1,
    fontSize: 15,
  }
})

export default History