const { app, BrowserWindow } = require('electron');

let mainWindow = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.webContents.loadURL('file://' + __dirname + '/index.html');
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    })
})