function gotojail() {
	var p = player[turn];
	addAlert(p.name + " đã bị đưa thẳng vào tù.");
	document.getElementById("landed").innerHTML = "Bạn đang trong tù.";

	p.jail = true;
	doublecount = 0;

	document.getElementById("nextbutton").value = "Kết thúc lượt.";
	document.getElementById("nextbutton").title = "Kết thúc lượt và chuyển sang người chơi tiếp theo.";

	if (p.human) {
		document.getElementById("nextbutton").focus();
	}

	updatePosition();
	updateOwned();

	if (!p.human) {
		popup(p.AI.alertList, game.next);
		p.AI.alertList = "";
	}
}

function useJailCard() {
	var p = player[turn];

	document.getElementById("jail").style.border = '1px solid black';
	document.getElementById("cell11").style.border = '2px solid ' + p.color;

	$("#landed").hide();
	p.jail = false;
	p.jailroll = 0;

	p.position = 10;

	doublecount = 0;

	if (p.communityChestJailCard) {
		p.communityChestJailCard = false;

		// Insert the get out of jail free card back into the community chest deck.
		communityChestCards.deck.splice(communityChestCards.index, 0, 0);

		communityChestCards.index++;

		if (communityChestCards.index >= communityChestCards.deck.length) {
			communityChestCards.index = 0;
		}
	} else if (p.chanceJailCard) {
		p.chanceJailCard = false;

		// Insert the get out of jail free card back into the chance deck.
		chanceCards.deck.splice(chanceCards.index, 0, 0);

		chanceCards.index++;

		if (chanceCards.index >= chanceCards.deck.length) {
			chanceCards.index = 0;
		}
	}

	addAlert(p.name + " sử dụng thẻ \"Tự do ra tù\".");
	updateOwned();
	updatePosition();
}