import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { TouchableOpacity, ScrollView, View, KeyboardAvoidingView, Modal, Alert, Platform } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { HeaderNavigationContext } from "../../contexts/HeaderNavigationContext";
import { UserContext } from "../../contexts/UserContext";
import { updateUserProfile } from "../../hooks/useFirestore";
import { useThemeContext } from "../../hooks/useThemeContext";
import {
  validateAboutMe,
  validateFacebook,
  validateInstagram,
  validateSnapchat,
  validateTiktok,
  validateTwitter,
} from "../../utilities";
import { emojis } from "../../mappings";
import { t } from "../../locales";
import styles from "./styles";

import HeaderPadding from "../../components/HeaderPadding";
import Message from "../../components/Message";
import Emoji from "../../components/Emoji";
import EmojiListItem from "../../components/EmojiListItem";
import BrandBoldText from "../../components/BrandBoldText";
import BrandText from "../../components/BrandText";
import Input from "../../components/Input";
import MoreInfo from "../../components/MoreInfo";
import {useEventListener} from "../../hooks/useEventListener";

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

const validationErrorMappings = new Map([
  [4, { field: "aboutMe", text: t("editProfileScreen.error.url") }],
  [5, { field: "relationshipStatus", text: t("editProfileScreen.error.oneEmoji") }],
  [6, { field: "lookingFor", text: t("editProfileScreen.error.atLeastOneEmoji") }],
  [7, { field: "emojisUser", text: t("editProfileScreen.error.atLeastOneEmoji") }],
  [8, { field: "socialFacebook", text: t("editProfileScreen.error.facebook") }],
  [9, { field: "socialInstagram", text: t("editProfileScreen.error.instagram") }],
  [10, { field: "socialSnapchat", text: t("editProfileScreen.error.snapchat") }],
  [11, { field: "socialTiktok", text: t("editProfileScreen.error.tiktok") }],
  [12, { field: "socialTwitter", text: t("editProfileScreen.error.twitter") }],
  [13, { field: "emojisOthers", text: t("editProfileScreen.error.atLeastOneEmoji") }],
]);

const formStateInitial = {
  aboutMe: {
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
  },
  relationshipStatus: {
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
  },
  lookingFor: {
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
  },
  emojisUser: {
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
  },
  emojisOthers: {
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
  },
  socialFacebook: {
    type: "socialText",
    value: { id: "", shown: false, verified: false },
    placeholder: t("profile.socialFacebook.hint"),
    hint: t("profile.socialFacebook.placeholder"),
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
  },
  socialInstagram: {
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
  },
  socialSnapchat: {
    type: "socialText",
    value: { id: "", shown: false, verified: false },
    placeholder: t("profile.socialSnapchat.placeholder"),
    hint: t("profile.socialSnapchat.hint"),
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
  },
  socialTiktok: {
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
  },
  socialTwitter: {
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
  },
};

const populateProfile = (profile) => {
  if (!profile) {
    return {};
  }

  const formStateLoaded = { ...formStateInitial };
  formStateLoaded.aboutMe.value = profile.aboutMe;
  formStateLoaded.relationshipStatus.value = profile.relationshipStatus;
  formStateLoaded.lookingFor.value = profile.lookingFor;
  formStateLoaded.emojisUser.value = profile.emojisUser;
  formStateLoaded.emojisOthers.value = profile.emojisOthers;
  formStateLoaded.socialFacebook.value = { ...profile.social.facebook } || {
    id: "",
    shown: false,
    verified: false,
  };
  formStateLoaded.socialInstagram.value = { ...profile.social.instagram } || {
    id: "",
    shown: false,
    verified: false,
  };
  formStateLoaded.socialSnapchat.value = { ...profile.social.snapchat } || {
    id: "",
    shown: false,
    verified: false,
  };
  formStateLoaded.socialTiktok.value = { ...profile.social.tiktok } || {
    id: "",
    shown: false,
    verified: false,
  };
  formStateLoaded.socialTwitter.value = { ...profile.social.twitter } || {
    id: "",
    shown: false,
    verified: false,
  };
  return formStateLoaded;
};

