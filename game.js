const BOARD_ROWS = 10;
const BOARD_COLS = 10;

const TRAY_LETTERS = 8;


var boardCells = [];

var draggedTrayCell = null;
var draggingPointerId = null;
var isDragging = false;

var ghostElement = null;



const populateTwoLetterWords = function()
{
  const span = document.getElementById('two-letter-words');

  if(WORD_LIST.length == 0)
  {
    span.innerHTML = '<i>(word list failed to load; running in test mode where all words are legal)</i>';
  }
  else
  {
    for(const word of WORD_LIST)
    {
      if(word.length == 2)
      {
        span.innerHTML += " " + word;
      }
    }
  }
}



const init = async function()
{
  await getWordList();
  populateTwoLetterWords();
  createBoardAndTray();
};



const createBoardAndTray = function()
{
  boardCells = [];

  let boardTableDiv = document.getElementById('board-table');
  boardTableDiv.replaceChildren();
  
  for(let row = 0; row < BOARD_ROWS; ++row)
  {
    const tr = document.createElement('tr');
    boardTableDiv.appendChild(tr);

    boardCells.push([]);

    for(let col = 0; col < BOARD_COLS; ++col)
    {
      const td = document.createElement('td');
      td.id = `board-cell-${row+1}-${col+1}`;
      td.classList.add('board-cell');
      td.classList.add('board-cell-empty');
      td.innerHTML = '&nbsp;';
      td.onclick = handleBoardCellClick;

      tr.appendChild(td);

      boardCells[row].push(td);
    }
  }

  const trayTableRow = document.getElementById('tray-table-row');
  trayTableRow.replaceChildren();

  for(let i = 0; i < TRAY_LETTERS; ++i)
  {
    const traySlot = document.createElement('td');
    traySlot.id = `tray-cell-${i+1}`;
    traySlot.classList.add('tray-cell');
    traySlot.classList.add('tray-cell-unplaced');
    traySlot.innerHTML = randomLetter();
    traySlot.onpointerdown = handleTrayCellPointerDown;
    traySlot.onpointermove = handleTrayCellPointerMove;
    traySlot.onpointerup = handleTrayCellPointerUp;

    trayTableRow.appendChild(traySlot);
  }
};



const handleBoardCellClick = function(event)
{
  if(! event.target.classList.contains('board-cell-tentative')) { return; }

  for(const placedTile of [...document.getElementsByClassName('tray-cell-placed')])
  {
    if(placedTile.innerHTML != event.target.innerHTML) { continue; }

    clearTentativePlacement(event.target);
    unplaceTile(placedTile);

    return;
  }
};



const singleConnectedComponent = function()
{
  const grid = boardCells.map(row => row.map(td => ! td.classList.contains('board-cell-empty')));

  const components = countConnectedComponents(grid);

  return (components == 1);
}



const validateBoard = function()
{
  const message = document.getElementById('message');

  // check horizontal words

  let newWords = 0;

  for(let row = 0; row < BOARD_ROWS; ++row)
  {
    let word = '';

    for(let col = 0; col < BOARD_COLS; ++col)
    {
      const td = boardCells[row][col];

      if(td.classList.contains('board-cell-empty'))
      {
        if(word.length > 1)
        {
          if(! isWord(word)) 
          { 
            message.innerHTML = 'unknown word ' + word;
            return false; 
          }
          ++newWords;
        }

        word = '';
      }
      else
      {
        word += td.innerHTML;
      }
    }

    if(word.length > 1)
    {
      if(! isWord(word)) 
      { 
        message.innerHTML = 'unknown word ' + word;
        return false;
      }
    }
  }

  // check vertical words

  for(let col = 0; col < BOARD_ROWS; ++col)
  {
    let word = '';

    for(let row = 0; row < BOARD_COLS; ++row)
    {
      const td = boardCells[row][col];

      if(td.classList.contains('board-cell-empty'))
      {
        if(word.length > 1)
        {
          if(! isWord(word)) 
            { 
              message.innerHTML = 'unknown word ' + word;
              return false; 
            }

          ++newWords;
        }

        word = '';
      }
      else
      {
        word += td.innerHTML;
      }
    }

    if(word.length > 1)
    {
      if(! isWord(word))
      { 
        message.innerHTML = 'unknown word ' + word;
        return false; 
      }
    }
  }

  if(newWords == 0) 
  { 
    message.innerHTML = 'must create at least one new word';
    return false; 
  }

  if(! singleConnectedComponent()) 
  { 
    message.innerHTML = 'must form a single contiguous region';
    return false; 
  }

  return true;
};



const updateScore = function()
{
  const grid = boardCells.map(row => row.map(td => td.classList.contains('board-cell-filled')));

  const rectangles = decomposeIntoRectangles(grid);

  let score = 0n;
  for(const rectangle of rectangles)
  {
    let [ row, col, height, width ] = rectangle;

    score += 2n ** BigInt(width * height);
  }

  document.getElementById('score').innerHTML = score;

  highlight(0, rectangles);
};



