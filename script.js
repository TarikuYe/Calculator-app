// DOM Elements
const inputDisplay = document.getElementById("input")
const resultDisplay = document.getElementById("result")
const historyDisplay = document.getElementById("history")
const historyPanel = document.getElementById("history-panel")
const historyList = document.getElementById("history-list")
const clearHistoryBtn = document.getElementById("clear-history")
const angleModeToggle = document.getElementById("angle-mode")
const modeText = document.getElementById("mode-text")
const themeToggle = document.getElementById("theme-toggle")
const themeText = document.getElementById("theme-text")
const buttons = document.querySelectorAll(".btn")

// Calculator state
let currentInput = "0"
let currentResult = ""
let calculationHistory = []
let memory = 0
let isInRadianMode = true
let isInSecondMode = false
let lastOperation = ""

// Initialize calculator
function init() {
  // Load saved state from localStorage if available
  loadState()

  // Set up event listeners
  setupEventListeners()

  // Update display
  updateDisplay()
}

// Load state from localStorage
function loadState() {
  if (localStorage.getItem("calculatorHistory")) {
    calculationHistory = JSON.parse(localStorage.getItem("calculatorHistory"))
    updateHistoryPanel()
  }

  if (localStorage.getItem("calculatorTheme") === "dark") {
    document.body.classList.add("dark-theme")
    themeToggle.checked = true
    themeText.textContent = "Dark"
  }

  if (localStorage.getItem("calculatorAngleMode") === "deg") {
    isInRadianMode = false
    angleModeToggle.checked = true
    modeText.textContent = "DEG"
  }

  if (localStorage.getItem("calculatorMemory")) {
    memory = Number.parseFloat(localStorage.getItem("calculatorMemory"))
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem("calculatorHistory", JSON.stringify(calculationHistory))
  localStorage.setItem("calculatorTheme", document.body.classList.contains("dark-theme") ? "dark" : "light")
  localStorage.setItem("calculatorAngleMode", isInRadianMode ? "rad" : "deg")
  localStorage.setItem("calculatorMemory", memory.toString())
}

// Set up event listeners
function setupEventListeners() {
  // Button click events
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      handleButtonClick(button.getAttribute("data-value"))
    })
  })

  // Keyboard support
  document.addEventListener("keydown", handleKeyPress)

  // Toggle angle mode
  angleModeToggle.addEventListener("change", toggleAngleMode)

  // Toggle theme
  themeToggle.addEventListener("change", toggleTheme)

  // History panel toggle
  historyDisplay.addEventListener("click", toggleHistoryPanel)

  // Clear history
  clearHistoryBtn.addEventListener("click", clearHistory)
}

// Handle button clicks
function handleButtonClick(value) {
  switch (value) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
    case ".":
      appendNumber(value)
      break
    case "+":
    case "-":
    case "*":
    case "/":
    case "%":
    case "^":
      appendOperator(value)
      break
    case "=":
      calculate()
      break
    case "ac":
      clearAll()
      break
    case "del":
      deleteLastChar()
      break
    case "+/-":
      toggleSign()
      break
    case "sin":
      appendFunction("sin(")
      break
    case "cos":
      appendFunction("cos(")
      break
    case "tan":
      appendFunction("tan(")
      break
    case "asin":
      appendFunction("asin(")
      break
    case "acos":
      appendFunction("acos(")
      break
    case "atan":
      appendFunction("atan(")
      break
    case "log":
      appendFunction("log(")
      break
    case "ln":
      appendFunction("ln(")
      break
    case "sqrt":
      appendFunction("sqrt(")
      break
    case "!":
      appendFunction("fact(")
      break
    case "pi":
      appendConstant("π")
      break
    case "e":
      appendConstant("e")
      break
    case "(":
      appendParenthesis("(")
      break
    case ")":
      appendParenthesis(")")
      break
    case "2nd":
      toggleSecondMode()
      break
    case "x2":
      appendFunction("sqr(")
      break
    case "1/x":
      appendFunction("reciproc(")
      break
    case "mc":
      memoryOperation("mc")
      break
    case "m+":
      memoryOperation("m+")
      break
    case "m-":
      memoryOperation("m-")
      break
    case "mr":
      memoryOperation("mr")
      break
  }

  updateDisplay()
}

