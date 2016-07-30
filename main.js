const electron = require('electron')
const {ipcMain} = require('electron')
// Module to control application life.
const app = electron.app
const FB  = require('fb')
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800, height: 600,
    webPreferences: {
      webSecurity: false,
      plugins: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/login.html`)

  ipcMain.on("facebook-button-clicked",function (event, arg) {
    var options = {
      client_id: '1656785501307920',
      scopes: "public_profile",
      redirect_uri: "https://www.facebook.com/connect/login_success.html"
    };
    var authWindow = new BrowserWindow({ width: 450, height: 300, show: false, 'node-integration': false });
    var facebookAuthURL = "https://www.facebook.com/dialog/oauth?client_id=" + options.client_id + "&redirect_uri=" + options.redirect_uri + "&response_type=token,granted_scopes&scope=" + options.scopes + "&display=popup";

    authWindow.loadURL(facebookAuthURL);
    authWindow.show();
    authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
      var raw_code = /access_token=([^&]*)/.exec(newUrl) || null;
      access_token = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
      error = /\?error=(.+)$/.exec(newUrl);
      if (access_token) {
        FB.setAccessToken(access_token);
        mainWindow.loadURL(`file://${__dirname}/index.html`)
      }
    });
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
