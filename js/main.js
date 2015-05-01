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
  AST.body[0].id.name = 'moo';

  var newSource = escodegen.generate(AST);
  callback({
    source:newSource,
    AST:JSON.stringify(AST,null, 4),
    errors:JSON.stringify(tolerant,null, 4)
  });
}
