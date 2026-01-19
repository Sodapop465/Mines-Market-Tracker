import { useSQLiteContext } from 'expo-sqlite'
import { Text, View, StyleSheet, TouchableOpacity, SectionList, Platform, useColorScheme, Pressable } from 'react-native'
import React, { useState, useCallback, memo } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import Moment from 'moment'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from 'expo-sqlite/kv-store'
import * as Haptics from 'expo-haptics'



const History = () => {
  const scheme = useColorScheme()
  const [ activeTab, setActiveTab ] = useState("Meals")

  return(
    <GestureHandlerRootView>
      <HeaderTabs activeTab={activeTab} setActiveTab={setActiveTab}/>
      <HistoryList page = {activeTab}/>
    </GestureHandlerRootView>
  )
}

/*
  Create navigation header for History screen
*/
interface HeaderTabsProps {
  activeTab: string,
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
}
const HeaderTabs:React.FC<HeaderTabsProps> = ({ activeTab, setActiveTab }) => {
  const scheme = useColorScheme()

  return (
    <View style = {scheme === 'dark' ? styles.headerTabsContainerDark : styles.headerTabsContainerLight}>
      <HeaderTabButton title = "Meals" activeTab = {activeTab} setActiveTab = {setActiveTab}/>
      <HeaderTabButton title = "Munch Money" activeTab = {activeTab} setActiveTab = {setActiveTab}/>
    </View>
  )
}
/*
  The buttons for the header
*/
interface HeaderTabButtonProps {
  title: string,
  activeTab: string,
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
}
const HeaderTabButton:React.FC<HeaderTabButtonProps> = ({ title, activeTab, setActiveTab }) => {
  const scheme = useColorScheme()
  const active = activeTab === title

  function onPress() {
    setActiveTab(title)
  }

  return (
    <Pressable
      style = {({ pressed }) => [
        [scheme === 'dark' ? styles.headerTabContainerDarkDefault : styles.headerTabContainerLightDefault, {}],
        pressed ?
          (scheme === 'dark' ? styles.headerTabContainerDarkPressed : styles.headerTabContainerLightPressed) : 
          (scheme === 'dark' ? styles.headerTabContainerDarkDefault : styles.headerTabContainerLightDefault)]}
      onPress = {onPress}
    >
      <Text style = {
        scheme === 'dark' ? (active ? styles.headerTabTextDarkActive : styles.headerTabTextDark) : 
        (active ? styles.headerTabTextLightActive : styles.headerTabTextLight)}>
          {title}
      </Text>
    </Pressable>
  )
}

interface HistoryListProps {
  page: string
}
const HistoryList:React.FC<HistoryListProps> = ({ page }) => {
  return (
    <>
      <View style={{ display: page === 'Meals' ? 'flex' : 'none', flex: 1 }}>
        <MemoMealHistory />
      </View>
      <View style={{ display: page === 'Munch Money' ? 'flex' : 'none', flex: 1 }}>
        <MemoMunchHistory />
      </View>
    </>
  )
}


