import React, { useState, useEffect, useCallback } from 'react'
import { Text, StyleSheet, Pressable, ScrollView, Dimensions, useColorScheme, View, FlatList, LayoutChangeEvent } from 'react-native'
import AsyncStorage from 'expo-sqlite/kv-store'
import * as SQLite from 'expo-sqlite'
import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import { useFocusEffect } from '@react-navigation/native';
import Dialog from "react-native-dialog";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics'

/*
  Database Schema:
  Table: meal_history
    id: INTEGER PRIMARY KEY
    meals_left: INTEGER NOT NULL
    date: TEXT NOT NULL (ISO String)
  Table: munch_money_history
    id: INTEGER PRIMARY KEY
    transaction_amount: REAL NOT NULL
    remaining_balance: REAL NOT NULL
    date: TEXT NOT NULL (ISO String)
*/

SplashScreen.preventAutoHideAsync();

const Index = () => {
  const width = Dimensions.get('window').width
  const scheme = useColorScheme()

  const [currentPage, setCurrentPage] = useState(0);
  const handleScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);
    setCurrentPage(pageIndex);
  };

  return(
    <SafeAreaView style={[
      {flex: 1},
      scheme === 'dark' ? {backgroundColor: 'black'} : {backgroundColor: 'white'}
      ]}>
      
      {/* Mines Market Logo */}
      <Image
        style = {[styles.logo, { width: width }]}
        source = {require("../../assets/images/MinesMarketLogo.png")}
        contentFit="cover"
        transition={1000}
      />

      {/* Home Screen Pages */}
      <FlatList
        data = {pages}
        renderItem = {({ item }) => {
          return(
          <View style={styles.page}>
            <item.component />
          </View>
          )
        }}
        horizontal = {true}
        pagingEnabled = {true}
        showsHorizontalScrollIndicator = {false}
        onScroll = {handleScroll}
      />
      {/* Home Screen Dots */}
      <PageDots total={pages.length} current={currentPage} />
    </SafeAreaView>
  )
}

interface PageDotsProps {
  total: number,
  current: number
}
const PageDots:React.FC<PageDotsProps> = ({ total, current}) => {
  const scheme = useColorScheme()
  return (
    <View style={styles.dotContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            scheme === 'dark' ? styles.dotDark : styles.dotLight,
            index === current && (scheme === 'dark' ? styles.activeDotDark : styles.activeDotLight)
          ]}
        />
      ))}
    </View>
  );
};


