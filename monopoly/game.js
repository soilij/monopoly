function Game() {
	var die1;
	var die2;
	var areDiceRolled = false;

	var auctionQueue = [];
	var highestbidder;
	var highestbid;
	var currentbidder = 1;
	var auctionproperty;

	this.rollDice = function() {
		die1 = Math.floor(Math.random() * 6) + 1;
		die2 = Math.floor(Math.random() * 6) + 1;
		areDiceRolled = true;
	};

	this.resetDice = function() {
		areDiceRolled = false;
	};

	this.next = function() {
		if (!p.human && p.money < 0) {
			p.AI.payDebt();

			if (p.money < 0) {
				popup("<p>" + p.name + " đã phá sản. Tất cả tài sản của nó sẽ được chuyển giao cho..." + player[p.creditor].name + ".</p>", game.bankruptcy);
			} else {
				roll();
			}
		} else if (areDiceRolled && doublecount === 0) {
			play();
		} else {
			roll();
		}
	};

	this.getDie = function(die) {
		if (die === 1) {

			return die1;
		} else {

			return die2;
		}

	};



	// Auction functions:



	var finalizeAuction = function() {
		var p = player[highestbidder];
		var sq = square[auctionproperty];

		if (highestbid > 0) {
			p.pay(highestbid, 0);
			sq.owner = highestbidder;
			addAlert(p.name + " bought " + sq.name + " for $" + highestbid + ".");
		}

		for (var i = 1; i <= pcount; i++) {
			player[i].bidding = true;
		}

		$("#popupbackground").hide();
		$("#popupwrap").hide();

		if (!game.auction()) {
			play();
		}
	};

	this.addPropertyToAuctionQueue = function(propertyIndex) {
		auctionQueue.push(propertyIndex);
	};

	this.auction = function() {
		if (auctionQueue.length === 0) {
			return false;
		}

		index = auctionQueue.shift();

		var s = square[index];

		if (s.price === 0 || s.owner !== 0) {
			return game.auction();
		}

		auctionproperty = index;
		highestbidder = 0;
		highestbid = 0;
		currentbidder = turn + 1;

		if (currentbidder > pcount) {
			currentbidder -= pcount;
		}

		popup("<div style='font-weight: bold; font-size: 16px; margin-bottom: 10px;'>Auction <span id='propertyname'></span></div><div>Highest Bid = $<span id='highestbid'></span> (<span id='highestbidder'></span>)</div><div><span id='currentbidder'></span>, it is your turn to bid.</div<div><input id='bid' title='Enter an amount to bid on " + s.name + ".' style='width: 291px;' /></div><div><input type='button' value='Bid' onclick='game.auctionBid();' title='Place your bid.' /><input type='button' value='Pass' title='Skip bidding this time.' onclick='game.auctionPass();' /><input type='button' value='Exit Auction' title='Stop bidding on " + s.name + " altogether.' onclick='if (confirm(\"Are you sure you want to stop bidding on this property altogether?\")) game.auctionExit();' /></div>", "blank");

		document.getElementById("propertyname").innerHTML = "<a href='javascript:void(0);' onmouseover='showdeed(" + auctionproperty + ");' onmouseout='hidedeed();' class='statscellcolor'>" + s.name + "</a>";
		document.getElementById("highestbid").innerHTML = "0";
		document.getElementById("highestbidder").innerHTML = "N/A";
		document.getElementById("currentbidder").innerHTML = player[currentbidder].name;
		document.getElementById("bid").onkeydown = function (e) {
			var key = 0;
			var isCtrl = false;
			var isShift = false;

			if (window.event) {
				key = window.event.keyCode;
				isCtrl = window.event.ctrlKey;
				isShift = window.event.shiftKey;
			} else if (e) {
				key = e.keyCode;
				isCtrl = e.ctrlKey;
				isShift = e.shiftKey;
			}

			if (isNaN(key)) {
				return true;
			}

			if (key === 13) {
				game.auctionBid();
				return false;
			}

			// Allow backspace, tab, delete, arrow keys, or if control was pressed, respectively.
			if (key === 8 || key === 9 || key === 46 || (key >= 35 && key <= 40) || isCtrl) {
				return true;
			}

			if (isShift) {
				return false;
			}

			// Only allow number keys.
			return (key >= 48 && key <= 57) || (key >= 96 && key <= 105);
		};

		document.getElementById("bid").onfocus = function () {
			this.style.color = "black";
			if (isNaN(this.value)) {
				this.value = "";
			}
		};

		updateMoney();

		if (!player[currentbidder].human) {
			currentbidder = turn; // auctionPass advances currentbidder.
			this.auctionPass();
		}
		return true;
	};

	this.auctionPass = function() {
		if (highestbidder === 0) {
			highestbidder = currentbidder;
		}

		while (true) {
			currentbidder++;

			if (currentbidder > pcount) {
				currentbidder -= pcount;
			}

			if (currentbidder == highestbidder) {
				finalizeAuction();
				return;
			} else if (player[currentbidder].bidding) {
				var p = player[currentbidder];

				if (!p.human) {
					var bid = p.AI.bid(auctionproperty, highestbid);

					if (bid === -1 || highestbid >= p.money) {
						p.bidding = false;

						window.alert(p.name + " rời khỏi phiên đấu giá.");
						continue;

					} else if (bid === 0) {
						window.alert(p.name + " Bỏ qua.");
						continue;

					} else if (bid > 0) {
						this.auctionBid(bid);
						window.alert(p.name + " Đưa ra giá $" + bid + ".");
						continue;
					}
					return;
				} else {
					break;
				}
			}

		}

		document.getElementById("currentbidder").innerHTML = player[currentbidder].name;
		document.getElementById("bid").value = "";
		document.getElementById("bid").style.color = "black";
	};

	this.auctionBid = function(bid) {
		bid = bid || parseInt(document.getElementById("bid").value, 10);

		if (bid === "" || bid === null) {
			document.getElementById("bid").value = "Hãy đưa ra giá.";
			document.getElementById("bid").style.color = "red";
		} else if (isNaN(bid)) {
			document.getElementById("bid").value = "Giá đấu của bạn phải là một con số.";
			document.getElementById("bid").style.color = "red";
		} else {

			if (bid > player[currentbidder].money) {
				document.getElementById("bid").value = "Bạn không đủ tiền để đấu giá $" + bid + ".";
				document.getElementById("bid").style.color = "red";
			} else if (bid > highestbid) {
				highestbid = bid;
				document.getElementById("highestbid").innerHTML = parseInt(bid, 10);
				highestbidder = currentbidder;
				document.getElementById("highestbidder").innerHTML = player[highestbidder].name;

				document.getElementById("bid").focus();

				if (player[currentbidder].human) {
					this.auctionPass();
				}
			} else {
				document.getElementById("bid").value = "Giá đấu của bạn phải cao hơn giá đấu cao nhất. ($" + highestbid + ")";
				document.getElementById("bid").style.color = "red";
			}
		}
	};

	this.auctionExit = function() {
		player[currentbidder].bidding = false;
		this.auctionPass();
	};



	// Trade functions:



	var currentInitiator;
	var currentRecipient;

	// Define event handlers:

	var tradeMoneyOnKeyDown = function (e) {
		var key = 0;
		var isCtrl = false;
		var isShift = false;

		if (window.event) {
			key = window.event.keyCode;
			isCtrl = window.event.ctrlKey;
			isShift = window.event.shiftKey;
		} else if (e) {
			key = e.keyCode;
			isCtrl = e.ctrlKey;
			isShift = e.shiftKey;
		}

		if (isNaN(key)) {
			return true;
		}

		if (key === 13) {
			return false;
		}

		// Allow backspace, tab, delete, arrow keys, or if control was pressed, respectively.
		if (key === 8 || key === 9 || key === 46 || (key >= 35 && key <= 40) || isCtrl) {
			return true;
		}

		if (isShift) {
			return false;
		}

		// Only allow number keys.
		return (key >= 48 && key <= 57) || (key >= 96 && key <= 105);
	};

	var tradeMoneyOnFocus = function () {
		this.style.color = "black";
		if (isNaN(this.value) || this.value === "0") {
			this.value = "";
		}
	};

	var tradeMoneyOnChange = function(e) {
		$("#proposetradebutton").show();
		$("#canceltradebutton").show();
		$("#accepttradebutton").hide();
		$("#rejecttradebutton").hide();

		var amount = this.value;

		if (isNaN(amount)) {
			this.value = "Giá trị này phải là một con số.";
			this.style.color = "red";
			return false;
		}

		amount = Math.round(amount) || 0;
		this.value = amount;

		if (amount < 0) {
			this.value = "Giá trị này phải lớn hơn 0.";
			this.style.color = "red";
			return false;
		}

		return true;
	};

	document.getElementById("trade-leftp-money").onkeydown = tradeMoneyOnKeyDown;
	document.getElementById("trade-rightp-money").onkeydown = tradeMoneyOnKeyDown;
	document.getElementById("trade-leftp-money").onfocus = tradeMoneyOnFocus;
	document.getElementById("trade-rightp-money").onfocus = tradeMoneyOnFocus;
	document.getElementById("trade-leftp-money").onchange = tradeMoneyOnChange;
	document.getElementById("trade-rightp-money").onchange = tradeMoneyOnChange;

	var resetTrade = function(initiator, recipient, allowRecipientToBeChanged) {
		var currentSquare;
		var currentTableRow;
		var currentTableCell;
		var currentTableCellCheckbox;
		var nameSelect;
		var currentOption;
		var allGroupUninproved;
		var currentName;

		var tableRowOnClick = function(e) {
			var checkboxElement = this.firstChild.firstChild;

			if (checkboxElement !== e.srcElement) {
				checkboxElement.checked = !checkboxElement.checked;
			}

			$("#proposetradebutton").show();
			$("#canceltradebutton").show();
			$("#accepttradebutton").hide();
			$("#rejecttradebutton").hide();
		};

		var initiatorProperty = document.getElementById("trade-leftp-property");
		var recipientProperty = document.getElementById("trade-rightp-property");

		currentInitiator = initiator;
		currentRecipient = recipient;

		// Empty elements.
		while (initiatorProperty.lastChild) {
			initiatorProperty.removeChild(initiatorProperty.lastChild);
		}

		while (recipientProperty.lastChild) {
			recipientProperty.removeChild(recipientProperty.lastChild);
		}

		var initiatorSideTable = document.createElement("table");
		var recipientSideTable = document.createElement("table");


		for (var i = 0; i < 40; i++) {
			currentSquare = square[i];

			// A property cannot be traded if any properties in its group have been improved.
			if (currentSquare.house > 0 || currentSquare.groupNumber === 0) {
				continue;
			}

			allGroupUninproved = true;
			var max = currentSquare.group.length;
			for (var j = 0; j < max; j++) {

				if (square[currentSquare.group[j]].house > 0) {
					allGroupUninproved = false;
					break;
				}
			}

			if (!allGroupUninproved) {
				continue;
			}

			// Offered properties.
			if (currentSquare.owner === initiator.index) {
				currentTableRow = initiatorSideTable.appendChild(document.createElement("tr"));
				currentTableRow.onclick = tableRowOnClick;

				currentTableCell = currentTableRow.appendChild(document.createElement("td"));
				currentTableCell.className = "propertycellcheckbox";
				currentTableCellCheckbox = currentTableCell.appendChild(document.createElement("input"));
				currentTableCellCheckbox.type = "checkbox";
				currentTableCellCheckbox.id = "tradeleftcheckbox" + i;
				currentTableCellCheckbox.title = "Check this box to include " + currentSquare.name + " in the trade.";

				currentTableCell = currentTableRow.appendChild(document.createElement("td"));
				currentTableCell.className = "propertycellcolor";
				currentTableCell.style.backgroundColor = currentSquare.color;

				if (currentSquare.groupNumber == 1 || currentSquare.groupNumber == 2) {
					currentTableCell.style.borderColor = "grey";
				} else {
					currentTableCell.style.borderColor = currentSquare.color;
				}

				currentTableCell.propertyIndex = i;
				currentTableCell.onmouseover = function() {showdeed(this.propertyIndex);};
				currentTableCell.onmouseout = hidedeed;

				currentTableCell = currentTableRow.appendChild(document.createElement("td"));
				currentTableCell.className = "propertycellname";
				if (currentSquare.mortgage) {
					currentTableCell.title = "Mortgaged";
					currentTableCell.style.color = "grey";
				}
				currentTableCell.textContent = currentSquare.name;

			// Requested properties.
			} else if (currentSquare.owner === recipient.index) {
				currentTableRow = recipientSideTable.appendChild(document.createElement("tr"));
				currentTableRow.onclick = tableRowOnClick;

				currentTableCell = currentTableRow.appendChild(document.createElement("td"));
				currentTableCell.className = "propertycellcheckbox";
				currentTableCellCheckbox = currentTableCell.appendChild(document.createElement("input"));
				currentTableCellCheckbox.type = "checkbox";
				currentTableCellCheckbox.id = "traderightcheckbox" + i;
				currentTableCellCheckbox.title = "Check this box to include " + currentSquare.name + " in the trade.";

				currentTableCell = currentTableRow.appendChild(document.createElement("td"));
				currentTableCell.className = "propertycellcolor";
				currentTableCell.style.backgroundColor = currentSquare.color;

				if (currentSquare.groupNumber == 1 || currentSquare.groupNumber == 2) {
					currentTableCell.style.borderColor = "grey";
				} else {
					currentTableCell.style.borderColor = currentSquare.color;
				}

				currentTableCell.propertyIndex = i;
				currentTableCell.onmouseover = function() {showdeed(this.propertyIndex);};
				currentTableCell.onmouseout = hidedeed;

				currentTableCell = currentTableRow.appendChild(document.createElement("td"));
				currentTableCell.className = "propertycellname";
				if (currentSquare.mortgage) {
					currentTableCell.title = "Mortgaged";
					currentTableCell.style.color = "grey";
				}
				currentTableCell.textContent = currentSquare.name;
			}
		}

		if (initiator.communityChestJailCard) {
			currentTableRow = initiatorSideTable.appendChild(document.createElement("tr"));
			currentTableRow.onclick = tableRowOnClick;

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcheckbox";
			currentTableCellCheckbox = currentTableCell.appendChild(document.createElement("input"));
			currentTableCellCheckbox.type = "checkbox";
			currentTableCellCheckbox.id = "tradeleftcheckbox40";
			currentTableCellCheckbox.title = "Hãy đánh dấu vào ô này để bao gồm Thẻ Ra Tù Miễn Phí trong giao dịch.";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcolor";
			currentTableCell.style.backgroundColor = "white";
			currentTableCell.style.borderColor = "grey";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellname";

			currentTableCell.textContent = "Thẻ Ra Tù Miễn Phí.";
		} else if (recipient.communityChestJailCard) {
			currentTableRow = recipientSideTable.appendChild(document.createElement("tr"));
			currentTableRow.onclick = tableRowOnClick;

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcheckbox";
			currentTableCellCheckbox = currentTableCell.appendChild(document.createElement("input"));
			currentTableCellCheckbox.type = "checkbox";
			currentTableCellCheckbox.id = "traderightcheckbox40";
			currentTableCellCheckbox.title = "Hãy đánh dấu vào ô này để bao gồm Thẻ Ra Tù Miễn Phí trong giao dịch.";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcolor";
			currentTableCell.style.backgroundColor = "white";
			currentTableCell.style.borderColor = "grey";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellname";

			currentTableCell.textContent = "Thẻ Ra Tù Miễn Phí.";
		}

		if (initiator.chanceJailCard) {
			currentTableRow = initiatorSideTable.appendChild(document.createElement("tr"));
			currentTableRow.onclick = tableRowOnClick;

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcheckbox";
			currentTableCellCheckbox = currentTableCell.appendChild(document.createElement("input"));
			currentTableCellCheckbox.type = "checkbox";
			currentTableCellCheckbox.id = "tradeleftcheckbox41";
			currentTableCellCheckbox.title = "Hãy đánh dấu vào ô này để bao gồm Thẻ Ra Tù Miễn Phí trong giao dịch.";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcolor";
			currentTableCell.style.backgroundColor = "white";
			currentTableCell.style.borderColor = "grey";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellname";

			currentTableCell.textContent = "Thẻ Ra Tù Miễn Phí.";
		} else if (recipient.chanceJailCard) {
			currentTableRow = recipientSideTable.appendChild(document.createElement("tr"));
			currentTableRow.onclick = tableRowOnClick;

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcheckbox";
			currentTableCellCheckbox = currentTableCell.appendChild(document.createElement("input"));
			currentTableCellCheckbox.type = "checkbox";
			currentTableCellCheckbox.id = "traderightcheckbox41";
			currentTableCellCheckbox.title = "Hãy đánh dấu vào ô này để bao gồm Thẻ Ra Tù Miễn Phí trong giao dịch.";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellcolor";
			currentTableCell.style.backgroundColor = "white";
			currentTableCell.style.borderColor = "grey";

			currentTableCell = currentTableRow.appendChild(document.createElement("td"));
			currentTableCell.className = "propertycellname";

			currentTableCell.textContent = "Thẻ Ra Tù Miễn Phí.";
		}

		if (initiatorSideTable.lastChild) {
			initiatorProperty.appendChild(initiatorSideTable);
		} else {
			initiatorProperty.textContent = initiator.name + " has no properties to trade.";
		}

		if (recipientSideTable.lastChild) {
			recipientProperty.appendChild(recipientSideTable);
		} else {
			recipientProperty.textContent = recipient.name + " has no properties to trade.";
		}

		document.getElementById("trade-leftp-name").textContent = initiator.name;

		currentName = document.getElementById("trade-rightp-name");

		if (allowRecipientToBeChanged && pcount > 2) {
			// Empty element.
			while (currentName.lastChild) {
				currentName.removeChild(currentName.lastChild);
			}

			nameSelect = currentName.appendChild(document.createElement("select"));
			for (var i = 1; i <= pcount; i++) {
				if (i === initiator.index) {
					continue;
				}

				currentOption = nameSelect.appendChild(document.createElement("option"));
				currentOption.value = i + "";
				currentOption.style.color = player[i].color;
				currentOption.textContent = player[i].name;

				if (i === recipient.index) {
					currentOption.selected = "selected";
				}
			}

			nameSelect.onchange = function() {
				resetTrade(currentInitiator, player[parseInt(this.value, 10)], true);
			};

			nameSelect.title = "Hãy chọn người chơi để trao đổi.";
		} else {
			currentName.textContent = recipient.name;
		}

		document.getElementById("trade-leftp-money").value = "0";
		document.getElementById("trade-rightp-money").value = "0";

	};

	var readTrade = function() {
		var initiator = currentInitiator;
		var recipient = currentRecipient;
		var property = new Array(40);
		var money;
		var communityChestJailCard;
		var chanceJailCard;

		for (var i = 0; i < 40; i++) {

			if (document.getElementById("tradeleftcheckbox" + i) && document.getElementById("tradeleftcheckbox" + i).checked) {
				property[i] = 1;
			} else if (document.getElementById("traderightcheckbox" + i) && document.getElementById("traderightcheckbox" + i).checked) {
				property[i] = -1;
			} else {
				property[i] = 0;
			}
		}

		if (document.getElementById("tradeleftcheckbox40") && document.getElementById("tradeleftcheckbox40").checked) {
			communityChestJailCard = 1;
		} else if (document.getElementById("traderightcheckbox40") && document.getElementById("traderightcheckbox40").checked) {
			communityChestJailCard = -1;
		} else {
			communityChestJailCard = 0;
		}

		if (document.getElementById("tradeleftcheckbox41") && document.getElementById("tradeleftcheckbox41").checked) {
			chanceJailCard = 1;
		} else if (document.getElementById("traderightcheckbox41") && document.getElementById("traderightcheckbox41").checked) {
			chanceJailCard = -1;
		} else {
			chanceJailCard = 0;
		}

		money = parseInt(document.getElementById("trade-leftp-money").value, 10) || 0;
		money -= parseInt(document.getElementById("trade-rightp-money").value, 10) || 0;

		var trade = new Trade(initiator, recipient, money, property, communityChestJailCard, chanceJailCard);

		return trade;
	};

	var writeTrade = function(tradeObj) {
		resetTrade(tradeObj.getInitiator(), tradeObj.getRecipient(), false);

		for (var i = 0; i < 40; i++) {

			if (document.getElementById("tradeleftcheckbox" + i)) {
				document.getElementById("tradeleftcheckbox" + i).checked = false;
				if (tradeObj.getProperty(i) === 1) {
					document.getElementById("tradeleftcheckbox" + i).checked = true;
				}
			}

			if (document.getElementById("traderightcheckbox" + i)) {
				document.getElementById("traderightcheckbox" + i).checked = false;
				if (tradeObj.getProperty(i) === -1) {
					document.getElementById("traderightcheckbox" + i).checked = true;
				}
			}
		}

		if (document.getElementById("tradeleftcheckbox40")) {
			if (tradeObj.getCommunityChestJailCard() === 1) {
				document.getElementById("tradeleftcheckbox40").checked = true;
			} else {
				document.getElementById("tradeleftcheckbox40").checked = false;
			}
		}

		if (document.getElementById("traderightcheckbox40")) {
			if (tradeObj.getCommunityChestJailCard() === -1) {
				document.getElementById("traderightcheckbox40").checked = true;
			} else {
				document.getElementById("traderightcheckbox40").checked = false;
			}
		}

		if (document.getElementById("tradeleftcheckbox41")) {
			if (tradeObj.getChanceJailCard() === 1) {
				document.getElementById("tradeleftcheckbox41").checked = true;
			} else {
				document.getElementById("tradeleftcheckbox41").checked = false;
			}
		}

		if (document.getElementById("traderightcheckbox41")) {
			if (tradeObj.getChanceJailCard() === -1) {
				document.getElementById("traderightcheckbox41").checked = true;
			} else {
				document.getElementById("traderightcheckbox41").checked = false;
			}
		}

		if (tradeObj.getMoney() > 0) {
			document.getElementById("trade-leftp-money").value = tradeObj.getMoney() + "";
		} else {
			document.getElementById("trade-rightp-money").value = (-tradeObj.getMoney()) + "";
		}

	};

	this.trade = function(tradeObj) {
		$("#board").hide();
		$("#control").hide();
		$("#trade").show();
		$("#proposetradebutton").show();
		$("#canceltradebutton").show();
		$("#accepttradebutton").hide();
		$("#rejecttradebutton").hide();

		if (tradeObj instanceof Trade) {
			writeTrade(tradeObj);
			this.proposeTrade();
		} else {
			var initiator = player[turn];
			var recipient = turn === 1 ? player[2] : player[1];

			currentInitiator = initiator;
			currentRecipient = recipient;

			resetTrade(initiator, recipient, true);
		}
	};


	this.cancelTrade = function() {
		$("#board").show();
		$("#control").show();
		$("#trade").hide();


		if (!player[turn].human) {
			player[turn].AI.alertList = "";
			game.next();
		}

	};

	this.acceptTrade = function(tradeObj) {
		if (isNaN(document.getElementById("trade-leftp-money").value)) {
			document.getElementById("trade-leftp-money").value = "Giá trị này phải là một con số.";
			document.getElementById("trade-leftp-money").style.color = "red";
			return false;
		}

		if (isNaN(document.getElementById("trade-rightp-money").value)) {
			document.getElementById("trade-rightp-money").value = "Giá trị này phải là một con số.";
			document.getElementById("trade-rightp-money").style.color = "red";
			return false;
		}

		var showAlerts = true;
		var money;
		var initiator;
		var recipient;

		if (tradeObj) {
			showAlerts = false;
		} else {
			tradeObj = readTrade();
		}

		money = tradeObj.getMoney();
		initiator = tradeObj.getInitiator();
		recipient = tradeObj.getRecipient();


		if (money > 0 && money > initiator.money) {
			document.getElementById("trade-leftp-money").value = initiator.name + " không $" + money + ".";
			document.getElementById("trade-leftp-money").style.color = "red";
			return false;
		} else if (money < 0 && -money > recipient.money) {
			document.getElementById("trade-rightp-money").value = recipient.name + " không $" + (-money) + ".";
			document.getElementById("trade-rightp-money").style.color = "red";
			return false;
		}

		var isAPropertySelected = 0;

		// Ensure that some properties are selected.
		for (var i = 0; i < 40; i++) {
			isAPropertySelected |= tradeObj.getProperty(i);
		}

		isAPropertySelected |= tradeObj.getCommunityChestJailCard();
		isAPropertySelected |= tradeObj.getChanceJailCard();

		if (isAPropertySelected === 0) {
			popup("<p>Phải chọn một hoặc nhiều bất động sản để thực hiện giao dịch.</p>");

			return false;
		}

		if (showAlerts && !confirm(initiator.name + ", bạn có chắc chắn muốn thực hiện giao dịch này với " + recipient.name + "?")) {
			return false;
		}

		// Exchange properties
		for (var i = 0; i < 40; i++) {

			if (tradeObj.getProperty(i) === 1) {
				square[i].owner = recipient.index;
				addAlert(recipient.name + " received " + square[i].name + " from " + initiator.name + ".");
			} else if (tradeObj.getProperty(i) === -1) {
				square[i].owner = initiator.index;
				addAlert(initiator.name + " received " + square[i].name + " from " + recipient.name + ".");
			}

		}

		if (tradeObj.getCommunityChestJailCard() === 1) {
			initiator.communityChestJailCard = false;
			recipient.communityChestJailCard = true;
			addAlert(recipient.name + ' đã nhận một thẻ "Ra Tù Miễn Phí" từ: ' + initiator.name + ".");
		} else if (tradeObj.getCommunityChestJailCard() === -1) {
			initiator.communityChestJailCard = true;
			recipient.communityChestJailCard = false;
			addAlert(initiator.name + ' đã nhận một thẻ "Ra Tù Miễn Phí" từ: ' + recipient.name + ".");
		}

		if (tradeObj.getChanceJailCard() === 1) {
			initiator.chanceJailCard = false;
			recipient.chanceJailCard = true;
			addAlert(recipient.name + ' đã nhận một thẻ "Ra Tù Miễn Phí" từ: ' + initiator.name + ".");
		} else if (tradeObj.getChanceJailCard() === -1) {
			initiator.chanceJailCard = true;
			recipient.chanceJailCard = false;
			addAlert(initiator.name + ' đã nhận một thẻ "Ra Tù Miễn Phí" từ: ' + recipient.name + ".");
		}

		// Exchange money.
		if (money > 0) {
			initiator.pay(money, recipient.index);
			recipient.money += money;

			addAlert(recipient.name + " đã nhận $" + money + " từ " + initiator.name + ".");
		} else if (money < 0) {
			money = -money;

			recipient.pay(money, initiator.index);
			initiator.money += money;

			addAlert(initiator.name + " đã nhận $" + money + " từ " + recipient.name + ".");
		}

		updateOwned();
		updateMoney();

		$("#board").show();
		$("#control").show();
		$("#trade").hide();

		if (!player[turn].human) {
			player[turn].AI.alertList = "";
			game.next();
		}
	};

	this.proposeTrade = function() {
		if (isNaN(document.getElementById("trade-leftp-money").value)) {
			document.getElementById("trade-leftp-money").value = "Giá trị này phải là một con số.";
			document.getElementById("trade-leftp-money").style.color = "red";
			return false;
		}

		if (isNaN(document.getElementById("trade-rightp-money").value)) {
			document.getElementById("trade-rightp-money").value = "Giá trị này phải là một con số.";
			document.getElementById("trade-rightp-money").style.color = "red";
			return false;
		}

		var tradeObj = readTrade();
		var money = tradeObj.getMoney();
		var initiator = tradeObj.getInitiator();
		var recipient = tradeObj.getRecipient();
		var reversedTradeProperty = [];

		if (money > 0 && money > initiator.money) {
			document.getElementById("trade-leftp-money").value = initiator.name + " không $" + money + ".";
			document.getElementById("trade-leftp-money").style.color = "red";
			return false;
		} else if (money < 0 && -money > recipient.money) {
			document.getElementById("trade-rightp-money").value = recipient.name + " không $" + (-money) + ".";
			document.getElementById("trade-rightp-money").style.color = "red";
			return false;
		}

		var isAPropertySelected = 0;

		// Ensure that some properties are selected.
		for (var i = 0; i < 40; i++) {
			reversedTradeProperty[i] = -tradeObj.getProperty(i);
			isAPropertySelected |= tradeObj.getProperty(i);
		}

		isAPropertySelected |= tradeObj.getCommunityChestJailCard();
		isAPropertySelected |= tradeObj.getChanceJailCard();

		if (isAPropertySelected === 0) {
			popup("<p>Phải chọn một hoặc nhiều bất động sản để thực hiện giao dịch.</p>");

			return false;
		}

		if (initiator.human && !confirm(initiator.name + ", bạn có chắc chắn muốn thực hiện giao dịch này với " + recipient.name + "?")) {
			return false;
		}

		var reversedTrade = new Trade(recipient, initiator, -money, reversedTradeProperty, -tradeObj.getCommunityChestJailCard(), -tradeObj.getChanceJailCard());

		if (recipient.human) {

			writeTrade(reversedTrade);

			$("#proposetradebutton").hide();
			$("#canceltradebutton").hide();
			$("#accepttradebutton").show();
			$("#rejecttradebutton").show();

			addAlert(initiator.name + " bắt đầu một giao dịch với " + recipient.name + ".");
			popup("<p>" + initiator.name + " đã đề xuất một giao dịch với bạn, " + recipient.name + ". Bạn có thể chấp nhận, từ chối hoặc chỉnh sửa đề nghị.</p>");
		} else {
			var tradeResponse = recipient.AI.acceptTrade(tradeObj);

			if (tradeResponse === true) {
				popup("<p>" + recipient.name + " đã chấp nhận giao dịch.</p>");
				this.acceptTrade(reversedTrade);
			} else if (tradeResponse === false) {
				popup("<p>" + recipient.name + " đã từ chối giao dịch.</p>");
				return;
			} else if (tradeResponse instanceof Trade) {
				popup("<p>" + recipient.name + " đã đề xuất một đề nghị phản hồi.</p>");
				writeTrade(tradeResponse);

				$("#proposetradebutton, #canceltradebutton").hide();
				$("#accepttradebutton").show();
				$("#rejecttradebutton").show();
			}
		}
	};



	// Bankrupcy functions:




	this.eliminatePlayer = function() {
		var p = player[turn];

		for (var i = p.index; i < pcount; i++) {
			player[i] = player[i + 1];
			player[i].index = i;

		}

		for (var i = 0; i < 40; i++) {
			if (square[i].owner >= p.index) {
				square[i].owner--;
			}
		}

		pcount--;
		turn--;

		if (pcount === 2) {
			document.getElementById("stats").style.width = "454px";
		} else if (pcount === 3) {
			document.getElementById("stats").style.width = "686px";
		}

		if (pcount === 1) {
			updateMoney();
			$("#control").hide();
			$("#board").hide();
			$("#refresh").show();
			popup("<p>Chúc mừng, " + player[1].name + ", đã chiến thắng.</p><div>");

		} else {
			play();
		}
	};

	this.bankruptcyUnmortgage = function() {
		var p = player[turn];

		if (p.creditor === 0) {
			game.eliminatePlayer();
			return;
		}

		var HTML = "<p>" + player[p.creditor].name + ", Bạn có thể chuộc bất kỳ bất động sản nào dưới đây, không tính lãi suất, bằng cách nhấp vào chúng. Nhấn OK khi hoàn tất.</p><table>";
		var price;

		for (var i = 0; i < 40; i++) {
			sq = square[i];
			if (sq.owner == p.index && sq.mortgage) {
				price = Math.round(sq.price * 0.5);

				HTML += "<tr><td class='propertycellcolor' style='background: " + sq.color + ";";

				if (sq.groupNumber == 1 || sq.groupNumber == 2) {
					HTML += " border: 1px solid grey;";
				} else {
					HTML += " border: 1px solid " + sq.color + ";";
				}

				// Player already paid interest, so they can unmortgage for the mortgage price.
				HTML += "' onmouseover='showdeed(" + i + ");' onmouseout='hidedeed();'></td><td class='propertycellname'><a href='javascript:void(0);' title='Unmortgage " + sq.name + " for $" + price + ".' onclick='if (" + price + " <= player[" + p.creditor + "].money) {player[" + p.creditor + "].pay(" + price + ", 0); square[" + i + "].mortgage = false; addAlert(\"" + player[p.creditor].name + " unmortgaged " + sq.name + " for $" + price + ".\");} this.parentElement.parentElement.style.display = \"none\";'>Unmortgage " + sq.name + " ($" + price + ")</a></td></tr>";

				sq.owner = p.creditor;

			}
		}

		HTML += "</table>";

		popup(HTML, game.eliminatePlayer);
	};

	this.resign = function() {
		popup("<p>Bạn có chấp nhận thế chấp tài sản?</p>", game.bankruptcy, "Yes/No");
	};

	this.bankruptcy = function() {
		var p = player[turn];
		var pcredit = player[p.creditor];
		var bankruptcyUnmortgageFee = 0;


		if (p.money >= 0) {
			return;
		}

		addAlert(p.name + " đã phá sản.");

		if (p.creditor !== 0) {
			pcredit.money += p.money;
		}

		for (var i = 0; i < 40; i++) {
			sq = square[i];
			if (sq.owner == p.index) {
				// Mortgaged properties will be tranfered by bankruptcyUnmortgage();
				if (!sq.mortgage) {
					sq.owner = p.creditor;
				} else {
					bankruptcyUnmortgageFee += Math.round(sq.price * 0.1);
				}

				if (sq.house > 0) {
					if (p.creditor !== 0) {
						pcredit.money += sq.houseprice * 0.5 * sq.house;
					}
					sq.hotel = 0;
					sq.house = 0;
				}

				if (p.creditor === 0) {
					sq.mortgage = false;
					game.addPropertyToAuctionQueue(i);
					sq.owner = 0;
				}
			}
		}

		updateMoney();

		if (p.chanceJailCard) {
			p.chanceJailCard = false;
			pcredit.chanceJailCard = true;
		}

		if (p.communityChestJailCard) {
			p.communityChestJailCard = false;
			pcredit.communityChestJailCard = true;
		}

		if (pcount === 2 || bankruptcyUnmortgageFee === 0 || p.creditor === 0) {
			game.eliminatePlayer();
		} else {
			addAlert(pcredit.name + " đã thanh toán $" + bankruptcyUnmortgageFee + " lãi suất trên các bất động sản đã thế chấp nhận từ " + p.name + ".");
			popup("<p>" + pcredit.name + ", bạn phải thanh toán $" + bankruptcyUnmortgageFee + " lãi suất trên các bất động sản bạn đã nhận từ " + p.name + ".</p>", function() {player[pcredit.index].pay(bankruptcyUnmortgageFee, 0); game.bankruptcyUnmortgage();});
		}
	};

}

var game;