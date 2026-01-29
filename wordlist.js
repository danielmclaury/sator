var WORD_LIST = [];
var WORD_SET = new Set();



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