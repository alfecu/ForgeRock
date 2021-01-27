/*
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/*
Frontend configuration things.
*/
module.exports = {
  alert: {
    // The default or base configuration for alerts. These get passed as props into SnackbarProvider in index.js
    baseProps: {
      maxSnack: 1,
      autoHideDuration: 7000,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      },
      preventDuplicate: false,
      hideIconVariant: true,
    },
    // alert configuration specific to each alert level
    levelToOptions: {
      success: {
        variant: 'success',
        autoHideDuration: 3500,
        // no 'x' button, because it automatically goes away fairly quickly
        action: function() { return null; },
      },
      info: {
        variant: 'info',
        autoHideDuration: 9000,
      },
      warning: {
        variant: 'warning',
        autoHideDuration: 7000,
      },
      error: {
        variant: 'error',
        autoHideDuration: 15000,
      },
    },
  },
};
