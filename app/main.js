const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');


const windows = new Set();
const openFiles = new Map();

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

    newWindow.on('close', (event) => {
        if(newWindow.isDocumentEdited()) {
            event.preventDefault()

            const result = dialog.showMessageBox(newWindow, {
                type: 'warning',
                title: "Quit with Unsaved Changes?",
                buttons: [
                    'Quit Anyway',
                    'Cancel'
                ],
                defaultId: 0,
                cancelId: 1
            });
            if (result === 0) newWindow.destroy();
        }
        
    })

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        stopWatchingFile(newWindow)
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
}
const openFile = exports.openFile = (targetWindow, file) => {
    const content = fs.readFileSync(file).toString();
    app.addRecentDocument(file);
    targetWindow.setRepresentedFilename(file);
    targetWindow.webContents.send('file-opened', file, content);
    
    startWatchingFile(targetWindow, file);
} 
const saveHtml = exports.saveHtml = (targetWindow, content) => {
    const file = dialog.showSaveDialog(targetWindow, {
        title: 'Save HTML',
        defaultPath: app.getPath('documents'),
        filters: [
            { name: 'HTML Files', extensions: [ 'html', 'htm']}
        ]
    }).then(result => {
        if(!file) return;
        fs.writeFileSync(result.filePath, content);
    }).catch(err => {
        console.log(err);
    })
}
const saveMarkdown = exports.saveMarkdown = (targetWindow, file, content) => {
    if (!file) {
        file = dialog.showSaveDialog(targetWindow, {
            title: "Save Markdown",
            defaultPath: app.getPath('documents'),
            filters: [
                {name: "Markdonw Files", extensions: ['md', 'markdown']}
            ],
            properties: ['openFile']
        }).then(result => {
            
            
        writeFile(targetWindow, result.filePath, content)
        }).catch(err => {
            console.log(err);
        });
    };   
    if(!file) return;
   writeFile(targetWindow, file, content)
};
const writeFile = (targetWindow, filePath, content) => {
    console.log(filePath, 'WRITE FILE ===========');
    fs.writeFileSync(filePath, content);
        
        openFile(targetWindow, filePath);
}
// Watching Files for changes
const startWatchingFile = (targetWindow, file) => {
    stopWatchingFile(targetWindow);
    console.log(file)

    const watcher = fs.watch(file, (event) => {
        if(event === 'change') {
            const content = fs.readFileSync(file).toString();
            targetWindow.webContents.send('file-changed', file, content);
        }
    });
    openFiles.set(targetWindow, watcher);
};

const stopWatchingFile = (targetWindow) => {
    if(openFiles.has(targetWindow)) {
        let theThing = openFiles.get(targetWindow)
        console.log(theThing, '-------')
        openFiles.get(targetWindow).close();
        openFiles.delete(targetWindow);
    }
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