// Handle keyboard input
function handleKeyPress(e) {
  e.preventDefault()

  const key = e.key

  // Numbers and basic operators
  if (/^[0-9.]$/.test(key)) {
    handleButtonClick(key)
  } else if (["+", "-", "*", "/", "%", "(", ")"].includes(key)) {
    handleButtonClick(key)
  } else if (key === "Enter") {
    handleButtonClick("=")
  } else if (key === "Escape") {
    handleButtonClick("ac")
  } else if (key === "Backspace") {
    handleButtonClick("del")
  } else if (key === "^") {
    handleButtonClick("^")
  }
}

// Append number to input
function appendNumber(number) {
  if (currentInput === "0" && number !== ".") {
    currentInput = number
  } else if (currentInput === "-0" && number !== ".") {
    currentInput = "-" + number
  } else {
    // Check if we're trying to add a second decimal point
    if (number === "." && currentInput.includes(".") && !endsWithOperator(currentInput)) {
      const parts = currentInput.split(/[+\-*/%^]/)
      if (parts[parts.length - 1].includes(".")) {
        return
      }
    }
    currentInput += number
  }

  // Live calculation
  try {
    const result = evaluateExpression(currentInput)
    if (!isNaN(result) && isFinite(result)) {
      currentResult = formatNumber(result)
    }
  } catch (error) {
    currentResult = ""
  }
}

// Append operator to input
function appendOperator(operator) {
  // Replace the operator if the last character is already an operator
  if (endsWithOperator(currentInput)) {
    currentInput = currentInput.slice(0, -1) + operator
  } else {
    currentInput += operator
  }

  // If we just calculated a result, use that as the new input
  if (lastOperation) {
    currentInput = lastOperation + operator
    lastOperation = ""
  }
}

// Append function to input
function appendFunction(func) {
  if (currentInput === "0") {
    currentInput = func
  } else {
    currentInput += func
  }
}

// Append constant to input
function appendConstant(constant) {
  const value = constant === "π" ? Math.PI : Math.E

  if (currentInput === "0") {
    currentInput = constant
  } else if (endsWithOperator(currentInput) || currentInput.endsWith("(")) {
    currentInput += constant
  } else {
    currentInput += "*" + constant
  }

  // Live calculation
  try {
    const result = evaluateExpression(currentInput)
    if (!isNaN(result) && isFinite(result)) {
      currentResult = formatNumber(result)
    }
  } catch (error) {
    currentResult = ""
  }
}

// Append parenthesis
function appendParenthesis(parenthesis) {
  if (parenthesis === "(" && (currentInput === "0" || endsWithOperator(currentInput))) {
    if (currentInput === "0") {
      currentInput = "("
    } else {
      currentInput += "("
    }
  } else {
    currentInput += parenthesis
  }
}

// Calculate the result
function calculate() {
  try {
    const result = evaluateExpression(currentInput)

    if (isNaN(result) || !isFinite(result)) {
      currentResult = "Error"
    } else {
      // Add to history
      addToHistory(currentInput, result)

      // Update displays
      lastOperation = formatNumber(result)
      currentResult = ""
      currentInput = lastOperation
    }
  } catch (error) {
    currentResult = "Error"
  }
}

