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
OTHELLO_BOARD.timerDeadline = 0;
OTHELLO_BOARD.timerLimit = 0;

// 历史记录
let undoList = [], redoList = [];
function makeHistoryItem(turn) {
	let historyItem = JSON.parse(JSON.stringify(OTHELLO_BOARD));
	historyItem.turn = turn;
	historyItem.canPlaceCount = OTHELLO_BOARD.canPlaceCount;
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
		OTHELLO_BOARD.canPlaceCount = undoItem.canPlaceCount;

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
		OTHELLO_BOARD.canPlaceCount = redoItem.canPlaceCount;

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
	resetTimer();
}
function switchTurn() {
	turn = !turn;
	showTurn();
	resetTimer();
}
function showTurn() {
	turnBarEl.classList.add("expand");

	turnIconEl.classList.remove("black");
	turnIconEl.classList.remove("white");
	turnIconEl.classList.add(turn ? "white" : "black");

	turnTextEl.textContent = `${turn ? "白" : "黑"}方回合`;

	turnTextEl.style.color = turn ? "gray" : "#1B1B1B";
}

// 设置
let settingsFormEl;
const DEFAULT_SETTINGS = {
	// 计时
	timerEnabled: false,
	timerBlackLimit: 60,
	timerWhiteLimit: 60,
	timerPunish: "none"
};
let settings;
/**
 * 合并两个对象
 * @param {object} def 默认对象
 * @param {object} act 实际对象
 * @returns {object} 合并后的对象
 */