const MealHistory = () => {
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
      console.error("Could not select data from table 'meal_history': " + error)
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
      <SectionList
        sections={data}
        renderItem={({item}) => <MealHistoryEntry id={item.id} date={item.date} mealsLeft={item.mealsLeft} updateData={getData}/>}
        renderSectionHeader={({section: {title}}) => (
          <Text style={scheme==='dark' ? styles.headerTextDark : styles.headerTextLight}>{title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[
          scheme === 'dark' ? styles.listBackgroundDark : styles.listBackgroundLight, 
          { paddingBottom: 100 }
        ]}
      />
    </View>
  )
}

/* 
  Individual lines in the History list
*/
interface MealHistoryEntryProps {
  id: number,
  date: string,
  mealsLeft: number,
  updateData: () => void
}
const MealHistoryEntry: React.FC<MealHistoryEntryProps> = ({ id, date, mealsLeft, updateData }) => {
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

/* 
  Munch Money History Screen 
*/
const MunchHistory = () => {
  const scheme = useColorScheme()
  const db = useSQLiteContext()
  const [ historyData, setHistoryData ] = useState<SectionType[]|null> (null)
  interface MunchHistory {
    id: number,
    date: string,
    time: string,
    balance: number,
    transactionAmount: number
  }
  interface SectionType {
    title: string,
    data: MunchHistory[]
  }

  async function getData() {
    interface RawData {
      id: number,
      date: string,
      remaining_balance: number,
      transaction_amount: number
    }
    let rawDataArr: RawData[] = [];
    try {
      rawDataArr = await db.getAllAsync("SELECT * FROM munch_money_history") as RawData[]
    } catch (error) {
      console.error("Could not select data from table 'munch_money_history': " + error)
      return;
    }

    // Sort data into section list format
    let tempDataArray: SectionType[] = []
    let sectionIndex = -1
    let prevDate = ""
    for (const rawData of rawDataArr) {
      const date = Moment(rawData.date).format("MMM Do YY")
      const time = Moment(rawData.date).format("LT")
      const balance = rawData.remaining_balance
      const transactionAmount = rawData.transaction_amount
      const id = rawData.id
      // Check if new section needs to be created
      if (prevDate === date) {
        if (id === undefined || balance === undefined || transactionAmount === undefined) {
          console.error("database table 'munch_money_history' contains undefined elements")
          continue
        }
        const tempMunchEntry: MunchHistory = { id: id, date: date, time: time, balance: balance, transactionAmount: transactionAmount }
        tempDataArray.at(sectionIndex)?.data.push(tempMunchEntry)
      } else {
        if (id === undefined || balance === undefined || transactionAmount === undefined) {
          console.error("database table 'munch_money_history' contains undefined elements")
          continue
        }
        sectionIndex += 1
        const newDataArr: MunchHistory [] = []
        const tempMunchEntry: MunchHistory = { id: id, date: date, time: time, balance: balance, transactionAmount: transactionAmount }
        newDataArr.push(tempMunchEntry)
        const tempSection: SectionType = { title: date, data: newDataArr }
        tempDataArray.push(tempSection)
      }
      prevDate = date
    }
    setHistoryData(tempDataArray)
  }

  useFocusEffect(
    useCallback(() => {
      getData()
    }, [])
  );

  if (historyData === null) {
    getData()
    return (
      <Text>Loading...</Text>
    )
  }

  return (
    <View style = {scheme === 'dark' ? styles.screenContainerDark : styles.screenContainerLight}>
      <SectionList
        sections={historyData || []}
        renderItem={({item}) => <MunchHistoryEntry id = {item.id} time={item.time} balance={item.balance} transactionAmount={item.transactionAmount} updateData={getData}/>}
        renderSectionHeader={({section: {title}}) => (
          <Text style={scheme==='dark' ? styles.headerTextDark : styles.headerTextLight}>{title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[
          scheme === 'dark' ? styles.listBackgroundDark : styles.listBackgroundLight, 
          { paddingBottom: 100 }
        ]}
      />
    </View>
  )
}

interface MunchHistoryEntryProps {
  id: number,
  time: string,
  balance: number,
  transactionAmount: number
  updateData: () => void
}
const MunchHistoryEntry:React.FC<MunchHistoryEntryProps> = ({ id, time, balance, transactionAmount, updateData }) => {
  const scheme = useColorScheme()
  const db = useSQLiteContext()
  const [size, setSize] = useState({ width: 0, height: 0 });

  async function deleteEntry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Delete from table
    await db.runAsync("DELETE FROM munch_money_history WHERE id = ?;", id)
    updateData()
    // Update Munch Money Balance
    const newBalance = Number(await AsyncStorage.getItemAsync("munchMoneyBalance")) + transactionAmount
    await AsyncStorage.setItemAsync("munchMoneyBalance", String(newBalance))
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

  return (
    <Swipeable renderRightActions={deleteView}>
      <View style={scheme==='dark' ? { backgroundColor: "#000000"} : { backgroundColor: "#FFFFFF"}}>
        <TouchableOpacity style={scheme==='dark' ? styles.entryBackgroundDark : styles.entryBackgroundLight}>
          <Text style={scheme === 'dark' ? styles.entryTextDark : styles.entryTextLight}>${transactionAmount.toFixed(2)}</Text>
          <Text style={scheme === 'dark' ? styles.entryTextDark : styles.entryTextLight}>{time}</Text>
          <Text style={scheme === 'dark' ? styles.entryTextDark : styles.entryTextLight}>${balance.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  )
}

const MemoMealHistory = React.memo(MealHistory)
const MemoMunchHistory = React.memo(MunchHistory)

const pages = [
  { key: 'Meals', component: MemoMealHistory },
  { key: 'Munch Money', component: MemoMunchHistory },
]

const styles = StyleSheet.create({
  screenContainerLight: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  screenContainerDark: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  listBackgroundLight: {
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  listBackgroundDark: {
    backgroundColor: "rgba(0, 0, 0, 1)",
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
  },
  headerTabsContainerLight: {
    flexDirection: 'row',
    height: (Platform.OS === 'ios' ? 130 : 70),
    paddingTop: (Platform.OS === 'ios' ? 50 : 0),
    backgroundColor: 'rgba(220, 220, 220, 1)',
  },
  headerTabsContainerDark: {
    flexDirection: 'row',
    height: (Platform.OS === 'ios' ? 130 : 70),
    paddingTop: (Platform.OS === 'ios' ? 50 : 0),
    backgroundColor: 'rgba(20, 20, 20, 1)',
  },
  headerTabContainerLightDefault: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: "rgb(220, 220, 220)",
  },
  headerTabContainerDarkDefault: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: "rgba(20, 20, 20, 1)",
  },
  headerTabContainerLightPressed: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: "rgba(200, 200, 200, 1)",
  },
  headerTabContainerDarkPressed: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: "rgba(50, 50, 50, 1)",
  },
  headerTabTextLight: {
    fontSize: 15,
    fontWeight: '400',
    alignSelf: 'center',
    color: 'black',
  },
  headerTabTextLightActive: {
    fontSize: 25,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: 'black',
  },
  headerTabTextDark: {
    fontSize: 15,
    fontWeight: '400',
    alignSelf: 'center',
    color: 'white',
  },
  headerTabTextDarkActive: {
    fontSize: 25,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: 'white',
  },
})


export default History