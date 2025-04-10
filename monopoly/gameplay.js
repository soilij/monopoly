function play() {
	if (game.auction()) {
		return;
	}

	turn++;
	if (turn > pcount) {
		turn -= pcount;
	}

	var p = player[turn];
	game.resetDice();

	document.getElementById("pname").innerHTML = p.name;

	addAlert("It is " + p.name + "'s turn.");

	// Check for bankruptcy.
	p.pay(0, p.creditor);

	$("#landed, #option, #manage").hide();
	$("#board, #control, #moneybar, #viewstats, #buy").show();

	doublecount = 0;
	if (p.human) {
		document.getElementById("nextbutton").focus();
	}
	document.getElementById("nextbutton").value = "Tung xúc xắc.";
	document.getElementById("nextbutton").title = "Tung xúc xắc và di chuyển quân của bạn theo đó.";

	$("#die0").hide();
	$("#die1").hide();

	if (p.jail) {
		$("#landed").show();
		document.getElementById("landed").innerHTML = "Bạn đang trong tù.<input type='button' title='Trả 50$ để được ra khỏi tù ngay lập tức.' value='Thanh toán 50$' onclick='payfifty();' />";

		if (p.communityChestJailCard || p.chanceJailCard) {
			document.getElementById("landed").innerHTML += "<input type='button' id='gojfbutton' title='Use &quot;Get Out of Jail Free&quot; card.' onclick='useJailCard();' value='Sử dụng thẻ' />";
		}

		document.getElementById("nextbutton").title = "Roll the dice. If you throw doubles, you will get out of jail.";

		if (p.jailroll === 0)
			addAlert("Đây là lượt đầu tiên trong tù của " + p.name + ".");
		else if (p.jailroll === 1)
			addAlert("Đây là lượt thứ hai trong tù của " + p.name + ".");
		else if (p.jailroll === 2) {
			document.getElementById("landed").innerHTML += "<div>GHI CHÚ: Nếu bạn không tung đôi sau lần tung này, bạn <i>phải</i> Đóng $50.</div>";
			addAlert("Đây là lượt thứ ba trong tù của " + p.name + ".");
		}

		if (!p.human && p.AI.postBail()) {
			if (p.communityChestJailCard || p.chanceJailCard) {
				useJailCard();
			} else {
				payfifty();
			}
		}
	}

	updateMoney();
	updatePosition();
	updateOwned();

	$(".money-bar-arrow").hide();
	$("#p" + turn + "arrow").show();

	if (!p.human) {
		if (!p.AI.beforeTurn()) {
			game.next();
		}
	}
}
function roll() {
	var p = player[turn];

	$("#option").hide();
	$("#buy").show();
	$("#manage").hide();

	if (p.human) {
		document.getElementById("nextbutton").focus();
	}
	document.getElementById("nextbutton").value = "Kết thúc lượt";
	document.getElementById("nextbutton").title = "Kết thúc lượt và chuyển sang người chơi tiếp theo.";

	game.rollDice();
	var die1 = game.getDie(1);
	var die2 = game.getDie(2);

	doublecount++;

	if (die1 == die2) {
		addAlert(p.name + " đã tung " + (die1 + die2) + " - đôi.");
	} else {
		addAlert(p.name + " đã tung " + (die1 + die2) + ".");
	}

	if (die1 == die2 && !p.jail) {
		updateDice(die1, die2);

		if (doublecount < 3) {
			document.getElementById("nextbutton").value = "Tung lại";
			document.getElementById("nextbutton").title = "Bạn đã tung đôi. Tung lại.";

		// If player rolls doubles three times in a row, send him to jail
		} else if (doublecount === 3) {
			p.jail = true;
			doublecount = 0;
			addAlert(p.name + " tung đôi ba lần liên tiếp.");
			updateMoney();


			if (p.human) {
				popup("Bạn tung đôi ba lần liên tiếp.Đi vào tù.", gotojail);
			} else {
				gotojail();
			}

			return;
		}
	} else {
		document.getElementById("nextbutton").value = "Kết thúc lượt";
		document.getElementById("nextbutton").title = "Kết thúc lượt và chuyển sang người chơi tiếp theo.";
		doublecount = 0;
	}

	updatePosition();
	updateMoney();
	updateOwned();

	if (p.jail === true) {
		p.jailroll++;

		updateDice(die1, die2);
		if (die1 == die2) {
			document.getElementById("jail").style.border = "1px solid black";
			document.getElementById("cell11").style.border = "2px solid " + p.color;
			$("#landed").hide();

			p.jail = false;
			p.jailroll = 0;
			p.position = 10 + die1 + die2;
			doublecount = 0;

			addAlert(p.name + " tung đôi để ra khỏi tù.");

			land();
		} else {
			if (p.jailroll === 3) {

				if (p.human) {
					popup("<p>Bạn phải trả $50 để được ra tù.</p>", function() {
						payfifty();
						player[turn].position=10 + die1 + die2;
						land();
					});
				} else {
					payfifty();
					p.position = 10 + die1 + die2;
					land();
				}
			} else {
				$("#landed").show();
				document.getElementById("landed").innerHTML = "Bạn đang trong tù.";

				if (!p.human) {
					popup(p.AI.alertList, game.next);
					p.AI.alertList = "";
				}
			}
		}


	} else {
		updateDice(die1, die2);

		// Move player
		p.position += die1 + die2;

		// Collect $200 salary as you pass GO
		if (p.position >= 40) {
			p.position -= 40;
			p.money += 200;
			addAlert(p.name + " Nhận 200$ khi đi ngang ô Khời hành.");
		}

		land();
	}
}

