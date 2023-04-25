import React, { FC, ReactElement, useState, useEffect } from "react";
import { Alert, Button, StyleSheet, TextInput, Text, TouchableOpacity, Switch, ScrollView } from "react-native";
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
  const [weatherNotify, setWeatherNotify] = useState(false);
  const toggleWeather = () => setWeatherNotify(previousState => !previousState);
  const [stockSymbol, setStockSymbol] = useState("");
  const [stocksNotify, setStocksNotify] = useState(false);
  const toggleStocks = () => setStocksNotify(previousState => !previousState);
  const [category, setCategory] = useState("");
  const [newsNotify, setNewsNotify] = useState(false);
  const toggleNews = () => setNewsNotify(previousState => !previousState);
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
    const endpoint = `https://fastapi-app-6keaqsjy5q-uk.a.run.app/preferences/${await SecureStore.getItemAsync('userEmail')}`;

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
        console.log(response)
        if (response.status == 200) {
          const data = await response.json();
          console.log(data);
          setZipCode(data.weather.location_zipcode);
          setWeatherNotify(data.weather.notify);
          setStockSymbol(data.stocks.stock_symbols.join());
          setCategory(data.news.category);
          const time = new Date();
          time.setHours(parseInt(data.time_of_day.split(":")[0]));
          time.setMinutes(parseInt(data.time_of_day.split(":")[1]));
          setTimeOfDay(time)
          timeOfDay.setHours(parseInt(data.time_of_day.split(":")[0]));
          timeOfDay.setMinutes(parseInt(data.time_of_day.split(":")[1]));
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

    const response = await fetch(`https://fastapi-app-6keaqsjy5q-uk.a.run.app/users/${await SecureStore.getItemAsync('userEmail')}/preferences`, {
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
                    timezone: "America/New_York"
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
      console.log(response.error)
      const error = await response.json();
      Alert.alert('Error!', error.message);
      return false;
    }
  };
  

  return (
    <>
    <ScrollView>
      <Text>{"Weather"}</Text>
      <TextInput
        style={styles.input}
        value={zipCode}
        placeholder={"Zip Code"}
        onChangeText={(text) => setZipCode(text)}
        autoCapitalize={"none"}
      />
      <Switch
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={weatherNotify ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleWeather}
        value={weatherNotify}
      />
      <Text>{"Stocks"}</Text>
      <TextInput
        style={styles.input}
        value={stockSymbol}
        placeholder={"Stock Symbol"}
        onChangeText={(text) => setStockSymbol(text)}
      />
      <Switch
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={stocksNotify ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleStocks}
        value={stocksNotify}
      />
      <Text>{"News"}</Text>
      <TextInput
        style={styles.input}
        value={category}
        placeholder={"News Category"}
        onChangeText={(text) => setCategory(text)}
      />
      <Switch
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={newsNotify ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleNews}
        value={newsNotify}
      />
      <DateTimePicker 
        mode="time" 
        value={timeOfDay}
        onChange={(event, selectedTime) => setTimeOfDay(selectedTime)}
      />
      <Button title={"Update Preferences"} onPress={() => doUpdateRegistration()} />
    </ScrollView>
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