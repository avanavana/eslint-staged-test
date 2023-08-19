import React, { useEffect, useState, useContext, useRef, useMemo, useCallback } from "react";
import {
  Animated,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  View,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  PixelRatio,
  Keyboard,
} from "react-native";
import BottomSheet, {
  useBottomSheetSpringConfigs,
  BottomSheetFlatList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Camera, CameraType } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { ProfileContext } from "../../contexts/ProfileContext";
import { useChatClient } from "../../hooks/useChatClient";
import { firebase } from "../../firebase";
import { createUserProfile, getUserProfile } from "../../hooks/useFirestore";
import { useThemeContext } from "../../hooks/useThemeContext";
import {
  checkIfEveryCharIsEmoji,
  checkForCodeInString,
  validateUsername,
  validateAboutMe,
  validateFacebook,
  validateInstagram,
  validateSnapchat,
  validateTiktok,
  validateTwitter,
  calculateAge,
  formatDate,
  extractLastInitial,
  keyRegExp,
} from "../../utilities";
import { locationMappings, emojis } from "../../mappings";
import { t } from "../../locales";
import styles from "./styles";

import LogoText from "../../components/LogoText";
import BrandText from "../../components/BrandText";
import BrandBoldText from "../../components/BrandBoldText";
import Message from "../../components/Message";
import Input from "../../components/Input";
import DismissKeyboard from "../../components/DismissKeyboard";
import MoreInfo from "../../components/MoreInfo";
import ListItem from "../../components/ListItem";
import EmojiListItem from "../../components/EmojiListItem";
import Emoji from "../../components/Emoji";
import AnimatedBackdrop from "../../components/AnimatedBackdrop";
import GrowingImage from "../../components/GrowingImage";
import ImageEditor from "../../components/ImageEditor";
import CameraButton from "../../components/CameraButton";
import LicenseAgreement from "../../components/LicenseAgreement";
import NextButton from "../../components/NextButton";
import BirthdatePicker from "../../components/BirthdatePicker";

const screenWidth = Math.min(Dimensions.get("window").height, Dimensions.get("window").width);
const screenHeight = Math.max(Dimensions.get("window").height, Dimensions.get("window").width);
const locations = Array.from(locationMappings.values()).map((location, i) => ({ value: i, name: location }));

let pixelRatio = PixelRatio.get();
if (pixelRatio < 1.5) pixelRatio = 1;
else if (pixelRatio < 2) pixelRatio = 1.5;
else if (pixelRatio < 3) pixelRatio = 2;
else pixelRatio = 3;

const formStateInitial = {
  onboardingFirstName: {
    type: "text",
    value: "",
    placeholder: t("profile.firstName.placeholder"),
    hint: "",
    props: {
      autoCorrect: false,
      autoComplete: "name-given",
      textContentType: "givenName",
      maxLength: 64,
    },
    validation: {
      required: true,
      method: validateUsername,
    },
    valid: null,
    dirty: false,
    page: 2,
  },
  onboardingLastName: {
    type: "text",
    value: "",
    placeholder: t("profile.lastName.placeholder"),
    hint: t("profile.lastName.hint"),
    props: {
      autoCorrect: false,
      autoComplete: "name-family",
      textContentType: "familyName",
      maxLength: 64,
    },
    validation: {
      required: true,
      method: validateUsername,
    },
    valid: null,
    dirty: false,
    page: 2,
  },
  onboardingBirthdate: {
    type: "date",
    value: "",
    placeholder: t("profile.birthdate.placeholder"),
    hint: t("profile.birthdate.hint"),
    props: {
      autoComplete: "birthdate-full",
    },
    validation: {
      required: true,
      method: (value) => value !== "",
    },
    valid: null,
    dirty: false,
    page: 3,
  },
  onboardingLocation: {
    type: "autocompleteSelect",
    value: { value: null, name: "" },
    placeholder: t("profile.location.placeholder"),
    hint: t("profile.location.hint"),
    props: {},
    validation: {
      required: true,
      method: (value) => Boolean(value?.name),
    },
    valid: null,
    dirty: false,
    page: 4,
  },
  onboardingAboutMe: {
    type: "textArea",
    value: "",
    placeholder: t("profile.aboutMe.placeholder"),
    hint: t("profile.aboutMe.hint"),
    props: {
      multiline: true,
      maxLength: 140,
      autoComplete: "off",
      textContentType: "none",
    },
    validation: {
      required: null,
      method: (value) => validateAboutMe(value),
    },
    valid: null,
    dirty: false,
    page: 5,
  },
  onboardingPhotos: {
    type: "photoUpload",
    value: [],
    placeholder: t("profile.photos.placeholder"),
    hint: t("profile.photos.hint"),
    props: {},
    validation: {
      required: true,
      method: (value) => value.length > 0,
    },
    valid: null,
    dirty: false,
    page: 6,
  },
  onboardingRelationshipStatus: {
    type: "emojiSelect",
    value: "",
    placeholder: t("profile.relationshipStatus.placeholder"),
    hint: t("profile.relationshipStatus.hint"),
    props: {
      dataType: "relationshipStatus",
      title: t("profile.relationshipStatus.title"),
    },
    validation: {
      required: true,
      method: (value) => value.length > 0,
    },
    valid: null,
    dirty: false,
    page: 7,
  },
  onboardingLookingFor: {
    type: "emojiMultiSelect",
    value: [],
    placeholder: t("profile.lookingFor.placeholder"),
    hint: t("profile.lookingFor.hint"),
    props: {
      dataType: "lookingFor",
      title: t("profile.lookingFor.title"),
    },
    validation: {
      required: true,
      method: (value) => value.length > 0,
    },
    valid: null,
    dirty: false,
    page: 8,
  },
  onboardingEmojisUser: {
    type: "emojiMultiSelect",
    value: [],
    placeholder: t("profile.emojisUser.placeholder"),
    hint: t("profile.emojisUser.hint"),
    props: {
      dataType: "emoji",
      title: t("profile.emojisUser.title"),
    },
    validation: {
      required: true,
      method: (value) => value.length > 0,
    },
    valid: null,
    dirty: false,
    page: 9,
  },
  onboardingSocialFacebook: {
    type: "socialText",
    value: { id: "", shown: false, verified: false },
    placeholder: t("profile.socialFacebook.placeholder"),
    hint: t("profile.socialFacebook.hint"),
    props: {
      kind: "facebook",
      caption: "Facebook",
    },
    validation: {
      required: null,
      method: (value) => validateFacebook(value),
    },
    valid: null,
    dirty: false,
    page: 10,
  },
  onboardingSocialInstagram: {
    type: "socialText",
    value: { id: "", shown: false, verified: false },
    placeholder: t("profile.socialInstagram.placeholder"),
    hint: t("profile.socialInstagram.hint"),
    props: {
      kind: "instagram",
      caption: "Instagram",
    },
    validation: {
      required: null,
      method: (value) => validateInstagram(value),
    },
    valid: null,
    dirty: false,
    page: 10,
  },
  onboardingSocialSnapchat: {
    type: "socialText",
    value: { id: "", shown: false, verified: false },
    placeholder: t("profile.socialSnapchat.placeholder"),
    hint: t("profile.socialSnapchat.placeholder"),
    props: {
      kind: "snapchat",
      caption: "Snapchat",
    },
    validation: {
      required: null,
      method: (value) => validateSnapchat(value),
    },
    valid: null,
    dirty: false,
    page: 10,
  },
  onboardingSocialTiktok: {
    type: "socialText",
    value: { id: "", shown: false, verified: false },
    placeholder: t("profile.socialTiktok.placeholder"),
    hint: t("profile.socialTiktok.hint"),
    props: {
      kind: "tiktok",
      caption: "TikTok",
    },
    validation: {
      required: null,
      method: (value) => validateTiktok(value),
    },
    valid: null,
    dirty: false,
    page: 10,
  },
  onboardingSocialTwitter: {
    type: "socialText",
    value: { id: "", shown: false, verified: false },
    placeholder: t("profile.socialTwitter.placeholder"),
    hint: t("profile.socialTwitter.hint"),
    props: {
      kind: "twitter",
      caption: "Twitter",
    },
    validation: {
      required: null,
      method: (value) => validateTwitter(value),
    },
    valid: null,
    dirty: false,
    page: 10,
  },
  onboardingAgePreferences: {
    type: "range",
    value: [25, 45],
    placeholder: t("profile.agePreferences.placeholder"),
    hint: t("profile.agePreferences.hint"),
    props: {
      min: 18,
      max: 99,
      tooltipColor: "#000000aa",
      trackColor: "#e2ada0",
      color: "#fff",
    },
    validation: {
      required: null,
      method: () => true,
    },
    valid: null,
    dirty: false,
    page: 12,
  },
  onboardingEmojisOthers: {
    type: "emojiMultiSelect",
    value: [],
    placeholder: t("profile.emojisOthers.placeholder"),
    hint: t("profile.emojisOthers.hint"),
    props: {
      dataType: "emoji",
      title: t("profile.emojisOthers.title"),
    },
    validation: {
      required: true,
      method: (value) => value.length > 0,
    },
    valid: null,
    dirty: false,
    page: 13,
  },
  onboardingRelationshipStatusPreferences: {
    type: "emojiMultiSelect",
    value: [],
    placeholder: t("profile.relationshipStatusPreferences.placeholder"),
    hint: t("profile.relationshipStatusPreferences.hint"),
    props: {
      dataType: "relationshipStatus",
      title: t("profile.relationshipStatusPreferences.title"),
    },
    validation: {
      required: false,
      method: () => true,
    },
    valid: null,
    dirty: false,
    page: 14,
  },
  onboardingLookingForPreferences: {
    type: "emojiMultiSelect",
    value: [],
    placeholder: t("profile.lookingForPreferences.placeholder"),
    hint: t("profile.lookingForPreferences.hint"),
    props: {
      dataType: "lookingFor",
      title: t("profile.lookingForPreferences.title"),
    },
    validation: {
      required: false,
      method: () => true,
    },
    valid: null,
    dirty: false,
    page: 15,
  },
  onboardingAgreeToTerms: {
    type: "checkbox",
    value: false,
    placeholder: t("onboardingScreen.agreeToTerms.placeholder"),
    hint: t("onboardingScreen.agreeToTerms.hint"),
    props: {
      activeColor: "#d8a53a",
      inactiveColor: "#ffffffaa",
      labelTextSize: 16,
      size: 24,
      corners: 4,
    },
    validation: {
      required: true,
      method: (value) => value === true,
    },
    valid: null,
    dirty: false,
    page: 16,
  },
};

const populateInitialPageValidity = () => {
  const inputs = Object.values(formStateInitial);
  const pageAmount = Math.max(...inputs.map(({ page }) => page));

  return [...Array(pageAmount)].reduce((acc, _, index) => {
    const pageInputs = inputs.filter(({ page }) => page === index + 1);
    const isPageValid = pageInputs.length === 0 || pageInputs.every(({ validation }) => !validation.required);

    return { ...acc, [index + 1]: isPageValid };
  }, {});
};

