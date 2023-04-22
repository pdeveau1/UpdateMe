import React, { FC, ReactElement, useState } from "react";
import { Alert, Button, StyleSheet, TextInput, Text, TouchableOpacity } from "react-native";
import Parse from "parse/react-native";
import {useNavigation} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Styles from '../Styles';

export const SetPreferences: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();

  const [zipCode, setZipCode] = useState("");
  const [stockSymbol, setStockSymbol] = useState("");
  const [category, setCategory] = useState("");

  const doSetRegistration = async function (): Promise<boolean> {
    const zipCodeValue: string = zipCode;
    const stockSymbolValue: string = stockSymbol;
    const categoryValue: string = category;
    
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
            stock_symbols: [
              stockSymbolValue
            ]
          },
          news: {
            notify: true,
            category: categoryValue
          },
          time_of_day: "string",
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
      <Button title={"Set Preferences"} onPress={() => doSetRegistration()} />
    </>
    <>
    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
      <Text style={Styles.login_footer_text}>
        <Text style={Styles.login_footer_link}>{'Skip'}</Text>
      </Text>
    </TouchableOpacity>
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