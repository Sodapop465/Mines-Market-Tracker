import React, { useState, useEffect } from 'react'
import { Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native'
import AsyncStorage from 'expo-sqlite/kv-store'
import * as SQLite from 'expo-sqlite'
import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync();


const Index = () => {
  const [ meals, setMeals ] = useState<number|null>(null)
  const width = Dimensions.get('window').width
  const height = Dimensions.get('window').height
  let database: SQLite.SQLiteDatabase

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
    await setMeals(Number(await AsyncStorage.getItem("numMeals")))
  }

  async function handlePress() {
    if (meals !== null) {
      // AsyncStorage
      await AsyncStorage.setItemAsync("numMeals", String(meals-1))
      setMeals(meals - 1)

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

  async function handleAdd() {
    if (meals !== null) {
      await AsyncStorage.setItemAsync("numMeals", String(meals+1))
      setMeals(meals + 1)
    } else {
      console.error("Could not set 'numMeals' key to AsyncStorage")
    }
  }

  setup()

  // hide splashcreen after everything loads
  useEffect(() => {
    SplashScreen.hideAsync()
  }, []);

  return(
    <ScrollView style={styles.container}>
      <Image
        style = {[styles.logo, { width: width }]}
        source = {require("../../assets/images/MinesMarketLogo.png")}
        contentFit="cover"
        transition={1000}
      />

      <Text style={styles.mealCount}>{String(meals)}</Text>
      <Text style={styles.mealText}>meals</Text>

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
          pressed ? styles.addMealsPressed : styles.addMealsDefault]}
        onPress={handleAdd}
      >
        <Text style={styles.addMealsText}>Add Meal</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    flex: 1,
    height: 100,
    width: 100,
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  mealCount: {
    flex: 1,
    fontSize: 100,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  mealText: {
    flex: 1,
    marginTop: -20,
    fontSize: 20,
    alignSelf: 'center',
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
  addMealsDefault: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(207, 207, 207, 1)',
  },
  addMealsPressed: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(177, 177, 177, 1)',
    justifyContent: 'center',
    alignContent: 'center',
  },
  addMealsText: {
    fontSize: 20,
    fontWeight: '700'
  },
})


export default Index