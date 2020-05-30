var socket = io();

//send

var id = Math.random();
socket.emit('test', {
	id: id,
	somestuff: 'hello world'
});