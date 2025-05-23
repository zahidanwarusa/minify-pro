// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const minifyBtn = document.getElementById('minifyBtn');
const unminifyBtn = document.getElementById('unminifyBtn');
const swapBtn = document.getElementById('swapBtn');
const copyBtn = document.getElementById('copyBtn');
const clearInput = document.getElementById('clearInput');
const clearOutput = document.getElementById('clearOutput');
const pasteBtn = document.getElementById('pasteBtn');
const inputSize = document.getElementById('inputSize');
const outputSize = document.getElementById('outputSize');
const reduction = document.getElementById('reduction');

// Minify function
function minifyText(text) {
    if (!text.trim()) return '';
    
    let minified = text
        // Remove comments (/* */ and //)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        // Remove spaces around operators and punctuation
        .replace(/\s*([{}();:,=+\-*/<>!&|])\s*/g, '$1')
        // Remove spaces around brackets
        .replace(/\s*([[\]])\s*/g, '$1')
        // Remove trailing/leading whitespace
        .trim();
    
    return minified;
}

// Unminify function
function unminifyText(text) {
    if (!text.trim()) return '';
    
    let unminified = text;
    let indentLevel = 0;
    const indentChar = '    '; // 4 spaces
    
    // Add line breaks after semicolons (but not inside strings)
    unminified = unminified.replace(/;(?=(?:[^"']*["'][^"']*["'])*[^"']*$)/g, ';\n');
    
    // Add line breaks before and after braces
    unminified = unminified.replace(/\{/g, '{\n');
    unminified = unminified.replace(/\}/g, '\n}\n');
    
    // Add line breaks after commas in object/array contexts
    unminified = unminified.replace(/,(?=(?:[^"']*["'][^"']*["'])*[^"']*$)/g, ',\n');
    
    // Split into lines for indentation
    let lines = unminified.split('\n');
    let result = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Decrease indent for closing braces
        if (line.includes('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add indentation
        result.push(indentChar.repeat(indentLevel) + line);
        
        // Increase indent for opening braces
        if (line.includes('{')) {
            indentLevel++;
        }
    }
    
    return result.join('\n');
}

// Update statistics
function updateStats() {
    const inputLength = inputText.value.length;
    const outputLength = outputText.value.length;
    
    inputSize.textContent = `${inputLength} characters`;
    outputSize.textContent = `${outputLength} characters`;
    
    if (inputLength > 0) {
        const reductionPercent = Math.round(((inputLength - outputLength) / inputLength) * 100);
        reduction.textContent = `${reductionPercent}%`;
        
        // Color code the reduction
        if (reductionPercent > 0) {
            reduction.style.color = '#28a745'; // Green for reduction
        } else if (reductionPercent < 0) {
            reduction.style.color = '#dc3545'; // Red for increase
        } else {
            reduction.style.color = '#6c757d'; // Gray for no change
        }
    } else {
        reduction.textContent = '0%';
        reduction.style.color = '#6c757d';
    }
}

// Event listeners
minifyBtn.addEventListener('click', () => {
    const input = inputText.value;
    if (!input.trim()) {
        alert('Please enter some text to minify');
        return;
    }
    
    outputText.value = minifyText(input);
    updateStats();
});

unminifyBtn.addEventListener('click', () => {
    const input = inputText.value;
    if (!input.trim()) {
        alert('Please enter some text to unminify');
        return;
    }
    
    outputText.value = unminifyText(input);
    updateStats();
});

swapBtn.addEventListener('click', () => {
    const temp = inputText.value;
    inputText.value = outputText.value;
    outputText.value = temp;
    updateStats();
});

copyBtn.addEventListener('click', async () => {
    if (!outputText.value) {
        alert('No text to copy');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(outputText.value);
        
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 1500);
    } catch (err) {
        // Fallback for older browsers
        outputText.select();
        document.execCommand('copy');
        alert('Text copied to clipboard');
    }
});

pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        updateStats();
    } catch (err) {
        alert('Unable to paste. Please paste manually or grant clipboard permissions.');
    }
});

clearInput.addEventListener('click', () => {
    inputText.value = '';
    updateStats();
    inputText.focus();
});

clearOutput.addEventListener('click', () => {
    outputText.value = '';
    updateStats();
});

// Update stats when input changes
inputText.addEventListener('input', updateStats);
outputText.addEventListener('input', updateStats);

// Auto-resize textareas
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(200, textarea.scrollHeight) + 'px';
}

inputText.addEventListener('input', () => autoResize(inputText));
outputText.addEventListener('input', () => autoResize(outputText));

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (e.shiftKey) {
                    unminifyBtn.click();
                } else {
                    minifyBtn.click();
                }
                break;
            case 'u':
                e.preventDefault();
                swapBtn.click();
                break;
        }
    }
});

// Initialize
updateStats();

// Add some helpful text on load
inputText.placeholder = `Paste your code or text here...

Keyboard shortcuts:
• Ctrl+Enter: Minify
• Ctrl+Shift+Enter: Unminify
• Ctrl+U: Swap input/output`;

console.log('Code Minify/Unminify Tool loaded successfully!');