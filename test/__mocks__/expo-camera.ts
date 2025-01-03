export const Camera = {
  Constants: {
    Type: {
      back: "back",
      front: "front"
    }
  },
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" })
}; 