function deepMergeObject(def, act) {
	if (typeof def == "undefined" || def == null) {
		return act;
	} else if (typeof act == "undefined" || act == null) {
		return def;
	}

	if (typeof def !== "object" || typeof act !== "object") {
		return typeof def !== typeof act ? def : act;
	} else if (Array.isArray(def) !== Array.isArray(act)) {
		return def;
	} else if (Array.isArray(def) && Array.isArray(act)) {
		return def.concat(act);
	}

	let res = {};
	for (let k in def) {
		res[k] = deepMergeObject(def[k], act[k]);
	}
	for (let k in act) {
		res[k] = deepMergeObject(def[k], act[k]);
	}
	return res;
}
function readSettings() {
	let settings;
	try {
		settings = deepMergeObject(DEFAULT_SETTINGS, JSON.parse(window.localStorage.getItem("settings")));
	} catch (e) {
		console.log(e);
		settings = DEFAULT_SETTINGS;
	}
	return settings;
}
function saveSettings(settings) {
	window.localStorage.setItem("settings", JSON.stringify(settings));
}
function readSettingsForm() {
	let settings = {};
	for (let i = 0; i < settingsFormEl.length; i++) {
		const item = settingsFormEl[i], key = item.name;
		switch (settingsFormEl[i].type) {
			case "button":
			case "color":
			case "date":
			case "datetime-local":
			case "email":
			case "file":
			case "hidden":
			case "image":
			case "month":
			case "password":
			case "search":
			case "submit":
			case "tel":
			case "text":
			case "time":
			case "url":
			case "week":
			case "select-one": {
				settings[key] = item.value;
				break;
			}
			case "checkbox":
			case "radio": {
				settings[key] = item.checked;
				break;
			}
			case "number": {
				settings[key] = parseInt(item.value);
				break;
			}
			case "range": {
				settings[key] = parseFloat(item.value);
				break;
			}
			case "reset": {
				break;
			}
			default: {
				console.warn(`未知的设置类型：${item.type}`);
				break;
			}
		}
	}
	return settings;
}
function writeSettingsForm(settings) {
	for (let i = 0; i < settingsFormEl.length; i++) {
		const item = settingsFormEl[i], key = item.name;
		switch (item.type) {
			case "button":
			case "color":
			case "date":
			case "datetime-local":
			case "email":
			case "file":
			case "hidden":
			case "image":
			case "month":
			case "password":
			case "search":
			case "submit":
			case "tel":
			case "text":
			case "time":
			case "url":
			case "week":
			case "select-one": {
				item.value = settings[key];
				break;
			}
			case "checkbox":
			case "radio": {
				item.checked = settings[key];
				break;
			}
			case "number":
			case "range": {
				item.value = String(settings[key]);
				break;
			}
			case "reset": {
				break;
			}
			default: {
				console.warn(`未知的设置类型：${item.type}`);
				break;
			}
		}
	}
}
function initSettings() {
	settings = readSettings();
	writeSettingsForm(settings);
}
function applySettings() {
	settings = readSettingsForm();
	// 持久化设置
	saveSettings(settings);
	// 隐藏设置
	hideSettings();
}
function resetSettings() {
	writeSettingsForm(DEFAULT_SETTINGS);
}
function showSettings() {
	// 读取设置
	writeSettingsForm(settings);

	// 显示设置
	settingsFormEl.classList.remove("hide");
	settingsFormEl.classList.add("pre-show");
	setTimeout(() => {
		settingsFormEl.classList.remove("pre-show");
		settingsFormEl.classList.add("show");
	}, 200);
}
function hideSettings() {
	// 隐藏设置
	settingsFormEl.classList.remove("show");
	settingsFormEl.classList.add("pre-hide");
	setTimeout(() => {
		settingsFormEl.classList.remove("pre-hide");
		settingsFormEl.classList.add("hide");
	}, 200);
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

// 计时器
function resetTimer() {
	if (OTHELLO_BOARD.settings.timerEnabled) {
		let timerLimit;
		if (turn) {
			timerLimit = OTHELLO_BOARD.settings.timerWhiteLimit;
		} else {
			timerLimit = OTHELLO_BOARD.settings.timerBlackLimit;
		}
		OTHELLO_BOARD.timerDeadline = Date.now() + timerLimit * 1000;
		OTHELLO_BOARD.timerLimit = timerLimit;
	}
}
function showTimer() {
	if (OTHELLO_BOARD.settings?.timerEnabled && OTHELLO_BOARD.canPlaceCount) {
		const now = Date.now();
		if (now < OTHELLO_BOARD.timerDeadline) {
			const timeLeft = OTHELLO_BOARD.timerDeadline - now;
			const timeLeftPercent = timeLeft / OTHELLO_BOARD.timerLimit / 1000;
			turnBarEl.style.backgroundPosition = `0 ${timeLeftPercent * 100}%`;
		} else {
			turnBarEl.style.backgroundPosition = `0 0`;
			turnTextEl.textContent = `${turn ? "白" : "黑"}方超时`;

			// 计时器惩罚
			timerPunish();
		}
	} else {
		turnBarEl.style.backgroundImage = "white";
		turnBarEl.style.backgroundPosition = `0 100%`;
	}
}
function startTimerInterval() {
	OTHELLO_BOARD.timerInterval = setInterval(showTimer, 200);
}
function stopTimerInterval() {
	clearInterval(OTHELLO_BOARD.timerInterval);
}
function timerPunish() {
	switch (OTHELLO_BOARD.settings.timerPunish) {
		case "none":
		default: {
			break;
		}
		case "skip": {
			// 非正常结束游戏，记录历史
			recordHistory(turn);
			// 跳过回合
			switchTurn();
			// 检查游戏状态
			checkGameState();
			break;
		}
		case "lose": {
			// 非正常结束游戏，记录历史
			recordHistory(turn);
			// 结束游戏
			gameOver(!turn);
			break;
		}
	}
}

// 开局游戏
function startGame() {
	// 锁定设置
	OTHELLO_BOARD.settings = JSON.parse(JSON.stringify(settings));

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

	// 重置计时器
	resetTimer();

	// 预测可落子位置
	predPlacePos();
}
// 预测可落子位置
function predPlacePos() {
	// 从棋盘中移除所有预测可落子位置
	removeAllPredPlacePos();

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

	OTHELLO_BOARD.canPlaceCount = canPlaceCount;

	return canPlaceCount;
}
// 移除所有预测可落子位置
function removeAllPredPlacePos() {
	// 从棋盘中移除所有预测可落子位置
	for (let col = 0; col < OTHELLO_BOARD.length; col++) {
		for (let row = 0; row < OTHELLO_BOARD[col].length; row++) {
			const gridObj = OTHELLO_BOARD[col][row];
			if (gridObj.type === "BLACK_CAN_PLACE" || gridObj.type === "WHITE_CAN_PLACE") {
				changeStoneType(gridObj, "EMPTY");
			}
		}
	}

	OTHELLO_BOARD.canPlaceCount = 0;
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
function gameOver(winnerTurn = null) {
	if (winnerTurn === null) {
		// 计算分数
		let scores = calculateScore();
		if (scores.blackScore !== scores.whiteScore) {
			winnerTurn = scores.blackScore <= scores.whiteScore;
		}
	} else {
		// 移除所有可落子位置
		removeAllPredPlacePos();
	}

	if (winnerTurn === null) {
		// 平局
		turnTextEl.innerText = "双方平局";
		turnTextEl.style.color = "#1B1B1B";

		turnIconEl.classList.remove("black");
		turnIconEl.classList.remove("white");
		turnIconEl.classList.add("double");
	} else {
		// 显示游戏结束
		turnTextEl.innerText = `${winnerTurn ? "白方" : "黑方"}获胜`;
		turnTextEl.style.color = winnerTurn ? "gray" : "#1B1B1B";

		turnIconEl.classList.remove(winnerTurn ? "black" : "white");
		turnIconEl.classList.add(winnerTurn ? "white" : "black");
	}
}

window.addEventListener("DOMContentLoaded", () => {
	boardEl = document.getElementById("board");

	blackScoreEl = document.getElementById("black-score");
	whiteScoreEl = document.getElementById("white-score");

	turnBarEl = document.getElementById("turn-bar");
	turnIconEl = document.getElementById("turn-icon");
	turnTextEl = document.getElementById("turn-text");

	settingsFormEl = document.getElementById("settings");
	settingsFormEl.addEventListener("submit", e => {
		e.preventDefault();
		applySettings();
	});
	settingsFormEl.addEventListener("reset", e => {
		e.preventDefault();
		resetSettings();
	});
	initSettings();

	resetBoard();

	startTimerInterval();
});

// 禁用右键菜单
window.addEventListener("contextmenu", e => {
	e.preventDefault();
});