const assertProfileStatesEqual = (updated, original) =>
  updated.aboutMe.value === original.aboutMe &&
  updated.relationshipStatus.value === original.relationshipStatus &&
  updated.lookingFor.value.every((e) => original.lookingFor.includes(e)) &&
  original.lookingFor.every((e) => updated.lookingFor.value.includes(e)) &&
  updated.emojisUser.value.every((e) => original.emojisUser.includes(e)) &&
  original.emojisUser.every((e) => updated.emojisUser.value.includes(e)) &&
  updated.emojisOthers.value.every((e) => original.emojisOthers.includes(e)) &&
  original.emojisOthers.every((e) => updated.emojisOthers.value.includes(e)) &&
  updated.socialFacebook.value.id === original.social.facebook?.id &&
  updated.socialInstagram.value.id === original.social.instagram?.id &&
  updated.socialSnapchat.value.id === original.social.snapchat?.id &&
  updated.socialTiktok.value.id === original.social.tiktok?.id &&
  updated.socialTwitter.value.id === original.social.twitter?.id;

const EditProfileScreen = ({ navigation }) => {
  const { user, profile, updateProfile } = useContext(UserContext);
  const originalProfile = useMemo(() => populateProfile(profile), []);
  const { setNavigationData, setHeaderProps } = useContext(HeaderNavigationContext);
  const [validationErrors, setValidationErrors] = useState(() => new Set());
  const [errors, setErrors] = useState(() => new Set());
  const [showMessage, setShowMessage] = useState("");
  const [formState, setFormState] = useState(originalProfile);
  const [emojiListModalOpen, setEmojiListModalOpen] = useState(false);
  const [activeEmojiList, setActiveEmojiList] = useState("");
  const [tempSelectValue, setTempSelectValue] = useState(null);
  const [changesMade, setChangesMade] = useState(false);
  const insets = useSafeAreaInsets();
  const { theme } = useThemeContext();

  const isFormValid =
    validationErrors.size === 0 &&
    errors.size === 0 &&
    Object.values(formState).every((field) => field.valid !== false);

  const removeValidationError = (errorCode) => {
    setValidationErrors((state) => {
      const next = new Set(state);
      next.delete(errorCode);
      return next;
    });
  };

  const checkForValidationError = (errorCode, condition) => {
    if (!condition) {
      if (!validationErrors.has(errorCode)) setValidationErrors((state) => new Set(state).add(errorCode));
    } else {
      removeValidationError(errorCode);
    }
  };

  useEffect(() => {
    if (Object.values(formState).some((field) => !field.valid)) {
      if (formState.aboutMe.dirty) {
        checkForValidationError(ERROR_URL_IN_TEXT, validateAboutMe(formState.aboutMe.value));
      }

      if (formState.relationshipStatus.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_RELATIONSHIPSTATUS_SELECTION,
          formState.relationshipStatus.value.length > 0
        );
      }

      if (formState.lookingFor.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_LOOKINGFOR_SELECTION,
          formState.lookingFor.value.length > 0
        );
      }

      if (formState.emojisUser.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_USEREMOJI_SELECTION,
          formState.emojisUser.value.length > 0
        );
      }

      if (formState.socialFacebook.dirty && formState.socialFacebook.value.id) {
        checkForValidationError(
          ERROR_INVALID_FACEBOOK_USERNAME,
          validateFacebook(formState.socialFacebook.value.id)
        );
      }

      if (formState.socialInstagram.dirty && formState.socialInstagram.value.id) {
        checkForValidationError(
          ERROR_INVALID_INSTAGRAM_USERNAME,
          validateInstagram(formState.socialInstagram.value.id)
        );
      }

      if (formState.socialSnapchat.dirty && formState.socialSnapchat.value.id) {
        checkForValidationError(
          ERROR_INVALID_SNAPCHAT_USERNAME,
          validateSnapchat(formState.socialSnapchat.value.id)
        );
      }

      if (formState.socialTiktok.dirty && formState.socialTiktok.value.id) {
        checkForValidationError(
          ERROR_INVALID_TIKTOK_USERNAME,
          validateTiktok(formState.socialTiktok.value.id)
        );
      }

      if (formState.socialTwitter.dirty && formState.socialTwitter.value.id) {
        checkForValidationError(
          ERROR_INVALID_TWITTER_USERNAME,
          validateTwitter(formState.socialTwitter.value.id)
        );
      }

      if (formState.emojisOthers.dirty) {
        checkForValidationError(
          ERROR_AT_LEAST_ONE_OTHERSEMOJI_SELECTION,
          formState.emojisOthers.value.length > 0
        );
      }
    }

    for (const field in formState) {
      if (
        (!formState[field].value || !formState[field].value.toString().length) &&
        formState[field].type !== "emojiSelect" &&
        formState[field].type !== "emojiMultiSelect" &&
        formState[field].type !== "socialText"
      ) {
        Array.from(validationErrorMappings.entries())
          .map((error) => ({ code: error[0], ...error[1] }))
          .filter((error) => error.field === field)
          .forEach(({ code }) => removeValidationError(code));
      }
    }

    if (!assertProfileStatesEqual(formState, profile)) {
      setChangesMade(true);
    } else {
      setChangesMade(false);
    }
  }, [formState, profile]);

  const handleSaveChanges = async () => {
    try {
      const update = {
        "profile.aboutMe": formState.aboutMe.value,
        "profile.relationshipStatus": formState.relationshipStatus.value,
        "profile.lookingFor": formState.lookingFor.value,
        "profile.emojisUser": formState.emojisUser.value,
        "profile.emojisOthers": formState.emojisOthers.value,
        "profile.social": {
          facebook: formState.socialFacebook.value,
          instagram: formState.socialInstagram.value,
          snapchat: formState.socialSnapchat.value,
          tiktok: formState.socialTiktok.value,
          twitter: formState.socialTwitter.value,
        },
      };

      const localUpdate = {
        aboutMe: formState.aboutMe.value,
        relationshipStatus: formState.relationshipStatus.value,
        lookingFor: formState.lookingFor.value,
        emojisUser: formState.emojisUser.value,
        emojisOthers: formState.emojisOthers.value,
        social: {
          facebook: formState.socialFacebook.value,
          instagram: formState.socialInstagram.value,
          snapchat: formState.socialSnapchat.value,
          tiktok: formState.socialTiktok.value,
          twitter: formState.socialTwitter.value,
        },
      };

      const wasUpdated = updateUserProfile(user?.uid, update);
      if (!wasUpdated) throw new Error(t("editProfileScreen.error.updateProfile"));
      updateProfile(localUpdate);
      setChangesMade(false);
      navigation.navigate("ViewProfile", { updatedProfile: true });
    } catch (error) {
      setShowMessage(error.message);
      setTimeout(() => setShowMessage(""), 3000);
      console.log(error);
    }
  };

  const handleGoBack = () => {
    if (changesMade) {
      Alert.alert(t("discardAlert.unsavedChanges"), t("discardAlert.unsavedChangesHint"), [
        { text: t("discardAlert.cancel"), onPress: () => {}, style: "cancel" },
        {
          text: t("discardAlert.discard"),
          onPress: () => {
            setFormState(originalProfile);
            setChangesMade(false);
            navigation.goBack();
          },
          style: "destructive",
        },
      ]);
    } else {
      setFormState(originalProfile);
      navigation.goBack();
    }
  };

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

  const validateInput = (value, { required, method }) =>
    required === null ? method(value) : required ? method(value) : true;

  const formFieldOnChange = (value, id, externalValidation) => {
    const formInput = { ...formState };
    formInput[id].dirty = true;

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

    if (formInput[id].value.toString().length > 0 && id === "aboutMe") {
      formInput[id].valid = validateAboutMe(value);
    } else if (formInput[id].type === "socialText") {
      formInput[id].valid = formInput[id].value.id ? validateInput(value.id, formInput[id].validation) : null;
      formInput[id].value.shown = !!formInput[id].valid;
    } else if (formInput[id].value.toString().length > 0) {
      formInput[id].valid =
        externalValidation !== null ? externalValidation : validateInput(value, formInput[id].validation);
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

    setErrors(new Set());
    setFormState({ ...formInput });
  };

  const formFieldEndEditing = (id, externalValidation) => {
    const formInput = { ...formState };
    formInput[id].dirty = true;

    if (formInput[id].value.toString().length > 0 && id === "aboutMe") {
      formInput[id].valid = validateAboutMe(formInput[id].value);
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
        formInput[id].value.shown = !!formInput[id].valid;
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
      .forEach(({ code }) => removeValidationError(code));

    setFormState({ ...formInput });
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
          <BrandText style={[styles.textAreaLimitText, { color: theme.text.light }]}>
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

  const socialInputStyles = {
    placeholderTextColor: theme.text.light,
    placeholderBorderColor: theme.primary,
    borderColor: theme.border.primary,
  };

  const headerLeft = (
    <TouchableOpacity style={styles.headerBack} onPress={handleGoBack} hitSlop={15}>
      <Ionicons name="chevron-back-outline" size={24} color={theme.icons.default} />
      <BrandText style={[styles.headerBackText, { color: theme.text.secondary }]}>
        {t("header.back")}
      </BrandText>
    </TouchableOpacity>
  );

  const headerRight = changesMade && isFormValid && (
    <TouchableOpacity style={styles.headerSaveChanges} onPress={handleSaveChanges} hitSlop={15}>
      <FontAwesome5 name="check" size={16} color={theme.icons.default} style={{ marginRight: 5 }} />
      <BrandBoldText style={[styles.headerSaveChangesText, { color: theme.text.secondary }]}>
        {t("header.save")}
      </BrandBoldText>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      setNavigationData(navigation);

      setHeaderProps((state) => ({
        ...state,
        colors: theme.gradient.third,
        title: t("header.editProfile"),
        curvature: null,
        headerPadding: null,
        headerHidden: false,
        headerTitle: null,
        headerLeft,
        headerRight,
      }));
    }, [changesMade, isFormValid])
  );

  return (
    <>
      {showMessage ? <Message>{showMessage}</Message> : null}
      {emojiListModalOpen && (
        <Modal
          statusBarTranslucent={true}
          animationType="fade"
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
                <BrandText
                  style={[
                    styles.modalSubtitle,
                    styles.emojiListModalSubtitle,
                    { color: theme.text.subtitle },
                  ]}
                >
                  {formState[activeEmojiList].type === "emojiSelect"
                    ? t("editProfileScreen.chooseOne")
                    : t("editProfileScreen.chooseOneOrMore")}
                </BrandText>
                <MoreInfo
                  backgroundColor={theme.text.subtitle}
                  text={formState[activeEmojiList].hint}
                  containerStyle={styles.modalMoreInfo}
                  nonLocal={true}
                />
              </View>
              <ScrollView style={styles.modalList} decelerationRate="fast">
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
                      styles.saveChangesButton,
                      { backgroundColor: theme.button.primary },
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
                      {t("editProfileScreen.saveChoices")}
                    </BrandBoldText>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { backgroundColor: theme.button.cancel }]}
                  onPress={() => handleModalCancel(activeEmojiList)}
                >
                  <BrandBoldText style={[styles.buttonText, { color: theme.text.secondary }]}>
                    {t("editProfileScreen.cancel")}
                  </BrandBoldText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: theme.primary }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.scrollContainer}>
          <HeaderPadding>
            <View style={styles.editProfileContainer(insets)}>
              <View style={[styles.inputContainer, { borderColor: theme.border.primary }]}>
                <View style={styles.inputHeader}>
                  <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.light }]}>
                    {t("editProfileScreen.aboutMe")}
                  </BrandBoldText>
                  <MoreInfo
                    backgroundColor={theme.text.subtitle}
                    text={formState.aboutMe.hint}
                    containerStyle={styles.moreInfoIcon}
                    overridePosition
                    overrideY={insets.top + 20}
                  />
                </View>
                {buildInput("aboutMe", { style: { borderWidth: 1, borderColor: theme.border.primary } })}
              </View>
              <View style={[styles.inputContainer, { borderColor: theme.border.primary }]}>
                <View style={styles.inputHeader}>
                  <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.light }]}>
                    {t("editProfileScreen.myRelationshipStatus")}
                  </BrandBoldText>
                  <MoreInfo
                    backgroundColor={theme.text.subtitle}
                    text={formState.relationshipStatus.hint}
                    containerStyle={styles.moreInfoIcon}
                  />
                </View>
                <View style={styles.emojiSelectionsWrapper}>
                  {formState.relationshipStatus.value && (
                    <TouchableOpacity onPress={() => handleModalOpen("relationshipStatus")}>
                      <Emoji
                        key={formState.relationshipStatus.value}
                        size="medium"
                        emoji={formState.relationshipStatus.value}
                        type="relationshipStatus"
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleModalOpen("relationshipStatus")}
                    style={[
                      styles.emoji,
                      styles.emojiEmptyMedium,
                      styles.emojiEmpty,
                      { borderColor: theme.emoji.border },
                    ]}
                  >
                    {formState.relationshipStatus.value ? (
                      <MaterialIcons name="edit" size={24} color={theme.border.primary} />
                    ) : (
                      <Ionicons name="add-outline" size={32} color={theme.border.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                {buildErrorMessages("relationshipStatus")}
              </View>
              <View style={[styles.inputContainer, { borderColor: theme.border.primary }]}>
                <View style={styles.inputHeader}>
                  <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.light }]}>
                    {t("editProfileScreen.imLookingFor")}
                  </BrandBoldText>
                  <MoreInfo
                    backgroundColor={theme.text.subtitle}
                    text={formState.lookingFor.hint}
                    containerStyle={styles.moreInfoIcon}
                  />
                </View>
                <View style={styles.emojiSelectionsWrapper}>
                  {formState.lookingFor.value.join("").length > 0 && (
                    <View style={styles.emojiSelections}>
                      {formState.lookingFor.value.map((emoji) => (
                        <Emoji
                          key={emoji}
                          size="medium"
                          emoji={emoji}
                          style={styles.emojiIcon}
                          type="lookingFor"
                        />
                      ))}
                      <TouchableOpacity
                        onPress={() => handleModalOpen("lookingFor")}
                        style={[
                          styles.emoji,
                          styles.emojiEmptyMedium,
                          styles.emojiEmpty,
                          { borderColor: theme.emoji.border },
                        ]}
                      >
                        <MaterialIcons name="edit" size={24} color={theme.border.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {formState.lookingFor.value.join("").length === 0 && (
                    <TouchableOpacity
                      onPress={() => handleModalOpen("lookingFor")}
                      style={[
                        styles.emoji,
                        styles.emojiEmptyMedium,
                        styles.emojiEmpty,
                        { borderColor: theme.emoji.border },
                      ]}
                    >
                      <Ionicons name="add-outline" size={24} color={theme.border.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {buildErrorMessages("lookingFor")}
              </View>
              <View style={[styles.inputContainer, { borderColor: theme.border.primary }]}>
                <View style={styles.inputHeader}>
                  <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.light }]}>
                    {t("editProfileScreen.iAm")}
                  </BrandBoldText>
                  <MoreInfo
                    backgroundColor={theme.text.subtitle}
                    text={formState.emojisUser.hint}
                    containerStyle={styles.moreInfoIcon}
                  />
                </View>
                <View style={styles.emojiSelectionsWrapper}>
                  {formState.emojisUser.value.join("").length > 0 && (
                    <View style={styles.emojiSelections}>
                      {formState.emojisUser.value.map((emoji) => (
                        <Emoji key={emoji} size="medium" emoji={emoji} style={styles.emojiIcon} />
                      ))}
                      <TouchableOpacity
                        onPress={() => handleModalOpen("emojisUser")}
                        style={[
                          styles.emoji,
                          styles.emojiEmptyMedium,
                          styles.emojiEmpty,
                          { borderColor: theme.emoji.border },
                        ]}
                      >
                        <MaterialIcons name="edit" size={24} color={theme.border.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {formState.emojisUser.value.join("").length === 0 && (
                    <TouchableOpacity
                      onPress={() => handleModalOpen("emojisUser")}
                      style={[
                        styles.emoji,
                        styles.emojiEmptyMedium,
                        styles.emojiEmpty,
                        { borderColor: theme.emoji.border },
                      ]}
                    >
                      <Ionicons name="add-outline" size={32} color={theme.border.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {buildErrorMessages("emojisUser")}
              </View>
              <View style={[styles.inputContainer, { borderColor: theme.border.primary }]}>
                <View style={styles.inputHeader}>
                  <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.light }]}>
                    {t("editProfileScreen.myMatchShouldBe")}
                  </BrandBoldText>
                  <MoreInfo
                    backgroundColor={theme.text.subtitle}
                    text={formState.emojisOthers.hint}
                    containerStyle={styles.moreInfoIcon}
                  />
                </View>
                <View style={styles.emojiSelectionsWrapper}>
                  {formState.emojisOthers.value.join("").length > 0 && (
                    <View style={styles.emojiSelections}>
                      {formState.emojisOthers.value.map((emoji) => (
                        <Emoji key={emoji} size="medium" emoji={emoji} style={styles.emojiIcon} />
                      ))}
                      <TouchableOpacity
                        onPress={() => handleModalOpen("emojisOthers")}
                        style={[
                          styles.emoji,
                          styles.emojiEmptyMedium,
                          styles.emojiEmpty,
                          { borderColor: theme.emoji.border },
                        ]}
                      >
                        <MaterialIcons name="edit" size={24} color={theme.border.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {formState.emojisOthers.value.join("").length === 0 && (
                    <TouchableOpacity
                      onPress={() => handleModalOpen("emojisOthers")}
                      style={[
                        styles.emoji,
                        styles.emojiEmptyMedium,
                        styles.emojiEmpty,
                        { borderColor: theme.emoji.border },
                      ]}
                    >
                      <Ionicons name="add-outline" size={32} color={theme.border.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {buildErrorMessages("emojisOthers")}
              </View>
              <View
                style={[styles.inputContainer, { borderBottomWidth: 0, borderColor: theme.border.primary }]}
              >
                <View style={styles.inputHeader}>
                  <BrandBoldText style={[styles.inputHeaderText, { color: theme.text.light }]}>
                    {t("editProfileScreen.mySocialMedia")}
                  </BrandBoldText>
                  <MoreInfo
                    backgroundColor={theme.text.subtitle}
                    text={t("editProfileScreen.chooseSocialToShare")}
                    containerStyle={styles.moreInfoIcon}
                  />
                </View>
                {buildInput("socialFacebook", { ...socialInputStyles })}
                {buildInput("socialInstagram", { ...socialInputStyles })}
                {buildInput("socialSnapchat", { ...socialInputStyles })}
                {buildInput("socialTiktok", { ...socialInputStyles })}
                {buildInput("socialTwitter", { ...socialInputStyles })}
              </View>
            </View>
          </HeaderPadding>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default EditProfileScreen;
