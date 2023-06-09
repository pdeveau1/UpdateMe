import React, {FC, ReactElement, useEffect, useState} from 'react';
import {Text, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import Parse from 'parse/react-native';
import Styles from '../Styles';
import {useNavigation} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import defaultPreferences from '../data/preferences';
import defaultNotifications from '../data/notifications';

export const HelloUser: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();
  // State variable that will hold username value
  const [username, setUsername] = useState('');
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [notifications, setNotifications] = useState(defaultNotifications);

  // useEffect is called after the component is initially rendered and
  // after every other render
  useEffect(() => {
    // Since the async method Parse.User.currentAsync is needed to
    // retrieve the current user data, you need to declare an async
    // function here and call it afterwards
    async function getCurrentUser() {
      // This condition ensures that username is updated only if needed
      
      if (username === '') {
        const currentUser = await SecureStore.getItemAsync('userEmail');
        console.log(currentUser);
        //const currentUser = await Parse.User.currentAsync();
        if (currentUser !== null) {
          setUsername(currentUser);
        }
      }
    }
    getCurrentUser();
  }, [username]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Call your function here
      getPreferences();
      getLastNotification();
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
        if (response.status == 200) {
          const data = await response.json();
          console.log(data)
          setPreferences(data);
          console.log(preferences)
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
  const getLastNotification = async function (): Promise<boolean> {
    const endpoint = `https://fastapi-app-6keaqsjy5q-uk.a.run.app/users/${await SecureStore.getItemAsync('userEmail')}/last-notification`;

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
          console.log(data)
          setNotifications(data);
          console.log(notifications)
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
  // Note the condition operator here, so the "Hello" text is only
  // rendered if there is an username value
  return (
    <View style={Styles.login_wrapper}>
      <ScrollView style={Styles.form}>
        {username !== '' && <Text>{`Hello ${username}!`}</Text>}
        {username !== '' && <Text>{`Your last notification:`}</Text>}
        {notifications.weather_data.current_temp !== 0.0 && <Text>{`Weather:`}</Text>}
        {notifications.weather_data.current_temp !== 0.0 && <Text>{`Current temp ${notifications.weather_data.current_temp}, High ${notifications.weather_data.day_high}, Low ${notifications.weather_data.day_low} `}</Text>}
        {notifications.stock_data[0].symbol !== "" && <Text>{`Stocks:`}</Text>}
        {notifications.stock_data.map((item, index) => (
          <Text key={index}>{`${item.symbol} ${item.price}`}</Text>
        ))}
        {notifications.news_data[0].title !== "" && <Text>{`Top News:`}</Text>}
        {notifications.news_data.map((item, index) => (
          <Text key={index}>{`${item.title} - ${item.source}`}</Text>
        ))}
        {preferences.time_of_day !== "" && preferences.timezone != "" && <Text>{`You will be notified at ${preferences.time_of_day} ${preferences.timezone}`}</Text>}
      </ScrollView>
      <>
        <TouchableOpacity onPress={() => navigation.navigate('Update Preferences')}>
          <Text style={Styles.login_footer_text}>
            <Text style={Styles.login_footer_link}>{'Update Preferences'}</Text>
          </Text>
        </TouchableOpacity>
      </>
    </View>
  );
};