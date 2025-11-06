import React, { useState, useEffect, useCallback } from 'react'
import { Text, StyleSheet, Pressable, ScrollView, Dimensions, useColorScheme, View, StatusBar } from 'react-native'
import AsyncStorage from 'expo-sqlite/kv-store'
import * as SQLite from 'expo-sqlite'
import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import { useFocusEffect } from '@react-navigation/native';
import Dialog from "react-native-dialog";
import { SafeAreaView } from 'react-native-safe-area-context';


SplashScreen.preventAutoHideAsync();


const Index = () => {
  const [ meals, setMealsState ] = useState<number|null>(null)
  const width = Dimensions.get('window').width
  const height = Dimensions.get('window').height
  let database: SQLite.SQLiteDatabase
  const scheme = useColorScheme()

  // Add meals dialog stuff
  const [ dialogVisible, setDialogVisible ] = useState(false);
  const [ dialogValue, setDialogValue ] = useState("");

  async function setup() {
    // Setup SQLite
    try {
      database = await SQLite.openDatabaseAsync("database.db")
    } catch(error) {
      console.error("Could not open database: " + error)
    }
    try {
      // Data is stored as a ISO 8601 String
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
    <View style={scheme === 'dark' ? styles.containerDark : styles.containerLight}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView style={styles.containerLight}>
          <Image
            style = {[styles.logo, { width: width }]}
            source = {require("../../assets/images/MinesMarketLogo.png")}
            contentFit="cover"
            transition={1000}
          />

          <Text style={scheme === 'dark' ? styles.mealCountDark : styles.mealCountLight}>{String(meals)}</Text>
          <Text style={scheme === 'dark' ? styles.mealTextDark : styles.mealTextLight}>meals</Text>

          <Pressable 
            style={({ pressed }) => [
              [styles.buttonDefault, { 
                width: width - 30, 
                height: width - 30, 
                borderRadius: width/2
              }],
              pressed ? 
                [styles.buttonPressed, { 
                  width: width - 30, 
                  height: width - 30, 
                  borderRadius: width/2 }]: 
                [styles.buttonDefault, {width: width - 30, 
                    height: width - 30, 
                    borderRadius: width/2}],
            ]}
            onPress={handlePress}
          >
            <Text style={styles.buttonText}>EAT</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              [styles.buttonDefault, { 
                width: width/2, 
                borderRadius: 20
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
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}



const styles = StyleSheet.create({
  containerLight: {
    flex: 1,
  },
  containerDark: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  logo: {
    flex: 1,
    height: 100,
    width: 100,
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  mealCountLight: {
    flex: 1,
    fontSize: 100,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  mealCountDark: {
    flex: 1,
    fontSize: 100,
    alignSelf: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
  mealTextLight: {
    flex: 1,
    marginTop: -20,
    fontSize: 20,
    alignSelf: 'center',
  },
  mealTextDark: {
    flex: 1,
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
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(207, 207, 207, 1)',
  },
  addMealsDefaultDark: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(50, 50, 50, 1)',
  },
  addMealsPressedLight: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(177, 177, 177, 1)',
    justifyContent: 'center',
    alignContent: 'center',
  },
  addMealsPressedDark: {
    flex: 1,
    height: 40,
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
})

export default Index