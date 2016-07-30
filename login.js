const {ipcRenderer} = require('electron');

$('#login-btn').click(function() {
  ipcRenderer.send('facebook-button-clicked');
});
