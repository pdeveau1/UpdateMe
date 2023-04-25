import React, { FC, ReactElement, useState } from "react";
import { Alert, Button, StyleSheet, TextInput } from "react-native";
import Parse from "parse/react-native";
import {useNavigation} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export const UserRegistration: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const doUserRegistration = async function (): Promise<boolean> {
    const emailValue: string = email;
    const passwordValue: string = password;
    const firstNameValue: string = firstName;
    const lastNameValue: string = lastName;
    
    const response = await fetch('https://fastapi-app-6keaqsjy5q-uk.a.run.app/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: "111",
        email: emailValue,
        password: passwordValue,
        first_name: firstNameValue,
        last_name: lastNameValue,
        "notification_on": false
      })
    });
    
    const result = await response.json();
    console.log(response)
    if (response.status == 201) {
      Alert.alert(
        "Success!",
        `User ${emailValue} was successfully created!`
      );
      await doUserLogIn();
      return true;
    } else {
      Alert.alert("Error!", "User registration failed");
      return false;
    }
  };
  
  const doUserLogIn = async function (): Promise<boolean> {
    // Note that this values come from state variables that we've declared before
    const usernameValue: string = email;
    const passwordValue: string = password;
    const endpoint: string = 'https://fastapi-app-6keaqsjy5q-uk.a.run.app/login';
  
    const formData = new URLSearchParams();
    formData.append('username', usernameValue);
    formData.append('password', passwordValue);
  
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      };

    return await fetch(endpoint, requestOptions)
      .then(async (response) => {
        if (response.status == 200) {
          const data = await response.json();
          // Navigation.navigate takes the user to the screen named after the one
          // passed as parameter
          await SecureStore.setItemAsync('userEmail', usernameValue);
          await SecureStore.setItemAsync('userToken', data.access_token);
          navigation.navigate('Set Preferences');
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

  return (
    <>
      <TextInput
        style={styles.input}
        value={email}
        placeholder={"Email"}
        onChangeText={(text) => setEmail(text)}
        autoCapitalize={"none"}
      />
      <TextInput
        style={styles.input}
        value={password}
        placeholder={"Password"}
        secureTextEntry
        onChangeText={(text) => setPassword(text)}
      />
      <TextInput
        style={styles.input}
        value={firstName}
        placeholder={"First Name"}
        onChangeText={(text) => setFirstName(text)}
      />
      <TextInput
        style={styles.input}
        value={lastName}
        placeholder={"Last Name"}
        onChangeText={(text) => setLastName(text)}
      />
      <Button title={"Sign Up"} onPress={() => doUserRegistration()} />
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