const MealSwipes = () => {
  const [ meals, setMealsState ] = useState<number|null>(null)
  // let database: SQLite.SQLiteDatabase
  const database = SQLite.useSQLiteContext()
  const scheme = useColorScheme()
  const [ layout, setLayout ] = useState({ width: 0, height: 0, x: 0, y: 0 });

  // Add meals dialog stuff
  const [ dialogVisible, setDialogVisible ] = useState(false);
  const [ dialogValue, setDialogValue ] = useState("");

  async function setup() {
    try {
      // Date is stored as a ISO 8601 String
      await database.runAsync(`CREATE TABLE IF NOT EXISTS meal_history (
        id INTEGER PRIMARY KEY,
        meals_left INTEGER NOT NULL,
        date text NOT NULL
        );`)
      } catch(error) {
        console.error("Failed to create SQLite table: " + error)
      }
    
    // Set up AsyncStorage
    if (await AsyncStorage.getItem("numMeals") === null) {
      await AsyncStorage.setItemAsync("numMeals", "80")
    }
    await setMealsState(Number(await AsyncStorage.getItem("numMeals")))
  }

  // Handle press of big button
  async function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (meals !== null) {
      // AsyncStorage
      await AsyncStorage.setItemAsync("numMeals", String(meals-1))
      setMealsState(meals - 1)

      // SQLite
      try {
        await database.runAsync("INSERT INTO meal_history (meals_left, date) VALUES (?, ?);", meals, new Date().toISOString())
      } catch(error) {
        console.error("Failed to insert row into database: " + error)
      }
    } else {
      console.error("Could not set 'numMeals' key to AsyncStorage")
    }
  }

  async function setMeals(mealsToSet: number) {
    if (meals !== null) {
      await AsyncStorage.setItemAsync("numMeals", String(mealsToSet))
      setMealsState(mealsToSet)
    } else {
      console.error("Could not set 'numMeals' key to AsyncStorage")
    }
  }

  async function reloadMealCounter() {
    setMealsState(Number(await AsyncStorage.getItem("numMeals")))
  }
  
  // Measure View dimensions to place buttons correctly
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout
    setLayout({ x, y, width, height })
  }, [])

  setup()

  // hide splashcreen after everything loads
  useEffect(() => {
    SplashScreen.hideAsync()
  }, []);

  // reload meals counter when page comes back in focus
  useFocusEffect(
    useCallback(() => {
      reloadMealCounter()
    }, [])
  );

  return(
    <View style={scheme === 'dark' ? styles.containerDark : styles.containerLight}
      onLayout = {onLayout}>
      <Text style={scheme === 'dark' ? styles.mealCountDark : styles.mealCountLight}>{String(meals)}</Text>
      <Text style={scheme === 'dark' ? styles.mealTextDark : styles.mealTextLight}>meals</Text>

      <Pressable 
        style={({ pressed }) => [
          [styles.buttonDefault, { 
            width: layout.width - 30, 
            height: layout.width - 30, 
            borderRadius: layout.width/2
          }],
          pressed ? 
            [styles.buttonPressed, { 
              width: layout.width - 30, 
              height: layout.width - 30, 
              borderRadius: layout.width/2 }]: 
            [styles.buttonDefault, {
                width: layout.width - 30, 
                height: layout.width - 30, 
                borderRadius: layout.width/2}],
        ]}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>EAT</Text>
      </Pressable>

      <Pressable 
        style={({ pressed }) => [
          [styles.buttonDefault, { 
            width: layout.width/2, 
            borderRadius: 2000
          }],
          pressed ? 
            (scheme === 'dark' ? styles.addMealsPressedDark : styles.addMealsPressedLight) 
            : (scheme === 'dark' ? styles.addMealsDefaultDark : styles.addMealsDefaultLight)]}
        onPress={() => {setDialogVisible(true)}}
      >
        <Text style={scheme === 'dark' ? styles.addMealsTextDark : styles.addMealsTextLight}>Set Meals</Text>
      </Pressable>
      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Enter number of meals</Dialog.Title>
        <Dialog.Input
          keyboardType="numeric"
          value={dialogValue}
          onChangeText={setDialogValue}
          placeholder="Type here"
        />
        <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} />
        <Dialog.Button label="Submit" onPress={() => {
          setDialogVisible(false);
          setMeals(Number(dialogValue))
          setDialogValue("")
        }} />
      </Dialog.Container>
    </View>
  )
}

