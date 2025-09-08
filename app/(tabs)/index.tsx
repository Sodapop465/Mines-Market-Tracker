import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native'
import AsyncStorage from 'expo-sqlite/kv-store'
import { Image } from 'expo-image'

const Index = () => {
  const [ meals, setMeals ] = useState<number|null>(null)
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  async function getMeals() {
    if (await AsyncStorage.getItem("numMeals") === null) {
      await AsyncStorage.setItemAsync("numMeals", "80")
    }
    await setMeals(Number(await AsyncStorage.getItem("numMeals")))
  }

  async function handlePress() {
    if (meals !== null) {
      await AsyncStorage.setItemAsync("numMeals", String(meals-1))
      setMeals(meals - 1)
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

  getMeals()

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