const ERROR_MISSING_FIRST_NAME = 0;
const ERROR_MISSING_LAST_NAME = 1;
const ERROR_MISSING_BIRTHDATE = 2;
const ERROR_MISSING_LOCATION = 3;
const ERROR_URL_IN_TEXT = 4;
const ERROR_AT_LEAST_ONE_RELATIONSHIPSTATUS_SELECTION = 5;
const ERROR_AT_LEAST_ONE_LOOKINGFOR_SELECTION = 6;
const ERROR_AT_LEAST_ONE_USEREMOJI_SELECTION = 7;
const ERROR_INVALID_FACEBOOK_USERNAME = 8;
const ERROR_INVALID_INSTAGRAM_USERNAME = 9;
const ERROR_INVALID_SNAPCHAT_USERNAME = 10;
const ERROR_INVALID_TIKTOK_USERNAME = 11;
const ERROR_INVALID_TWITTER_USERNAME = 12;
const ERROR_AT_LEAST_ONE_OTHERSEMOJI_SELECTION = 13;
const ERROR_MISSING_PHOTO = 14;
const ERROR_VALID_FIRST_NAME = 15;
const ERROR_VALID_LAST_NAME = 16;
const ERROR_USERNAME_URL = 17;

const validationErrorMappings = new Map([
  [0, { field: "onboardingLastName", text: t("onboardingScreen.error.enterFirstName") }],
  [1, { field: "onboardingLastName", text: t("onboardingScreen.error.enterLastName") }],
  [2, { field: "onboardingBirthdate", text: t("onboardingScreen.error.birthday") }],
  [3, { field: "onboardingLocation", text: t("onboardingScreen.error.location") }],
  [4, { field: "onboardingAboutMe", text: t("onboardingScreen.error.url") }],
  [5, { field: "onboardingRelationshipStatus", text: t("onboardingScreen.error.chooseOne") }],
  [6, { field: "onboardingLookingFor", text: t("onboardingScreen.error.chooseAtLeastOne") }],
  [7, { field: "onboardingEmojisUser", text: t("onboardingScreen.error.chooseAtLeastOne") }],
  [8, { field: "onboardingSocialFacebook", text: t("onboardingScreen.error.facebook") }],
  [9, { field: "onboardingSocialInstagram", text: t("onboardingScreen.error.instagram") }],
  [10, { field: "onboardingSocialSnapchat", text: t("onboardingScreen.error.snapchat") }],
  [11, { field: "onboardingSocialTiktok", text: t("onboardingScreen.error.tiktok") }],
  [12, { field: "onboardingSocialTwitter", text: t("onboardingScreen.error.twitter") }],
  [13, { field: "onboardingEmojisOthers", text: t("onboardingScreen.error.chooseAtLeastOne") }],
  [14, { field: "onboardingPhotos", text: t("onboardingScreen.error.atLeastOnePhoto") }],
  [15, { field: "onboardingLastName", text: t("onboardingScreen.error.validFirstName") }],
  [16, { field: "onboardingLastName", text: t("onboardingScreen.error.validLastName") }],
  [17, { field: "onboardingLastName", text: t("onboardingScreen.error.url") }],
]);