// Evaluate the expression
function evaluateExpression(expression) {
  // Replace constants with their values
  expression = expression.replace(/π/g, Math.PI.toString())
  expression = expression.replace(/e/g, Math.E.toString())

  // Replace functions with their JavaScript equivalents
  expression = expression.replace(/sin\(/g, `Math.sin(${isInRadianMode ? "" : "(Math.PI/180)*"}`)
  expression = expression.replace(/cos\(/g, `Math.cos(${isInRadianMode ? "" : "(Math.PI/180)*"}`)
  expression = expression.replace(/tan\(/g, `Math.tan(${isInRadianMode ? "" : "(Math.PI/180)*"}`)
  expression = expression.replace(/asin\(/g, `${isInRadianMode ? "" : "(180/Math.PI)*"}Math.asin(`)
  expression = expression.replace(/acos\(/g, `${isInRadianMode ? "" : "(180/Math.PI)*"}Math.acos(`)
  expression = expression.replace(/atan\(/g, `${isInRadianMode ? "" : "(180/Math.PI)*"}Math.atan(`)
  expression = expression.replace(/log\(/g, "Math.log10(")
  expression = expression.replace(/ln\(/g, "Math.log(")
  expression = expression.replace(/sqrt\(/g, "Math.sqrt(")
  expression = expression.replace(/sqr\(/g, "(")
  expression = expression.replace(/reciproc\(/g, "1/(")

  // Handle factorial function
  expression = expression.replace(/fact$$([^)]+)$$/g, (match, number) => {
    return factorial(Number.parseFloat(eval(number)))
  })

  // Replace ^ with ** for exponentiation
  expression = expression.replace(/\^/g, "**")

  // Handle square function
  expression = expression.replace(/sqr$$([^)]+)$$/g, "($1)**2")

  // Evaluate the expression
  return eval(expression)
}

// Calculate factorial
function factorial(n) {
  if (n < 0) return Number.NaN
  if (n === 0 || n === 1) return 1

  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }

  return result
}

// Clear all input and result
function clearAll() {
  currentInput = "0"
  currentResult = ""
  lastOperation = ""
}

// Delete last character
function deleteLastChar() {
  if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith("-"))) {
    currentInput = "0"
  } else {
    currentInput = currentInput.slice(0, -1)
  }

  // Live calculation after deletion
  try {
    const result = evaluateExpression(currentInput)
    if (!isNaN(result) && isFinite(result)) {
      currentResult = formatNumber(result)
    } else {
      currentResult = ""
    }
  } catch (error) {
    currentResult = ""
  }
}

// Toggle sign of the current number
function toggleSign() {
  if (currentInput === "0") {
    currentInput = "-0"
  } else if (currentInput === "-0") {
    currentInput = "0"
  } else if (currentInput.startsWith("-")) {
    currentInput = currentInput.substring(1)
  } else {
    currentInput = "-" + currentInput
  }

  // Live calculation
  try {
    const result = evaluateExpression(currentInput)
    if (!isNaN(result) && isFinite(result)) {
      currentResult = formatNumber(result)
    }
  } catch (error) {
    currentResult = ""
  }
}

// Toggle between radian and degree mode
function toggleAngleMode() {
  isInRadianMode = !isInRadianMode
  modeText.textContent = isInRadianMode ? "RAD" : "DEG"
  saveState()
}

// Toggle between first and second function set
function toggleSecondMode() {
  isInSecondMode = !isInSecondMode

  // Update button labels based on mode
  if (isInSecondMode) {
    document.querySelector('[data-value="sin"]').textContent = "sinh"
    document.querySelector('[data-value="cos"]').textContent = "cosh"
    document.querySelector('[data-value="tan"]').textContent = "tanh"
    document.querySelector('[data-value="log"]').textContent = "10^x"
    document.querySelector('[data-value="ln"]').textContent = "e^x"
  } else {
    document.querySelector('[data-value="sin"]').textContent = "sin"
    document.querySelector('[data-value="cos"]').textContent = "cos"
    document.querySelector('[data-value="tan"]').textContent = "tan"
    document.querySelector('[data-value="log"]').textContent = "log"
    document.querySelector('[data-value="ln"]').textContent = "ln"
  }
}

// Toggle between light and dark theme
function toggleTheme() {
  document.body.classList.toggle("dark-theme")
  themeText.textContent = document.body.classList.contains("dark-theme") ? "Dark" : "Light"
  saveState()
}

// Memory operations
function memoryOperation(operation) {
  switch (operation) {
    case "mc": // Memory Clear
      memory = 0
      break
    case "m+": // Memory Add
      try {
        const currentValue = evaluateExpression(currentInput)
        if (!isNaN(currentValue) && isFinite(currentValue)) {
          memory += currentValue
        }
      } catch (error) {
        // Handle error silently
      }
      break
    case "m-": // Memory Subtract
      try {
        const currentValue = evaluateExpression(currentInput)
        if (!isNaN(currentValue) && isFinite(currentValue)) {
          memory -= currentValue
        }
      } catch (error) {
        // Handle error silently
      }
      break
    case "mr": // Memory Recall
      if (memory !== 0) {
        if (currentInput === "0") {
          currentInput = memory.toString()
        } else if (endsWithOperator(currentInput) || currentInput.endsWith("(")) {
          currentInput += memory.toString()
        } else {
          currentInput += "*" + memory.toString()
        }
      }
      break
  }

  saveState()
}

// Toggle history panel
function toggleHistoryPanel() {
  historyPanel.classList.toggle("show")
}

// Add calculation to history
function addToHistory(expression, result) {
  const formattedResult = formatNumber(result)
  calculationHistory.unshift({
    expression: expression,
    result: formattedResult,
  })

  // Limit history to 10 items
  if (calculationHistory.length > 10) {
    calculationHistory.pop()
  }

  updateHistoryPanel()
  saveState()
}

// Update history panel with saved calculations
function updateHistoryPanel() {
  historyList.innerHTML = ""

  calculationHistory.forEach((item) => {
    const historyItem = document.createElement("div")
    historyItem.className = "history-item"
    historyItem.innerHTML = `
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">${item.result}</div>
        `

    // Add click event to reuse the calculation
    historyItem.addEventListener("click", () => {
      currentInput = item.expression
      updateDisplay()
    })

    historyList.appendChild(historyItem)
  })
}

// Clear history
function clearHistory() {
  calculationHistory = []
  updateHistoryPanel()
  saveState()
}

// Update the display
function updateDisplay() {
  // Format the input for display
  let displayInput = currentInput

  // Replace operators with their display symbols
  displayInput = displayInput.replace(/\*/g, "×")
  displayInput = displayInput.replace(/\//g, "÷")

  // Update the displays
  inputDisplay.textContent = displayInput
  resultDisplay.textContent = currentResult

  // Add copy button to result if there's a result
  if (currentResult && currentResult !== "Error") {
    const copyBtn = document.createElement("button")
    copyBtn.className = "copy-btn tooltip"
    copyBtn.innerHTML = 'Copy <span class="tooltiptext">Copy to clipboard</span>'
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      navigator.clipboard.writeText(currentResult).then(() => {
        copyBtn.innerHTML = 'Copied! <span class="tooltiptext">Copied!</span>'
        setTimeout(() => {
          copyBtn.innerHTML = 'Copy <span class="tooltiptext">Copy to clipboard</span>'
        }, 2000)
      })
    })

    resultDisplay.appendChild(copyBtn)
  }

  // Show animation for result
  resultDisplay.classList.remove("show")
  void resultDisplay.offsetWidth // Trigger reflow
  resultDisplay.classList.add("show")
}

// Helper function to check if input ends with an operator
function endsWithOperator(str) {
  return /[+\-*/%^]$/.test(str)
}

// Format number for display
function formatNumber(num) {
  // Handle special cases
  if (isNaN(num)) return "Error"
  if (!isFinite(num)) return num > 0 ? "Infinity" : "-Infinity"

  // Convert to string with appropriate precision
  let str
  if (Math.abs(num) < 1e-10 || Math.abs(num) >= 1e10) {
    // Use scientific notation for very small or very large numbers
    str = num.toExponential(10)
  } else {
    // Use fixed notation with up to 10 decimal places
    str = num.toString()
    if (str.includes(".") && str.split(".")[1].length > 10) {
      str = num.toFixed(10)
    }
  }

  // Remove trailing zeros after decimal point
  if (str.includes(".")) {
    str = str.replace(/\.?0+$/, "")
  }

  return str
}

// Initialize the calculator
init()
