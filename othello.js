// 游戏棋盘
const OTHELLO_BOARD = [
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null]
];

// 历史记录
let undoList = [], redoList = [];
function makeHistoryItem(turn) {
	let historyItem = JSON.parse(JSON.stringify(OTHELLO_BOARD));
	historyItem.turn = turn;
	return historyItem;
}
function recordHistory(turn) {
	undoList.push(makeHistoryItem(turn));
	redoList = [];
}
function undoHistory() {
	if (undoList.length > 0) {
		redoList.push(makeHistoryItem(turn));

		let undoItem = undoList.pop();
		undoItem.forEach((undoRow, rowIndex) => {
			undoRow.forEach((undoGrid, colIndex) => {
				changeStoneType(OTHELLO_BOARD[rowIndex][colIndex], undoGrid.type);
				changeStoneChargeType(OTHELLO_BOARD[rowIndex][colIndex], undoGrid.chargeType);
			});
		});

		setTurn(undoItem.turn);
		calculateScore();
	}
}
function redoHistory() {
	if (redoList.length > 0) {
		undoList.push(makeHistoryItem(turn));

		let redoItem = redoList.pop();
		redoItem.forEach((redoRow, rowIndex) => {
			redoRow.forEach((redoGrid, colIndex) => {
				changeStoneType(OTHELLO_BOARD[rowIndex][colIndex], redoGrid.type);
				changeStoneChargeType(OTHELLO_BOARD[rowIndex][colIndex], redoGrid.chargeType);
			});
		});

		setTurn(redoItem.turn);

		calculateScore();

		checkGameState();
	}
}

// 棋子类型
const STONE_TYPES = [
	{type: "EMPTY", class: "empty"},
	{type: "BLACK_CAN_PLACE", class: "pre-black"},
	{type: "BLACK", class: "black"},
	{type: "WHITE_CAN_PLACE", class: "pre-white"},
	{type: "WHITE", class: "white"}
];
function getStoneClass(type) {
	return STONE_TYPES.find(stoneType => stoneType.type === type)?.class || null;
}
function changeStoneType(gridObj, type) {
	// 移除所有棋子类型
	STONE_TYPES.forEach(stoneType => {
		gridObj.stoneEl.classList.remove(stoneType.class);
	});

	// 添加指定棋子类型
	gridObj.stoneEl.classList.add(getStoneClass(type));

	// 设置棋子类型
	gridObj.type = type;
}

// 棋子充能类型
const STONE_CHARGE_TYPES = [
	{type: "NONE", class: "none-charge"},
	{type: "WEAK", class: "weak-charge"},
	{type: "STRONG", class: "strong-charge"}
];
function getStoneChargeClass(type) {
	return STONE_CHARGE_TYPES.find(stoneChargeType => stoneChargeType.type === type)?.class || null;
}
function changeStoneChargeType(gridObj, type) {
	// 移除所有棋子充能类型
	STONE_CHARGE_TYPES.forEach(stoneChargeType => {
		gridObj.stoneEl.classList.remove(stoneChargeType.class);
	});

	// 添加指定棋子充能类型
	gridObj.stoneEl.classList.add(getStoneChargeClass(type));

	// 设置棋子充能类型
	gridObj.chargeType = type;
}
function resetAllStoneCharge() {
	for (let col = 0; col < OTHELLO_BOARD.length; col++) {
		for (let row = 0; row < OTHELLO_BOARD[col].length; row++) {
			const gridObj = OTHELLO_BOARD[col][row];
			changeStoneChargeType(gridObj, "NONE");
		}
	}
}

let turn = false;
function setTurn(newTurn) {
	turn = newTurn;
	showTurn();
}
function switchTurn() {
	turn = !turn;
	showTurn();
}
function showTurn() {
	turnBarEl.classList.add("expand");

	turnIconEl.classList.remove("black");
	turnIconEl.classList.remove("white");
	turnIconEl.classList.add(turn ? "white" : "black");

	turnTextEl.textContent = `${turn ? "白" : "黑"}方回合`;

	turnTextEl.style.color = turn ? "gray" : "#1B1B1B";
}

let boardEl = null,
	blackScoreEl = null, whiteScoreEl = null,
	turnBarEl = null, turnIconEl = null, turnTextEl = null;

