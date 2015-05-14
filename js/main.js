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
  try {
    var newAST = getGoofy(_.clone(originalAST, true));
    var newSource = escodegen.generate(newAST);
  }
  catch(e){
    console.log(e.stack);
  }

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

function addClosureLevel(cm){
  var newClosureMap = function(){};
  newClosureMap.prototype = cm;
  newClosureMap = new newClosureMap();
  return newClosureMap;
}

function goofBody(body, closureMap){
  if (Array.isArray(body)){
    //Body items need to share a closure map
    var newClosureMap = addClosureLevel(closureMap);

    for(var i = 0; i < body.length; i++){
      goofBody(body[i], newClosureMap);
    }
    return;
  }

  if (body.type === 'BlockStatement'){
    return goofBody(body.body, addClosureLevel(closureMap));
  }

  if (body.type === 'FunctionDeclaration'){
    //Change function name
    body.id.name = getWord('V');

    //add function params as variables to closuremap
    for (var i = 0; i < body.params.length; i++){
      var param = body.params[i];
      var newVariableName = getWord('N');
      closureMap[param.name] = newVariableName;
      param.name = newVariableName;
    }

    return goofBody(body.body, addClosureLevel(closureMap));
  }

  if (body.type === 'VariableDeclaration'){
    for (var i = 0; i < body.declarations.length; i++){
      var variable = body.declarations[i];
      var newVariableName = getWord('N');
      //map old name to new name
      closureMap[variable.id.name] = newVariableName;
      //change name in AST
      variable.id.name = newVariableName;

      if (variable.init.arguments){
        var args = variable.init.arguments;
        for (var j = 0; j < args.length; j++){
          var arg = args[j];

          switch(arg.type){
            case 'Identifier':
              if (closureMap[arg.name]){
                arg.name = closureMap[arg.name];
              } //No else here, if we can't find it, must be a global
            break;

            case 'ObjectExpression':
              for (var k = 0; k < arg.properties.length; k++){
                var prop = arg.properties[k];
                if (prop.value.type === 'Identifier'){
                  if (closureMap[prop.value.name]){
                    prop.value.name = closureMap[prop.value.name];
                  }
                }
              }
            break;
          }
        }
      }
    }

    return body;
  }

  if (body.type === 'ExpressionStatement'){
    var arguments =
      (body.expression.right || body.expression).arguments;
    for (var i = 0; i < arguments.length; i++){
      var variable = arguments[i];
      var variableId = variable.id || variable;

      // If we find the variable name in the scope, change to the new name
      if (closureMap[variableId.name]){
        variable.name = closureMap[variableId.name];
      }
      else { //Otherwise, set a new name
        var newVariableName = getWord('N');
        closureMap[variableId.name] = newVariableName;
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
