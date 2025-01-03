export const launchImageLibraryAsync = jest.fn().mockResolvedValue({
  cancelled: false,
  assets: [{
    uri: "mock-image.jpg",
    width: 1024,
    height: 768,
    type: "image"
  }]
});

export const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: "granted",
  granted: true
}); 