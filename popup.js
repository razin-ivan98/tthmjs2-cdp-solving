(() => {
    const hackButton = document.getElementById("hack-button")
    const resultContainer = document.getElementById("result")
    const resultText = document.getElementById("result-text")
    const loader = document.getElementById("loader")

    hackButton.addEventListener("click", () => {
        hack();
        onHackRequested();
    })

    const onHackRequested = () => {
        resultText.innerText = ""
        resultContainer.classList.remove("ready")
        loader.classList.add("visible")
    }
    const onHacked = (data) => {
        resultText.innerText = data
        resultContainer.classList.add("ready")
        loader.classList.remove("visible")

    }

    const extractComment = (code) => code.match(/\/\/.+\n/)
    const isSearchingFunction = (code) => code.includes("The magic word is in the comment to this function.")

    const eventListenerCallback = async (debuggerTarget, method, params) => {
        if (method === 'Debugger.scriptParsed') {
            const { scriptId } = params;
            const { scriptSource } = await chrome.debugger.sendCommand(debuggerTarget, 'Debugger.getScriptSource', { scriptId });
            if (isSearchingFunction(scriptSource)) {
                onHacked(extractComment(scriptSource))
                chrome.debugger.onEvent.removeListener(eventListenerCallback)
                chrome.debugger.detach(debuggerTarget)
            }
        }
        if (method === 'Debugger.paused') {
            chrome.debugger.sendCommand(debuggerTarget, 'Debugger.resume');
        }
    }

    const hack = async () => {
        const { 0: activeTab } = await chrome.tabs.query({ active: true, currentWindow: true })
        const debuggerTarget = { tabId: activeTab.id }

        await chrome.debugger.attach(debuggerTarget, '1.3');
        await chrome.debugger.sendCommand(debuggerTarget, 'Debugger.enable')
        chrome.debugger.onEvent.addListener(eventListenerCallback)
        chrome.tabs.reload(activeTab.id)
    }
})()
