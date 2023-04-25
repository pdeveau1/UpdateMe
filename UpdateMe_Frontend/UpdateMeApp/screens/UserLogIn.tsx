import React, {FC, ReactElement, useState} from 'react';
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Parse from 'parse/react-native';
import {useNavigation} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Styles from '../Styles';

export const UserLogIn: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const doUserLogIn = async function (): Promise<boolean> {
    // Note that this values come from state variables that we've declared before
    const usernameValue: string = username;
    const passwordValue: string = password;
    const endpoint: string = 'https://fastapi-app-6keaqsjy5q-uk.a.run.app/login';
  
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
  
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      };

    return await fetch(endpoint, requestOptions)
      .then(async (response) => {
        console.log(response);
        if (response.status == 200) {
          const data = await response.json();
          // Navigation.navigate takes the user to the screen named after the one
          // passed as parameter
          await SecureStore.setItemAsync('userEmail', usernameValue);
          await SecureStore.setItemAsync('userToken', data.access_token);
          navigation.navigate('Home');
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
    <View style={Styles.login_wrapper}>
      <View style={Styles.form}>
        <TextInput
          style={Styles.form_input}
          value={username}
          placeholder={'Username'}
          onChangeText={(text) => setUsername(text)}
          autoCapitalize={'none'}
          keyboardType={'email-address'}
        />
        <TextInput
          style={Styles.form_input}
          value={password}
          placeholder={'Password'}
          secureTextEntry
          onChangeText={(text) => setPassword(text)}
        />
        <TouchableOpacity onPress={() => doUserLogIn()}>
          <View style={Styles.button}>
            <Text style={Styles.button_label}>{'Sign in'}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <>
        <TouchableOpacity onPress={() => navigation.navigate('Sign Up')}>
          <Text style={Styles.login_footer_text}>
            {"Don't have an account? "}
            <Text style={Styles.login_footer_link}>{'Sign up'}</Text>
          </Text>
        </TouchableOpacity>
      </>
    </View>
  );
};