// 重置棋盘
function resetBoard() {
	boardEl.innerHTML = "";
	for (let col = 0; col < OTHELLO_BOARD.length; col++) {
		for (let row = 0; row < OTHELLO_BOARD[col].length; row++) {
			// 定义棋子
			const stoneEl = document.createElement("div");

			// stoneEl.textContent = `${col}, ${row}`;

			stoneEl.style.gridArea = `${col + 1} / ${row + 1}`;

			stoneEl.classList.add("stone");

			stoneEl.classList.add("empty");

			boardEl.appendChild(stoneEl);

			// 定义棋子中间的小圆点
			const stoneCenterEl = document.createElement("div");

			stoneCenterEl.classList.add("stone-center");

			stoneEl.appendChild(stoneCenterEl);

			OTHELLO_BOARD[col][row] = {
				type: "EMPTY",
				chargeType: "NONE",
				stoneEl,
				stoneCenterEl
			};

			// 定义落子函数
			stoneEl.onclick = function () {
				let nowType = OTHELLO_BOARD[col][row].type;

				// 如果当前棋子不是可落子状态，直接返回
				if (nowType !== "BLACK_CAN_PLACE" && nowType !== "WHITE_CAN_PLACE") {
					return;
				}

				// 落子
				placeStone(col, row, nowType === "BLACK_CAN_PLACE" ? "BLACK" : "WHITE");

				// 切换回合
				switchTurn();

				// 检查游戏状态
				checkGameState();
			};
		}
	}
}

// 开局游戏
function startGame() {
	// 重置棋盘
	resetBoard();

	// 重置回合
	setTurn(false);

	// 重置悔棋列表
	undoList = [];
	redoList = [];

	// 中间摆放四个棋子
	changeStoneType(OTHELLO_BOARD[3][3], "WHITE");
	changeStoneType(OTHELLO_BOARD[3][4], "BLACK");
	changeStoneType(OTHELLO_BOARD[4][3], "BLACK");
	changeStoneType(OTHELLO_BOARD[4][4], "WHITE");

	// 重置分数
	calculateScore();

	// 预测可落子位置
	predPlacePos();
}
// 预测可落子位置
function predPlacePos() {
	// 从棋盘中移除所有预测可落子位置
	for (let col = 0; col < OTHELLO_BOARD.length; col++) {
		for (let row = 0; row < OTHELLO_BOARD[col].length; row++) {
			const gridObj = OTHELLO_BOARD[col][row];
			if (gridObj.type === "BLACK_CAN_PLACE" || gridObj.type === "WHITE_CAN_PLACE") {
				changeStoneType(gridObj, "EMPTY");
			}
		}
	}

	let canPlaceCount = 0;

	for (let col = 0; col < OTHELLO_BOARD.length; col++) {
		for (let row = 0; row < OTHELLO_BOARD[col].length; row++) {
			const gridObj = OTHELLO_BOARD[col][row];
			if (gridObj.type === "EMPTY") {
				if (turn) {
					// 判断是否可以落子
					if (canPlace(col, row, "WHITE")) {
						changeStoneType(gridObj, "WHITE_CAN_PLACE");
						canPlaceCount++;
					}
				} else {
					// 判断是否可以落子
					if (canPlace(col, row, "BLACK")) {
						changeStoneType(gridObj, "BLACK_CAN_PLACE");
						canPlaceCount++;
					}
				}
			}
		}
	}

	return canPlaceCount;
}
// 判断是否可以落子
function canPlace(col, row, type) {
	// 判断是否在棋盘内
	if (col < 0 || col >= OTHELLO_BOARD.length || row < 0 || row >= OTHELLO_BOARD[col].length) {
		return false;
	}

	// 判断是否为空
	if (OTHELLO_BOARD[col][row].type !== "EMPTY") {
		return false;
	}

	// 判断是否可以吃子
	let canEat = false;
	// 判断上方
	if (canEat || canEatStone(col - 1, row, -1, 0, type)) {
		canEat = true;
	}
	// 判断右上方
	if (canEat || canEatStone(col - 1, row + 1, -1, 1, type)) {
		canEat = true;
	}
	// 判断右方
	if (canEat || canEatStone(col, row + 1, 0, 1, type)) {
		canEat = true;
	}
	// 判断右下方
	if (canEat || canEatStone(col + 1, row + 1, 1, 1, type)) {
		canEat = true;
	}
	// 判断下方
	if (canEat || canEatStone(col + 1, row, 1, 0, type)) {
		canEat = true;
	}
	// 判断左下方
	if (canEat || canEatStone(col + 1, row - 1, 1, -1, type)) {
		canEat = true;
	}
	// 判断左方
	if (canEat || canEatStone(col, row - 1, 0, -1, type)) {
		canEat = true;
	}
	// 判断左上方
	if (canEat || canEatStone(col - 1, row - 1, -1, -1, type)) {
		canEat = true;
	}

	return canEat;
}
// 判断是否可以吃子
function canEatStone(col, row, colStep, rowStep, type, isRecursion = false) {
	// 判断是否在棋盘内
	if (col < 0 || col >= OTHELLO_BOARD.length || row < 0 || row >= OTHELLO_BOARD[col].length) {
		return false;
	}

	// 判断是否为空
	if (OTHELLO_BOARD[col][row].type !== "BLACK" && OTHELLO_BOARD[col][row].type !== "WHITE") {
		return false;
	}

	if (!isRecursion && OTHELLO_BOARD[col][row].type === type) {
		return false;
	}

	// 判断是否为对方颜色
	if (OTHELLO_BOARD[col][row].type !== type) {
		// 判断下一个棋子
		return canEatStone(col + colStep, row + rowStep, colStep, rowStep, type, true);
	}

	// 判断是否为自己颜色
	if (OTHELLO_BOARD[col][row].type === type) {
		// 可以吃子
		return true;
	}
}

