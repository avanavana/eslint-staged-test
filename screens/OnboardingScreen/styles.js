import { StyleSheet, Dimensions } from "react-native";

const screenWidth = Math.min(Dimensions.get("window").height, Dimensions.get("window").width);
const screenHeight = Math.max(Dimensions.get("window").height, Dimensions.get("window").width);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageContainer: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  inputHeaderText: {
    alignSelf: "flex-start",
    marginTop: "auto",
    fontSize: 18,
  },
  welcomeText: {
    fontSize: 48,
    textAlign: "center",
  },
  paragraphText: {
    fontSize: 16,
    textAlign: "center",
  },
  paragraphTextLink: {
    textDecorationLine: "underline",
  },
  textAreaLimit: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 5,
  },
  textAreaLimitText: {
    fontSize: 13,
    textAlign: "right",
  },
  photoContainer: {
    width: "100%",
    marginTop: 10,
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  photoRowUpper: {},
  photoRowLower: {
    top: (90 / 2 + 10) * Math.sqrt(3) - 90,
    position: "relative",
  },
  onboardingPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    position: "relative",
  },
  onboardingPhotoEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  onboardingPhotoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  onboardingPhotoLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: 45,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  onboardingPhotoLabel: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    width: 24,
    height: 24,
    position: "absolute",
    top: 0,
    left: 0,
  },
  onboardingPhotoLabelText: {
    marginTop: 2,
    fontSize: 13,
  },
  cameraTools: {
    justifyContent: "space-between",
  },
  cameraToolsBottom: {
    justifyContent: "center",
    flexDirection: "row",
  },
  cameraToolsTop: {
    justifyContent: "space-between",
    flexDirection: "row",
  },
  cameraToolsColumnLeft: {
    paddingLeft: 20,
    paddingTop: 20,
  },
  cameraToolsColumnRight: {
    paddingRight: 20,
    paddingTop: 20,
  },
  cameraButtonFlashMode: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 20,
  },
  cameraButtonFlashModeText: {
    fontSize: 8,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 2,
  },
  cameraPreviewWrapper: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cameraPreviewMaskWrapper: {
    justifyContent: "space-between",
  },
  cameraPreviewMask: {
    width: "100%",
    position: "absolute",
    left: 0,
    right: 0,
  },
  cameraPreviewMaskUpper: {
    top: 0,
  },
  cameraPreviewMaskLower: {
    bottom: 0,
  },
  cameraPreviewTools: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
  },
  cameraPreviewToolsTop: {
    justifyContent: "flex-start",
    flexDirection: "row",
    top: 0,
  },
  cameraPreviewToolsBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    bottom: 0,
  },
  cameraPreviewAction: {
    width: "50%",
    height: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  cameraPreviewActionText: {
    fontSize: 16,
    marginTop: 6,
    paddingHorizontal: 5,
  },
  cameraButtonRetake: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  cameraButtonUse: {
    paddingRight: 20,
    marginBottom: 20,
  },
  onboardingEmoji: {
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    position: "relative",
  },
  onboardingEmojiSmall: {
    width: 32,
    height: 32,
  },
  onboardingEmojiMedium: {
    width: 64,
    height: 64,
  },
  onboardingEmojiLarge: {
    width: 256,
    height: 256,
  },
  onboardingEmojiEmptySmall: {
    width: Math.round(32 * 0.762),
    height: Math.round(32 * 0.762),
  },
  onboardingEmojiEmptyMedium: {
    width: Math.round(64 * 0.762),
    height: Math.round(64 * 0.762),
  },
  onboardingEmojiEmptyLarge: {
    width: Math.round(256 * 0.762),
    height: Math.round(256 * 0.762),
  },
  onboardingEmojiEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 999,
  },
  onboardingEmojiEmptyOptionalText: {
    fontSize: 11,
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  checkboxHitArea: {
    width: "100%",
    height: 56,
    justifyContent: "center",
    position: "relative",
    top: 17,
  },
  buttonContainer: {
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    zIndex: 0,
  },
  button: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    height: 56,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 16,
    top: 1,
  },
  buttonTextDisabled: {
    fontWeight: "700",
    fontSize: 16,
  },
  buttonEULAIcon: {
    marginRight: 10,
  },
  barContainer: {
    position: "absolute",
    zIndex: 0,
    top: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  backButton: (insets) => ({
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: insets.top + 5,
    left: 18,
    opacity: 0.7,
    zIndex: 1,
  }),
  track: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    overflow: "hidden",
    height: 8,
    width: screenWidth * 0.6,
    borderRadius: 4,
  },
  bar: {
    height: 8,
    width: screenWidth * 0.6,
    position: "absolute",
    left: 0,
    top: 0,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
    fontFamily: "Brand-Regular",
    fontSize: 15,
    height: 56,
    width: "100%",
  },
  invalidInput: {
    borderWidth: 2,
  },
  inputError: {
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 5,
    alignSelf: "flex-start",
  },
  inputErrorCenter: {
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 5,
    alignSelf: "center",
  },
  inputErrorText: {
    fontSize: 12,
  },
  dateInputButton: {
    width: 32,
    height: 32,
    position: "absolute",
    right: 12,
    top: 53,
  },
  moreInfoIcon: {
    top: 5,
  },
  agePreferencesReset: {
    position: "absolute",
    opacity: 0.5,
    padding: 5,
    transform: [{ scaleX: -1 }],
    right: 1,
    top: 24,
  },
  currentLocation: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingBottom: 10,
    marginTop: 10,
    marginLeft: 20,
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  modalButtonGroup: {
    width: "100%",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingTop: 20,
    paddingBottom: 20,
  },
  modal: {
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    flex: 1,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 40,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 10,
    top: 4,
  },
  modalSubtitleWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalMoreInfo: {
    textAlign: "right",
    bottom: 2,
  },
  modalList: {
    width: "100%",
    flex: 1,
  },
  saveChangesButton: {
    marginTop: 0,
  },
  cancelButton: {
    borderRadius: 10,
    flexDirection: "row",
  },
  shadowsShallow: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 3,
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    width: "100%",
  },
  bottomSheetBackground: {
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    overflow: "hidden",
  },
  bottomSheetInnerBackground: {
    zIndex: 999,
    opacity: 0.75,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  bottomSheetBackdrop: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  bottomSheetBackdropImage: (topInset) => ({
    width: "80%",
    height: screenWidth * 0.8,
    marginTop: (screenHeight - screenWidth * 0.8 - 288 + topInset) / 2,
    borderRadius: 20,
  }),
  bottomSheetBackdropTitle: (topInset) => ({
    width: "80%",
    textAlign: "center",
    fontSize: 18,
    height: 20,
    marginTop: (screenHeight - screenWidth * 0.8 - 248 + topInset) / 2 - 20 - 20,
    marginBottom: -((screenHeight - screenWidth * 0.8 - 288 + topInset) / 2) + 20,
  }),
  emojiList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  emojiSelectionsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  emojiSelections: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiListCounter: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginRight: 14,
    position: "relative",
    left: 1,
  },
  emojiListCounterText: {
    fontSize: 10,
    top: 1,
  },
  emojiListModalSubtitle: {
    marginRight: 5,
  },
  logoText: {
    height: (screenWidth * 2) / 9,
    width: "80%",
  },
});

export default styles;
