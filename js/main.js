$('#compute').on('click', function(e){
  compute(
    $('#sourceInput').text(),
    function(codes){
      $('#sourceOutput').text(codes.source);
      $('#ASTOutput').text(codes.AST);
      $('#errorOutput').text(codes.errors);
    }
  ); //TODO: Can we pipe this at some point?
});

var outputPanes = $('#sourceOutput, #ASTOutput, #errorOutput');
var paneButtons = $('BUTTON#sourcePane, BUTTON#ASTPane, BUTTON#errorPane')
paneButtons.on('click', function(e){
  outputPanes.hide();
  $('#' + $(e.target).attr('data-pane')).show();
});

function compute(oldSource, callback){
  var tolerant = [];

  var originalAST = esprima.parse(oldSource, {tolerant:tolerant});
  var newAST = getGoofy(originalAST);

  var newSource = escodegen.generate(newAST);
  callback({
    source:newSource,
    AST:JSON.stringify(originalAST,null, 4),
    errors:JSON.stringify(tolerant,null, 4)
  });
}

function getGoofy(AST){

  for (var i = 0; i < AST.body.length; i++){
    var body = AST.body[i];
    goofBody(body, function(){});
  }

  return AST;
}

function goofBody(body, closureMap){
  var newClosureMap = function(){};
  newClosureMap.prototype = closureMap;
  newClosureMap = new newClosureMap();

  if (Array.isArray(body)){
    for(var i = 0; i < body.length; i++){
      goofBody(body[i], newClosureMap);
    }
    return;
  }

  if (body.type === 'BlockStatement'){
    return goofBody(body.body, newClosureMap);
  }

  if (body.type === 'FunctionDeclaration'){
    body.id.name = getWord('V');
    return goofBody(body.body, newClosureMap);
  }

  if (body.type === 'VariableDeclaration'){
    for (var i = 0; i < body.declarations.length; i++){
      var variable = body.declarations[i];
      var newVariableName = getWord('N');
      newClosureMap[variable.id.name] = newVariableName;
      variable.id.name = newVariableName;
    }

    return body;
  }

  if (body.type === 'ExpressionStatement'){
    var arguments =
      (body.expression.right || body.expression).arguments;
    for (var i = 0; i < arguments.length; i++){
      var variable = arguments[i];
      var variableId = variable.id || variable;
      if (newClosureMap[variableId.name]){
        variable.name = newClosureMap[variableId.name];
      }
      else {
        newClosureMap[variableId.name] = newVariableName;
        variableId.name = newVariableName;
      }
    }
  }
}

function getWord(partOfSpeech){
  //start at random spot in array then wrap around looking
  var r = Math.floor(Math.random() * __words.length);
  var i = r;
  while (i++){
    var word = __words[i];
    if (word[1] == partOfSpeech){
      return word[0];
    }

    if (i >= __words.length){
      i = 0;
    }
    else {
      if (i == (r - 1)){
        return 'nothing'; //End of wrap around loop
      }
    }
  }
}
