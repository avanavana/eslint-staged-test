import { StyleSheet, Dimensions } from "react-native";

const screenWidth = Math.min(Dimensions.get("window").height, Dimensions.get("window").width);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  scrollContainer: {
    width: "100%",
  },
  profileHeader: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 10,
  },
  header: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  headerBack: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    opacity: 0.5,
  },
  headerBackText: {
    fontSize: 14,
    marginLeft: 0,
    lineHeight: 22,
  },
  headerSaveChanges: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  headerSaveChangesText: {
    fontSize: 14,
    marginLeft: 0,
    lineHeight: 22,
  },
  editProfileContainer: (insets) => ({
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 49 + insets.bottom,
  }),
  inputContainer: {
    width: screenWidth - 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderStyle: "solid",
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingBottom: 5,
  },
  inputHeaderText: {
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    top: 7,
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
  emoji: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    margin: 5,
  },
  emojiIcon: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    margin: 5,
  },
  emojiMedium: {
    width: Math.round((screenWidth - 40) / 5),
    height: Math.round((screenWidth - 40) / 5),
  },
  emojiEmptyMedium: {
    width: Math.round((screenWidth - 40) / 5) * 0.762,
    height: Math.round((screenWidth - 40) / 5) * 0.762,
  },
  emojiEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 999,
  },
  emojiSelectionsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    marginRight: 0,
  },
  emojiSelections: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
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
  emojiWrapper: {
    width: 32,
    height: 32,
  },
  emojiList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  modalButton: {
    width: "100%",
    position: "absolute",
    bottom: 20,
  },
  modalButtonGroup: {
    width: "100%",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingTop: 20,
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
    marginTop: 20,
  },
  modalSubtitleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    top: 0,
    padding: 0,
    margin: 0,
  },
  modalMoreInfo: {
    textAlign: "right",
    zIndex: 1,
  },
  moreInfoIcon: {
    bottom: 5,
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
    marginBottom: 20,
  },
});

export default styles;
