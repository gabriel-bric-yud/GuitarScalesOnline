//Global Constants////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const display = document.querySelector("#dataDisplay");
const btnScale = document.querySelector("#btnScale");
const btnRecord = document.querySelector("#btnRecord");
const btnListen = document.querySelector("#btnListen");
const keyCtrl = document.querySelector("#keyCtrl")
const modeCtrl = document.querySelector("#modeCtrl")
const guitar = document.querySelector("#guitar");
const tabContainer = document.querySelector("#tab")


const noteAlpha = "CDEFGAB"
const majorScalePattern = "wwhwwwh";
const modeNames = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"]
const theoreticalKeys = ["G#", "D#", "A#","E#", "B#", "Fb", "Cb"]
const audioCtx = new (window.AudioContext || window.webkit.AudioContext)();

//Global Variables////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let numRows = 6;
let numColumns = 25;
let tuningInterval = 5
let tuningShift = 1
let recordingInProcess = false;
let compositionList = []
let composition = []

let mousePress = false
let touchPress = false






//Main Loop//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


createGuitar(numColumns) //createGrid(24,6)
createOptionElements(modeNames, modeCtrl)
createOptionElements(createChromaticAllNotesSeperate(), keyCtrl)


btnScale.addEventListener("click", (e) => {
  display.innerHTML = ""
  display.innerHTML = "Scale Data"

  let ionianKey = getIonianRoot(keyCtrl.value, modeCtrl.value)
  let ionianScale = createMajorScale(ionianKey)
  let modeScale = createModePattern(modeCtrl.value, createMajorScale(ionianKey))
  let accidental = determineAccidentalForMajorKey(ionianKey)
  let chromaticScale = createChromaticUnifiedAccidental(accidental)

  displayToSpan(displayArray(`Scale of ${keyCtrl.value} ${modeCtrl.value}: `, modeScale), display )
  displayToSpan(`${keyCtrl.value} ${modeCtrl.value} comes from ${ionianKey} Ionian`, display)
  displayToSpan(displayArray(`Scale of ${ionianKey} Ionian: `, ionianScale), display )
  displayToSpan(displayArray(`Circle of Fifths (#):`, createCircleOfFifths("#", 8)), display)
  displayToSpan(displayArray(`Circle of Fifths (b):`, createCircleOfFifths("b", 8)), display)

  //console.log(chromaticScale)


  document.querySelectorAll(".cell").forEach((elem) => {
    setNoteNum(elem, chromaticScale)
    elem.style.backgroundColor = "black"
    elem.style.border = "1px dotted blue"
    //elem.style.borderTop =  "1px solid white"
    elem.querySelector("span").style.color = "orange"
    elem.querySelector("span").style.opacity = "1"
    elem.querySelector("span").innerHTML = elem.dataset.note
    elem.dataset.diatonic = "f"
    if (ionianScale.includes(elem.dataset.note)) {
      elem.style.backgroundColor = "green"
      elem.style.border = "1px solid white"
      
      elem.querySelector("span").style.color = "white"
      elem.dataset.diatonic = "t"
    }
    else {
      elem.querySelector("span").style.opacity = "0.8"

    }
    if (elem.dataset.note == modeScale[0]) {

      elem.style.backgroundColor = "green"
    }

  })
 
})

function testScales() {
  //display.innerHTML = ""
  let testNote = "C"
  displayToSpan(displayArray(`Scale of ${testNote} Major:`, createMajorScale(testNote)), display )
  displayToSpan(displayArray(`Circle of Fifths (#):`, createCircleOfFifths("#", 8)), display)
  displayToSpan(displayArray(`Circle of Fifths (b):`, createCircleOfFifths("b", 8)), display)
  displayToSpan(displayArray("Chromatic Scale:", createChromaticEnharmonic(noteAlpha)), display)
  //displayToSpan(displayArray(`Chromatic Scale (#):`, createChromaticUnifiedAccidental("#")), display)
  //displayToSpan(displayArray(`Chromatic Scale (b):`, createChromaticUnifiedAccidental("b")), display)

}

testScales()



