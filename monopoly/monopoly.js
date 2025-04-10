
function updateOption() {
	$("#option").show();

	var allGroupUninproved = true;
	var allGroupUnmortgaged = true;
	var checkedproperty = getCheckedProperty();

	if (checkedproperty < 0 || checkedproperty >= 40) {
		$("#buyhousebutton").hide();
		$("#sellhousebutton").hide();
		$("#mortgagebutton").hide();


		var housesum = 32;
		var hotelsum = 12;

		for (var i = 0; i < 40; i++) {
			s = square[i];
			if (s.hotel == 1)
				hotelsum--;
			else
				housesum -= s.house;
		}

		$("#buildings").show();
		document.getElementById("buildings").innerHTML = "<img src='images/house.png' alt='' title='House' class='house' />:&nbsp;" + housesum + "&nbsp;&nbsp;<img src='images/hotel.png' alt='' title='Hotel' class='hotel' />:&nbsp;" + hotelsum;

		return;
	}

	$("#buildings").hide();
	var sq = square[checkedproperty];

	buyhousebutton = document.getElementById("buyhousebutton");
	sellhousebutton = document.getElementById("sellhousebutton");

	$("#mortgagebutton").show();
	document.getElementById("mortgagebutton").disabled = false;

	if (sq.mortgage) {
		document.getElementById("mortgagebutton").value = "Chuộc ($" + Math.round(sq.price * 0.55) + ")";
		document.getElementById("mortgagebutton").title = "Chuộc " + sq.name + " for $" + Math.round(sq.price * 0.55) + ".";
		$("#buyhousebutton").hide();
		$("#sellhousebutton").hide();

		allGroupUnmortgaged = false;
	} else {
		document.getElementById("mortgagebutton").value = "Thế chấp ($" + (sq.price * 0.5) + ")";
		document.getElementById("mortgagebutton").title = "Thế chấp " + sq.name + " for $" + (sq.price * 0.5) + ".";

		if (sq.groupNumber >= 3) {
			$("#buyhousebutton").show();
			$("#sellhousebutton").show();
			buyhousebutton.disabled = false;
			sellhousebutton.disabled = false;

			buyhousebutton.value = "Mua nhà ($" + sq.houseprice + ")";
			sellhousebutton.value = "Bán nhà ($" + (sq.houseprice * 0.5) + ")";
			buyhousebutton.title = "Mua một ngôi nhà với giá $" + sq.houseprice;
			sellhousebutton.title = "Bán một ngôi nhà với giá $" + (sq.houseprice * 0.5);

			if (sq.house == 4) {
				buyhousebutton.value = "Mua khách sạn ($" + sq.houseprice + ")";
				buyhousebutton.title = "Mua một khách sạn với giá $" + sq.houseprice;
			}
			if (sq.hotel == 1) {
				$("#buyhousebutton").hide();
				sellhousebutton.value = "Bán khách sạn ($" + (sq.houseprice * 0.5) + ")";
				sellhousebutton.title = "BÁn một khách sạn với giá $" + (sq.houseprice * 0.5);
			}

			var maxhouse = 0;
			var minhouse = 5;

			for (var j = 0; j < max; j++) {

				if (square[currentSquare.group[j]].house > 0) {
					allGroupUninproved = false;
					break;
				}
			}

			var max = sq.group.length;
			for (var i = 0; i < max; i++) {
				s = square[sq.group[i]];

				if (s.owner !== sq.owner) {
					buyhousebutton.disabled = true;
					sellhousebutton.disabled = true;
					buyhousebutton.title = "Trước khi bạn có thể mua một ngôi nhà, bạn phải sở hữu tất cả các bất động sản cùng nhóm.";
				} else {

					if (s.house > maxhouse) {
						maxhouse = s.house;
					}

					if (s.house < minhouse) {
						minhouse = s.house;
					}

					if (s.house > 0) {
						allGroupUninproved = false;
					}

					if (s.mortgage) {
						allGroupUnmortgaged = false;
					}
				}
			}

			if (!allGroupUnmortgaged) {
				buyhousebutton.disabled = true;
				buyhousebutton.title = "Trước khi bạn có thể mua một ngôi nhà, bạn phải sở hữu tất cả các bất động sản cùng nhóm.";
			}

			// Force even building
			if (sq.house > minhouse) {
				buyhousebutton.disabled = true;

				if (sq.house == 1) {
					buyhousebutton.title = "Trước khi bạn có thể mua thêm một ngôi nhà, các bất động sản còn lại trong nhóm này phải đều có một ngôi nhà.";
				} else if (sq.house == 4) {
					buyhousebutton.title = "Trước khi bạn có thể mua một khách sạn, các bất động sản còn lại trong nhóm này phải đều có 4 ngôi nhà.";
				} else {
					buyhousebutton.title = "Trước khi bạn có thể mua một ngôi nhà, các bất động sản còn lại trong nhóm này phải đều có " + sq.house + " nhà.";
				}
			}
			if (sq.house < maxhouse) {
				sellhousebutton.disabled = true;

				if (sq.house == 1) {
					sellhousebutton.title = "Trước khi bạn có thể bán một ngôi nhà, các bất động sản còn lại trong nhóm này phải đều có một ngôi nhà.";
				} else {
					sellhousebutton.title = "Trước khi bạn có thể bán một ngôi nhà, các bất động sản còn lại trong nhóm này phải đều có " + sq.house + " nhà.";
				}
			}

			if (sq.house === 0 && sq.hotel === 0) {
				$("#sellhousebutton").hide();

			} else {
				$("#mortgagebutton").hide();

			}

			// Before a property can be mortgaged or sold, all the properties of its color-group must unimproved.
			if (!allGroupUninproved) {
				document.getElementById("mortgagebutton").title = "Trước khi một bất động sản có thể được thế chấp, tất cả các bất động sản trong nhóm của nó phải chưa được cải tạo.";
				document.getElementById("mortgagebutton").disabled = true;
			}

		} else {
			$("#buyhousebutton").hide();
			$("#sellhousebutton").hide();
		}
	}
}


function streetrepairs(houseprice, hotelprice) {
	var cost = 0;
	for (var i = 0; i < 40; i++) {
		var s = square[i];
		if (s.owner == turn) {
			if (s.hotel == 1)
				cost += hotelprice;
			else
				cost += s.house * houseprice;
		}
	}

	var p = player[turn];

	if (cost > 0) {
		p.pay(cost, 0);

		// If function was called by Community Chest.
		if (houseprice === 40) {
			addAlert(p.name + " mất $" + cost + " cho Khí vận.");
		} else {
			addAlert(p.name + " mất $" + cost + " cho Cơ hội.");
		}
	}

}




















