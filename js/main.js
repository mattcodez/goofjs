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

  var AST = esprima.parse(oldSource, {tolerant:tolerant});
  AST = getGoofy(AST);

  var newSource = escodegen.generate(AST);
  callback({
    source:newSource,
    AST:JSON.stringify(AST,null, 4),
    errors:JSON.stringify(tolerant,null, 4)
  });
}

function getGoofy(AST){

  for (var i = 0; i < AST.body.length; i++){
    var body = AST.body[i];
    goofBody(body);
  }

  return AST;
}

function goofBody(body){
  if (Array.isArray(body)){
    for(var i = 0; i < body.length; i++){
      return goofBody(body[i]);
    }
  }

  if (body.type === 'BlockStatement'){
    return goofBody(body.body);
  }

  if (body.type === 'FunctionDeclaration'){
    body.id.name = getWord('V');
    return goofBody(body.body);
  }

  if (body.type === 'VariableDeclaration'){
    for (var i = 0; i < body.declarations.length; i++){
      body.declarations[i].id.name = getWord('N');
    }

    return body;
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