function land(increasedRent) {
	increasedRent = !!increasedRent; // Cast increasedRent to a boolean value. It is used for the ADVANCE TO THE NEAREST RAILROAD/UTILITY Chance cards.

	var p = player[turn];
	var s = square[p.position];

	var die1 = game.getDie(1);
	var die2 = game.getDie(2);

	$("#landed").show();
	document.getElementById("landed").innerHTML = "Bạn đã tới " + s.name + ".";
	s.landcount++;
	addAlert(p.name + " đã tới " + s.name + ".");

	// Allow player to buy the property on which he landed.
	if (s.price !== 0 && s.owner === 0) {

		if (!p.human) {

			if (p.AI.buyProperty(p.position)) {
				buy();
			}
		} else {
			document.getElementById("landed").innerHTML = "<div>Bạn đã tới <a href='javascript:void(0);' onmouseover='showdeed(" + p.position + ");' onmouseout='hidedeed();' class='statscellcolor'>" + s.name + "</a>.<input type='button' onclick='buy();' value='Buy ($" + s.price + ")' title='Buy " + s.name + " for " + s.pricetext + ".'/></div>";
		}


		game.addPropertyToAuctionQueue(p.position);
	}

	// Collect rent
	if (s.owner !== 0 && s.owner != turn && !s.mortgage) {
		var groupowned = true;
		var rent;

		// Railroads
		if (p.position == 5 || p.position == 15 || p.position == 25 || p.position == 35) {
			if (increasedRent) {
				rent = 25;
			} else {
				rent = 12.5;
			}

			if (s.owner == square[5].owner) {
				rent *= 2;
			}
			if (s.owner == square[15].owner) {
				rent *= 2;
			}
			if (s.owner == square[25].owner) {
				rent *= 2;
			}
			if (s.owner == square[35].owner) {
				rent *= 2;
			}

		} else if (p.position === 12) {
			if (increasedRent || square[28].owner == s.owner) {
				rent = (die1 + die2) * 10;
			} else {
				rent = (die1 + die2) * 4;
			}

		} else if (p.position === 28) {
			if (increasedRent || square[12].owner == s.owner) {
				rent = (die1 + die2) * 10;
			} else {
				rent = (die1 + die2) * 4;
			}

		} else {

			for (var i = 0; i < 40; i++) {
				sq = square[i];
				if (sq.groupNumber == s.groupNumber && sq.owner != s.owner) {
					groupowned = false;
				}
			}

			if (!groupowned) {
				rent = s.baserent;
			} else {
				if (s.house === 0) {
					rent = s.baserent * 2;
				} else {
					rent = s["rent" + s.house];
				}
			}
		}

		addAlert(p.name + " đã thanh toán $" + rent + " tiền cho thuê " + player[s.owner].name + ".");
		p.pay(rent, s.owner);
		player[s.owner].money += rent;

		document.getElementById("landed").innerHTML = "Bạn đã tới " + s.name + ". " + player[s.owner].name + " thu được $" + rent + " tiền thuê.";
	} else if (s.owner > 0 && s.owner != turn && s.mortgage) {
		document.getElementById("landed").innerHTML = "Bạn đã tới " + s.name + ". Bất động sản đã được thế chấp; không có tiền thuê nào được thu.";
	}

	// City Tax
	if (p.position === 4) {
		citytax();
	}

	// Go to jail. Go directly to Jail. Do not pass GO. Do not collect $200.
	if (p.position === 30) {
		updateMoney();
		updatePosition();

		if (p.human) {
			popup("<div>Đi vào tù. Đi thẳng vào tù. Không đi qua ô Khởi hành. Không nhận $200.</div>", gotojail);
		} else {
			gotojail();
		}

		return;
	}

	// Luxury Tax
	if (p.position === 38) {
		luxurytax();
	}

	updateMoney();
	updatePosition();
	updateOwned();

	if (!p.human) {
		popup(p.AI.alertList, chanceCommunityChest);
		p.AI.alertList = "";
	} else {
		chanceCommunityChest();
	}
}
