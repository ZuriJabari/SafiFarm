export const Platform = {
  OS: "ios",
  select: jest.fn((obj) => obj.ios)
};

export const Dimensions = {
  get: jest.fn().mockReturnValue({
    width: 375,
    height: 812
  })
};

export const Alert = {
  alert: jest.fn()
}; 