//Event Listeners////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


window.addEventListener('selectstart', (e) => {
  e.preventDefault();  
})

window.addEventListener("resize", (e) => {
  //let gridDimension = guitar.getBoundingClientRect().width / numColumns;
  document.querySelectorAll(".cell").forEach((elem) => {
    elem.style.height = guitar.getBoundingClientRect().height/ numRows + "px";
    elem.style.width = guitar.getBoundingClientRect().width / numColumns + "px";
  })
})

document.addEventListener("mousedown", (e) => {
  if (mousePress == false && touchPress == false) {
    mousePress = true;
    touchPress = true;
  }    
})

document.addEventListener('touchstart', (e) => {
  e.preventDefault()
  if (mousePress == false && touchPress == false) {
    mousePress = true;
    touchPress = true;
  }   
}, {passive: false})


btnRecord.addEventListener("click", (e) => {
  if (recordingInProcess != true) {
    composition = []
    recordingInProcess = true
    btnRecord.style.border = "20px solid red"
  }
  else {
    console.log(composition)
    convertToTab(composition, tabContainer)
    compositionList.push(composition)
    console.log(compositionList)
    recordingInProcess = false
    btnRecord.style.border = "none"

  }

})

btnListen.addEventListener("click", (e) => {
  let songPlayback
  let index = 0

  songPlayback = setInterval((e) => {
    if (index < composition.length) {
      playOsc(composition[index].dataset.freq);
      console.log(composition[index].dataset.freq)
      composition[index].classList.add("play")
      index++
    }
    else {
      clearInterval(songPlayback)
    }

  },350)

})


//Play Audio Functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function createOscInteracive(freq, gainNode) {
  let osc
  //let filterNode = audioCtx.createBiquadFilter();
  //filterNode.type = "highpass"
  //filterNode.frequency.setValueAtTime(1000, audioCtx.currentTime);
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.0;
  osc = audioCtx.createOscillator();
  osc.type = "sine"// type//"sawtooth" //"square";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gainNode).connect(audioCtx.destination); //.connect(filterNode)
  return [osc, gainNode]
}


function playOsc(freq) {
  let osc
  let gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.0;
  osc = audioCtx.createOscillator();
  osc.type = "sine"// type//"sawtooth" //"square";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(audioCtx.currentTime)
  gainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, .02);
  gainNode.gain.setTargetAtTime(0, audioCtx.currentTime + 0.50, .1);
  osc.stop(audioCtx.currentTime + 0.5)
  setTimeout(() => {
    osc.disconnect()
  }, 350)
}

//Create Tab Functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createCustomStringForTab(length, repeats, noteList, stringName) {
  let dash = " - "
  let txt = stringName + "|" + dash
  let currentNote = 0

  for (let i = 0; i < (length) * repeats; i++) {
    if (noteList != null && currentNote < noteList.length) {
      if (noteList[currentNote].index * 4 == i) {
        txt += noteList[currentNote].fret
        currentNote += 1
      }
      else {
        txt += dash
      }
    }
    else {
      txt += dash
    }
    if (i >= length && i % length == 0) {
      txt += "|" + dash
    }

  }  
  console.log(txt)
  return txt
}


function convertToTab(compositionArray, parent) {
  let noteList = [[], [], [], [], [], []]
  let repeats = 2;
  let length = parent.getAttribute("cols") /4
  console.log(compositionArray[0])
  for (let i = 0; i < compositionArray.length; i++) {
    let currentString = compositionArray[i].dataset.stringNum
    let currentFret = compositionArray[i].dataset.col
    console.log(currentString)
    console.log({ fret: currentFret, index: i})
    noteList[currentString - 1].push({ fret: currentFret, index: i})
  }


  parent.value = createCustomStringForTab(length, repeats, noteList[0], "e") + "\n"
  parent.value += createCustomStringForTab(length, repeats, noteList[1], "b") + "\n"
  parent.value += createCustomStringForTab(length, repeats, noteList[2], "g") + "\n"
  parent.value += createCustomStringForTab(length, repeats, noteList[3], "D") + "\n"
  parent.value += createCustomStringForTab(length, repeats, noteList[4], "A") + "\n"
  parent.value += createCustomStringForTab(length, repeats, noteList[5], "E") + "\n"

}

