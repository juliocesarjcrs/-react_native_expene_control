const Font = {
  isLoaded: jest.fn().mockReturnValue(true),
  loadAsync: jest.fn()
};

module.exports = Font;
module.exports.Font = Font;
module.exports.default = Font;
