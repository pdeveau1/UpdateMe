/**
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */
 import 'react-native-gesture-handler';
 import React from 'react';
 import {Image, SafeAreaView, StatusBar, Text, View} from 'react-native';
 
 import AsyncStorage from '@react-native-async-storage/async-storage';
 import Parse from 'parse/react-native';
 import {NavigationContainer} from '@react-navigation/native';
 import {createStackNavigator} from '@react-navigation/stack';
 import {UserRegistration} from './screens/UserRegistration';
 import {UserLogIn} from './screens/UserLogIn';
 import {UserLogOut} from './screens/UserLogOut';
 import {HelloUser} from './screens/HelloUser';
 import { SetPreferences } from './screens/SetPreferences';
 import { UpdatePreferences } from './screens/UpdatePreferences';
 import Styles from './Styles';
 
 // Your Parse initialization configuration goes here
 Parse.setAsyncStorage(AsyncStorage);
 const PARSE_APPLICATION_ID: string = 'YOUR_PARSE_APPLICATION_ID';
 const PARSE_HOST_URL: string = 'YOUR_PARSE_HOST_URL';
 const PARSE_JAVASCRIPT_ID: string = 'YOUR_PARSE_JAVASCRIPT_ID';
 Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_ID);
 Parse.serverURL = PARSE_HOST_URL;
 
 // Wrap your old app screen in a separate function, so you can create a screen inside the navigator
 // You can also declare your screens in a separate file, export and import here to reduce some clutter
 function UserRegistrationScreen() {
   return (
     <>
       <StatusBar />
       <SafeAreaView style={Styles.login_container}>
         <View style={Styles.login_header}>
           <Image
             style={Styles.login_header_logo}
             source={require('./assets/logo.png')}
           />
           <Text style={Styles.login_header_text}>
             <Text style={Styles.login_header_text_bold}>
               {'React Native on UpdateMe - '}
             </Text>
             {' User registration'}
           </Text>
         </View>
         <UserRegistration />
       </SafeAreaView>
     </>
   );
 }
 
 function UserLogInScreen() {
   return (
     <>
       <StatusBar />
       <SafeAreaView style={Styles.login_container}>
         <View style={Styles.login_header}>
           <Image
             style={Styles.login_header_logo}
             source={require('./assets/logo.png')}
           />
           <Text style={Styles.login_header_text}>
             <Text style={Styles.login_header_text_bold}>
               {'React Native on UpdateMe - '}
             </Text>
             {' User login'}
           </Text>
         </View>
         <UserLogIn />
       </SafeAreaView>
     </>
   );
 }

 function SetPreferencesScreen() {
  return (
    <>
      <StatusBar />
      <SafeAreaView style={Styles.login_container}>
        <View style={Styles.login_header}>
          <Image
            style={Styles.login_header_logo}
            source={require('./assets/logo.png')}
          />
          <Text style={Styles.login_header_text}>
            <Text style={Styles.login_header_text_bold}>
              {'React Native on UpdateMe - '}
            </Text>
            {' Set Preferences'}
          </Text>
        </View>
        <SetPreferences />
      </SafeAreaView>
    </>
  );
}

function UpdatePreferencesScreen() {
  return (
    <>
      <StatusBar />
      <SafeAreaView style={Styles.login_container}>
        <View style={Styles.login_header}>
          <Image
            style={Styles.login_header_logo}
            source={require('./assets/logo.png')}
          />
          <Text style={Styles.login_header_text}>
            <Text style={Styles.login_header_text_bold}>
              {'React Native on UpdateMe - '}
            </Text>
            {' Set Preferences'}
          </Text>
        </View>
        <UpdatePreferences />
      </SafeAreaView>
    </>
  );
}
 
 function HomeScreen() {
   return (
     <>
       <StatusBar />
       <SafeAreaView style={Styles.login_container}>
         <View style={Styles.login_header}>
           <Image
             style={Styles.login_header_logo}
             source={require('./assets/logo.png')}
           />
           <Text style={Styles.login_header_text}>
             <Text style={Styles.login_header_text_bold}>
               {'React Native on UpdateMe - '}
             </Text>
             {' Home'}
           </Text>
         </View>
         <HelloUser />
         <UserLogOut />
       </SafeAreaView>
     </>
   );
 }
 
 // This method instantiates and creates a new StackNavigator
 const Stack = createStackNavigator();
 
 // Add the stack navigator and inside it you can insert all your app screens, in the desired order
 const App = () => {
   return (
     <NavigationContainer>
       <Stack.Navigator>
         <Stack.Screen name="Login" component={UserLogInScreen} />
         <Stack.Screen name="Sign Up" component={UserRegistrationScreen} />
         <Stack.Screen name="Set Preferences" component={SetPreferencesScreen} />
         <Stack.Screen name="Update Preferences" component={UpdatePreferencesScreen} />
         <Stack.Screen name="Home" component={HomeScreen} />
         
       </Stack.Navigator>
     </NavigationContainer>
   );
 };
 
 export default App;