function createEmptyStringForTab(length, repeats, string) {
  let dash = "-  "
  let txt = `|${dash.repeat(length)}`
  return `${string}${txt.repeat(repeats)}`
}


function createEpmtyTabStructure(length) {
  console.log(length)
  let measureLength = length / 2
  let numMeasures = 3
  let stringArray = [createEmptyStringForTab(measureLength, numMeasures, "e") + "\n",
    createEmptyStringForTab(measureLength, numMeasures, "b") + "\n",
    createEmptyStringForTab(measureLength, numMeasures, "g") + "\n",
    createEmptyStringForTab(measureLength, numMeasures, "D") + "\n",
    createEmptyStringForTab(measureLength, numMeasures, "A") + "\n",
    createEmptyStringForTab(measureLength, numMeasures, "E") + "\n"
  ]
  return stringArray

  /** 
  let txt = createEmptyStringForTab(measureLength, 3, "e") + "\n"
  txt += createEmptyStringForTab(measureLength, 3, "b") + "\n"
  txt += createEmptyStringForTab(measureLength, 3, "g") + "\n"
  txt += createEmptyStringForTab(measureLength, 3, "D") + "\n"
  txt += createEmptyStringForTab(measureLength, 3, "A") + "\n"
  txt += createEmptyStringForTab(measureLength, 3, "E") + "\n"
  */
  //console.log(txt)
  //return txt;
}








//Create Grid Functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createCell(col, row) {
  let cell = document.createElement("div")
  cell.classList.add("cell");
  cell.dataset.row = row;
  cell.dataset.col = col;
  cell.id = col + "/" + row;
  cell.dataset.stringNum = getStringNum(row)
  cell.style.height = guitar.getBoundingClientRect().height/ numRows + "px";
  cell.style.width = guitar.getBoundingClientRect().width / numColumns + "px";
  setNoteNum(cell, createChromaticUnifiedAccidental("#"))
  cell.appendChild(createLabel(cell.dataset.note))

  if (col == 1) {
    cell.appendChild(createSideLabel(row))
    //cell.style.borderRight = "10px solid white"
    //cell.style.borderRadius = "10% 0px 0px 10%"
  }

  if (row == 1) {
    cell.appendChild(createBottomLabel(col - 1))
  }
  
  let osc
  let gainNode
  let playing = false

  cell.addEventListener('touchstart', (e) => {
    e.preventDefault()
    if (e.touches.length > 1) {  
      e.preventDefault();
    }

    if (playing == false) {
      if (cell.dataset.diatonic != "f") {
        cell.classList.add("play")
        let oscData = createOscInteracive(cell.dataset.freq, gainNode)

        osc = oscData[0]
        gainNode = oscData[1]
        osc.start(audioCtx.currentTime)
        gainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, .02);
        playing = true
        if (recordingInProcess == true) {
          composition.push(cell)
        }
      }
    }

  }, {passive: false})


  cell.addEventListener('touchend', (e) => {
    if (playing == true) {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, .1);
      osc.stop(audioCtx.currentTime + 0.5)
      setTimeout(() => {
        osc.disconnect()
      }, 100)

    }
    cell.classList.remove("play")
    playing = false
    touchPress = false
    mousePress = false
  })

  cell.addEventListener("mousedown", (e) => {
    if (playing == false) {
      if (cell.dataset.diatonic != "f") {
        cell.classList.add("play")
        let oscData = createOscInteracive(cell.dataset.freq, gainNode)

        osc = oscData[0]
        gainNode = oscData[1]
        osc.start(audioCtx.currentTime)
        gainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, .02);
        playing = true
        if (recordingInProcess == true) {
          composition.push(cell)
        }
      }
    }
  })


  cell.addEventListener("mouseenter", (e) => {
    if (mousePress && playing == false) { 
      if (cell.dataset.diatonic != "f") {
        cell.classList.add("play")
        let oscData = createOscInteracive(cell.dataset.freq, gainNode)
        osc = oscData[0]
        gainNode = oscData[1]
        osc.start(audioCtx.currentTime)
        gainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, .02);
        playing = true
        if (recordingInProcess == true) {
          composition.push(cell)
        }
      }

    }
  })


  document.addEventListener("mouseup", (e) => {
    if (playing == true) {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, .1);
      osc.stop(audioCtx.currentTime + 0.5)
      setTimeout(() => {
        osc.disconnect()
      }, 100)

    }
    cell.classList.remove("play")
    playing = false
    mousePress = false
    touchPress = false
  })

  return cell;
}


