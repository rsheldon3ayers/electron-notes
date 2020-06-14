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
    let newWindow = new BrowserWindow({ 
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
        targetWindow.webContents.send('file-opened', file, content);
    }    
}

