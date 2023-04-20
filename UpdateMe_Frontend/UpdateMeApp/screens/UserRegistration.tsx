import React, { FC, ReactElement, useState } from "react";
import { Alert, Button, StyleSheet, TextInput } from "react-native";
import Parse from "parse/react-native";

export const UserRegistration: FC<{}> = ({}): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const doUserRegistration = async function (): Promise<boolean> {
    const emailValue: string = email;
    const passwordValue: string = password;
    const firstNameValue: string = firstName;
    const lastNameValue: string = lastName;
    const phoneNumberValue: string = phoneNumber;
    
    const response = await fetch('http://127.0.0.1:8000/register', {
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
        phone_number: phoneNumberValue
      })
    });
    
    const result = await response.json();
    console.log(response)
    if (response.status == 201) {
      Alert.alert(
        "Success!",
        `User ${emailValue} was successfully created!`
      );
      return true;
    } else {
      Alert.alert("Error!", "User registration failed");
      return false;
    }
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
      <TextInput
        style={styles.input}
        value={phoneNumber}
        placeholder={"Phone Number"}
        onChangeText={(text) => setPhoneNumber(text)}
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