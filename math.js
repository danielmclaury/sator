
const decomposeIntoRectangles = function(grid)
{
  let result = [];

  let remaining = structuredClone(grid);

  while(true)
  {
    let rectangle = _findLargestRectangle(remaining);

    if(_rectangleIsEmpty(rectangle)) { return result; }

    result.push(rectangle);
    _zeroOutRectangle(remaining, rectangle);
  }
};



const _rectangleIsEmpty = function(rectangle)
{
  let [ row, col, width, height ] = rectangle;

  return (width == 0 && height == 0);
};



const _zeroOutRectangle = function(grid, rectangle)
{
  let [ startRow, startCol, width, height ] = rectangle;

  for(let i = 0; i < height; ++i)
  {
    for(let j = 0; j < width; ++j)
    {
      let row = startRow + i;
      let col = startCol + j;

      grid[row][col] = false;
    }
  }
};



const _findLargestRectangle = function(grid)
{
  const rows = grid.length;
  const cols = grid[0].length;

  best = [0, 0, 0, 0];
  bestArea = 0;

  for(let row = 0; row < rows; ++row)
  {
    for(let col = 0; col < cols; ++col)
    {
      [ width, height ] = _findLargestRectangleAt(grid, row, col);

      let area = width * height;

      if(area > bestArea)
      {
        best = [ row, col, width, height ];
        bestArea = area;
      }
    }
  }

  return best;
};



const _findLargestRectangleAt = function(grid, startRow, startCol)
{
  if(! grid[startRow][startCol]) { return [0, 0]; }

  const rows = grid.length;
  const cols = grid[0].length;

  let maxWidth = cols - startCol;
  let bestArea = 0;
  let result = [ 0, 0 ];

  for(height = 1; startRow + height - 1 < rows; ++height)
  {
    let row = startRow + height - 1;

    for(width = maxWidth; width > 0; --width)
    {
      let col = startCol + width - 1;

      if(! grid[row][col]) { maxWidth = width - 1; }
    }

    if(maxWidth == 0) { break; }

    let area = height * maxWidth;

    if(area > bestArea)
    {
      bestArea = area;
      result = [ maxWidth, height ];
    }
  }

  return result;
};



const _getNeighbors = function(grid, row, col)
{
  const rows = grid.length;
  const cols = grid[0].length;

  let result = [];

  if ((row - 1 >= 0) && grid[row-1][col])
  {
    result.push([row-1, col]);
  }

  if((col - 1 >= 0) && grid[row][col-1])
  {
    result.push([row, col-1]);
  }

  if((row + 1 < rows) && grid[row+1][col])
  {
    result.push([row+1, col]);
  }

  if((col + 1 < cols) && grid[row][col + 1])
  {
    result.push([row, col+1]);
  }

  return result;
};



const countConnectedComponents = function(grid)
{
  const rows = grid.length;
  const cols = grid[0].length;

  const remaining = structuredClone(grid);

  let componentsFound = 0;

  while(true)
  {
    // Find a single cell

    let toExamine = [];

    for(let row = 0; row < rows; ++row)
    {
      for(let col = 0; col < cols; ++col)
      {
        if(remaining[row][col])
        {
          toExamine.push([row, col]);
          break;
        }
      }

      if(toExamine.length > 0) { break; }
    }

    if(toExamine.length == 0) { break; }

    ++componentsFound;

    // Flood fill

    while(toExamine.length > 0)
    {
      let [ row, col ] = toExamine.pop();

      remaining[row][col] = false;

      toExamine.push(..._getNeighbors(remaining, row, col));
    }
  }

  return componentsFound;
};