import * as Device from "expo-device";
import * as Cellular from "expo-cellular";
import * as Network from "expo-network";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebase, firestore } from "../firebase";

const getUserProfile = async (id) => {
  try {
    const userProfileJSON = await AsyncStorage.getItem(`userProfile-${id}`);

    if (!userProfileJSON || (userProfileJSON && !JSON.parse(userProfileJSON).created)) {
      const userProfileDoc = await firestore.collection("users").doc(id).get();
      if (!userProfileDoc.exists) throw new Error("Unable to retrieve user data.");
      const userProfileData = userProfileDoc.data();
      if (userProfileData) await AsyncStorage.setItem(`userProfile-${id}`, JSON.stringify(userProfileData));
      return userProfileData;
    } else {
      return JSON.parse(userProfileJSON);
    }
  } catch (error) {
    throw new Error(`Unable to get user profile for user "${id}", "${error.message}".`);
  }
};

const createUserProfile = async (id, data) => {
  try {
    const profile = {
      ...data,
      created: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      lastIpAddress: await Network.getIpAddressAsync(),
      lastLoggedInOn: firebase.firestore.FieldValue.serverTimestamp(),
      lastNameChange: firebase.firestore.FieldValue.serverTimestamp(),
      lastAgeChange: firebase.firestore.FieldValue.serverTimestamp(),
      locales: Localization.locales,
      timezone: Localization.timezone,
      identityVerified: false,
      devices: [
        {
          id:
            Device.deviceName.toLowerCase().replace(/ /g, "-") ||
            `${Device.manufacturer} ${Device.modelName}`.toLowerCase().replace(/ /g, "-"),
          brand: Device.brand,
          manufacturer: Device.manufacturer,
          model: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
          mobileCountryCode: await Cellular.getIsoCountryCodeAsync(),
        },
      ],
    };

    const docRef = await firestore.collection("users").doc(id).set(profile);
    await AsyncStorage.setItem(`userProfile-${id}`, JSON.stringify(profile));
    console.log(JSON.stringify(profile));
    return true;
  } catch (error) {
    throw new Error(`Unable to create profile for user "${id}", "${error.message}".`);
  }
};

const updateUserProfile = async (id, data) => {
  try {
    let userProfileJSON, userProfileData;
    userProfileJSON = await AsyncStorage.getItem(`userProfile-${id}`);

    if (!userProfileJSON) {
      const userProfileDoc = await firestore.collection("users").doc(id).get();
      if (!userProfileDoc.exists) throw new Error("Unable to retrieve user data.");
      userProfileData = userProfileDoc.data();
    } else {
      userProfileData = JSON.parse(userProfileJSON);
    }

    const currentDeviceId =
      Device.deviceName.toLowerCase().replace(/ /g, "-") ||
      `${Device.manufacturer} ${Device.modelName}`.toLowerCase().replace(/ /g, "-");

    const update = {
      ...data,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      lastIpAddress: await Network.getIpAddressAsync(),
      locales: Localization.locales,
      timezone: Localization.timezone,
    };

    if (
      !userProfileData?.devices ||
      !userProfileData?.devices.map((device) => device.id).includes(currentDeviceId)
    ) {
      update.devices = [
        ...(userProfileData?.devices || []),
        {
          id:
            Device.deviceName.toLowerCase().replace(/ /g, "-") ||
            `${Device.manufacturer} ${Device.modelName}`.toLowerCase().replace(/ /g, "-"),
          brand: Device.brand,
          manufacturer: Device.manufacturer,
          model: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
          mobileCountryCode: await Cellular.getIsoCountryCodeAsync(),
        },
      ];
    }

    await firestore.collection("users").doc(id).update(update);
    await AsyncStorage.setItem(`userProfile-${id}`, JSON.stringify(update));
  } catch (error) {
    throw new Error(`Unable to update user "${id}", "${error.message}".`);
  }
};

const updateLastLoggedInOn = async (id) => {
  try {
    let userProfileJSON, userProfileData;
    userProfileJSON = await AsyncStorage.getItem(`userProfile-${id}`);

    if (!userProfileJSON) {
      const userProfileDoc = await firestore.collection("users").doc(id).get();
      if (!userProfileDoc.exists) throw new Error("Unable to retrieve user data.");
      userProfileData = userProfileDoc.data();
    } else {
      userProfileData = JSON.parse(userProfileJSON);
    }

    const currentDeviceId =
      Device.deviceName.toLowerCase().replace(/ /g, "-") ||
      `${Device.manufacturer} ${Device.modelName}`.toLowerCase().replace(/ /g, "-");

    const update = {
      lastLoggedInOn: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      lastIpAddress: await Network.getIpAddressAsync(),
      locales: Localization.locales,
      timezone: Localization.timezone,
    };

    if (
      !userProfileData?.devices ||
      !userProfileData?.devices.map((device) => device.id).includes(currentDeviceId)
    ) {
      update.devices = [
        ...(userProfileData?.devices || []),
        {
          id:
            Device.deviceName.toLowerCase().replace(/ /g, "-") ||
            `${Device.manufacturer} ${Device.modelName}`.toLowerCase().replace(/ /g, "-"),
          brand: Device.brand,
          manufacturer: Device.manufacturer,
          model: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
          mobileCountryCode: await Cellular.getIsoCountryCodeAsync(),
        },
      ];
    }

    await firestore.collection("users").doc(id).update(update);
    await AsyncStorage.setItem(`userProfile-${id}`, JSON.stringify(update));
  } catch (error) {
    throw new Error(`Unable to update user "${id}" lastLoggedInOn, "${error.message}".`);
  }
};

const deleteUserProfile = async (id) => {
  try {
    const docRef = await firestore.collection("users").doc(id).delete();
    await AsyncStorage.removeItem(`userProfile-${id}`);
  } catch (error) {
    throw new Error(`Unable to delete user "${id}", "${error.message}".`);
  }
};

export { getUserProfile, createUserProfile, updateUserProfile, updateLastLoggedInOn, deleteUserProfile };
