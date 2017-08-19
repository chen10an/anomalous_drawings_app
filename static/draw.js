document.addEventListener("DOMContentLoaded", function(event) {
  var canvas, context, canvasRe, contextRe, tool, button, threshold, first;

  function init () {
    // threshold for detecting anomalous drawings
    // if error > threshold then the drawing counts as abnormal
    threshold = 0.07;

    first = true;

    // Find the canvas element.
    canvas = document.getElementById('canvas');
    canvasRe = document.getElementById('canvasRe');

    if (!canvas) {
      alert('Error: I cannot find the canvas element!');
      return;
    }

    if (!canvas.getContext) {
      alert('Error: no canvas.getContext!');
      return;
    }

    // Get the 2D canvas context.
    context = canvas.getContext('2d');
    context.lineWidth = 10;
    context.lineCap = 'round';
    context.font = '30px sans-serif';
    context.fillStyle = 'rgba(0,0,0,0.1)';
    context.textAlign = 'center';
    context.fillText("Draw Here", canvas.width/2, canvas.height/2);

    contextRe = canvasRe.getContext('2d');
    contextRe.font = '30px sans-serif';
    contextRe.fillStyle = 'rgba(0,0,0,0.1)';
    contextRe.textAlign = 'center';
    contextRe.fillText("Reconstruction", canvasRe.width/2, canvasRe.height/2);

    if (!context) {
      alert('Error: failed to getContext!');
      return;
    }

    // Pencil tool instance.
    tool = new tool_pencil();

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener('mousedown', ev_canvas, false);
    canvas.addEventListener('mousemove', ev_canvas, false);
    canvas.addEventListener('mouseup',   ev_canvas, false);
    canvas.addEventListener('touchstart', ev_canvas, false);
    canvas.addEventListener('touchend', ev_canvas, false);
    canvas.addEventListener('touchmove', ev_canvas, false);

    button = document.getElementById('clear');
    button.onclick = clear;
  }

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    contextRe.clearRect(0, 0, canvasRe.width, canvasRe.height);
    document.getElementById('cost').innerHTML = 0;
    document.getElementById('cost').style.color = 'black';
  }

  // This painting tool works like a drawing pencil which tracks the mouse
  // movements.
  function tool_pencil () {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = start;
    this.touchstart = start;

    function start(ev) {
        if (first) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          first = false;
        }
        context.beginPath();
        context.moveTo(ev._x, ev._y);
        tool.started = true;
    };

    // This function is called every time you move the mouse. Obviously, it only
    // draws if the tool.started state is set to true (when you are holding down
    // the mouse button).
    this.mousemove = move;
    this.touchmove = move;

    function move(ev) {
      if (tool.started) {
        context.lineTo(ev._x, ev._y);
        context.stroke();
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = end;
    this.touchend = end;

    function end(ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;

        // send image data to server
        var contextTemp = document.createElement('canvas').getContext('2d');
        contextTemp.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 28, 28)
        var imgData = contextTemp.getImageData(0, 0, 28, 28).data;

        $.ajax({
          type: "POST",
          url: "/model",
          data: imgData
        }).done(function(data) {
          var cost = Number(data.cost)
          if (cost > threshold) {
            document.getElementById('cost').style.color = '#F45B69';
          } else {
            document.getElementById('cost').style.color = 'black';
          }
          document.getElementById('cost').innerHTML = cost.toFixed(5);

          var reconstruction = data.reconstruction
          for (var i=0; i<reconstruction.length; i++) {
            reconstruction[i] = Number(reconstruction[i])*255;
          }

          // display the reconstructed image on canvasRe
          var contextReTemp = document.createElement('canvas').getContext('2d');
          var imgDataRe = contextReTemp.createImageData(28, 28);
          for (var i=0; i<imgDataRe.data.length; i+=4) {
            imgDataRe.data[i] = 0;  // r
            imgDataRe.data[i+1] = 0;  // g
            imgDataRe.data[i+2] = 0;  // b
            imgDataRe.data[i+3] = parseInt(reconstruction[i/4]);  // a
          }
          contextReTemp.putImageData(imgDataRe, 0, 0);
          contextRe.clearRect(0, 0, canvasRe.width, canvasRe.height);
          contextRe.drawImage(contextReTemp.canvas, 0, 0, 28, 28, 0, 0, canvasRe.width, canvasRe.height);
        });
      }
    };
  }

  // The general-purpose event handler. This function just determines the mouse
  // position relative to the canvas element.
  function ev_canvas (ev) {
    if (ev.type.startsWith('touch')) {
      ev.preventDefault();
      var touch = ev.changedTouches[0];
      ev._x = touch.pageX - canvas.offsetLeft;
      ev._y = touch.pageY - canvas.offsetTop;
    } else {
      if (ev.layerX || ev.layerX == 0) { // Firefox
        ev._x = ev.layerX;
        ev._y = ev.layerY;
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        ev._x = ev.offsetX;
        ev._y = ev.offsetY;
      }
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  init();

});
