var _ = require('lodash');

// values in haystack must be unique
function containsSome(haystack, needles) {
  return haystack.length > _.difference(haystack, needles).length;
}

function relevantStyles(offset, styleRanges) {
  var styles = _.filter(styleRanges, function(range) {
    return (offset >= range.offset && offset < (range.offset + range.length));
  });
  return styles.map(function (style) {return style.style});
}

function getListItemsWrapper(blocks, index, isOpenTag, listItemsWrappers) {
    if (isOpenTag && (index === 0 || (blocks[index - 1].type !== blocks[index].type))) {
        return listItemsWrappers[blocks[index].type][0];
    } else if (!isOpenTag && (index === blocks.length - 1 || (blocks[index].type !== blocks[index + 1].type))) {
        return listItemsWrappers[blocks[index].type][1];
    }

    return null;
}

function buildMarkup(rawDraftContentState, markup, listItemsWrappers) {

  var blocks = rawDraftContentState.blocks;
  return blocks.map(function convertBlock(block, index) {
    var outputText = [];
    var styleStack = [];
    var text = block.text;
    var ranges = block.inlineStyleRanges;
    var type = block.type;

    if (markup[type]) {
        if (listItemsWrappers && listItemsWrappers[type]) {
            outputText.push(getListItemsWrapper(blocks, index, true, listItemsWrappers));
        }
        outputText.push(markup[type][0]);
    }
    // loop over every char in this block's text
    for (var i = 0; i < text.length; i++) {

      // figure out what styles this char and the next char need
      // (regardless of whether there *is* a next char or not)
      var characterStyles = relevantStyles(i, ranges);
      var nextCharacterStyles = relevantStyles(i + 1, ranges);

      // calculate styles to add and remove
      var stylesToAdd = _.difference(characterStyles, styleStack);
      var stylesToRemove = _.difference(characterStyles, nextCharacterStyles);

      // add styles we will need for this char
      stylesToAdd.forEach(function(style) {
        styleStack.push(style);
        outputText.push(markup[style][0]);
      });

      outputText.push(text.substr(i, 1));

      // remove styles we won't need anymore
      while (containsSome(styleStack, stylesToRemove)) {
        var toRemove = styleStack.pop();
        outputText.push(markup[toRemove][1]);
      }
    }

    if (markup[type]) {
        outputText.push(markup[type][1]);

        if (listItemsWrappers && listItemsWrappers[type]) {
            outputText.push(getListItemsWrapper(blocks, index, false, listItemsWrappers));
        }
    }

    return outputText.join('');
  });

}

module.exports = buildMarkup;
