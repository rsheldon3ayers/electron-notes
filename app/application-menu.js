const {app, BrowserWindow, Menu, MenuItem, shell} = require('electron');
const mainProcess = require('./main');

const copyMenuITem = new MenuItem({
    label: 'Copy',
    accelerator: 'CommandOrControl+C',
    role: 'copy'
});
const template =[
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
              accelerator: 'CommandOrControl+Z',
              role: 'undo',
            },
            {
                label: 'Redo',
              accelerator: 'Shift+CommandOrControl+Z',
              role: 'redo',
            },
            { type: 'separator'},
            {
                label: 'Cut',
              accelerator: 'CommandOrControl+X',
              role: 'cut',
            },
            {
              label: 'Copy',
              accelerator: 'CommandOrControl+C',
              role: 'copy',
            },
            {
                label: 'Paste',
                accelerator: 'CommandOrControl+V',
                role: 'paste',
            },
            {
                label: 'Select All',
                accelerator: 'CommandOrControl+A',
                role: 'selectall',
            },
        ]
    },
    {
        label: 'Window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CommandOrControl+M',
                role: 'minimize',
            },
            {
                label: 'close this',
                accelerator: 'CommanOrControl+W',
                role: 'close',
            },
        ],
    },
];

if(process.platform === 'darwin') {
    const name = 'Quick Notes';
    template.unshift({
        label: name,
        submenu: [
            {
                label: `About ${name}`,
                role: 'about',
            }, 
            { type: 'separator' },
            {
                label: 'Services',
                role: 'services',
                submenu: [],
            },
            { type: 'separator' },
            {
                label: `Hide ${name}`,
                accelerator: 'Command+H',
                role: 'hide',
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+H',
                role: 'hide',
            },
            {
                label: 'Show All',
                role: 'unhide',
            },
            { type: 'separator' },
            {
               label: `Quit ${name}`,
               accelerator: 'Command+Q',
               click() { app.quit(); },
            },
        ],
    });
}
module.exports = Menu.buildFromTemplate(template);