function createRow(col, row) {
  for (let i = 1; i <= col; i++) {
    let cell = createCell(i, row);
    guitar.appendChild(cell);
  }
}

function createGrid(col, row) {
  for (let i = row; i >= 1; i--) {
    createRow(col ,i)
  }
}

function createGuitar(col) {
  tuningShift = 0
  createRow(col, 6)
  createRow(col, 5)
  tuningShift +=1

  for (let i = 4; i >= 1; i--) {
    createRow(col ,i)
  }
}

function createLabel(txt) {
  let labelContainer = document.createElement("span")
  labelContainer.innerHTML = txt
  return labelContainer
}


function createSideLabel(row) {
  let stringNum = getStringNum(row)
  let stringLabel = createLabel("String " + stringNum)
  stringLabel.classList.add("sideLabel")
  return stringLabel
}

function createBottomLabel(col) {
  let stringLabel = createLabel(col)
  stringLabel.classList.add("bottomLabel")
  return stringLabel
}

function getStringNum(row) {
  if (row >3) {
    return (6 % row) + 1
  }
  else {
    return  6 - row + 1
  }
}




//Scale Functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function setNoteNum(elem, scale) {
  let noteNum;
  noteNum = ((Number(elem.dataset.row) - 1) * tuningInterval) + Number(elem.dataset.col) + 14 + tuningShift
  elem.dataset.noteNum = noteNum
  elem.dataset.note = scale[noteNum % scale.length]
  elem.dataset.freq = getFrequencyChromatic(noteNum)[0]
  elem.dataset.octave = getFrequencyChromatic(noteNum)[1]
}


function createChromaticEnharmonic(alphabet) {
  alphabet = "CDEFGAB";
  let chromaticScale = [];

  for (let i = 0; i < alphabet.length; i++) {
    chromaticScale.push(alphabet[i]);
    if (i != 2 && i != 6) {  
      chromaticScale.push(`${alphabet[i]}#/${alphabet[i+1]}b`);
    }
  }
  return chromaticScale;
}

function createChromaticAllNotesSeperate() {
  let chromatic = createChromaticEnharmonic()
  let allNotes = []
  let noteName;
  
  for (let i = 0; i < chromatic.length; i++) {
    noteName = chromatic[i]
    if (chromatic[i].length > 1) {
      allNotes.push(noteName.substr(0,2))
      allNotes.push(noteName = noteName.substr(3))
    }
    else {
      allNotes.push(noteName)
    }
  }

  return allNotes;

}

function createChromaticUnifiedAccidental(accidental) {
  let chromatic = createChromaticAllNotesSeperate()
  let chromaticUnifiedAccidental = []
  for (let i = 0; i < chromatic.length; i++) {
    noteName = chromatic[i]
    if (noteName.length > 1) {
      if (noteName[1] == accidental) {
        chromaticUnifiedAccidental.push(noteName)
      }
    }
    else {
      chromaticUnifiedAccidental.push(noteName)
    }
  }

  return chromaticUnifiedAccidental;
}


function createChromaticTheoretical(alphabet) {
  alphabet = "CDEFGAB";
  let chromaticScale = [];

  for (let i = 0; i < alphabet.length; i++) {
    chromaticScale.push(alphabet[i] + "b");
    chromaticScale.push(alphabet[i]);
    chromaticScale.push(alphabet[i] + "#");
  }
  return chromaticScale;
}


