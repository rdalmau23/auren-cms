const React = require('react');

module.exports = {
  useTranslations: () => (key) => key,
  useLocale: () => 'es',
  NextIntlClientProvider: ({ children }) => React.createElement(React.Fragment, null, children),
};
