import React, {FC, ReactElement} from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';
import Parse from 'parse/react-native';
import {useNavigation} from '@react-navigation/native';
import {StackActions} from '@react-navigation/native';
import Styles from '../Styles';
import * as SecureStore from 'expo-secure-store';

export const UserLogOut: FC<{}> = ({}): ReactElement => {
  const navigation = useNavigation();

  const doUserLogOut = async function (): Promise<boolean> {
    return await SecureStore.deleteItemAsync('userToken')
      .then(async () => {
        await SecureStore.deleteItemAsync('userEmail');
        // To verify that current user is now empty, currentAsync can be used
        const currentUser = await SecureStore.getItemAsync('userEmail');
        if (currentUser === null) {
          Alert.alert('Success!', 'No user is logged in anymore!');
        }
        // Navigation dispatch calls a navigation action, and popToTop will take
        // the user back to the very first screen of the stack
        navigation.dispatch(StackActions.popToTop());
        return true;
      })
      .catch((error: object) => {
        Alert.alert('Error!', error.message);
        return false;
      });
  };

  return (
    <View style={Styles.login_wrapper}>
      <View style={Styles.form}>
        <TouchableOpacity onPress={() => doUserLogOut()}>
          <View style={Styles.button}>
            <Text style={Styles.button_label}>{'Logout'}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};