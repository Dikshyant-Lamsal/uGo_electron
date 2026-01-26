/* eslint-disable prettier/prettier */
// Wrapper for Electron dialogs

export const showDialog = async (options) => {
  if (window.api && window.api.dialog) {
    return await window.api.dialog.showMessage(options);
  }
  
  // Fallback
  if (options.buttons && options.buttons.length > 1) {
    const result = window.confirm(options.message);
    return { response: result ? 1 : 0 };
  } else {
    window.alert(options.message);
    return { response: 0 };
  }
};

export const showInfo = async (message, title = 'Information') => {
  return await showDialog({
    type: 'info',
    title,
    message,
    buttons: ['OK']
  });
};

export const showError = async (message, title = 'Error') => {
  return await showDialog({
    type: 'error',
    title,
    message,
    buttons: ['OK']
  });
};

export const showWarning = async (message, title = 'Warning') => {
  return await showDialog({
    type: 'warning',
    title,
    message,
    buttons: ['OK']
  });
};

export const showConfirm = async (message, title = 'Confirm') => {
  const result = await showDialog({
    type: 'question',
    title,
    message,
    buttons: ['Cancel', 'OK']
  });
  return result.response === 1;
};

export const showSuccess = async (message, title = 'Success') => {
  return await showDialog({
    type: 'info',
    title,
    message,
    buttons: ['OK']
  });
};