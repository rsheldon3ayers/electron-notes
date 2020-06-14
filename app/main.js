const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');


const windows = new Set();

let mainWindow = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });
    mainWindow.webContents.loadURL(`file://${__dirname}/index.html`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    })
    createWindow();
})

const createWindow = exports.createWindow = () => {
    let x, y;
    const currentWindow = BrowserWindow.getFocusedWindow();

    if(currentWindow) {
        const [ currentWindowX, currentWindowY] = currentWindow.getPosition();
        x = currentWindowX + 10;
        y = currentWindowY + 10;

    }
    let newWindow = new BrowserWindow({ 
        x, 
        y,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })
    newWindow.loadURL(`file://${__dirname}/index.html`);
    newWindow.once('ready-to-show', () => {
        newWindow.show();
    })

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null;
    });
    windows.add(newWindow);
    return newWindow;
}
const getFileFromUser = exports.getFileFromUser = (targetWindow) => {
    const files = dialog.showOpenDialog(targetWindow, {

        filters: [
            { name: 'Markdown Files', extensions: ['md', 'markdown']},
            { name: 'Text Files', extensions: ['txt']}   
        ],
        properties: ['openFile']
    }).then(result => {
        if(files) { openFile(targetWindow, result.filePaths[0]) }
    }).catch(err => {
        console.log("ERROR MESSAGE:", err);
    });

    const openFile = exports.openFile = (targetWindow, file) => {
        const content = fs.readFileSync(file).toString();
        app.addRecentDocument(file);
        targetWindow.setRepresentedFilename(file);
        targetWindow.webContents.send('file-opened', file, content);
    }    
}
const saveHtml = exports.saveHtml = (targetWindow, content) => {
    const file = dialog.showSaveDialog(targetWindow, {
        title: 'Save HTML',
        defaultPath: app.getPath('documents'),
        filters: [
            { name: 'HTML Files', extensions: [ 'html', 'htm']}
        ]
    })

    if(!file) return;

    fs.writeFileSync(file, content);
}
// Closing window kills the app only on non-mac machines
app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
        return false;
    }
    app.quit();
});
// opens window if app is clicked in mac doc
app.on('activate', (event, hasVisibleWindows) => {
    if(!hasVisibleWindows) { createWindow(); }
});

app.on('will-finish-launching', () => {
    app.on('open-file', (event, file) => {
      const win = createWindow();
      win.once('ready-to-show', () => {
          this.openFile(win, file);
      });
    });
});