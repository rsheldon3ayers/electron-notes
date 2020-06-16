const marked = require('marked');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main.js');
const currentWindow = remote.getCurrentWindow();

let filePath = null;
let originalContent = '';

const isDifferentContent = (content) => content != markdownView.value;
const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdowButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

// Drag and Drop Events
document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragleave', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());


const renderMarkdownToHtml = (markdown) => {
    htmlView.innerHTML = marked(sanitizeHtml(markdown));
}
markdownView.addEventListener('keyup', (event) => {
    const currentContent = event.target.value;
    renderMarkdownToHtml(currentContent);
    updateUserInterface(currentContent !== originalContent);
});
openFileButton.addEventListener('click', () => {
    mainProcess.getFileFromUser(currentWindow);
});

newFileButton.addEventListener('click', () => {
    mainProcess.createWindow();
});

saveHtmlButton.addEventListener('click', () => {
    mainProcess.saveHtml(currentWindow, htmlView.innerHTML);
});

saveMarkdowButton.addEventListener('click', () => {
    console.log('SAVING');
    mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value);
});

revertButton.addEventListener('click', () => {
    markdownView.value = originalContent;
    renderMarkdownToHtml(originalContent);
});

// drag and drop functions

const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];

const fileTypeSupprted = (file) => {
    return ['txt/plain', 'text/markdown'].includes(file.type);
};

markdownView.addEventListener('dragover', (event) => {
    const file = getDraggedFile(event);

    if(fileTypeSupprted(file)) {
        markdownView.classList.add('drag-over');
    } else {
        markdownView.classList.add('drag-error');
    }
});

markdownView.addEventListener('dragleave', () => {
    markdownView.classList.remove('drag-over');
    markdownView.classList.remove('drag-error');
});
markdownView.addEventListener('drop', (event) => {
    const file = getDroppedFile(event);
   if(fileTypeSupprted(file)) {
       mainProcess.openFile(currentWindow, file.path);
   } else {
       alert('That file type is not supported');
   }
   markdownView.classList.remove('drag-over');
   markdownView.classList.remove('drag-error');
});

const renderFile = (file, content) => {
    filePath = file;
    originalContent = content;

    markdownView.value = content;
    renderMarkdownToHtml(content);

    updateUserInterface(false);
}
ipcRenderer.on('file-opened', (event, file, content) => {
    if(currentWindow.isDocumentEdited() && isDifferentContent(content)) {
        const result = remote.dialog.showMessageBoxSync(currentWindow, {
         type: 'warning',
         title: 'Overwrite Current Unsaved Changes?',
         message: 'Opening a new file in this window will overwrite your saved changes. Open this file anyway?',
         buttons: [
             'Yes',
             'Cancel'
         ],
         defaultId: 0,
         cancelId: 1
        });
            if(result === 1 ){
                event.preventDefault()
                return;
            } else {
                renderFile(file, content)
            }
        
    } 
   
        
    
});

ipcRenderer.on('file-changed', (event, file, content) => {
    if(!isDifferentContent(content)) return;
    const result = remote.dialog.showMessageBoxSync(currentWindow, {
        type: 'warning',
        title: 'Overwrite current Unsaved Changes?',
        message: 'Another application has changed this file. Load Changes?',
        button: [
            'Yes',
            'Cancel'
        ],
        defaultId: 0,
        cancelId: 1
    });

    renderFile(file, content);
});

const updateUserInterface = (isEdited) => {
    let title = "Quick Notes";

    if(filePath) { title = `${path.basename(filePath)} - ${title} `;}
    if(isEdited) { title = `${title} (Edited)`;}

    currentWindow.setTitle(title);
    currentWindow.setDocumentEdited(isEdited);

    saveMarkdowButton.disabled = !isEdited;
    revertButton.disabled = !isEdited;
}