const highlight = function(index, rectangles)
{
  if(index >= rectangles.length)
  {
    for(const td of [...document.getElementsByClassName('glowing')])
    {
      td.classList.remove('glowing');
    }

    return;
  }

  let [ startRow, startCol, width, height ] = rectangles[index];

  for(let row = 0; row < BOARD_ROWS; ++row)
  {
    for(let col = 0; col < BOARD_COLS; ++col)
    {
      const insideRectangle = (
           (startRow <= row) && (row < startRow + height)
        && (startCol <= col) && (col < startCol + width));

      const td = boardCells[row][col];
      
      if(insideRectangle)
      {
        td.classList.add('glowing');
      }
      else
      {
        td.classList.remove('glowing');
      }
    }
  }
  
  setTimeout(()=>highlight(index + 1, rectangles), 250);
}



const submit = function()
{
  if(! validateBoard()) { return; }

  for(const tentativePlacement of [...document.getElementsByClassName('board-cell-tentative')])
  {
    tentativePlacement.classList.remove('board-cell-tentative');
    tentativePlacement.classList.add('board-cell-filled');
  }

  const remainingLetters = [...document.getElementsByClassName('tray-cell-unplaced')].map(element => element.innerHTML);

  for(const placedTile of [...document.getElementsByClassName('tray-cell-placed')])
  {
    placedTile.classList.remove('tray-cell-placed');
    placedTile.classList.add('tray-cell-unplaced');

    let draw;
    while(true)
    {
      draw = randomLetter();

      const copiesAlreadyPresent = remainingLetters.filter(letter => (letter == draw)).length;

      if(copiesAlreadyPresent == 0) { break; }

      if(copiesAlreadyPresent == 1 && Math.random() > 0.5) { break; }
    }

    placedTile.innerHTML = draw;
  }

  const message = document.getElementById('message');
  message.innerHTML = '';

  updateScore();
};



const clearTentativePlacement = function(tentativePlacement)
{
  tentativePlacement.classList.remove('board-cell-tentative');
  tentativePlacement.classList.add('board-cell-empty');
  tentativePlacement.innerHTML = '&nbsp;';
}



const unplaceTile = function(placedTile)
{
  placedTile.classList.remove('tray-cell-placed');
  placedTile.classList.add('tray-cell-unplaced');
}



const undo = function()
{
  for(const tentativePlacement of [...document.getElementsByClassName('board-cell-tentative')])
  {
    clearTentativePlacement(tentativePlacement)
  }

  for(const placedTile of [...document.getElementsByClassName('tray-cell-placed')])
  {
    unplaceTile(placedTile);
  }

  const message = document.getElementById('message');
  message.innerHTML = '';
};



const restart = function()
{
  if(! confirm("Are you sure?")) { return; }
  
  createBoardAndTray();

  const message = document.getElementById('message');
  message.innerHTML = '';

  const score = document.getElementById('score');
  score.innerHTML = 0;
}



const handleTrayCellPointerDown = function(event)
{
  if(event.isPrimary && !event.target.classList.contains('tray-cell-placed'))
  {
    draggingPointerId = event.pointerId;
    draggedTrayCell = event.target;
    isDragging = false;
    event.target.setPointerCapture(event.pointerId);
    document.addEventListener('pointermove', handleDocumentPointerMove);
  }
};



const handleTrayCellPointerMove = function(event)
{
  if(event.isPrimary && draggingPointerId === event.pointerId && draggedTrayCell)
  {
    if(!isDragging)
    {
      isDragging = true;
      draggedTrayCell.classList.add('dragging');
      
      ghostElement = document.createElement('div');
      ghostElement.classList.add('drag-ghost');
      ghostElement.innerHTML = draggedTrayCell.innerHTML;
      ghostElement.style.position = 'fixed';
      ghostElement.style.pointerEvents = 'none';
      ghostElement.style.zIndex = '10000';
      ghostElement.style.left = event.clientX + 'px';
      ghostElement.style.top = event.clientY + 'px';
      document.body.appendChild(ghostElement);
    }
  }
};



const handleDocumentPointerMove = function(event)
{
  if(ghostElement && draggingPointerId === event.pointerId)
  {
    ghostElement.style.left = event.clientX + 'px';
    ghostElement.style.top = event.clientY + 'px';
  }
};



const placeTile = function(trayCell, boardCell)
{
  boardCell.classList.remove('board-cell-empty');
  boardCell.classList.add('board-cell-tentative');
  boardCell.innerHTML = trayCell.innerHTML;

  trayCell.classList.remove('tray-cell-unplaced');
  trayCell.classList.add('tray-cell-placed');
};



const handleTrayCellPointerUp = function(event)
{
  if(event.isPrimary && draggingPointerId === event.pointerId && draggedTrayCell && isDragging)
  {
    // Find which element is at the pointer location
    const elementAtPointer = document.elementFromPoint(event.clientX, event.clientY);
    
    if(elementAtPointer && elementAtPointer.classList.contains('board-cell-empty'))
    {
      placeTile(draggedTrayCell, elementAtPointer);

      const message = document.getElementById('message');
      message.innerHTML = '';
    }

    draggedTrayCell.classList.remove('dragging');
    if(ghostElement)
    {
      ghostElement.remove();
      ghostElement = null;
    }
    document.removeEventListener('pointermove', handleDocumentPointerMove);
    draggingPointerId = null;
    draggedTrayCell = null;
    isDragging = false;
  }
};