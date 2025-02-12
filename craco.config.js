module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [/Failed to parse source map/],
      module: {
        rules: [
          {
            test: /\.m?js/,
            resolve: {
              fullySpecified: false
            }
          }
        ]
      }
    }
  }
};
