function buy() {
	var p = player[turn];
	var property = square[p.position];
	var cost = property.price;

	if (p.money >= cost) {
		p.pay(cost, 0);

		property.owner = turn;
		updateMoney();
		addAlert(p.name + " đã mua " + property.name + " với giá " + property.pricetext + ".");

		updateOwned();

		$("#landed").hide();

	} else {
		popup("<p>" + p.name + ", bạn cần thêm $" + (property.price - p.money) + " để mua " + property.name + ".</p>");
	}
}
function buyHouse(index) {
	var sq = square[index];
	var p = player[sq.owner];
	var houseSum = 0;
	var hotelSum = 0;

	if (p.money - sq.houseprice < 0) {
		if (sq.house == 4) {
			return false;
		} else {
			return false;
		}

	} else {
		for (var i = 0; i < 40; i++) {
			if (square[i].hotel === 1) {
				hotelSum++;
			} else {
				houseSum += square[i].house;
			}
		}

		if (sq.house < 4) {
			if (houseSum >= 32) {
				return false;

			} else {
				sq.house++;
				addAlert(p.name + " đặt một ngôi nhà trên " + sq.name + ".");
			}

		} else {
			if (hotelSum >= 12) {
				return;

			} else {
				sq.house = 5;
				sq.hotel = 1;
				addAlert(p.name + " đặt một khách sạn trên " + sq.name + ".");
			}
		}

		p.pay(sq.houseprice, 0);

		updateOwned();
		updateMoney();
	}
}
function sellHouse(index) {
	sq = square[index];
	p = player[sq.owner];

	if (sq.hotel === 1) {
		sq.hotel = 0;
		sq.house = 4;
		addAlert(p.name + " bán một ngôi nhà trên " + sq.name + ".");
	} else {
		sq.house--;
		addAlert(p.name + " bán một khách sạn  trên " + sq.name + ".");
	}

	p.money += sq.houseprice * 0.5;
	updateOwned();
	updateMoney();
}
function mortgage(index) {
	var sq = square[index];
	var p = player[sq.owner];

	if (sq.house > 0 || sq.hotel > 0 || sq.mortgage) {
		return false;
	}

	var mortgagePrice = Math.round(sq.price * 0.5);
	var unmortgagePrice = Math.round(sq.price * 0.55);

	sq.mortgage = true;
	p.money += mortgagePrice;

	document.getElementById("mortgagebutton").value = "Chuộc với giá $" + unmortgagePrice;
	document.getElementById("mortgagebutton").title = "Chuộc " + sq.name + " với giá $" + unmortgagePrice + ".";

	addAlert(p.name + " Thế chấp " + sq.name + " với giá $" + mortgagePrice + ".");
	updateOwned();
	updateMoney();

	return true;
}
function unmortgage(index) {
	var sq = square[index];
	var p = player[sq.owner];
	var unmortgagePrice = Math.round(sq.price * 0.55);
	var mortgagePrice = Math.round(sq.price * 0.5);

	if (unmortgagePrice > p.money || !sq.mortgage) {
		return false;
	}

	p.pay(unmortgagePrice, 0);
	sq.mortgage = false;
	document.getElementById("mortgagebutton").value = "Thế chấp với gái $" + mortgagePrice;
	document.getElementById("mortgagebutton").title = "Thế chấp " + sq.name + " với giá $" + mortgagePrice + ".";

	addAlert(p.name + " Chuộc " + sq.name + " với giá $" + unmortgagePrice + ".");
	updateOwned();
	return true;
}