const MunchMoney = () => {
  // Satisfy my eyes variables
  const scheme = useColorScheme()
  const [ purchaseDialogVisible, setPurchaseDialogVisible ] = useState(false);
  const [ balanceDialogVisible, setBalanceDialogVisible ] = useState(false);
  const [ purchaseDialogValue, setPurchaseDialogValue ] = useState("");
  const [ balanceDialogValue, setBalanceDialogValue ] = useState("");
  // Data variables
  const db = SQLite.useSQLiteContext()
  const [ balance, setBalance ] = useState<number>(0)

  async function setup() {
    // Setup SQLite
    try {
      await db.runAsync(`CREATE TABLE IF NOT EXISTS munch_money_history
      ( id INTEGER PRIMARY KEY,
        transaction_amount REAL NOT NULL,
        remaining_balance REAL NOT NULL,
        date TEXT NOT NULL
      );`)
    } catch (error) {
      console.error("Failed to create munch money table: " + error)
      return
    }

    // Setup AsyncStorage for balance
    if (await AsyncStorage.getItem("munchMoneyBalance") === null) {
      await AsyncStorage.setItemAsync("munchMoneyBalance", "0")
      setBalance(0)
    } else {
      setBalance(Number(await AsyncStorage.getItemAsync("munchMoneyBalance")))
    }
  }

  async function makePurchase(amount: number) {
    const newBalance = balance - amount
    try {
      await db.runAsync(
        `INSERT INTO munch_money_history (transaction_amount, remaining_balance, date)
        VALUES (?, ?, ?);`,
        amount,
        newBalance,
        new Date().toISOString()
      )
    } catch (error) {
      console.error("Failed to insert row into munch_money_history: " + error)
    }
    changeBalanceInput(newBalance)
  }

  async function changeBalanceInput(newBalance: number) {
    await AsyncStorage.setItemAsync("munchMoneyBalance", String(newBalance))
    setBalance(newBalance)
  }

  async function reloadBalanceCounter() {
    setBalance(Number(await AsyncStorage.getItemAsync("munchMoneyBalance")))
  }


  setup()

  // reload balance counter when page comes back in focus
  useFocusEffect(
    useCallback(() => {
      reloadBalanceCounter()
    }, [])
  );

  return(
    <View
      style={[scheme === 'dark' ? styles.containerDark : styles.containerLight,
        {width: Dimensions.get('window').width}
      ]}>
      <Text style={scheme === 'dark' ? styles.munchMoneyHeaderDark : styles.munchMoneyHeaderLight}>Munch Money</Text>
      <Text style={scheme === 'dark' ? styles.balanceDark : styles.balanceLight}>
        ${balance.toFixed(2)}
      </Text>

      {/* Buttons */}
      <View style = {styles.munchButtonContainer}>
        <Pressable 
          style={({ pressed }) => [
            [scheme === 'dark' ? styles.munchButtonDefaultDark : styles.munchButtonDefaultLight, { 
            }],
            pressed ? 
              (scheme === 'dark' ? styles.munchButtonPressedDark : styles.munchButtonPressedLight) 
              : (scheme === 'dark' ? styles.munchButtonDefaultDark : styles.munchButtonDefaultLight)]}
          onPress={() => {setPurchaseDialogVisible(true)}}
        >
          <Text style={scheme === 'dark' ? styles.munchButtonTextDark : styles.munchButtonTextLight}>Purchase</Text>
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            [scheme === 'dark' ? styles.munchButtonDefaultDark : styles.munchButtonDefaultLight, { 
            }],
            pressed ? 
              (scheme === 'dark' ? styles.munchButtonPressedDark : styles.munchButtonPressedLight) 
              : (scheme === 'dark' ? styles.munchButtonDefaultDark : styles.munchButtonDefaultLight)]}
          onPress={() => {setBalanceDialogVisible(true)}}
        >
          <Text style={scheme === 'dark' ? styles.munchButtonTextDark : styles.munchButtonTextLight}>Change Balance</Text>
        </Pressable>
      </View>

      {/* Dialogs for changing things because I'm too lazy to make my own */}
      <Dialog.Container visible={purchaseDialogVisible}>
        <Dialog.Title>Purchase amount</Dialog.Title>
        <Dialog.Input
          keyboardType="numeric"
          value={purchaseDialogValue}
          onChangeText={setPurchaseDialogValue}
          placeholder="0.00"
        />
        <Dialog.Button label="Cancel" onPress={() => setPurchaseDialogVisible(false)} />
        <Dialog.Button label="Submit" onPress={() => {
          setPurchaseDialogVisible(false);
          makePurchase(Number(purchaseDialogValue))
          setPurchaseDialogValue("")
        }} />
      </Dialog.Container>

      <Dialog.Container visible={balanceDialogVisible}>
        <Dialog.Title>New Balance</Dialog.Title>
        <Dialog.Input
          keyboardType="numeric"
          value={balanceDialogValue}
          onChangeText={setBalanceDialogValue}
          placeholder="0.00"
        />
        <Dialog.Button label="Cancel" onPress={() => setBalanceDialogVisible(false)} />
        <Dialog.Button label="Submit" onPress={() => {
          setBalanceDialogVisible(false);
          changeBalanceInput(Number(balanceDialogValue))
          setBalanceDialogValue("")
        }} />
      </Dialog.Container>
    </View>
  )
}

