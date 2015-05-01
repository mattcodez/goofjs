$('#compute').on('click', function(e){
  compute(
    $('#sourceInput').text(),
    function(newCode){
      $('#sourceOutput').text(newCode);
    }
  ); //TODO: Can we pipe this at some point?
});

function compute(oldSource, callback){
  var tolerant = [];

  var AST = esprima.parse(oldSource, {tolerant:tolerant});
  console.log(tolerant);

  AST.body[0].id.name = 'moo';

  var newSource = escodegen.generate(AST);
  callback(newSource);
}
