import {app, BrowserWindow, ipcMain} from "electron";
import * as path from "path";
import * as url from "url";

// Module to control application life.
// const app = electron.app
// Module to create native browser window.
// const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let splash;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, title: "The Wallet", show: false});

  splash = new BrowserWindow({width: 800, height: 600, alwaysOnTop: true, webPreferences: {nodeIntegration: false}});
  splash.loadURL(url.format({
    pathname: path.join(__dirname, "../static/splash.html"),
    protocol: "file:",
    slashes: true,
  }));

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, "../static/index.html"),
    protocol: "file:",
    slashes: true,
  }));

  // Open the DevTools.
  // splash.webContents.openDevTools()
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// close splash screen and show main window when page is ready
ipcMain.on("my-page-ready", (event, arg) => {
  splash.destroy();
  mainWindow.show();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
});

app.on("activate", function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.