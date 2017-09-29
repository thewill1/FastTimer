$(document).ready(function () {
    chrome.storage.sync.get("empId", function (response) {
        $("#empId").val(response.empId);
        $("#submitEmpId").click();
    });
	
	timeLogger.initializeDatePicker();
    timeLogger.initializeSubmitDataClick();
	timeLogger.initializeTotalTimeCalculationOfWeek();
});

var timeLogger = {
	initializeDatePicker : function() {
		var $datepicker = $('.datepicker').pickadate({
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year,
        today: 'Today',
        clear: 'Clear',
        close: 'Ok',
        closeOnSelect: true,
        format: 'mm-dd-yyyy'// Close upon selecting a date,
		});
		
		var picker = $datepicker.pickadate('picker');
		
		picker.set('select', new Date());
	},
	
	initializeSubmitDataClick : function() {
		$("#submitEmpId").click(function (event) {
			var $employeeIdForm = $("#empForm");
			var fields = {};
			$employeeIdForm.find(":input").each(function () {
            fields[this.name] = $(this).val();
			});
			
			var input = {fields: fields};
			
			chrome.runtime.sendMessage(input, function (response) {
				var totalTimeLoggedInADay = timeLogger.calculateTimeLogAndSetTableData(response);
				$("#chipDiv").hide();
				
				if (totalTimeLoggedInADay != null && totalTimeLoggedInADay != 0) {
					timeLogger.setCalculatedTotalTimeToPage(totalTimeLoggedInADay);
				} else {
					$("#swipeTable").hide();
				}
			});

			event.preventDefault();
		});
	},
	
	initializeTotalTimeCalculationOfWeek : function() {
		var $today = new Date();
		var calculateWeekDay = $today.getDay();
		var totalLogTimeInWeek = 0;
		var counterToDecrementDate = 0;
		var todayLoggedTime = 0;
		var validNoOfDays = 5;
		
		if (calculateWeekDay === 6 || calculateWeekDay === 0) {
			$("#chipDivWeekend").show();
		} else {
			for (var i = calculateWeekDay; i > 0; i--) {
				var dateToLog = $today.getDate() - counterToDecrementDate;
							var $employeeIdForm = $("#empForm");
							var fields = {};
							$employeeIdForm.find(":input").each(function () {
            							fields[this.name] = $(this).val();
					});
				
				var input = {fields: fields};
				
				chrome.runtime.sendMessage(input, function (response) {
					var totalTimeLoggedInPassedDate = timeLogger.calculateTimeLogAndSetTableData(response);
					totalLogTimeInWeek = totalLogTimeInWeek + totalTimeLoggedInPassedDate;
					
					if (counterToDecrementDate === 0) {
						todayLoggedTime = totalTimeLoggedInPassedDate;
						timeLogger.setCalculatedTotalTimeToPage(totalTimeLoggedInPassedDate);
					}
				
					if (totalTimeLoggedInPassedDate == null || totalTimeLoggedInPassedDate == undefined || totalTimeLoggedInPassedDate == 0) {
						validNoOfDays--;
					}
					
				});
				
				counterToDecrementDate++;
			}
			
			if (calculateWeekDay === 5) {
				showHoursRemainingToClock40(validNoOfDays, totalLogTimeInWeek, todayLoggedTime);
			}
		
		}
	},
	
	showHoursRemainingToClock40 : function (validNoOfDays, totalLogTimeInWeekDone, todayLoggedTime) {
		var totalHoursCompulsoryToClock = validNoOfDays * 8;
		var totalMinutesCompulsoryToClock = totalHoursCompulsoryToClock * 60;
		var remainingMinutesCompulsoryToClock = totalMinutesCompulsoryToClock - totalLogTimeInWeekDone;
		
		if (remainingMinutesCompulsoryToClock > 0) {
			timeLogger.setCalculatedTotalTimeReamainingToPage(remainingMinutesCompulsoryToClock);
		} else {
			if (todayLoggedTime < 330) {
				$("#chipDivCompleteMinHours").show();
			}
		}
	},
	
	calculateTimeLogAndSetTableData : function(response) {
		var result = JSON.parse(response.d);
		$("#timeLogTable").html("");
		var lastIn = null;
		var totalMinutes = 0;
		var resultList = result.SwipeRecord;
	
		$.each(resultList, function () {
			var armyTime = moment(this.swipeTime, ["h:mm A"]).format("HH:mm");
			var logDate = $("#dateForLog").val() + " " + armyTime + ":00";
			
			if (lastIn == null && this.swipeInOut == "In") {
				lastIn = logDate;
			}
			
			if (this.swipeInOut == "Out" && lastIn != null) {
				var output = moment.utc(moment(logDate, "MM-DD-YYYY HH:mm:ss").diff(moment(lastIn, "MM-DD-YYYY HH:mm:ss"))).format("HH:mm");
				var outputArray = output.split(":");
				totalMinutes += (parseInt(outputArray[0]) * 60) + parseInt(outputArray[1]);
				lastIn = null;
			}
			
			var $tr = $("<tr><td>" + this.swipeInOut + "</td><td>" + armyTime + "</td></td></tr>");
			$("#timeLogTable").append($tr);
		});
	
		if (lastIn != null) {
			var lastLog = new Date();
			var lastInDate = (moment(lastIn, "MM-DD-YYYY HH:mm:ss")).toDate();
			
			if ((new Date).getDate() - lastInDate.getDate() != 0) {
				lastLog.setHours(0, 0, 0);
			}
			
			var output = moment.utc(moment(lastLog).diff(moment(lastIn, "MM-DD-YYYY HH:mm:ss"))).format("HH:mm");
			var outputArray = output.split(":");
			totalMinutes += (parseInt(outputArray[0]) * 60) + parseInt(outputArray[1]);
			lastIn = null;

		}
	
		return totalMinutes;
	
	},
	
	setCalculatedTotalTimeToPage : function(totalMinutes) {
		var $totalLogTime = $("<div>" + Math.floor(totalMinutes / 60) + " hours " + totalMinutes % 60 + " minutes </div>");

		if (totalMinutes == 0) {
			$("#swipeTable").hide();
		} else {
			$("#swipeTable").show();
		}

		$(".js-chip").html($totalLogTime);
		$("#chipDiv").show();
	},
	
	setCalculatedTotalTimeReamainingToPage : function(totalMinutes) {
		var $totalRemainingInWeek = $("<div>" + Math.floor(totalMinutes / 60) + " hours " + totalMinutes % 60 + " minutes </div>");

		$(".js2-chip").html($totalLogTime);
		$("#chip2Div").show();
	}
	
};