function createCircleOfFifths(accidental, numKeys) {
  let circleFifths = []
  let chromatic = createChromaticEnharmonic();
  let interval;
  accidental == "#" ? interval =  7 : interval = 5; 
  
  for (let i = 0; i < numKeys; i++) {
    let keyIndex =  (i * interval) % chromatic.length;
    let key = chromatic[keyIndex]
    if (key.length > 1) {
      accidental == "#" ? key = key.substr(0,2) : key = key.substr(3); 
    }
    if (i == 7) {
      key = "C" + accidental
    }
    circleFifths.push(key)
  }

  return circleFifths
}


function createMajorScale(key) {
  let startIndex;
  let scale = []
  let stepPattern = "wwhwwwh";
  let accidental = determineAccidentalForMajorKey(key)
  let chromatic = createChromaticUnifiedAccidental(accidental);


  //find key index in chromatic scale
  for (let i = 0; i != chromatic.length; i++) {
    if (chromatic[i] == key) {
      startIndex = i;
      break;
    }
  }

  //createScale
  scale.push(chromatic[startIndex])
  for (let i = 0; i < stepPattern.length - 1; i++) {
    
    let target = getTargetNote(scale[scale.length - 1])

    //check if index is less than length of chromatic scale, else use modulus to loop back to start.
    if (stepPattern[i] == "w") {  //wholestep
      startIndex + 2 > chromatic.length - 1 ? startIndex = (startIndex + 2) % chromatic.length : startIndex += 2
    }
    else { //halfstep
      startIndex + 1 > chromatic.length - 1 ? startIndex = (startIndex + 1) % chromatic.length : startIndex += 1
    }


    if (chromatic[startIndex][0] != target) {
      if (startIndex != 0) {
        scale.push(target + accidental);
      }
    }
    else {
      scale.push(chromatic[startIndex]);
    }

  }

  return scale;
}



function getIonianRoot(key, mode) {

  let ionianKey
  let modeIndex = modeNames.indexOf(mode);

  let alphabet = "CDEFGAB";
  let ionianIndex = alphabet.indexOf(key[0]) - modeIndex;
  if (ionianIndex < 0) {
    ionianIndex = alphabet.length + ionianIndex;
  }
        
  let possibleRootScale = [alphabet[ionianIndex] + "b", alphabet[ionianIndex], alphabet[ionianIndex] + "#"]
  possibleRootScale.forEach((elem) => {
    if (!theoreticalKeys.includes(elem)) {
      let  currentScale = createMajorScale(elem)
      if (currentScale[modeIndex] == key) {
        ionianKey = elem
      }
    }
    else {
      console.log(elem + " RESTRICTED")
      //playOsc(110)
      //alert("Scale is theoretical. Try another.")
    }
  })

  return ionianKey

}


function determineAccidentalForMajorKey(key) {
  let accidental;
  if (key.length > 1) {
    accidental = key[1]
  }
  else {
    let circleFifthsFlat = createCircleOfFifths("b", 8)
    circleFifthsFlat.includes(key) ? accidental = "b" : accidental = "#";
  }

  return accidental
}

function createModePattern(mode, scaleArray) {
  let modeNum = modeNames.indexOf(mode)
  let stepPattern = "wwhwwwh";
  let modePattern = stepPattern.substring(modeNum) + stepPattern.substring(0,modeNum)
  let modeArray = scaleArray.slice(modeNum).concat(scaleArray.slice(0, modeNum))
  return modeArray
}


function calculateSteps(pattern, index) {
  let numHalfSteps = 0;
  pattern = "wwhwwwh".substring(0,index)

  for (let i = 0; i < pattern.length; i++) {
    pattern[i] == "w" ? numHalfSteps += 2 : numHalfSteps += 1;
  }
  return numHalfSteps
}

function getTargetNote(note) {
  let target = note.substring(0,1)
  alphabet = "CDEFGAB";
  let index = alphabet.indexOf(target)
  index + 1 != alphabet.length ? index += 1 : index = 0;
  return alphabet[index]
}




