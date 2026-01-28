const BOARD_ROWS = 10;
const BOARD_COLS = 10;

const TRAY_LETTERS = 8;

var WORD_LIST = [];
var WORD_SET = new Set();

var boardCells = [];



var draggedTrayCell;



const getWordList = async function()
{
  const wordListURL = 'ENABLE.txt';

  try
  {
    const contents = await fetch(wordListURL).then(response => response.text());

    WORD_LIST = contents.split('\n');
    WORD_SET = new Set(WORD_LIST);
  }
  catch
  {
    console.log('Could not fetch word list');
  }
};



const init = async function()
{
  await getWordList();
  createBoardAndTray();
};



const randomLetter = function()
{
  if(WORD_LIST.length == 0)
  {
    return  String.fromCharCode(
      'A'.charCodeAt(0) + Math.floor(Math.random() * 26));
  }
  else
  {
    const wordIndex = Math.floor(Math.random() * WORD_LIST.length);

    const word = WORD_LIST[wordIndex];

    const letterIndex = Math.floor(Math.random() * word.length);

    return word[letterIndex];
  }
}



const createBoardAndTray = function()
{
    let boardTableDiv = document.getElementById('board-table');
    
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
        td.ondragover = handleBoardCellDragOver;
        td.ondrop = handleBoardCellDrop;
        td.onclick = handleBoardCellClick;

        tr.appendChild(td);

        boardCells[row].push(td);
      }
    }

    const trayTableRow = document.getElementById('tray-table-row');

    for(let i = 0; i < TRAY_LETTERS; ++i)
    {
      const traySlot = document.createElement('td');
      traySlot.id = `tray-cell-${i+1}`;
      traySlot.classList.add('tray-cell');
      traySlot.classList.add('tray-cell-unplaced');
      traySlot.innerHTML = randomLetter();
      traySlot.draggable = 'true';
      traySlot.ondragstart = handleTrayCellDragStart;

      trayTableRow.appendChild(traySlot);
    }
};



const handleTrayCellDragStart = function(event)
{
  draggedTrayCell = event.target;
};



const handleBoardCellDragOver = function(event)
{
  if(event.target.innerHTML == '&nbsp;')
  {
    event.preventDefault();
  }
};



const handleBoardCellDrop = function(event)
{
  if(event.target.classList.contains('board-cell-empty'))
  {
    event.preventDefault();

    event.target.classList.remove('board-cell-empty');
    event.target.classList.add('board-cell-tentative');
    event.target.innerHTML = draggedTrayCell.innerHTML;

    draggedTrayCell.classList.remove('tray-cell-unplaced');
    draggedTrayCell.classList.add('tray-cell-placed');
    draggedTrayCell.draggable = false;

    const message = document.getElementById('message');
    message.innerHTML = '';
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



const isWord = function(word)
{
  if(WORD_SET.size == 0)
  {
    // testing
    return true;
  }
  else
  {
    return WORD_SET.has(word.toLowerCase());
  }
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

  // check that all letters were added in a single row or column

  const rowsWithTilePlaced = new Set();
  const colsWithTilePlaced = new Set();
  let tilesPlaced = 0;

  for(let row = 0; row < BOARD_ROWS; ++row)
  {
    for(let col = 0; col < BOARD_COLS; ++col)
    {
      const td = boardCells[row][col];

      if(td.classList.contains('board-cell-tentative'))
      {
        rowsWithTilePlaced.add(row);
        colsWithTilePlaced.add(col);
        ++tilesPlaced;
      }
    }
  }

  // check that all added letters were contiguous

  let seenAdded = false;
  let seenEmptyAfterAdded = false;

  if(rowsWithTilePlaced.size == 1)
  {
    const row = [...rowsWithTilePlaced][0];

    for(let col = 0; col < BOARD_COLS; ++col)
    {
      const td = boardCells[row][col];

      if(! seenAdded)
      {
        if(td.classList.contains('board-cell-tentative'))
        {
          seenAdded = true;
        }
      }
      else if(! seenEmptyAfterAdded)
      {
        if(td.classList.contains('board-cell-empty'))
        {
          seenEmptyAfterAdded = true;
        }
      }
      else
      {
        if(td.classList.contains('board-cell-tentative'))
        {
          message.innerHTML = 'placed tiles must be consecutive';
          return false;
        }
      }
    }
  }
  else if(colsWithTilePlaced.size == 1)
  {
    const col = [...colsWithTilePlaced][0];
    
    for(let row = 0; row < BOARD_COLS; ++row)
    {
      const td = boardCells[row][col];

      if(! seenAdded)
      {
        if(td.classList.contains('board-cell-tentative'))
        {
          seenAdded = true;
        }
      }
      else if(! seenEmptyAfterAdded)
      {
        if(td.classList.contains('board-cell-empty'))
        {
          seenEmptyAfterAdded = true;
        }
      }
      else
      {
        if(td.classList.contains('board-cell-tentative'))
        {
          message.innerHTML = 'placed tiles must be consecutive';
          return false;
        }
      }
    }
  }
  else
  {
    // Tiles were not all placed in one row or column
    message.innerHTML = 'placed tiles must all be in the same row or column';
    return false;
  }

  return true;
};



const updateScore = function()
{
  const grid = boardCells.map(row => row.map(td => td.classList.contains('board-cell-filled')));

  const rectangles = decomposeIntoRectangles(grid);

  console.log(rectangles);

  let score = 0n;
  for(const rectangle of rectangles)
  {
    let [ row, col, height, width ] = rectangle;

    score += 2n ** BigInt(width * height);
  }

  document.getElementById('score').innerHTML = score;
};



const submit = function()
{
  if(! validateBoard()) { return; }

  for(const tentativePlacement of [...document.getElementsByClassName('board-cell-tentative')])
  {
    tentativePlacement.classList.remove('board-cell-tentative');
    tentativePlacement.classList.add('board-cell-filled');
  }

  for(const placedTile of [...document.getElementsByClassName('tray-cell-placed')])
  {
    placedTile.classList.remove('tray-cell-placed');
    placedTile.classList.add('tray-cell-unplaced');
    placedTile.draggable = true;
    placedTile.innerHTML = randomLetter();
  }

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
  placedTile.draggable = true;
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