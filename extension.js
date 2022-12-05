// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { rejects } = require('assert');
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('"chatgpt-code-assistant" to your service!');

  // Create a new terminal and execute a command
  //const vscode = require('vscode');  
  const newTerminal = vscode.window.createTerminal('ChatGPT Chat Server Terminal');
  // // start the python server from the resources directory
  const path = require('path');
  const serverPath = path.join(context.extensionPath, 'resources', 'chatgpt-api-server/server-start.sh');
  console.log("Starting Python Chat Server at " + serverPath)
  newTerminal.sendText(serverPath);
  
  // ugly hack :P
  vscode.window.showInformationMessage("Waiting 5 Seconds Until the Browser Starts...(ugly hack :P)!");
  const sleep = (ms) => new Promise(resolve => setTimeout(()=>resolve({time:ms}), ms));
  await sleep(5000);


  let lastQuestions = [
    "DO NOT SEND ANY SENSITIVE CONTENT / PRIVATE INFORMATION TO ChatGPT, it's only a POC",
    "\n\nExplain the code and focus on potential security vulnerabilities.",
    `

Show a security code audit report about a vulnerability found in this source code fragment. The code comments describe the vulnerability.    
It describes all important technical details.
Display the report based on the following Markdown template:

# Unique Descriptive Title and Component
*Severity: (One of LOW, MEDIUM, HIGH, CRITICAL)* | *CWE-ID: (give a relevant CWE)* | *Affected Component: Source Unit and Filename*

## Description
Write a short description with technical details and type of vulnerability found. Also include where in the source code it was found as listing:

~~~
Show the relevant source code that is affected here.
~~~    

Describe the potential security impact here.

## Solution advice
Give a solution advice for described vulnerability here.
  
  
  `];

  let sendToChatGPT = function () {
    // Get the active editor and selected text

    const editor = vscode.window.activeTextEditor;
    const selection = editor.selection;

    // Get the selected code
    const code = editor.document.getText(selection);

    // Show a selection of questions, including the last 5 questions
    vscode.window.showQuickPick(lastQuestions, {
      placeHolder: 'Enter your question for ChatGPT:',
      matchOnDetail: true,
      matchOnDescription: true,
      canPickMany: false,
      ignoreFocusOut: true,
      value: lastQuestions[0]
    }).then((question) => {
      console.log("Fwding query: " + question)
      if (!question) {
        return;
      }


      // Add the selected question to the list of last questions if it's new
      if (lastQuestions.length > 0 && lastQuestions[0] != question) {
        lastQuestions.unshift(question);
        lastQuestions = lastQuestions.slice(0, 10);
      }

      let query = code + "\n" + question;
      const axios = require('axios');
      axios.get('http://localhost:5001/chat?q=' + encodeURIComponent(query)).then(response => {
        console.log("got resp: " + response);
        if (response.status != 200) {
          throw 'status != 200';
        }

        //let md = require('markdown-it')();
        //let mdContent = md.render(response.data)
        let mdContent = response.data;

        // Create an HTML string containing the markdown content
        const html = `
<!DOCTYPE html>
<html>
<head>
<style>
body {
  padding: 0;
  margin: 0;
}

.content {
  padding: 20px;
}
</style>
</head>
<body style="word-wrap: break-word;">
  <div id="markdown-container">${mdContent}</div>
</body>
</html>
`;

        const panel = vscode.window.createWebviewPanel(
          'chatGptAssistance',
          'ChatGTP Assistance Result',
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            // localResourceRoots: [
            //   vscode.Uri.file(path.join(context.extensionPath, 'public'))
            // ]
          }
        );

        panel.webview.html = html;

      }).catch((err) => { console.error('error getting an answer:' + err) });
    });
  }
  context.subscriptions.push(vscode.commands.registerCommand('chatgpt-code-assistant.sendToChatGPT', sendToChatGPT));


  let addQuestion = function () {
    // Get the active editor and selected text

    // Show a selection of questions, including the last 5 questions
    vscode.window.showInputBox({
      prompt: 'Create a question for ChatGPT. It can be selected via "Interview ChatGPT"',
      placeHolder: 'Explain this code and focus on: ',
      ignoreFocusOut: true,
    }).then((question) => {
      console.log("Fwding query: " + question)
      if (!question) {
        return;
      }


      // Add the selected question to the list of last questions if it's new
      if (lastQuestions.length > 0 && lastQuestions[0] != question) {
        lastQuestions.unshift(question);
        lastQuestions = lastQuestions.slice(0, 10);
      }
    }).catch((err) => { console.error('error adding a question:' + err) });
  }




  // Register the right-click menu entry
  context.subscriptions.push(vscode.commands.registerCommand('chatgpt-code-assistant.addQuestion', addQuestion));
}

// This method is called when your extension is deactivated
function deactivate() { }


module.exports = {
  activate,
  deactivate
}