//Frequency Functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getFrequencyChromatic(num) {
  let noteNum;
  let note = "";
  let freq;

  if (num <= 11) {
    noteNum = Number(num);
  }
  else {
    if (Number(num) >= 83) {
      noteNum =  (Number(num) % 84)
      noteNum = (noteNum % 12);
    }
    else {
      noteNum = (num % 12);
    }
  }

  switch(noteNum) {
    case 0:
      freq = 32.70320// 261.63;
      note = "C";
      break;
    case 1:
      freq = 34.64783 // 277.18;
      note = "C#/Db"
      break;
    case 2:
      freq = 36.70810 //293.66;
      note = "D"
      break;
    case 3:
      freq = 38.89087 //311.13;
      note = "D#/Eb"
      break;
    case 4:
      freq = 41.20344 //329.62;
      note = "E"
      break;
    case 5:
      freq = 43.65353 // 349.23;
      note = "F"
      break;
    case 6:
      freq = 46.24930 //69.99;
      note = "F#/Gb"
      break;
    case 7:
      freq = 48.99943 //392;
      note = "G"
      break;
    case 8:
      freq = 51.91309 //415.30;
      note = "G#/Ab"
      break;
    case 9:
      freq = 55.00000;
      note = "A"
      break;
    case 10:
      freq = 58.27047;
      note = "A#/Bb"
      break;
    case 11:
      freq = 61.73541;
      note = "B"
      break;
  }

  let multiplier = 1
  if (num > 11) {
    num > 83 ? multiplier = Math.floor((Number(num) % 84) /12) : multiplier = Math.floor(num /12);
    if (multiplier < 2) {
      note = note + (multiplier + 1) 
      freq *= 2 
    }
    else {
      for (let i = 0; i < multiplier; i++) {
        freq *= 2
      }
      note = note + (multiplier + 1)
    }
  }
  return [freq, note];
}



//UI Functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function displayToSpan(txt, parent) {
  let spanTxt = document.createElement("span")
  spanTxt.innerHTML = txt
  parent.appendChild(spanTxt)
}

function displayArray(txt, list) {
  txt = "<u>" + txt + "</u>"
  list.forEach((elem) => {
    txt += ` ${elem}`
  })
  return txt;
}


function createOptionElements(list, parent) {
  list.forEach((elem) => {
    let option = document.createElement("option")
    option.innerHTML = elem;
    option.setAttribute("value", elem)
    parent.appendChild(option)
  })
}



//Old Functions//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/** 
 * 
console.log(cell.dataset.freq)
console.log(cell.dataset.note)
console.log(cell.dataset.octave)

let sharpKeys = createCircleOfFifths("#", 7)
let flatKeys = createCircleOfFifths("b", 7)
flatKeys.shift()
let possibleKeys = sharpKeys.concat(flatKeys)
possibleKeys.sort()
createOptionElements(possibleKeys, keyCtrl)
*/