const pages = [
  { key: 'MealSwipes', component: MealSwipes },
  { key: 'MunchMoney', component: MunchMoney },
]

const styles = StyleSheet.create({
  page: {
    width: Dimensions.get('window').width,
    flex: 1,
  },
  containerLight: {
    flex: 1,
    width: Dimensions.get('window').width,
    verticalAlign: 'middle',
  },
  containerDark: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  logo: {
    height: 100,
    width: 100,
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  mealCountLight: {
    fontSize: 100,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  mealCountDark: {
    fontSize: 100,
    alignSelf: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
  mealTextLight: {
    marginTop: -20,
    fontSize: 20,
    alignSelf: 'center',
  },
  mealTextDark: {
    marginTop: -20,
    fontSize: 20,
    alignSelf: 'center',
    color: 'white',
  },
  buttonDefault: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 98, 98, 1)',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: 'rgba(136, 255, 67, 1)',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    alignSelf: 'center',
    fontSize: 75,
    fontWeight: '700',
  },
  addMealsDefaultLight: {
    flex: 0.15,
    height: 40,
    marginBottom: 30,
    backgroundColor: 'rgba(207, 207, 207, 1)',
  },
  addMealsDefaultDark: {
    flex: 0.15,
    height: 40,
    marginBottom: 30,
    backgroundColor: 'rgba(50, 50, 50, 1)',
  },
  addMealsPressedLight: {
    flex: 0.15,
    height: 40,
    marginBottom: 30,
    backgroundColor: 'rgba(177, 177, 177, 1)',
    justifyContent: 'center',
    alignContent: 'center',
  },
  addMealsPressedDark: {
    flex: 0.15,
    height: 40,
    marginBottom: 30,
    backgroundColor: 'rgba(75, 75, 75, 1)',
    justifyContent: 'center',
    alignContent: 'center',
  },
  addMealsTextLight: {
    fontSize: 20,
    fontWeight: '700',
  },
  addMealsTextDark: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  munchMoneyHeaderLight: {
    fontSize: 30,
    marginTop: 10,
    fontWeight: '700',
    alignSelf: 'center',
  },
  munchMoneyHeaderDark: {
    fontSize: 30,
    marginTop: 10,
    fontWeight: '700',
    alignSelf: 'center',
    color: 'white',
  },
  balanceLight: {
    fontSize: 50,
    fontWeight: '700',
    alignSelf: 'center',
    marginTop: 10,
  },
  balanceDark: {
    fontSize: 50,
    fontWeight: '700',
    alignSelf: 'center',
    marginTop: 10,
    color: 'white',
  },
  munchButtonContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    width: Dimensions.get('window').width,
    marginTop: 20,
  },
  munchButtonTextLight: {
    fontSize: 40,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  munchButtonTextDark: {
    fontSize: 40,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: 'white',
  },
  munchButtonDefaultLight: {
    flex: 1,
    borderRadius: 2000,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 30,
    padding: 5,
    justifyContent: 'center',
    width: Dimensions.get('window').width - 50,
    backgroundColor: 'rgba(207, 207, 207, 1)',
  },
  munchButtonDefaultDark: {
    flex: 1,
    borderRadius: 2000,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 30,
    padding: 5,
    justifyContent: 'center',
    width: Dimensions.get('window').width - 50,
    backgroundColor: 'rgba(50, 50, 50, 1)',
  },
  munchButtonPressedLight: {
    flex: 1,
    borderRadius: 2000,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 30,
    padding: 5,
    width: Dimensions.get('window').width - 50,
    backgroundColor: 'rgba(177, 177, 177, 1)',
  },
  munchButtonPressedDark: {
    flex: 1,
    borderRadius: 2000,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 30,
    padding: 5,
    width: Dimensions.get('window').width - 50,
    backgroundColor: 'rgba(75, 75, 75, 1)',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 60,
  },
  dotLight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  dotDark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  activeDotLight: {
    backgroundColor: '#333',
    width: 10,
    height: 10,
  },
  activeDotDark: {
    backgroundColor: '#ccc',
    width: 10,
    height: 10,
  },
})

export default Index