// 落子
function placeStone(col, row, type) {
	// 记录落子
	recordHistory(turn);

	// 重置所有充能
	resetAllStoneCharge();

	const gridObj = OTHELLO_BOARD[col][row];

	// 落子
	changeStoneType(gridObj, type);

	// 强充能
	changeStoneChargeType(gridObj, "STRONG");

	// 吃子
	eatStone(col - 1, row, -1, 0, type); // 上方
	eatStone(col - 1, row + 1, -1, 1, type); // 右上方
	eatStone(col, row + 1, 0, 1, type); // 右方
	eatStone(col + 1, row + 1, 1, 1, type); // 右下方
	eatStone(col + 1, row, 1, 0, type); // 下方
	eatStone(col + 1, row - 1, 1, -1, type); // 左下方
	eatStone(col, row - 1, 0, -1, type); // 左方
	eatStone(col - 1, row - 1, -1, -1, type); // 左上方

	// 计算分数
	calculateScore();
}
// 吃子
function eatStone(col, row, colStep, rowStep, type) {
	// 判断是否在棋盘内
	if (col < 0 || col >= OTHELLO_BOARD.length || row < 0 || row >= OTHELLO_BOARD[col].length) {
		return false;
	}

	let gridObj = OTHELLO_BOARD[col][row];

	// 判断是否为空
	if (gridObj.type !== "BLACK" && gridObj.type !== "WHITE") {
		return false;
	}

	// 判断是否为对方颜色
	if (gridObj.type !== type) {
		// 判断下一个棋子
		if (eatStone(col + colStep, row + rowStep, colStep, rowStep, type)) {
			// 吃子
			changeStoneType(gridObj, type);
			// 弱充能
			changeStoneChargeType(gridObj, "WEAK");
		}
	}

	// 判断是否为自己颜色
	if (gridObj.type === type) {
		// 吃子
		changeStoneType(gridObj, type);
		return true;
	}
}
// 计算分数
function calculateScore() {
	let blackScore = 0;
	let whiteScore = 0;

	for (let col = 0; col < OTHELLO_BOARD.length; col++) {
		for (let row = 0; row < OTHELLO_BOARD[col].length; row++) {
			if (OTHELLO_BOARD[col][row].type === "BLACK") {
				blackScore++;
			} else if (OTHELLO_BOARD[col][row].type === "WHITE") {
				whiteScore++;
			}
		}
	}

	blackScoreEl.innerText = blackScore;
	whiteScoreEl.innerText = whiteScore;

	return {
		blackScore,
		whiteScore
	};
}

// 游戏结束
function checkGameState() {
	// 本方无子可落
	if (!predPlacePos()) {
		// 如果当前回合无可落子位置，切换回合
		switchTurn();
		if (!predPlacePos()) {
			// 如果对方回合也无可落子位置，游戏结束
			gameOver();
		}
	}

	// 任意一方为0分
	let scores = calculateScore();
	if (scores.blackScore === 0 || scores.whiteScore === 0) {
		gameOver();
	}
}
function gameOver() {
	// 计算分数
	let scores = calculateScore();

	if (scores.blackScore === scores.whiteScore) {
		// 平局
		turnTextEl.innerText = "双方平局";
		turnTextEl.style.color = "#1B1B1B";

		turnIconEl.classList.remove("black");
		turnIconEl.classList.remove("white");
		turnIconEl.classList.add("double");
	} else {
		let winnerTurn = scores.blackScore <= scores.whiteScore;

		// 显示游戏结束
		turnTextEl.innerText = `${winnerTurn ? "白方" : "黑方"}获胜`;
		turnTextEl.style.color = winnerTurn ? "gray" : "#1B1B1B";

		turnIconEl.classList.remove(winnerTurn ? "black" : "white");
		turnIconEl.classList.add(winnerTurn ? "white" : "black");
	}
}

window.addEventListener("load", () => {
	boardEl = document.getElementById("board");

	blackScoreEl = document.getElementById("black-score");
	whiteScoreEl = document.getElementById("white-score");

	turnBarEl = document.getElementById("turn-bar");
	turnIconEl = document.getElementById("turn-icon");
	turnTextEl = document.getElementById("turn-text");

	resetBoard();
});