/**
const notesChromatic = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/G", "G", "G#/Ab", "A", "A#/Bb", "B" ]
function createCircleOfFifthsSharp() {
  let circleFifths = []
  let chromatic = createChromaticEnharmonic();
  let perfectFifth = 7; //seven halfsteps is a perfect 5th
  let numKeys = 7; //total number of keys to generate on circle

  for (let i = 0; i < numKeys; i++) {
    let keyIndex = (i * perfectFifth) % chromatic.length;
    let key = chromatic[keyIndex]
    if (key.length > 1) {
      key = key.substr(0,2)
    }
  
    circleFifths.push(key)
  }

  console.log("Circle of Fifths (sharp):")
  console.log(circleFifths)
  return circleFifths

}

function createCircleOfFifthsFlat() {
  let circleFifths = []
  let chromatic = createChromaticEnharmonic();
  let perfectFourth = 5; //5 halfsteps is a perfect 4th
  let numKeys = 7; //total number of keys to generate on circle
  
  for (let i = 0; i < numKeys; i++) {
    let keyIndex =  (i * perfectFourth) % chromatic.length;
    let key = chromatic[keyIndex]
    if (key.length > 1) {
      key = key.substr(3)
    }
  
    circleFifths.push(key)
  }

  console.log("Circle of Fifths (flat):")
  console.log(circleFifths)
  return circleFifths
}


function createChromaticUnifiedAccidentalOld(accidental) {
  let chromatic = createChromaticEnharmonic()
  let chromaticCorrectAccidental = []
  let noteName;
  
  for (let i = 0; i < chromatic.length; i++) {
    noteName = chromatic[i]
    if (chromatic[i].length > 1) {
      accidental == "#" ? noteName = noteName.substr(0,2) : noteName = noteName.substr(3);
    }
    
    chromaticCorrectAccidental.push(noteName);
  }
  
  //displayToSpan(displayArray(`Chromatic Scale:`, chromaticCorrectAccidental), display)
  //console.log(`Chromatic Scale:`)
  //console.log(chromaticCorrectAccidental)
  return chromaticCorrectAccidental;
}



function determineAccidentalForMajorKey(key) {
  let circleFifthsSharp = createCircleOfFifths("#", 8)
  let circleFifthsFlat = createCircleOfFifths("b", 8)
  let accidental;

  for (let i = 0; i < circleFifthsSharp.length; i++) {
    if (key == "C") {
      console.log("none")
      accidental = "#"
      break;
    }
    else if (circleFifthsSharp[i] == key) {
      console.log("sharp")
      accidental = "#";
      break;
    }
    else if (circleFifthsFlat[i] == key) {
      console.log("flat")
      accidental = "b"
      break;
    }
  }
  return accidental
}


function createChromaticUnifiedAccidentalold(accidental) {
  let chromatic = createChromaticEnharmonic()
  let chromaticCorrectAccidental = []
  let noteName;
  
  for (let i = 0; i < chromatic.length; i++) {
    noteName = chromatic[i]
    if (chromatic[i].length > 1) {
      accidental == "#" ? noteName = noteName.substr(0,2) : noteName = noteName.substr(3);
    }
    
    chromaticCorrectAccidental.push(noteName);
  }
  
  return chromaticCorrectAccidental;
}


function getIonianOld(key, mode) {
  let modeIndex = modeNames.indexOf(mode);
  let steps = calculateSteps("", modeIndex);
  console.log(steps)
  let accidental = determineAccidentalUnknown(key, modeIndex)
  let chromatic = createChromaticUnifiedAccidental(accidental);
  let keyIndex = chromatic.indexOf(key)
  keyIndex - steps < 0 ? keyIndex = (chromatic.length) + (keyIndex - steps) : keyIndex -= steps
  let ionianKey = chromatic[keyIndex]
  return ionianKey
}



function determineAccidentalUnknownOld(key, modeIndex) {
  let accidental;

  //for (let i = 0; i < 8; i++) {
    if (key.length > 1) {
      accidental = key[1];
      //break;
    }
    else {
      if (key != "C") {
        let alphabet = "CDEFGAB";
        let ionianIndex = alphabet.indexOf(key) - modeIndex;
        console.log(ionianIndex)
        if (ionianIndex < 0) {
          ionianIndex = alphabet.length + ionianIndex;
        }
        console.log(alphabet[ionianIndex])
        

        let possibleRootScale = [alphabet[ionianIndex] + "b", alphabet[ionianIndex], alphabet[ionianIndex] + "#"]
        console.log(possibleRootScale)
        let confirmedIndex;


        possibleRootScale.forEach((elem, j) => {
          if (!theoreticalKeys.includes(elem)) {
            let  currentScale = createMajorScale(elem)
            if (currentScale[modeIndex] == key) {
              console.log("found in the key of : " + elem)
              confirmedIndex = j
            }
          }
        })

        if (confirmedIndex == 0) {
          console.log(0)
          accidental = "b";
          //break;
        }
        else if (confirmedIndex == 2) {
          console.log(2)
          accidental = "#"
          //break
        }
        else {
          console.log(1)
          accidental = determineAccidentalForMajorKey(createMajorScale(possibleRootScale[1]))
          //break
        }
      }

    }
      
  //}
  return accidental
}


  createCircleOfFifthsSharp()
  createCircleOfFifthsFlat()
*/