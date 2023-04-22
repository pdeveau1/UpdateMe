import React, { FC, ReactElement, useState, useEffect } from "react";
import { Alert, Button, StyleSheet, TextInput, Text, TouchableOpacity } from "react-native";
import Parse from "parse/react-native";
import {useNavigation} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Styles from '../Styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import defaultPreferences from '../data/preferences';

export const UpdatePreferences: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();

  const [preferences, setPreferences] = useState(defaultPreferences);
  const [zipCode, setZipCode] = useState("");
  const [stockSymbol, setStockSymbol] = useState("");
  const [category, setCategory] = useState("");
  const [timeOfDay, setTimeOfDay] = useState(new Date());

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      // Call your function here
      await getPreferences();
    });

    // Return the cleanup function
    return unsubscribe;
  }, [navigation]);  
  
const getPreferences = async function (): Promise<boolean> {
    const endpoint = `http://127.0.0.1:8000/preferences/${await SecureStore.getItemAsync('userEmail')}`;

    const requestBody = {
      email: await SecureStore.getItemAsync('userEmail')
    };
    
    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json',
                  Authorization: `Bearer ${await SecureStore.getItemAsync('userToken')}`, },
      //body: JSON.stringify(requestBody),
    };
    return await fetch(endpoint, requestOptions)
      .then(async (response) => {
        if (response.status == 200) {
          const data = await response.json();
          console.log(data);
          setZipCode(data.weather.location_zipcode);
          setStockSymbol(data.stocks.stock_symbols.join());
          setCategory(data.news.category);
          // Navigation.navigate takes the user to the screen named after the one
          // passed as parameter
          return true;
        } else {
          const error = await response.json();
          Alert.alert('Error!', error.message);
          return false;
        }
      })
      .catch((error) => {
        // Error can be caused by wrong parameters or lack of Internet connection
        Alert.alert('Error!', error.message);
        return false;
      });
  };

  const doUpdateRegistration = async function (): Promise<boolean> {
    const zipCodeValue: string = zipCode;
    const stockSymbolValue: string[] = stockSymbol.split(',');
    const categoryValue: string = category;
    const timeOfDayValue: string = `${timeOfDay.getHours().toString()}:${timeOfDay.getMinutes().toString()}`;

    const response = await fetch(`http://127.0.0.1:8000/users/${await SecureStore.getItemAsync('userEmail')}/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json',
                  Authorization: `Bearer ${await SecureStore.getItemAsync('userToken')}`, },
                  body: JSON.stringify({
                    weather: {
                      notify: true,
                      location_zipcode: zipCodeValue
                    },
                    stocks: {
                      notify: true,
                      stock_symbols:
                        stockSymbolValue
                    },
                    news: {
                      notify: true,
                      category: categoryValue
                    },
                    time_of_day: timeOfDayValue,
                    timezone: "string"
                })
    });
    const result = await response.json();
    console.log(response)
    if (response.status == 200) {
      Alert.alert(
        "Success!",
        `Preferences successfully set!`
      );
      navigation.navigate('Home');
      return true;
    } else {
      Alert.alert("Error!", "User registration failed");
      return false;
    }
  };
  

  return (
    <>
    <>
      <Text>{"Weather"}</Text>
      <TextInput
        style={styles.input}
        value={zipCode}
        placeholder={"Zip Code"}
        onChangeText={(text) => setZipCode(text)}
        autoCapitalize={"none"}
      />
      <Text>{"Stocks"}</Text>
      <TextInput
        style={styles.input}
        value={stockSymbol}
        placeholder={"Stock Symbol"}
        onChangeText={(text) => setStockSymbol(text)}
      />
      <Text>{"News"}</Text>
      <TextInput
        style={styles.input}
        value={category}
        placeholder={"News Category"}
        onChangeText={(text) => setCategory(text)}
      />
      <DateTimePicker 
        mode="time" 
        value={timeOfDay}
        onChange={(event, selectedTime) => setTimeOfDay(selectedTime)}
      />
      <Button title={"Update Preferences"} onPress={() => doUpdateRegistration()} />
    </>
  </>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
});