const OnboardingScreen = ({ route }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageValid, setIsPageValid] = useState(() => populateInitialPageValidity());
  const [validationErrors, setValidationErrors] = useState(() => new Set());
  const [errors, setErrors] = useState(() => new Set());
  const [showMessage, setShowMessage] = useState("");
  const [formState, setFormState] = useState(formStateInitial);
  const [addPhotoBottomSheetOpen, setAddPhotoBottomSheetOpen] = useState(false);
  const [editPhotoBottomSheetOpen, setEditPhotoBottomSheetOpen] = useState(false);
  const [selectedImageUpload, setSelectedImageUpload] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraResultOpen, setCameraResultOpen] = useState(false);
  const [cameraResult, setCameraResult] = useState(false);
  const [cameraRatio, setCameraRatio] = useState("4:3");
  const [isCameraRatioSet, setIsCameraRatioSet] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState("auto");
  const [emojiListModalOpen, setEmojiListModalOpen] = useState(false);
  const [activeEmojiList, setActiveEmojiList] = useState("onboardingRelationshipStatus");
  const [tempSelectValue, setTempSelectValue] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const { chatClient } = useChatClient();
  const { setProfileCompleted } = useContext(ProfileContext);
  const sliderRef = useRef(null);
  const addPhotoBottomSheetRef = useRef(null);
  const editPhotoBottomSheetRef = useRef(null);
  const cameraRef = useRef(null);
  const editorRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();

  const pageScrollOffset = new Animated.Value(0);

  const checkForValidationError = (errorCode, condition) => {
    if (!condition) {
      if (!validationErrors.has(errorCode)) setValidationErrors((state) => new Set(state).add(errorCode));
    } else {
      setValidationErrors((state) => {
        const next = new Set(state);
        next.delete(errorCode);
        return next;
      });
    }
  };

  useEffect(() => {
    if (Object.values(formState).some((field) => !field.valid)) {
      if (formState.onboardingFirstName.dirty) {
        checkForValidationError(ERROR_MISSING_FIRST_NAME, formState.onboardingFirstName.value.length > 0);
        checkForValidationError(
          ERROR_VALID_FIRST_NAME,
          !checkIfEveryCharIsEmoji(formState.onboardingFirstName.value) &&
            !checkForCodeInString(formState.onboardingFirstName.value)
        );
      }

      if (formState.onboardingLastName.dirty) {
        checkForValidationError(ERROR_MISSING_LAST_NAME, formState.onboardingLastName.value.length > 0);
        checkForValidationError(
          ERROR_VALID_LAST_NAME,
          !checkIfEveryCharIsEmoji(formState.onboardingLastName.value) &&
            !checkForCodeInString(formState.onboardingLastName.value)
        );
      }

      if (formState.onboardingFirstName.dirty || formState.onboardingLastName.dirty) {
        checkForValidationError(
          ERROR_USERNAME_URL,
          validateAboutMe(formState.onboardingFirstName.value.trim()) &&
            validateAboutMe(formState.onboardingLastName.value.trim())
        );
      }

      if (formState.onboardingBirthdate.dirty) {
        checkForValidationError(ERROR_MISSING_BIRTHDATE, formState.onboardingBirthdate.value !== "");
      }

      if (formState.onboardingLocation.dirty) {
        checkForValidationError(ERROR_MISSING_LOCATION, formState.onboardingLocation.valid);
      }

      if (formState.onboardingAboutMe.dirty) {
        checkForValidationError(ERROR_URL_IN_TEXT, validateAboutMe(formState.onboardingAboutMe.value));
      }

      if (formState.onboardingPhotos.dirty) {
        checkForValidationError(ERROR_MISSING_PHOTO, formState.onboardingPhotos.value.length > 0);
      }

      if (formState.onboardingRelationshipStatus.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_RELATIONSHIPSTATUS_SELECTION,
          formState.onboardingRelationshipStatus.value.length > 0
        );
      }

      if (formState.onboardingLookingFor.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_LOOKINGFOR_SELECTION,
          formState.onboardingLookingFor.value.length > 0
        );
      }

      if (formState.onboardingEmojisUser.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_USEREMOJI_SELECTION,
          formState.onboardingEmojisUser.value.length > 0
        );
      }

      if (formState.onboardingSocialFacebook.dirty && formState.onboardingSocialFacebook.value.id) {
        checkForValidationError(
          ERROR_INVALID_FACEBOOK_USERNAME,
          validateFacebook(formState.onboardingSocialFacebook.value.id)
        );
      }

      if (formState.onboardingSocialInstagram.dirty && formState.onboardingSocialInstagram.value.id) {
        checkForValidationError(
          ERROR_INVALID_INSTAGRAM_USERNAME,
          validateInstagram(formState.onboardingSocialInstagram.value.id)
        );
      }

      if (formState.onboardingSocialSnapchat.dirty && formState.onboardingSocialSnapchat.value.id) {
        checkForValidationError(
          ERROR_INVALID_SNAPCHAT_USERNAME,
          validateSnapchat(formState.onboardingSocialSnapchat.value.id)
        );
      }

      if (formState.onboardingSocialTiktok.dirty && formState.onboardingSocialTiktok.value.id) {
        checkForValidationError(
          ERROR_INVALID_TIKTOK_USERNAME,
          validateTiktok(formState.onboardingSocialTiktok.value.id)
        );
      }

      if (formState.onboardingSocialTwitter.dirty && formState.onboardingSocialTwitter.value.id) {
        checkForValidationError(
          ERROR_INVALID_TWITTER_USERNAME,
          validateTwitter(formState.onboardingSocialTwitter.value.id)
        );
      }

      if (formState.onboardingEmojisOthers.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_OTHERSEMOJI_SELECTION,
          formState.onboardingEmojisOthers.value.length > 0
        );
      }
    }

    for (const field in formState) {
      if (
        !formState[field].value.toString().length &&
        formState[field].type !== "emojiSelect" &&
        formState[field].type !== "emojiMultiSelect" &&
        formState[field].type !== "socialText" &&
        field !== "onboardingFirstName" &&
        field !== "onboardingLastName" &&
        field !== "onboardingBirthdate" &&
        field !== "onboardingPhotos"
      ) {
        Array.from(validationErrorMappings.entries())
          .map((error) => ({ code: error[0], ...error[1] }))
          .filter((error) => error.field === field)
          .forEach((error) => {
            setValidationErrors((state) => {
              const next = new Set(state);
              next.delete(error.code);
              return next;
            });
          });
      }
    }

    const isCurrentPageValid = !Object.entries(formState)
      .map((field) => ({ id: field[0], ...field[1] }))
      .filter(({ page, validation }) => page === currentPage && validation.required)
      .some(
        (field) =>
          !field.dirty || field.valid === false || field.value.toString() === "" || field.value?.name === ""
      );

    setIsPageValid((prevState) => ({ ...prevState, [currentPage]: isCurrentPageValid }));
  }, [formState]);

  const validateInput = (value, { required, method }) =>
    required === null ? method(value) : required ? method(value) : true;

  const goToPage = (page) => {
    sliderRef.current.scrollTo({ x: screenWidth * (page - 1), y: 0, animated: true });
    setCurrentPage(page);
  };

  const publishPhotos = async () => {
    if (formState.onboardingPhotos.value.length) {
      try {
        const options = {
          method: "POST",
          headers: {
            Authorization: `Bearer ${route.params?.token}`,
            "Content-type": "application/json",
            "x-tfp-user": route.params?.user?.userId,
          },
        };

        options.body = JSON.stringify({
          payload: formState.onboardingPhotos.value.map((photo) => photo.key),
        });
        const { keys, data } = await (
          await fetch(`${Constants.manifest?.extra?.awsEndpoint}/copyUploads`, options)
        ).json();
        if (!keys || data.length !== formState.onboardingPhotos.value.length)
          throw new Error(t("onboardingScreen.error.photoUpload"));
        return { response: data };
      } catch (error) {
        return { error };
      }
    }
  };

  const completeProfile = async () => {
    try {
      if (!formState.onboardingPhotos.value.length)
        throw new Error(t("onboardingScreen.error.atLeastOnePhoto"));
      const { response, error } = publishPhotos();
      if (error) throw new Error(t("onboardingScreen.error.unableToCreateProfile"));

      const lastInitial = extractLastInitial(formState.onboardingLastName.value);
      const username = `${formState.onboardingFirstName.value}${
        lastInitial.length ? ` ${lastInitial}.` : ""
      }`;

      const data = {
        profile: {
          name: username,
          firstName: formState.onboardingFirstName.value,
          lastName: formState.onboardingLastName.value,
          lastInitial,
          birthdate: firebase.firestore.Timestamp.fromDate(new Date(formState.onboardingBirthdate.value)),
          birthdateString: new Date(formState.onboardingBirthdate.value).toISOString(),
          aboutMe: formState.onboardingAboutMe.value,
          photos: Object.fromEntries(
            formState.onboardingPhotos.value.map((photo, i) => [
              i,
              {
                addedOn: firebase.firestore.FieldValue.serverTimestamp(),
                files: {
                  def: `${Constants.manifest?.extra?.awsPhotos}/${keyRegExp.exec(photo.key)[1]}.jpg`,
                  thumb: `${Constants.manifest?.extra?.awsThumbnails}/${keyRegExp.exec(photo.key)[1]}.jpg`,
                  id: keyRegExp.exec(photo.key)[1],
                  type: "image",
                },
              },
            ])
          ),
          social: {
            facebook: formState.onboardingSocialFacebook.value,
            instagram: formState.onboardingSocialInstagram.value,
            snapchat: formState.onboardingSocialSnapchat.value,
            tiktok: formState.onboardingSocialTiktok.value,
            twitter: formState.onboardingSocialTwitter.value,
          },
          relationshipStatus: formState.onboardingRelationshipStatus.value,
          lookingFor: formState.onboardingLookingFor.value,
          emojisUser: formState.onboardingEmojisUser.value,
          emojisOthers: formState.onboardingEmojisOthers.value,
        },
        profilePhoto: {
          addedOn: firebase.firestore.FieldValue.serverTimestamp(),
          files: {
            def: `${Constants.manifest?.extra?.awsPhotos}/${
              keyRegExp.exec(formState.onboardingPhotos.value[0].key)[1]
            }.jpg`,
            thumb: `${Constants.manifest?.extra?.awsThumbnails}/${
              keyRegExp.exec(formState.onboardingPhotos.value[0].key)[1]
            }.jpg`,
            id: keyRegExp.exec(formState.onboardingPhotos.value[0].key)[1],
            type: "image",
          },
        },
        searchPreferences: {
          agePreferences: formState.onboardingAgePreferences.value,
          locationId: formState.onboardingLocation.value.value,
          relationshipStatusPreferences: formState.onboardingRelationshipStatusPreferences.value,
          lookingForPreferences: formState.onboardingLookingForPreferences.value,
        },
        onboarded: true,
        verified:
          !(
            route.params?.user?.providerData.length === 1 && route.params?.user?.providerData[0].providerId
          ) || route.params?.user?.emailVerified,
        providerId: route.params?.user?.providerData.length
          ? route.params?.user?.providerData[0].providerId
          : null,
        email: route.params?.user?.email || null,
        phone: route.params?.user?.phoneNumber || null,
        appleId: route.params?.user?.providerData.filter(({ providerId }) => providerId === "apple.com")
          .length
          ? route.params?.user?.providerData.filter(({ providerId }) => providerId === "apple.com")[0].uid
          : null,
        facebookId: route.params?.user?.providerData.filter(({ providerId }) => providerId === "facebook.com")
          .length
          ? route.params?.user?.providerData.filter(({ providerId }) => providerId === "facebook.com")[0].uid
          : null,
        googleId: route.params?.user?.providerData.filter(({ providerId }) => providerId === "google.com")
          .length
          ? route.params?.user?.providerData.filter(({ providerId }) => providerId === "google.com")[0].uid
          : null,
        authProviders: route.params?.user?.providerData.length
          ? route.params?.user?.providerData.map((provider) => provider.providerId)
          : route.params?.user?.providerId
          ? [route.params?.user?.providerId]
          : [],
      };

      const wasCreated = createUserProfile(route.params?.user?.userId, data);
      if (!wasCreated) throw new Error(t("onboardingScreen.error.unableToCreateProfile"));

      const chatProfileUpdate = {
        id: route.params?.user?.userId,
        set: {
          name: data.profile.name,
          image: data.profilePhoto.files.thumb,
        },
      };

      await chatClient.partialUpdateUser(chatProfileUpdate);
      setProfileCompleted(true);
    } catch (err) {
      setShowMessage(err.message);
      setTimeout(() => setShowMessage(""), 3000);
      console.log(err);
    }
  };

  const goNext = useCallback(() => {
    setCurrentPage((prevPage) => {
      sliderRef.current.scrollTo({ x: screenWidth * prevPage, y: 0, animated: true });
      return prevPage + 1;
    });
  }, []);

  const moveImageUploadBehind = (i) => {
    const formInput = { ...formState };
    const images = [...formInput.onboardingPhotos.value];
    images.splice((i + 1) % formInput.onboardingPhotos.value.length, 0, images.splice(i, 1)[0]);
    formInput.onboardingPhotos.value = images;
    setFormState(formInput);
    handleEditPhotoBottomSheetClosePress();
  };

  const moveImageUploadAhead = (i) => {
    const formInput = { ...formState };
    const images = [...formInput.onboardingPhotos.value];
    images.splice(
      (formInput.onboardingPhotos.value.length - 1 + i) % formInput.onboardingPhotos.value.length,
      0,
      images.splice(i, 1)[0]
    );
    formInput.onboardingPhotos.value = images;
    setFormState(formInput);
    handleEditPhotoBottomSheetClosePress();
  };

  const doDeleteUploadImage = async (i) => {
    try {
      const formInput = { ...formState };
      const images = [...formInput.onboardingPhotos.value];
      images.splice(i, 1);
      formInput.onboardingPhotos.value = images;
      setFormState(formInput);
    } catch (err) {
      setShowMessage(err.message);
      setTimeout(() => setShowMessage(""), 3000);
      console.log(err);
    }
  };

  const deleteUploadImage = (i) => {
    Alert.alert(t("deletePhotoAlert.removePhoto"), t("deletePhotoAlert.removePhotoHint"), [
      { text: t("deletePhotoAlert.cancel"), onPress: () => {}, style: "cancel" },
      {
        text: t("deletePhotoAlert.delete"),
        onPress: () => {
          doDeleteUploadImage(i);
        },
        style: "destructive",
      },
    ]);

    handleEditPhotoBottomSheetClosePress();
  };

  const showImagePicker = async (i = null) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(t("allowPhotosAlert.allowAccess"), t("allowPhotosAlert.allowAccessHint"), [
        { text: t("allowPhotosAlert.button"), onPress: () => null, style: "default" },
      ]);

      if (i === null) {
        handleAddPhotoBottomSheetClosePress();
      } else {
        handleEditPhotoBottomSheetClosePress();
      }
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.cancelled) {
        const actions = [],
          formInput = { ...formState };
        if (result.width < 600 || (Platform.OS === "ios" && result?.fileSize < 20 * 1024))
          throw new Error(t("onboardingScreen.error.photoSmall"));
        if (result.width > 2000 || (Platform.OS === "ios" && result?.fileSize > 10 * 1024 * 1024))
          actions.push({ resize: { height: 2000, width: 2000 } });

        const formattedImage = await ImageManipulator.manipulateAsync(result.uri, actions, {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        });

        let data = await fetch(formattedImage.uri);
        data = await data.blob();
        const fileType = formattedImage.uri.split(".").pop();

        if (i === null) {
          formInput.onboardingPhotos.value.push({
            uri: formattedImage.uri,
            mimeType: `image/${fileType}`,
            data: new File([data], `photo.${fileType}`),
            uploadedAt: null,
            key: "",
            loading: true,
          });
        } else {
          formInput.onboardingPhotos.value[i] = {
            ...formInput.onboardingPhotos.value[i],
            uri: formattedImage.uri,
            mimeType: `image/${fileType}`,
            data: new File([data], `photo.${fileType}`),
            uploadedAt: null,
            loading: true,
          };
        }

        formInput.onboardingPhotos.dirty = true;
        setFormState(formInput);
        uploadPhoto(
          i === null ? formInput.onboardingPhotos.value.length - 1 : i,
          formInput.onboardingPhotos.value[i === null ? formInput.onboardingPhotos.value.length - 1 : i].key
            ? formInput.onboardingPhotos.value[i === null ? formInput.onboardingPhotos.value.length - 1 : i]
                .key
            : ""
        );
      }
    } catch (error) {
      setShowMessage(t("onboardingScreen.error.photoUploadSingle"));
      setTimeout(() => setShowMessage(""), 3000);
      const formInput = { ...formState };
      formInput.onboardingPhotos.value[i || 0].loading = false;
      setFormState(formInput);
      console.log(error);
    } finally {
      if (i === null) {
        handleAddPhotoBottomSheetClosePress();
      } else {
        handleEditPhotoBottomSheetClosePress();
      }
      return;
    }
  };

  const showCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();

    if (status === "granted") {
      setCameraOpen(true);
    } else {
      Alert.alert(t("allowCameraAlert.allowAccess"), t("allowCameraAlert.allowAccessHint"), [
        { text: t("allowCameraAlert.button"), onPress: () => null, style: "default" },
      ]);
    }

    return;
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      setCameraResultOpen(true);
      setCameraResult(photo);
    } catch (error) {
      console.log(error);
    } finally {
      return;
    }
  };

  const retakePhoto = () => {
    setCameraResultOpen(false);
    setCameraResult(null);
    showCamera();
  };

  const usePhoto = async (i = null) => {
    try {
      const cropData = editorRef.current?.data.cropped;

      const croppedImage = await ImageManipulator.manipulateAsync(
        cameraResult.uri,
        [
          {
            crop: {
              width: cropData.width,
              height: cropData.height,
              originX: cropData.x,
              originY: cropData.y,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      const formInput = { ...formState };

      let data = await fetch(croppedImage.uri);
      data = await data.blob();
      const fileType = croppedImage.uri.split(".").pop();

      if (i === null) {
        formInput.onboardingPhotos.value.push({
          uri: croppedImage.uri,
          mimeType: `image/${fileType}`,
          data: new File([data], `photo.${fileType}`),
          uploadedAt: null,
          key: "",
          loading: true,
        });
      } else {
        formInput.onboardingPhotos.value[i] = {
          ...formInput.onboardingPhotos.value[i],
          uri: croppedImage.uri,
          mimeType: `image/${fileType}`,
          data: new File([data], `photo.${fileType}`),
          uploadedAt: null,
          loading: true,
        };
      }

      formInput.onboardingPhotos.dirty = true;
      setFormState(formInput);
      uploadPhoto(
        i === null ? formInput.onboardingPhotos.value.length - 1 : i,
        formInput.onboardingPhotos.value[i === null ? formInput.onboardingPhotos.value.length - 1 : i].key
          ? formInput.onboardingPhotos.value[i === null ? formInput.onboardingPhotos.value.length - 1 : i].key
          : ""
      );
    } catch (error) {
      setShowMessage(t("onboardingScreen.error.photoUploadSingle"));
      setTimeout(() => setShowMessage(""), 3000);
      const formInput = { ...formState };
      formInput.onboardingPhotos.value[i || 0].loading = false;
      setFormState(formInput);
      console.log(error);
    } finally {
      setCameraResultOpen(false);
      setCameraOpen(false);
      setCameraResult(null);
      if (i === null) {
        handleAddPhotoBottomSheetClosePress();
      } else {
        handleEditPhotoBottomSheetClosePress();
      }
      return;
    }
  };

  const closeCamera = () => {
    setCameraResultOpen(false);
    setCameraOpen(false);
    setCameraResult(null);
    if (selectedImageUpload === null) {
      handleAddPhotoBottomSheetClosePress();
    } else {
      handleEditPhotoBottomSheetClosePress();
    }
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  const toggleFlashMode = () => {
    const flashModes = ["auto", "on", "torch", "off"];
    setFlashMode((current) => flashModes[(flashModes.indexOf(current) + 1) % flashModes.length]);
  };

  const uploadPhoto = async (i, objectKey = "") => {
    const formInput = { ...formState };

    try {
      if (route.params?.token) {
        const options = {
          method: "POST",
          headers: {
            Authorization: `Bearer ${route.params?.token}`,
            "Content-type": "application/json",
            "x-tfp-user": route.params?.user?.userId,
          },
        };

        options.body = JSON.stringify(
          objectKey
            ? { key: objectKey }
            : { fileType: formState.onboardingPhotos.value[i].mimeType.replace("image/", "") }
        );
        const {
          key,
          data: { url, fields },
        } = await (await fetch(`${Constants.manifest?.extra?.awsEndpoint}/createUpload`, options)).json();
        if (!key) throw new Error(t("onboardingScreen.error.photoUploadSingle"));
        const formData = new FormData();
        formData.append("Content-Type", formState.onboardingPhotos.value[i].mimeType);
        Object.entries(fields).forEach(([k, v]) => {
          formData.append(k, v);
        });
        formData.append("file", {
          uri: formState.onboardingPhotos.value[i].uri,
          type: formState.onboardingPhotos.value[i].mimeType,
          name: key,
        });
        const response = await fetch(Constants.manifest?.extra?.awsPhotosEndpoint, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error(t("onboardingScreen.error.photoUploadSingle"));
        formInput.onboardingPhotos.value[i].key = `${keyRegExp.exec(key)[1]}.jpg`;
        formInput.onboardingPhotos.value[i].uploadedAt = new Date();
        formInput.onboardingPhotos.value[i].loading = false;
        formInput.onboardingPhotos.valid = true;
        setFormState(formInput);
      }
    } catch (error) {
      const formInput = { ...formState };
      formInput.onboardingPhotos.value[i].loading = false;
      setFormState(formInput);
      throw new Error(error);
    }
  };

  const handleAddPhotoBottomSheetExpandPress = useCallback(() => {
    addPhotoBottomSheetRef.current?.expand();
    setAddPhotoBottomSheetOpen(true);
  }, []);

  const handleAddPhotoBottomSheetCollapsePress = useCallback(() => {
    addPhotoBottomSheetRef.current?.collapse();
    setAddPhotoBottomSheetOpen(false);
  }, []);

  const handleAddPhotoBottomSheetClosePress = useCallback(() => {
    addPhotoBottomSheetRef.current?.close();
    setAddPhotoBottomSheetOpen(false);
  }, []);

  const handleEditPhotoBottomSheetExpandPress = (index) => {
    setSelectedImageUpload(index);
    editPhotoBottomSheetRef.current?.expand();
    setEditPhotoBottomSheetOpen(true);
  };

  const handleEditPhotoBottomSheetCollapsePress = useCallback(() => {
    editPhotoBottomSheetRef.current?.collapse();
    setSelectedImageUpload(null);
    setEditPhotoBottomSheetOpen(false);
  }, []);

  const handleEditPhotoBottomSheetClosePress = useCallback(() => {
    editPhotoBottomSheetRef.current?.close();
    setSelectedImageUpload(null);
    setEditPhotoBottomSheetOpen(false);
  }, []);

  const getCameraRatio = async () => {
    if (!isCameraRatioSet && Platform.OS === "android") {
      const supportedRatios = await cameraRef.current.getSupportedRatiosAsync();
      const { height, width } = Dimensions.get("screen");
      const screenRatio = Math.max(width, height) / Math.min(width, height);
      const availableCameraRatios = supportedRatios.map((ratio) => ({
        scaleOffset: Math.abs(ratio.split(":").reduce((x, y) => x / y) - screenRatio),
        ratio,
      }));
      const closestAvailableRatio = availableCameraRatios.reduce((a, b) =>
        b.scaleOffset < a.scaleOffset ? b : a
      );

      setCameraRatio(closestAvailableRatio.ratio);
      setIsCameraRatioSet(true);
    }
  };

  const addPhotoBottomSheetOptions = [
    {
      id: "selectFromLibrary",
      title: t("editPhotosScreen.selectFromLibrary"),
      icon: "images-outline",
      action: () => showImagePicker(),
    },
    {
      id: "takeAPhoto",
      title: t("editPhotosScreen.takePhoto"),
      icon: "camera-outline",
      action: () => showCamera(),
    },
  ];

  const editPhotoBottomSheetOptions = [
    {
      id: "replacePhotoLibrary",
      title: t("editPhotosScreen.replacePhotoFromLibrary"),
      icon: "repeat-outline",
      action: () => showImagePicker(selectedImageUpload),
      disabled: false,
    },
    {
      id: "replacePhotoCamera",
      title: t("editPhotosScreen.replaceWithNew"),
      icon: "camera-outline",
      action: () => showCamera(),
      disabled: false,
    },
    {
      id: "moveUp",
      title: t("editPhotosScreen.moveAhead"),
      icon: "arrow-up-circle-outline",
      action: () => moveImageUploadAhead(selectedImageUpload),
      disabled: selectedImageUpload <= 0 ? true : false,
    },
    {
      id: "moveDown",
      title: t("editPhotosScreen.moveBehind"),
      icon: "arrow-down-circle-outline",
      action: () => moveImageUploadBehind(selectedImageUpload),
      disabled: selectedImageUpload >= formState.onboardingPhotos.value.length - 1 ? true : false,
    },
    {
      id: "removePhoto",
      title: t("editPhotosScreen.removePhoto"),
      icon: "trash-outline",
      action: () => deleteUploadImage(selectedImageUpload),
      disabled: false,
    },
  ];

  const addPhotoBottomSheetSnapPoints = useMemo(
    () => [
      24 + 46 * addPhotoBottomSheetOptions.length + insets.bottom,
      24 + 46 * addPhotoBottomSheetOptions.length + insets.bottom,
    ],
    []
  );
  const addPhotoBottomSheetOpacity = useSharedValue(
    24 + 46 * addPhotoBottomSheetOptions.length + insets.bottom
  );

  const editPhotoBottomSheetSnapPoints = useMemo(
    () => [
      24 + 46 * editPhotoBottomSheetOptions.length + insets.bottom,
      24 + 46 * editPhotoBottomSheetOptions.length + insets.bottom,
    ],
    []
  );
  const editPhotoBottomSheetOpacity = useSharedValue(
    24 + 46 * editPhotoBottomSheetOptions.length + insets.bottom
  );

  const bottomSheetAnimationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

  const handleModalOpen = (id) => {
    setActiveEmojiList(id);
    setTempSelectValue(formState[id].value);
    setEmojiListModalOpen(true);
  };

  const handleModalSaveChanges = (id) => {
    setTempSelectValue(null);
    setEmojiListModalOpen(false);
  };

  const handleModalCancel = (id) => {
    const formInput = {
      ...formState,
      [id]: {
        ...formState[id],
      },
    };

    formInput[id].value = tempSelectValue;

    setFormState(formInput);
    setTempSelectValue(null);
    setEmojiListModalOpen(false);
  };

  const checkboxOnChange = (id) => {
    const formInput = { ...formState };
    if (formInput[id].value) formInput[id].value = false;
    else formInput[id].value = true;
    if (currentPage === formInput[id].page) formInput[id].dirty = true;
    setFormState(formInput);
  };

  const formFieldOnChange = (value, id, externalValidation) => {
    setErrors([]);
    const formInput = { ...formState };

    if (formInput[id].type === "emojiMultiSelect") {
      const s = new Set(formInput[id].value);
      if (s.has(value)) s.delete(value);
      else s.add(value);
      formInput[id].value = [...s];
    } else if (formInput[id].type === "emojiSelect") {
      if (value === formInput[id].value) formInput[id].value = "";
      else formInput[id].value = value;
    } else if (formInput[id].type === "range-min") {
      formInput[id].value = [value[0], formInput[id].value[1]];
    } else if (formInput[id].type === "range-max") {
      formInput[id].value = [formInput[id].value[0], value[1]];
    } else if (formInput[id].type === "checkbox") {
      formInput[id].value = !value;
    } else {
      formInput[id].value = value;
    }

    if (formInput[id].value.toString().length > 0 && id === "onboardingAboutMe") {
      formInput[id].valid = validateAboutMe(value);
    } else if (id === "onboardingFirstName" || id === "onboardingLastName") {
      formInput[id].valid =
        externalValidation !== null ? externalValidation : validateInput(value, formInput[id].validation);
    } else if (formInput[id].type === "socialText") {
      formInput[id].valid = formInput[id].value.id ? validateInput(value.id, formInput[id].validation) : null;
    } else if (formInput[id].value.toString().length > 0) {
      formInput[id].valid =
        externalValidation !== null ? externalValidation : validateInput(value, formInput[id].validation);
    } else {
      formInput[id].valid = null;
    }

    if (
      id === "onboardingBirthdate" &&
      formInput.onboardingBirthdate.valid &&
      !formInput.onboardingAgePreferences.dirty
    ) {
      formInput.onboardingAgePreferences.value = [
        Math.max(calculateAge(value) - 10, 18),
        Math.min(calculateAge(value) + 10, 99),
      ];
    }

    Array.from(validationErrorMappings.entries())
      .map((error) => ({ code: error[0], ...error[1] }))
      .filter((error) => error.field === id)
      .forEach((error) => {
        setValidationErrors((state) => {
          const next = new Set(state);
          next.delete(error.code);
          return next;
        });
      });

    if (currentPage === formInput[id].page) formInput[id].dirty = true;
    setFormState(formInput);
  };

  const formFieldEndEditing = (id, externalValidation) => {
    const formInput = { ...formState };

    if (formInput[id].value.toString().length > 0 && id === "onboardingAboutMe") {
      formInput[id].valid = validateAboutMe(formInput[id].value);
    } else if (id === "onboardingFirstName" || id === "onboardingLastName") {
      formInput[id].valid =
        externalValidation !== null
          ? externalValidation
          : validateInput(formInput[id].value, formInput[id].validation);
    } else if (id === "onboardingAgePreferences" && formInput[id].value.some((val) => val.length < 2)) {
      resetAgePreferences();
    } else if (formInput[id].type === "socialText") {
      const userPart = formInput[id].value.id.split("/")[formInput[id].value.id.split("/").length - 1];

      switch (formInput[id].props.kind) {
        case "facebook":
          formInput[id].value.id = /^@?(.{1,50})/.test(userPart)
            ? /^@?(.{1,50})/.exec(userPart)[1]
            : userPart;
          break;
        case "instagram":
          formInput[id].value.id = /^@?(.{1,30})/.test(userPart)
            ? /^@?(.{1,30})/.exec(userPart)[1].toLowerCase()
            : userPart.toLowerCase();
          break;
        case "snapchat":
          formInput[id].value.id = /^@?(.{1,15})/.test(userPart)
            ? /^@?(.{1,15})/.exec(userPart)[1].toLowerCase()
            : userPart.toLowerCase();
          break;
        case "tiktok":
          formInput[id].value.id = /^@?(.{1,24})/.test(userPart)
            ? /^@?(.{1,24})/.exec(userPart)[1]
            : userPart;
          break;
        case "twitter":
          formInput[id].value.id = /^@?(.{1,15})/.test(userPart)
            ? /^@?(.{1,15})/.exec(userPart)[1]
            : userPart;
          break;
        default:
          break;
      }

      if (formInput[id].value.id) {
        formInput[id].valid =
          externalValidation !== null
            ? externalValidation
            : validateInput(formInput[id].value.id, formInput[id].validation);
        formInput[id].value.shown = formInput[id].valid;
      }
    } else if (formInput[id].value.toString().length > 0) {
      formInput[id].valid =
        externalValidation !== null
          ? externalValidation
          : validateInput(formInput[id].value, formInput[id].validation);
    } else {
      formInput[id].valid = null;
    }

    Array.from(validationErrorMappings.entries())
      .map((error) => ({ code: error[0], ...error[1] }))
      .filter((error) => error.field === id)
      .forEach((error) => {
        setValidationErrors((state) => {
          const next = new Set(state);
          next.delete(error.code);
          return next;
        });
      });

    if (currentPage === formInput[id].page) formInput[id].dirty = true;
    setFormState(formInput);
  };

  const buildInput = (id, extra) => {
    const elements = [],
      inputErrors = [
        ...Array.from(validationErrors)
          .map((error) => validationErrorMappings.get(error))
          .filter((error) => error.field === id),
        ...Array.from(errors).filter((error) => error.field === id),
      ];

    elements.push(
      <Input
        id={id}
        key={id}
        extra={extra}
        type={formState[id].type}
        value={formState[id].value}
        placeholder={formState[id].placeholder}
        valid={formState[id].valid}
        dirty={formState[id].dirty}
        props={formState[id].props}
        onChange={
          formState[id].type === "date"
            ? (_, value) => formFieldOnChange(value, id, null)
            : formState[id].type === "checkbox"
            ? () => checkboxOnChange(id)
            : (value) => formFieldOnChange(value, id, null)
        }
        onEndEditing={(e) => formFieldEndEditing(id, null)}
      />
    );

    if (formState[id].type === "textArea" && formState[id].props?.maxLength && formState[id].value.length > 0)
      elements.push(
        <View key="textAreaLimit" style={styles.textAreaLimit}>
          <BrandText style={[styles.textAreaLimitText, { color: theme.avatar.loading }]}>
            {formState[id].value.length}/{formState[id].props?.maxLength}
          </BrandText>
        </View>
      );

    if (inputErrors.length > 0)
      elements.push(
        inputErrors.map((error, i) => (
          <View
            key={`${error.field}-${i}`}
            style={[styles.inputError, { backgroundColor: theme.error.background }]}
          >
            <BrandText style={[styles.inputErrorText, { color: theme.error.invalid }]}>
              {error.text}
            </BrandText>
          </View>
        ))
      );
    return elements;
  };

  const buildErrorMessages = (id) => {
    const elements = [],
      inputErrors = [
        ...Array.from(validationErrors)
          .map((error) => validationErrorMappings.get(error))
          .filter((error) => error.field === id),
        ...Array.from(errors).filter((error) => error.field === id),
      ];
    if (inputErrors.length > 0)
      elements.push(
        inputErrors.map((error, i) => (
          <View
            key={`${error.field}-${i}`}
            style={[
              { backgroundColor: theme.error.background },
              formState[id].type === "emojiSelect" || formState[id].type === "emojiMultiSelect"
                ? styles.inputErrorCenter
                : styles.inputError,
            ]}
          >
            <BrandText style={[styles.inputErrorText, { color: theme.error.invalid }]}>
              {error.text}
            </BrandText>
          </View>
        ))
      );
    return elements;
  };

  const renderSheetListItem = (item, index, last) => (
    <ListItem
      title={item.title}
      icon={item.icon}
      index={index}
      last={last}
      action={item.action}
      disabled={item.disabled}
    />
  );

  const renderAddPhotoBottomSheetBackdrop = useCallback(
    (props) => (
      <AnimatedBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={0}
        animatedIndex={addPhotoBottomSheetOpacity}
        onPress={handleAddPhotoBottomSheetClosePress}
        opacity={0.5}
      >
        {selectedImageUpload !== null && (
          <Pressable
            onPress={handleEditPhotoBottomSheetClosePress}
            style={[StyleSheet.absoluteFillObject, styles.bottomSheetBackdrop]}
          >
            <GrowingImage
              source={{ uri: formState.onboardingPhotos.value[selectedImageUpload].uri }}
              shadows="shallow"
              speed={250}
              style={[
                styles.bottomSheetBackdropImage(insets.top),
                styles.shadowsShallow,
                { shadowColor: theme.shadow, backgroundColor: theme.icons.black },
              ]}
            />
          </Pressable>
        )}
      </AnimatedBackdrop>
    ),
    [selectedImageUpload]
  );

  const renderEditPhotoBottomSheetBackdrop = useCallback(
    (props) => (
      <AnimatedBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={0}
        animatedIndex={editPhotoBottomSheetOpacity}
        onPress={handleEditPhotoBottomSheetClosePress}
        opacity={0.5}
      >
        {selectedImageUpload !== null && (
          <Pressable
            onPress={handleEditPhotoBottomSheetClosePress}
            style={[StyleSheet.absoluteFillObject, styles.bottomSheetBackdrop]}
          >
            <BrandBoldText
              style={[styles.bottomSheetBackdropTitle(insets.top), { color: theme.text.secondary }]}
            >
              {selectedImageUpload === 0
                ? t("onboardingScreen.profilePhoto")
                : t("onboardingScreen.photoNumberN") + (selectedImageUpload + 1)}
            </BrandBoldText>
            <GrowingImage
              source={{ uri: formState.onboardingPhotos.value[selectedImageUpload].uri }}
              shadows="shallow"
              speed={250}
              style={[
                styles.bottomSheetBackdropImage(insets.top),
                { shadowColor: theme.shadow, backgroundColor: theme.icons.black },
              ]}
            />
          </Pressable>
        )}
      </AnimatedBackdrop>
    ),
    [selectedImageUpload]
  );

  const resetAgePreferences = () => {
    const formInput = { ...formState };

    formInput.onboardingAgePreferences.value = [
      Math.max(calculateAge(formInput.onboardingBirthdate.value) - 10, 18),
      Math.min(calculateAge(formInput.onboardingBirthdate.value) + 10, 99),
    ];

    setFormState(formInput);
  };

  let pagesArray = [
    <View key="page-1" style={styles.pageContainer}>
      <LogoText colors={theme.gradient.onboarding} style={[styles.logoText, { marginBottom: 10 }]} />
      <View style={styles.inputContainer}>
        <BrandText style={[styles.paragraphText, { color: theme.text.secondary }]}>
          {t("onboardingScreen.welcomeText")}
        </BrandText>
      </View>
      <NextButton onPress={() => goToPage(2)} title={t("onboardingScreen.getStarted")} />
    </View>,
    <View key="page-2" style={styles.pageContainer}>
      <DismissKeyboard style={[styles.pageContainer, { flex: 1 }]}>
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
              {t("onboardingScreen.whatIsYourName")}
            </BrandBoldText>
            <MoreInfo text={formState.onboardingLastName.hint} containerStyle={styles.moreInfoIcon} />
          </View>
          {buildInput("onboardingFirstName", {
            style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
          })}
          {buildInput("onboardingLastName", {
            style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
          })}
        </View>
        <NextButton onPress={() => goToPage(3)} disabled={!isPageValid[2]} />
      </DismissKeyboard>
    </View>,
    <View key="page-3" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.whatIsYourBirthday")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingBirthdate.hint} containerStyle={styles.moreInfoIcon} />
        </View>
        <BirthdatePicker
          date={formState.onboardingBirthdate.value}
          changeDate={(date) => formFieldOnChange(date, "onboardingBirthdate", null)}
        >
          <TextInput
            selectionColor={theme.caret.primary}
            key="onboardingBirthdate"
            placeholder={formState.onboardingBirthdate.placeholder}
            placeholderTextColor={
              formState.onboardingBirthdate.valid === false && formState.onboardingBirthdate.dirty
                ? theme.error.placeholder
                : theme.input.disabled
            }
            value={
              formState.onboardingBirthdate.dirty && formState.onboardingBirthdate.value
                ? formatDate(formState.onboardingBirthdate.value)
                : ""
            }
            style={[
              styles.input,
              { color: theme.text.primary, backgroundColor: theme.primary },
              styles.shadowsShallow,
              { shadowColor: theme.shadow },
              formState.onboardingBirthdate.valid === false && formState.onboardingBirthdate.dirty
                ? [styles.invalidInput, { color: theme.error.invalid, borderColor: theme.error.invalid }]
                : null,
            ]}
            editable={false}
            pointerEvents="none"
            {...formState.onboardingBirthdate.props}
          />
        </BirthdatePicker>
        <View style={styles.dateInputButton} pointerEvents="none">
          <Ionicons
            name="ios-calendar-sharp"
            size={28}
            color={
              formState.onboardingBirthdate.valid === false && formState.onboardingBirthdate.dirty
                ? theme.icons.calendar
                : theme.text.light
            }
          />
        </View>
        {buildErrorMessages("onboardingBirthdate")}
      </View>
      <NextButton onPress={() => goToPage(4)} disabled={!isPageValid[3]} />
    </View>,
    <View key="page-4" style={styles.pageContainer}>
      <DismissKeyboard style={[styles.pageContainer, { flex: 1 }]}>
        <View style={[styles.inputContainer, { height: "70%" }]}>
          <View style={styles.inputHeader}>
            <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
              {t("onboardingScreen.whereAreYou")}
            </BrandBoldText>
            <MoreInfo text={formState.onboardingLocation.hint} containerStyle={styles.moreInfoIcon} />
          </View>
          {buildInput("onboardingLocation", {
            data: locations,
            style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
          })}
        </View>
        <NextButton onPress={() => goToPage(5)} disabled={!isPageValid[4]} />
      </DismissKeyboard>
    </View>,
    <View key="page-5" style={styles.pageContainer}>
      <DismissKeyboard style={[styles.pageContainer, { flex: 1 }]}>
        <View style={[styles.inputContainer, { height: 61 }]}>
          <View style={styles.inputHeader}>
            <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
              {t("onboardingScreen.aboutYou")}
            </BrandBoldText>
            <MoreInfo text={formState.onboardingAboutMe.hint} containerStyle={styles.moreInfoIcon} />
          </View>
          {buildInput("onboardingAboutMe", {
            style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
          })}
        </View>
        <NextButton onPress={() => goToPage(6)} disabled={!isPageValid[5]} />
      </DismissKeyboard>
    </View>,
    <View key="page-6" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.addUpToFivePhotos")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingPhotos.hint} containerStyle={styles.moreInfoIcon} />
        </View>
        <View style={styles.photoContainer}>
          <View style={[styles.photoRow, styles.photoRowUpper]}>
            {formState.onboardingPhotos.value.length >= 1 ? (
              <TouchableOpacity
                onPress={() => handleEditPhotoBottomSheetExpandPress(0)}
                style={[styles.onboardingPhoto, styles.shadowsShallow, { shadowColor: theme.shadow }]}
              >
                <Image
                  source={{ uri: formState.onboardingPhotos.value[0].uri }}
                  style={styles.onboardingPhotoImage}
                />
                {formState.onboardingPhotos.value[0].loading && (
                  <View style={[styles.onboardingPhotoLoading, { backgroundColor: theme.avatar.loading }]}>
                    <ActivityIndicator color={theme.text.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.onboardingPhotoLabel,
                    styles.shadowsShallow,
                    { shadowColor: theme.shadow },
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="person" size={12} color={theme.text.primary} />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleAddPhotoBottomSheetExpandPress}
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              >
                <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
              </TouchableOpacity>
            )}
            {formState.onboardingPhotos.value.length >= 2 ? (
              <TouchableOpacity
                onPress={() => handleEditPhotoBottomSheetExpandPress(1)}
                style={[styles.onboardingPhoto, styles.shadowsShallow, { shadowColor: theme.shadow }]}
              >
                <Image
                  source={{ uri: formState.onboardingPhotos.value[1].uri }}
                  style={styles.onboardingPhotoImage}
                />
                {formState.onboardingPhotos.value[1].loading && (
                  <View style={[styles.onboardingPhotoLoading, { backgroundColor: theme.avatar.loading }]}>
                    <ActivityIndicator color={theme.text.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.onboardingPhotoLabel,
                    styles.shadowsShallow,
                    { shadowColor: theme.shadow },
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <BrandBoldText style={[styles.onboardingPhotoLabelText, { color: theme.text.primary }]}>
                    2
                  </BrandBoldText>
                </View>
              </TouchableOpacity>
            ) : formState.onboardingPhotos.value.length === 1 ? (
              <TouchableOpacity
                onPress={handleAddPhotoBottomSheetExpandPress}
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              >
                <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              />
            )}
            {formState.onboardingPhotos.value.length >= 3 ? (
              <TouchableOpacity
                onPress={() => handleEditPhotoBottomSheetExpandPress(2)}
                style={[styles.onboardingPhoto, styles.shadowsShallow, { shadowColor: theme.shadow }]}
              >
                <Image
                  source={{ uri: formState.onboardingPhotos.value[2].uri }}
                  style={styles.onboardingPhotoImage}
                />
                {formState.onboardingPhotos.value[2].loading && (
                  <View style={[styles.onboardingPhotoLoading, { backgroundColor: theme.avatar.loading }]}>
                    <ActivityIndicator color={theme.text.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.onboardingPhotoLabel,
                    styles.shadowsShallow,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <BrandBoldText style={[styles.onboardingPhotoLabelText, { color: theme.text.primary }]}>
                    3
                  </BrandBoldText>
                </View>
              </TouchableOpacity>
            ) : formState.onboardingPhotos.value.length === 2 ? (
              <TouchableOpacity
                onPress={handleAddPhotoBottomSheetExpandPress}
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              >
                <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              />
            )}
          </View>
          <View style={[styles.photoRow, styles.photoRowLower]}>
            {formState.onboardingPhotos.value.length >= 4 ? (
              <TouchableOpacity
                onPress={() => handleEditPhotoBottomSheetExpandPress(3)}
                style={[styles.onboardingPhoto, styles.shadowsShallow, { shadowColor: theme.shadow }]}
              >
                <Image
                  source={{ uri: formState.onboardingPhotos.value[3].uri }}
                  style={styles.onboardingPhotoImage}
                />
                {formState.onboardingPhotos.value[3].loading && (
                  <View style={[styles.onboardingPhotoLoading, { backgroundColor: theme.avatar.loading }]}>
                    <ActivityIndicator color={theme.text.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.onboardingPhotoLabel,
                    styles.shadowsShallow,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <BrandBoldText style={[styles.onboardingPhotoLabelText, { color: theme.text.primary }]}>
                    4
                  </BrandBoldText>
                </View>
              </TouchableOpacity>
            ) : formState.onboardingPhotos.value.length === 3 ? (
              <TouchableOpacity
                onPress={handleAddPhotoBottomSheetExpandPress}
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              >
                <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              />
            )}
            {formState.onboardingPhotos.value.length >= 5 ? (
              <TouchableOpacity
                onPress={() => handleEditPhotoBottomSheetExpandPress(4)}
                style={[styles.onboardingPhoto, styles.shadowsShallow, { shadowColor: theme.shadow }]}
              >
                <Image
                  source={{ uri: formState.onboardingPhotos.value[4].uri }}
                  style={styles.onboardingPhotoImage}
                />
                {formState.onboardingPhotos.value[4].loading && (
                  <View style={[styles.onboardingPhotoLoading, { backgroundColor: theme.avatar.loading }]}>
                    <ActivityIndicator color={theme.text.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.onboardingPhotoLabel,
                    styles.shadowsShallow,
                    { shadowColor: theme.shadow },
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <BrandBoldText style={[styles.onboardingPhotoLabelText, { color: theme.text.primary }]}>
                    5
                  </BrandBoldText>
                </View>
              </TouchableOpacity>
            ) : formState.onboardingPhotos.value.length === 4 ? (
              <TouchableOpacity
                onPress={handleAddPhotoBottomSheetExpandPress}
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              >
                <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.onboardingPhoto,
                  styles.onboardingPhotoEmpty,
                  { borderColor: theme.avatar.background },
                ]}
              />
            )}
          </View>
        </View>
        <View style={{ paddingTop: 15 }}>{buildErrorMessages("onboardingPhotos")}</View>
      </View>
      <NextButton onPress={() => goToPage(7)} disabled={!isPageValid[6]} />
    </View>,
    <View key="page-7" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.yourRelationshipStatus")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingRelationshipStatus.hint} containerStyle={styles.moreInfoIcon} />
        </View>
        {formState.onboardingRelationshipStatus.value ? (
          <TouchableOpacity onPress={() => handleModalOpen("onboardingRelationshipStatus")}>
            <Emoji
              key={formState.onboardingRelationshipStatus.value}
              size="large"
              emoji={formState.onboardingRelationshipStatus.value}
              type="relationshipStatus"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => handleModalOpen("onboardingRelationshipStatus")}
            style={[
              styles.onboardingEmoji,
              styles.onboardingEmojiEmptyLarge,
              styles.onboardingEmojiEmpty,
              { borderColor: theme.input.inactive },
            ]}
          >
            <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
          </TouchableOpacity>
        )}
        {buildErrorMessages("onboardingRelationshipStatus")}
      </View>
      <NextButton onPress={() => goToPage(8)} disabled={!isPageValid[7]} />
    </View>,
    <View key="page-8" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.whatAreYouLookingFor")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingLookingFor.hint} containerStyle={styles.moreInfoIcon} />
        </View>
        <View style={styles.emojiSelectionsWrapper}>
          {formState.onboardingLookingFor.value.join("").length > 0 && (
            <View style={styles.emojiSelections}>
              {formState.onboardingLookingFor.value.map((emoji) => (
                <Emoji
                  key={emoji}
                  size={
                    formState.onboardingLookingFor.value.length > Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                      ? "small"
                      : "medium"
                  }
                  emoji={emoji}
                  type="lookingFor"
                />
              ))}
              <TouchableOpacity
                onPress={() => handleModalOpen("onboardingLookingFor")}
                style={[
                  styles.onboardingEmoji,
                  formState.onboardingLookingFor.value.length > Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                    ? styles.onboardingEmojiEmptySmall
                    : styles.onboardingEmojiEmptyMedium,
                  styles.onboardingEmojiEmpty,
                  { borderColor: theme.input.inactive },
                ]}
              >
                <Ionicons
                  name="add-outline"
                  size={formState.onboardingLookingFor.value.length * 64 > screenWidth * 0.8 ? 16 : 32}
                  color={theme.avatar.background}
                />
              </TouchableOpacity>
            </View>
          )}
          {formState.onboardingLookingFor.value.join("").length === 0 && (
            <TouchableOpacity
              onPress={() => handleModalOpen("onboardingLookingFor")}
              style={[
                styles.onboardingEmoji,
                styles.onboardingEmojiEmptyLarge,
                styles.onboardingEmojiEmpty,
                { borderColor: theme.input.inactive },
              ]}
            >
              <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
            </TouchableOpacity>
          )}
        </View>
        {buildErrorMessages("onboardingLookingFor")}
      </View>
      <NextButton onPress={() => goToPage(9)} disabled={!isPageValid[8]} />
    </View>,
    <View key="page-9" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.describeYourself")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingEmojisUser.hint} containerStyle={styles.moreInfoIcon} />
        </View>
        <View style={styles.emojiSelectionsWrapper}>
          {formState.onboardingEmojisUser.value.join("").length > 0 && (
            <View style={styles.emojiSelections}>
              {formState.onboardingEmojisUser.value.map((emoji) => (
                <Emoji
                  key={emoji}
                  size={
                    formState.onboardingEmojisUser.value.length > Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                      ? "small"
                      : "medium"
                  }
                  emoji={emoji}
                />
              ))}
              <TouchableOpacity
                onPress={() => handleModalOpen("onboardingEmojisUser")}
                style={[
                  styles.onboardingEmoji,
                  formState.onboardingEmojisUser.value.length > Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                    ? styles.onboardingEmojiEmptySmall
                    : styles.onboardingEmojiEmptyMedium,
                  styles.onboardingEmojiEmpty,
                  { borderColor: theme.input.inactive },
                ]}
              >
                <Ionicons
                  name="add-outline"
                  size={formState.onboardingEmojisUser.value.length * 64 > screenWidth * 0.8 ? 16 : 32}
                  color={theme.avatar.background}
                />
              </TouchableOpacity>
            </View>
          )}
          {formState.onboardingEmojisUser.value.join("").length === 0 && (
            <TouchableOpacity
              onPress={() => handleModalOpen("onboardingEmojisUser")}
              style={[
                styles.onboardingEmoji,
                styles.onboardingEmojiEmptyLarge,
                styles.onboardingEmojiEmpty,
                { borderColor: theme.input.inactive },
              ]}
            >
              <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
            </TouchableOpacity>
          )}
        </View>
        {buildErrorMessages("onboardingEmojisUser")}
      </View>
      <NextButton onPress={() => goToPage(10)} disabled={!isPageValid[9]} />
    </View>,
    <View key="page-10" style={styles.pageContainer}>
      <View style={[styles.inputContainer, { paddingBottom: 25 }]}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.yourSocial")}
          </BrandBoldText>
          <MoreInfo text={t("onboardingScreen.chooseSocialToShare")} containerStyle={styles.moreInfoIcon} />
        </View>
        {buildInput("onboardingSocialFacebook", {
          style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
        })}
        {buildInput("onboardingSocialInstagram", {
          style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
        })}
        {buildInput("onboardingSocialSnapchat", {
          style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
        })}
        {buildInput("onboardingSocialTiktok", {
          style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
        })}
        {buildInput("onboardingSocialTwitter", {
          style: [styles.shadowsShallow, { shadowColor: theme.shadow }],
        })}
      </View>
      <NextButton onPress={() => goToPage(11)} disabled={!isPageValid[10]} />
    </View>,
    <View key="page-11" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <BrandBoldText style={[styles.welcomeText, { color: theme.text.secondary }]}>Great!</BrandBoldText>
        <BrandText style={[styles.paragraphText, { color: theme.text.secondary }]}>
          {t("onboardingScreen.profileFinished")}
        </BrandText>
      </View>
      <NextButton onPress={() => goToPage(12)} disabled={!isPageValid[11]} />
    </View>,
    <View key="page-12" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.yourAgePreferences")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingAgePreferences.hint} containerStyle={styles.moreInfoIcon} />
        </View>
        <View style={{ width: "100%" }}>
          {buildInput("onboardingAgePreferences", { style: { width: screenWidth * 0.8 } })}
          {(formState.onboardingAgePreferences.value[0] !==
            Math.max(calculateAge(formState.onboardingBirthdate.value) - 10, 18) ||
            formState.onboardingAgePreferences.value[1] !==
              Math.min(calculateAge(formState.onboardingBirthdate.value) + 10, 99)) && (
            <TouchableOpacity onPressOut={resetAgePreferences}>
              <Ionicons
                name="refresh-circle-outline"
                size={23}
                color={theme.icons.default}
                style={styles.agePreferencesReset}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <NextButton onPress={() => goToPage(13)} disabled={!isPageValid[12]} />
    </View>,
    <View key="page-13" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.describeIdealMatch")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingEmojisOthers.hint} containerStyle={styles.moreInfoIcon} />
        </View>
        <View style={styles.emojiSelectionsWrapper}>
          {formState.onboardingEmojisOthers.value.join("").length > 0 && (
            <View style={styles.emojiSelections}>
              {formState.onboardingEmojisOthers.value.map((emoji) => (
                <Emoji
                  key={emoji}
                  size={
                    formState.onboardingEmojisOthers.value.length >
                    Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                      ? "small"
                      : "medium"
                  }
                  emoji={emoji}
                />
              ))}
              <TouchableOpacity
                onPress={() => handleModalOpen("onboardingEmojisOthers")}
                style={[
                  styles.onboardingEmoji,
                  formState.onboardingEmojisOthers.value.length > Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                    ? styles.onboardingEmojiEmptySmall
                    : styles.onboardingEmojiEmptyMedium,
                  styles.onboardingEmojiEmpty,
                  { borderColor: theme.input.inactive },
                ]}
              >
                <Ionicons
                  name="add-outline"
                  size={formState.onboardingEmojisOthers.value.length * 64 > screenWidth * 0.8 ? 16 : 32}
                  color={theme.avatar.background}
                />
              </TouchableOpacity>
            </View>
          )}
          {formState.onboardingEmojisOthers.value.join("").length === 0 && (
            <TouchableOpacity
              onPress={() => handleModalOpen("onboardingEmojisOthers")}
              style={[
                styles.onboardingEmoji,
                styles.onboardingEmojiEmptyLarge,
                styles.onboardingEmojiEmpty,
                { borderColor: theme.input.inactive },
              ]}
            >
              <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
            </TouchableOpacity>
          )}
        </View>
        {buildErrorMessages("onboardingEmojisOthers")}
      </View>
      <NextButton onPress={() => goToPage(14)} disabled={!isPageValid[13]} />
    </View>,
    <View key="page-14" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.theirRelationshipStatusShouldBe")}
          </BrandBoldText>
          <MoreInfo text={formState.onboardingRelationshipStatusPreferences.hint} />
        </View>
        <View style={styles.emojiSelectionsWrapper}>
          {formState.onboardingRelationshipStatusPreferences.value.join("").length > 0 && (
            <View style={styles.emojiSelections}>
              {formState.onboardingRelationshipStatusPreferences.value.map((emoji) => (
                <Emoji
                  key={emoji}
                  size={
                    formState.onboardingRelationshipStatusPreferences.value.length >
                    Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                      ? "small"
                      : "medium"
                  }
                  emoji={emoji}
                  type="relationshipStatus"
                />
              ))}
              <TouchableOpacity
                onPress={() => handleModalOpen("onboardingRelationshipStatusPreferences")}
                style={[
                  styles.onboardingEmoji,
                  formState.onboardingRelationshipStatusPreferences.value.length >
                  Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                    ? styles.onboardingEmojiEmptySmall
                    : styles.onboardingEmojiEmptyMedium,
                  styles.onboardingEmojiEmpty,
                  { borderColor: theme.input.inactive },
                ]}
              >
                <Ionicons
                  name="add-outline"
                  size={
                    formState.onboardingRelationshipStatusPreferences.value.length * 64 > screenWidth * 0.8
                      ? 16
                      : 32
                  }
                  color={theme.avatar.background}
                />
              </TouchableOpacity>
            </View>
          )}
          {formState.onboardingRelationshipStatusPreferences.value.join("").length === 0 && (
            <TouchableOpacity
              onPress={() => handleModalOpen("onboardingRelationshipStatusPreferences")}
              style={[
                styles.onboardingEmoji,
                styles.onboardingEmojiEmptyLarge,
                styles.onboardingEmojiEmpty,
                { borderColor: theme.input.inactive },
              ]}
            >
              <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
              <BrandBoldText
                style={[styles.onboardingEmojiEmptyOptionalText, { color: theme.input.inactive }]}
              >
                {t("onboardingScreen.optional")}
              </BrandBoldText>
            </TouchableOpacity>
          )}
        </View>
        {buildErrorMessages("onboardingRelationshipStatusPreferences")}
      </View>
      <NextButton onPress={() => goToPage(15)} disabled={!isPageValid[14]} />
    </View>,
    <View key="page-15" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputHeader}>
          <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.theyLookingFor")}
          </BrandBoldText>
          <MoreInfo
            text={formState.onboardingLookingForPreferences.hint}
            containerStyle={styles.moreInfoIcon}
          />
        </View>
        <View style={styles.emojiSelectionsWrapper}>
          {formState.onboardingLookingForPreferences.value.join("").length > 0 && (
            <View style={styles.emojiSelections}>
              {formState.onboardingLookingForPreferences.value.map((emoji) => (
                <Emoji
                  key={emoji}
                  size={
                    formState.onboardingLookingForPreferences.value.length >
                    Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                      ? "small"
                      : "medium"
                  }
                  emoji={emoji}
                  type="lookingFor"
                />
              ))}
              <TouchableOpacity
                onPress={() => handleModalOpen("onboardingLookingForPreferences")}
                style={[
                  styles.onboardingEmoji,
                  formState.onboardingLookingForPreferences.value.length >
                  Math.ceil((screenWidth * 0.8) / 84) * 4 - 1
                    ? styles.onboardingEmojiEmptySmall
                    : styles.onboardingEmojiEmptyMedium,
                  styles.onboardingEmojiEmpty,
                  { borderColor: theme.input.inactive },
                ]}
              >
                <Ionicons
                  name="add-outline"
                  size={
                    formState.onboardingLookingForPreferences.value.length * 64 > screenWidth * 0.8 ? 16 : 32
                  }
                  color={theme.avatar.background}
                />
              </TouchableOpacity>
            </View>
          )}
          {formState.onboardingLookingForPreferences.value.join("").length === 0 && (
            <TouchableOpacity
              onPress={() => handleModalOpen("onboardingLookingForPreferences")}
              style={[
                styles.onboardingEmoji,
                styles.onboardingEmojiEmptyLarge,
                styles.onboardingEmojiEmpty,
                { borderColor: theme.input.inactive },
              ]}
            >
              <Ionicons name="add-outline" size={32} color={theme.avatar.background} />
              <BrandBoldText
                style={[styles.onboardingEmojiEmptyOptionalText, { color: theme.input.inactive }]}
              >
                {t("onboardingScreen.optional")}
              </BrandBoldText>
            </TouchableOpacity>
          )}
        </View>
        {buildErrorMessages("onboardingLookingForPreferences")}
      </View>
      <NextButton onPress={() => goToPage(16)} disabled={!isPageValid[15]} />
    </View>,
    <View key="page-16" style={styles.pageContainer}>
      <View style={styles.inputContainer}>
        <BrandBoldText
          style={[styles.welcomeText, { fontSize: 36, marginBottom: 10, color: theme.text.secondary }]}
        >
          {t("onboardingScreen.almostDone")}
        </BrandBoldText>
        <BrandText
          style={[styles.paragraphText, { marginBottom: 20, fontSize: 14, color: theme.text.secondary }]}
        >
          {t("onboardingScreen.agreeTo")}
          <BrandBoldText
            style={[styles.paragraphTextLink, { textDecorationColor: theme.input.inactive }]}
            onPress={() => setShowTerms(true)}
          >
            {t("onboardingScreen.endUserEula")}
          </BrandBoldText>{" "}
          {t("onboardingScreen.beforeUsingApp")}
        </BrandText>
        <TouchableOpacity
          onPress={() => setShowTerms(true)}
          style={[styles.button, { width: "100%", backgroundColor: theme.button.onboarding_active }]}
        >
          <Ionicons name="book-outline" size={24} color={theme.icons.default} style={styles.buttonEULAIcon} />
          <BrandBoldText style={[styles.buttonText, { color: theme.text.secondary }]}>
            {t("onboardingScreen.readEula")}
          </BrandBoldText>
        </TouchableOpacity>
        <TouchableWithoutFeedback onPress={() => checkboxOnChange("onboardingAgreeToTerms")}>
          <View style={styles.checkboxHitArea}>{buildInput("onboardingAgreeToTerms")}</View>
        </TouchableWithoutFeedback>
      </View>
      <NextButton
        onPress={completeProfile}
        title={t("onboardingScreen.createProfile")}
        disabled={!formState.onboardingAgreeToTerms.value}
      />
    </View>,
  ];

  const buildEmojiList = (id) =>
    Array.from(emojis[formState[id].props.dataType].entries()).map((emoji, index) => (
      <EmojiListItem
        key={emoji[0]}
        emoji={emoji[0]}
        index={index}
        color={theme.emoji.header}
        selected={
          formState[id].type === "emojiMultiSelect"
            ? formState[id].value.includes(emoji[0])
            : formState[id].value === emoji[0]
        }
        onPress={() => formFieldOnChange(emoji[0], id, null)}
        type={formState[id].props.dataType}
      />
    ));

  const barScrollOffset = pageScrollOffset.interpolate({
    inputRange: [0, screenWidth * (pagesArray.length - 1)],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const scrollInPlace = () =>
    sliderRef.current.scrollTo({ x: screenWidth * (currentPage - 1), y: 0, animated: true });

  const validateCurrentPage = () => {
    const formInput = { ...formState };
    const currentFields = Object.values(formInput).filter(({ page }) => page === currentPage);
    currentFields.forEach((field) => {
      if (field.validation.required) {
        field.valid = validateInput(field.value, field.validation);
        field.dirty = true;
      }
    });
    setFormState(formInput);
  };

  const handlePageSwipe = ({ nativeEvent }) => {
    const offsetX = nativeEvent?.contentOffset?.x;
    const isPageInvalid = !isPageValid[currentPage] && offsetX > (currentPage - 1) * screenWidth;
    validateCurrentPage();
    isPageInvalid ? scrollInPlace() : Keyboard.dismiss();
  };

  return (
    <>
      {showMessage ? <Message>{showMessage}</Message> : null}
      {showTerms && (
        <Modal
          statusBarTranslucent={true}
          animationType="slide"
          transparent={true}
          visible={showTerms}
          onRequestClose={() => setShowTerms(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modal,
                { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: theme.primary },
              ]}
            >
              <BrandBoldText style={[styles.modalTitle, { fontSize: 24, marginBottom: 10 }]}>
                {t("onboardingScreen.eula")}
              </BrandBoldText>
              <BrandText style={[styles.modalSubtitle, { color: theme.text.subtitle }]}>
                {t("onboardingScreen.eulaUpdatedOn")}
              </BrandText>
              <LicenseAgreement />
              <View style={styles.modalButtonGroup}>
                <TouchableOpacity onPress={() => setShowTerms(false)}>
                  <LinearGradient
                    colors={theme.gradient.third}
                    style={[
                      styles.button,
                      styles.saveChangesButton,
                      { backgroundColor: theme.button.primary },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <BrandBoldText style={[styles.buttonText, { color: theme.text.secondary }]}>
                      {t("onboardingScreen.close")}
                    </BrandBoldText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {emojiListModalOpen && (
        <Modal
          statusBarTranslucent={true}
          animationType="slide"
          transparent={true}
          visible={emojiListModalOpen}
          onRequestClose={() => setEmojiListModalOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modal,
                { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: theme.primary },
              ]}
            >
              <BrandBoldText style={styles.modalTitle}>
                {formState[activeEmojiList].props?.title}
              </BrandBoldText>
              <View style={styles.modalSubtitleWrapper}>
                <View style={styles.modalSubtitleSpacer} />
                <BrandText
                  style={[
                    styles.modalSubtitle,
                    styles.emojiListModalSubtitle,
                    { color: theme.text.subtitle },
                  ]}
                >
                  {formState[activeEmojiList].type === "emojiSelect"
                    ? t("onboardingScreen.chooseOne")
                    : t("onboardingScreen.chooseOneOrMore")}
                </BrandText>
                <MoreInfo
                  text={formState[activeEmojiList].hint}
                  backgroundColor={theme.text.subtitle}
                  containerStyle={styles.modalMoreInfo}
                  nonLocal={true}
                />
              </View>
              <ScrollView
                style={styles.modalList}
                snapToInterval={73}
                pagingEnabled={true}
                decelerationRate="fast"
              >
                {buildEmojiList(activeEmojiList)}
              </ScrollView>
              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  onPress={() => handleModalSaveChanges(activeEmojiList)}
                  disabled={
                    formState[activeEmojiList].type === "emojiSelect"
                      ? formState[activeEmojiList].value === tempSelectValue
                        ? true
                        : false
                      : formState[activeEmojiList].value.every((i) => tempSelectValue.includes(i)) &&
                        tempSelectValue.every((i) => formState[activeEmojiList].value.includes(i))
                      ? true
                      : false
                  }
                >
                  <LinearGradient
                    colors={
                      formState[activeEmojiList].type === "emojiSelect"
                        ? formState[activeEmojiList].value === tempSelectValue
                          ? theme.gradient.emoji
                          : theme.gradient.third
                        : formState[activeEmojiList].value.every((i) => tempSelectValue.includes(i)) &&
                          tempSelectValue.every((i) => formState[activeEmojiList].value.includes(i))
                        ? theme.gradient.emoji
                        : theme.gradient.third
                    }
                    style={[
                      styles.button,
                      { backgroundColor: theme.button.primary },
                      styles.saveChangesButton,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {formState[activeEmojiList].type === "emojiMultiSelect" &&
                    !(
                      formState[activeEmojiList].value.every((i) => tempSelectValue.includes(i)) &&
                      tempSelectValue.every((i) => formState[activeEmojiList].value.includes(i))
                    ) &&
                    formState[activeEmojiList].value.length > 1 ? (
                      <View style={[styles.emojiListCounter, { backgroundColor: theme.primary }]}>
                        <BrandBoldText style={[styles.emojiListCounterText, { color: theme.emoji.counter }]}>
                          {formState[activeEmojiList].value.length}
                        </BrandBoldText>
                      </View>
                    ) : (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.icons.default}
                        style={styles.buttonIcon}
                      />
                    )}
                    <BrandBoldText style={[styles.buttonText, { color: theme.text.secondary }]}>
                      {t("onboardingScreen.saveChoices")}
                    </BrandBoldText>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.button.cancel }, styles.cancelButton]}
                  onPress={() => handleModalCancel(activeEmojiList)}
                >
                  <BrandBoldText style={[styles.buttonText, { color: theme.text.secondary }]}>
                    {t("onboardingScreen.cancel")}
                  </BrandBoldText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <ImageBackground
        source={require("../../assets/images/onboarding-bg.png")}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : null}
          keyboardVerticalOffset={Platform.select({
            ios: currentPage === 10 ? -screenHeight / 6.8 : 0,
            android: 500,
          })}
        >
          {currentPage > 1 && (
            <TouchableOpacity
              style={styles.backButton(insets)}
              onPress={() => {
                sliderRef.current.scrollTo({ x: screenWidth * (currentPage - 2), y: 0, animated: true });
                setCurrentPage((prev) => prev - 1);
              }}
            >
              <Ionicons name="chevron-back-outline" size={24} color={theme.icons.default} />
            </TouchableOpacity>
          )}
          <View style={[styles.barContainer, { top: insets.top + 20 }]}>
            <Animated.View style={styles.track}>
              <Animated.View
                style={[styles.bar, { width: barScrollOffset, backgroundColor: theme.primary }]}
              />
            </Animated.View>
          </View>
          <ScrollView
            horizontal
            ref={sliderRef}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={10}
            pagingEnabled
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: pageScrollOffset } } }], {
              useNativeDriver: false,
            })}
            onMomentumScrollEnd={({
              nativeEvent: {
                contentOffset: { x },
              },
            }) => {
              setCurrentPage(Math.floor(x / screenWidth) + 1);
            }}
            onScrollEndDrag={handlePageSwipe}
            scrollEnabled={Platform.OS === "ios"}
          >
            {pagesArray}
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
      {addPhotoBottomSheetOpen && (
        <BottomSheet
          ref={addPhotoBottomSheetRef}
          index={1}
          snapPoints={addPhotoBottomSheetSnapPoints}
          animationConfigs={bottomSheetAnimationConfigs}
          animateOnMount={true}
          onAnimate={() => console.log()}
          backgroundComponent={() => (
            <BlurView
              intensity={30}
              tint="light"
              style={[StyleSheet.absoluteFillObject, styles.bottomSheetBackground]}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.bottomSheetInnerBackground,
                  { backgroundColor: theme.primary },
                ]}
              />
            </BlurView>
          )}
          backdropComponent={renderAddPhotoBottomSheetBackdrop}
        >
          <BottomSheetView style={styles.bottomSheetContainer}>
            <BottomSheetFlatList
              data={addPhotoBottomSheetOptions}
              renderItem={({ item, index }) =>
                renderSheetListItem(
                  item,
                  index,
                  index === addPhotoBottomSheetOptions.length - 1 ? true : false
                )
              }
              keyExtractor={(item) => item.id}
            />
          </BottomSheetView>
        </BottomSheet>
      )}
      {editPhotoBottomSheetOpen && (
        <BottomSheet
          ref={editPhotoBottomSheetRef}
          index={1}
          snapPoints={editPhotoBottomSheetSnapPoints}
          animationConfigs={bottomSheetAnimationConfigs}
          animateOnMount={true}
          onAnimate={() => console.log()}
          backgroundComponent={() => (
            <BlurView
              intensity={30}
              tint="light"
              style={[StyleSheet.absoluteFillObject, styles.bottomSheetBackground]}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.bottomSheetInnerBackground,
                  { backgroundColor: theme.primary },
                ]}
              />
            </BlurView>
          )}
          backdropComponent={renderEditPhotoBottomSheetBackdrop}
        >
          <BottomSheetView style={styles.bottomSheetContainer}>
            <BottomSheetFlatList
              data={editPhotoBottomSheetOptions}
              renderItem={({ item, index }) =>
                renderSheetListItem(
                  item,
                  index,
                  index === editPhotoBottomSheetOptions.length - 1 ? true : false
                )
              }
              keyExtractor={(item) => item.id}
            />
          </BottomSheetView>
        </BottomSheet>
      )}
      {cameraOpen && (
        <View style={StyleSheet.absoluteFillObject}>
          {cameraResultOpen && cameraResult ? (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.camera.canvas }]}>
              <ImageEditor image={cameraResult} parentRef={editorRef} />
              <View
                style={[
                  styles.cameraPreviewMask,
                  { height: (screenHeight - screenWidth) / 2, backgroundColor: theme.camera.mask },
                  styles.cameraPreviewMaskUpper,
                ]}
              >
                <BlurView
                  intensity={25}
                  tint="dark"
                  style={{ width: "100%", height: (screenHeight - screenWidth) / 2 }}
                />
              </View>
              <View
                style={[
                  styles.cameraPreviewMask,
                  { height: (screenHeight - screenWidth) / 2, backgroundColor: theme.camera.mask },
                  styles.cameraPreviewMaskLower,
                ]}
              >
                <BlurView
                  intensity={25}
                  tint="dark"
                  style={{ width: "100%", height: (screenHeight - screenWidth) / 2 }}
                />
              </View>
              <View
                style={[styles.cameraPreviewTools, styles.cameraPreviewToolsTop, { marginTop: insets.top }]}
              >
                <View style={styles.cameraToolsColumnLeft}>
                  <TouchableOpacity onPress={closeCamera} style={styles.cameraButtonCancel}>
                    <Ionicons name="close-outline" size={48} color={theme.icons.default} />
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={[
                  styles.cameraPreviewTools,
                  styles.cameraPreviewToolsBottom,
                  { marginBottom: insets.bottom },
                ]}
              >
                <TouchableOpacity
                  onPress={retakePhoto}
                  style={[
                    styles.cameraPreviewAction,
                    styles.cameraButtonRetake,
                    { justifyContent: "flex-start" },
                  ]}
                >
                  <Ionicons name="refresh" size={24} color={theme.text.light} />
                  <BrandText
                    style={[styles.cameraPreviewActionText, { textAlign: "left", color: theme.text.light }]}
                  >
                    {t("editPhotosScreen.retakePhoto")}
                  </BrandText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => usePhoto(selectedImageUpload)}
                  style={[styles.cameraPreviewAction, styles.cameraButtonUse, { justifyContent: "flex-end" }]}
                >
                  <BrandBoldText
                    style={[styles.cameraPreviewActionText, { textAlign: "right", color: theme.camera.text }]}
                  >
                    {t("editPhotosScreen.usePhoto")}
                  </BrandBoldText>
                  <Ionicons name="checkmark-sharp" size={24} color={theme.icons.default} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Camera
              style={[
                StyleSheet.absoluteFillObject,
                { height: Platform.OS === "android" ? Dimensions.get("screen").height : "auto" },
              ]}
              ref={cameraRef}
              type={cameraType}
              flashMode={flashMode}
              onCameraReady={getCameraRatio}
              ratio={cameraRatio}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.cameraTools,
                  { marginTop: insets.top, marginBottom: insets.bottom },
                ]}
              >
                <View style={styles.cameraToolsTop}>
                  <View style={styles.cameraToolsColumnLeft}>
                    <TouchableOpacity onPress={closeCamera} style={styles.cameraButtonCancel}>
                      <Ionicons name="close-outline" size={48} color={theme.icons.default} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cameraToolsColumnRight}>
                    <TouchableOpacity onPress={toggleCameraType} style={styles.cameraButtonToggleType}>
                      <Ionicons name="repeat-outline" size={36} color={theme.icons.default} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleFlashMode} style={styles.cameraButtonFlashMode}>
                      <Ionicons
                        name={
                          flashMode === "off"
                            ? "flash-off-outline"
                            : flashMode === "auto"
                            ? "flash-outline"
                            : flashMode === "on"
                            ? "flash"
                            : "flashlight-outline"
                        }
                        size={30}
                        color={theme.icons.default}
                      />
                      {flashMode === "auto" && (
                        <BrandBoldText
                          style={[styles.cameraButtonFlashModeText, { color: theme.camera.text }]}
                        >
                          {t("editPhotosScreen.auto")}
                        </BrandBoldText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cameraToolsBottom}>
                  <CameraButton onPress={takePhoto} />
                </View>
              </View>
            </Camera>
          )}
        </View>
      )}
      <StatusBar style="dark" translucent />
    </>
  );
};

export default OnboardingScreen;
