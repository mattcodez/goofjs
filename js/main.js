$('#compute').on('click', function(e){
  compute(
    $('#sourceInput').text(),
    function(newCode){
      $('#sourceOutput').text(newCode);
    }
  ); //TODO: Can we pipe this at some point?
});

function compute(source, callback){
  var tolerant = [];
  callback(
    JSON.stringify(
      esprima.parse(source, {tolerant:tolerant}),
    null, 4)
  );
  console.log(tolerant);
}
