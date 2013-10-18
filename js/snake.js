$(window).load(function(){
function log(msg) { console.log(msg); }

$(document).ready(function () {
    var getOptions = function() {
        return {
            gameSpeed: parseInt($('[name="gameSpeed"]:checked').val()),
            sizeX: parseInt($('#sizeX').val()),
            sizeY: parseInt($('#sizeY').val()),
            events : {
                onFoodNomNom: function (count) {
                    $('#cookieCounter').html(count);
                },
                onGameEnd: function (foodRemain) {
                    
                    var heroName = $('[name="gameSpeed"]:checked').parent().text().trim();
                    var message = 'Игра закончена. Из-за тебя ' + heroName + ' не доел ' + foodRemain + ' печенек :(';
                    switch (heroName) {
                    case "Чак":
                        {
                            message += ' Держи удар с разворота.';
                            break;
                        }
                        case "Слоупок":
                            {
                                message += ' Не того слоупоуком назвали...';
                                break;
                            }
                        case "Капитан":
                            {
                                message += ' Сейчас ты обязан нажать ок и начать снова (с)Твой капитан';
                                break;
                            }
                    }
                    alert(message);
                }
            }
        };
    };

    var startNewGame = function () {
        var gameOptions = getOptions();
        var gameObj = new SnakeItGame(gameOptions);
        gameObj.init();
        return gameObj;
    };

    var game = startNewGame();
    
    $('#saveOptions').click(function () {
        game.dispose();
        game = startNewGame();
    });
});



var directions = { up: 1, down: -1, left: 2, right: -2 };

function SnakeItGame(options) {

    var that = this;

    options = $.extend({
        gameSpeed: 500,
        sizeX: 10,
        sizeY: 10,
        events : {
            onFoodNomNom: function (count) { },
            onGameEnd : function (foodRemain){}
        }
    }, options);

    var fieldColors = { snakeHead: 'red', snakeBody: '#FF4747' };
    
    var field = null;
    var snake = null;
    var food = { x: null, y: null };
    var gameTimeout = null;
    var isGameStarted = false;

    this.init = function() {

        field = new Field(options.sizeX, options.sizeY);
        snake = new Snake({
            startCell: { x: getRandomInt(1, field.sizeX), y: getRandomInt(1, field.sizeY) },
            events: {
                onNewBodyPartAddedCallback: function (x, y) {
                    
                    field.drawCell(x, y, fieldColors.snakeBody);
                },
                onBodyPartRemovedCallback: function (x, y) {
                    field.clearCell(x, y);
                },
                onHeadPositionMovedCallback: function (fromX, fromY, toX, toY) {
                    field.drawCell(fromX, fromY, fieldColors.snakeBody);
                    field.drawCell(toX, toY, fieldColors.snakeHead);
                },
                onFoodNomNomCallback : function(count) {
                    options.events.onFoodNomNom(count);
                }
            }
        });

        field.init();
        snake.init();
        that.createFood();
        that.bindEvents();

    };
    this.createFood = function () {
        
        //prevent cell collision
        var isCollision;
        do {
            food.x = getRandomInt(1, field.sizeX);
            food.y = getRandomInt(1, field.sizeY);
            isCollision = snake.hasCollisionsWithBody(food.x, food.y, true);
        } while (isCollision);
        field.drawCookie(food.x, food.y);
    };

    this.bindEvents = function() {
        $(document).bind('keydown.game',function(e) {

            switch (e.keyCode) {
            case 37:
                {

                    snake.setDirection(directions.left);
                    break;
                }
            case 38:
                {
                    snake.setDirection(directions.up);
                    break;
                }
            case 39:
                {
                    snake.setDirection(directions.right);
                    break;
                }
            case 40:
                {
                    snake.setDirection(directions.down);
                    break;
                }
            default:
                {
                    return true;
                    break;
                }
            }
            if (!isGameStarted) {
                that.start();
                isGameStarted = true;
            }
            return true;
        });

        
    };
    this.start = function() {
        gameTimeout = setTimeout(function () {
            if (isGameStarted) {
                that.turn();
                that.start();
            }
        }, options.gameSpeed);
    };
    this.stop = function () {
        isGameStarted = false;
        clearTimeout(gameTimeout);
    };
    this.dispose = function () {
        
        that.stop();
        field.dispose();
        $(document).unbind('keydown.game');
        
    };
    this.turn = function() {

        snake.turn();


        if (!that._validatePosition()) {
            that.stop();
            var cookiesRemain = field.sizeX * field.sizeY - snake.getLength()  + 1;
            options.events.onGameEnd(cookiesRemain);
        } else {
            if (food.x == snake.getHead().x && food.y == snake.getHead().y) {
                snake.eatFood();
                that.createFood();
            } 
        }
    };

    this._validatePosition = function () {
        var snakeHead = snake.getHead();
        return (snakeHead.x <= field.sizeX && snakeHead.y <= field.sizeY && snakeHead.x > 0 && snakeHead.y > 0) && !snake.hasCollisionsWithBody(snakeHead.x,snakeHead.y,false);
    };
    return that;
}

function Field(sizeX, sizeY) {
    var table = $('#tbl');

    var that = this;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.cells = [];

    this.init = function() {
        var tbody = $('<tbody />');
        var xCellArray = [];
        for (var y = 1; y <= sizeY; y++) {
            var tr = $('<tr />');
            var yCellArray = [];
            for (var x = 1; x <= sizeX; x++) {
                var tdId = that.getTdId(x, y);
                var td = $('<td/>').attr('x', x).attr('y', y).attr('id', tdId);
                $(tr).append(td);
                yCellArray.push({ x: x, y: y });
            }
            xCellArray.push(yCellArray);
            $(tbody).append(tr);
        }
        $(table).append(tbody);
        that.cells = xCellArray;
    };

    this.drawCell = function (x, y, color) {
        var td = $('#' + that.getTdId(x, y));
        $(td).css({ 'background-color': color });
    };

    this.drawCookie = function (x, y) {
        $('.cookieTd').removeClass('cookieTd');
        var td = $('#' + that.getTdId(x, y));
        $(td).addClass('cookieTd');
    };

    this.clearCell = function(x, y) {
        var td = $('#' + that.getTdId(x, y));
        $(td).css({ 'background-color': '' });
    };

    this.getTdId = function(x, y) {
        return 'td' + x + '_' + y;
    };
    this.dispose = function() {
        $(table).html('');
    };
}

function Snake(options) {

    options = $.extend(true,{
        startCell : null,
        events : {
            onNewBodyPartAddedCallback: null,
            onBodyPartRemovedCallback: null,
            onHeadPositionMovedCallback: null,
            onFoodNomNomCallback: null
        }
    }, options);

    var that = this;

    var cells = [];
   

    var foodNomNomed = 0;
    var lastRemovedCell = null;
    this.currentDirection = null;

    this.init = function () {
        that._addToBodyPart(options.startCell.x, options.startCell.y,true);
    };

    this.setDirection = function(direction) {
        //check for same and cross directions
        if (Math.abs(that.currentDirection) != Math.abs(direction)) {
            that.currentDirection = direction;
        }
    };

    this.turn = function() {
        var head = that.getHead();
        var newHeadPos = { x: head.x, y: head.y };
        
        
        switch (that.currentDirection) {
        case directions.up:
            {
                newHeadPos.y--;
                break;
            }
        case directions.down:
            {
                newHeadPos.y++;
                break;
            }
        case directions.left:
            {
                newHeadPos.x--;
                break;
            }
        case directions.right:
            {
                newHeadPos.x++;
                break;
            }
        }
        that._addToBodyPart(newHeadPos.x, newHeadPos.y,true);
        
        that._removeBodyPartFromTail();
        //return cells.pop();
    };
    
    this.eatFood = function () {
        foodNomNomed++;
        that._addToBodyPart(lastRemovedCell.x, lastRemovedCell.y);
        if (options.events.onFoodNomNomCallback != null) {
            options.events.onFoodNomNomCallback(foodNomNomed);
        }
    };

    this.getHead = function() {
        return cells[0];
    };
    this.getTail = function() {
        return cells[cells.length - 1];
    };
    
    
    this._addToBodyPart = function (x, y, isToHead) {
        if (typeof isToHead === "undefined") {
            isToHead = false;
        }
        var oldHead = that.getHead();
        var newCell = { x: x, y: y };
        
        if (typeof oldHead == "undefined") {
            oldHead = newCell;
        }

        if (isToHead) 
            cells.unshift(newCell);
        else
            cells.push(newCell);
        
        if (options.events.onNewBodyPartAddedCallback != null)
            options.events.onNewBodyPartAddedCallback(x, y);
        
        if (options.events.onHeadPositionMovedCallback != null) {
            var newHead = that.getHead();
            options.events.onHeadPositionMovedCallback(oldHead.x, oldHead.y, newHead.x, newHead.y);
        }
    };
    this._removeBodyPartFromTail = function () {
        
        lastRemovedCell = cells.pop();;
        if (options.events.onBodyPartRemovedCallback != null)
            options.events.onBodyPartRemovedCallback(lastRemovedCell.x, lastRemovedCell.y);
    };

    this.hasCollisionsWithBody = function (x,y,includingHead) {
        var startFrom = includingHead ? 0 : 1;
        for(var i=startFrom;i<cells.length;i++) {
            if (x == cells[i].x && y == cells[i].y) {
                return true;
            }
        }
        return false;
    };

    this.getLength = function() {
        return cells.length;
    };
    
    this.getFoodNomNomed = function () {
        return foodNomNomed;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
});