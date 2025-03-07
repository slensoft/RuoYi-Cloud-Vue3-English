<template>
	<div class="popup-result">
		<p class="title">Last 5 Run Times</p>
		<ul class="popup-result-scroll">
			<template v-if='isShow'>
				<li v-for='item in resultList' :key="item">{{item}}</li>
			</template>
			<li v-else>Calculating results...</li>
		</ul>
	</div>
</template>

<script setup>
const props = defineProps({
    ex: {
        type: String,
        default: ''
    }
})
const dayRule = ref('')
const dayRuleSup = ref('')
const dateArr = ref([])
const resultList = ref([])
const isShow = ref(false)
watch(() => props.ex, () => expressionChange())
// When the expression value changes, start calculating the result
function expressionChange() {
    // Calculation start - hide result
    isShow.value = false;
    // Get rule array [0 second, 1 minute, 2 hour, 3 day, 4 month, 5 week, 6 year]
    let ruleArr = props.ex.split(' ');
    // Used to record the number of times entering the loop
    let nums = 0;
    // Array used to temporarily store the result of the symbol time rule
    let resultArr = [];
    // Get the current time accurate to [year, month, day, hour, minute, second]
    let nTime = new Date();
    let nYear = nTime.getFullYear();
    let nMonth = nTime.getMonth() + 1;
    let nDay = nTime.getDate();
    let nHour = nTime.getHours();
    let nMin = nTime.getMinutes();
    let nSecond = nTime.getSeconds();
    // Get possible year arrays, month arrays, etc. for the next 100 years according to the rules
    getSecondArr(ruleArr[0]);
    getMinArr(ruleArr[1]);
    getHourArr(ruleArr[2]);
    getDayArr(ruleArr[3]);
    getMonthArr(ruleArr[4]);
    getWeekArr(ruleArr[5]);
    getYearArr(ruleArr[6], nYear);
    // Assign the obtained array for easy use
    let sDate = dateArr.value[0];
    let mDate = dateArr.value[1];
    let hDate = dateArr.value[2];
    let DDate = dateArr.value[3];
    let MDate = dateArr.value[4];
    let YDate = dateArr.value[5];
    // Get the index of the current time in the array
    let sIdx = getIndex(sDate, nSecond);
    let mIdx = getIndex(mDate, nMin);
    let hIdx = getIndex(hDate, nHour);
    let DIdx = getIndex(DDate, nDay);
    let MIdx = getIndex(MDate, nMonth);
    let YIdx = getIndex(YDate, nYear);
    // Reset functions for month, day, hour, minute, second (used frequently later)
    const resetSecond = function () {
        sIdx = 0;
        nSecond = sDate[sIdx]
    }
    const resetMin = function () {
        mIdx = 0;
        nMin = mDate[mIdx]
        resetSecond();
    }
    const resetHour = function () {
        hIdx = 0;
        nHour = hDate[hIdx]
        resetMin();
    }
    const resetDay = function () {
        DIdx = 0;
        nDay = DDate[DIdx]
        resetHour();
    }
    const resetMonth = function () {
        MIdx = 0;
        nMonth = MDate[MIdx];
        resetDay();
    }
    // If the current year is not the current value in the array
    if (nYear !== YDate[YIdx]) {
        resetMonth();
    }
    // If the current month is not the current value in the array
    if (nMonth !== MDate[MIdx]) {
        resetDay();
    }
    // If the current 'day' is not the current value in the array
    if (nDay !== DDate[DIdx]) {
        resetHour();
    }
    // If the current 'hour' is not the current value in the array
    if (nHour !== hDate[hIdx]) {
        resetMin();
    }
    // If the current 'minute' is not the current value in the array
    if (nMin !== mDate[mIdx]) {
        resetSecond();
    }
    // Loop through the year array
    goYear: for (let Yi = YIdx; Yi < YDate.length; Yi++) {
        let YY = YDate[Yi];
        // If the maximum value is reached
        if (nMonth > MDate[MDate.length - 1]) {
            resetMonth();
            continue;
        }
        // Loop through the month array
        goMonth: for (let Mi = MIdx; Mi < MDate.length; Mi++) {
            // Assign value for easy calculation later
            let MM = MDate[Mi];
            MM = MM < 10 ? '0' + MM : MM;
            // If the maximum value is reached
            if (nDay > DDate[DDate.length - 1]) {
                resetDay();
                if (Mi === MDate.length - 1) {
                    resetMonth();
                    continue goYear;
                }
                continue;
            }
            // Loop through the day array
            goDay: for (let Di = DIdx; Di < DDate.length; Di++) {
                // Assign value for easy calculation later
                let DD = DDate[Di];
                let thisDD = DD < 10 ? '0' + DD : DD;
                // If the maximum value is reached
                if (nHour > hDate[hDate.length - 1]) {
                    resetHour();
                    if (Di === DDate.length - 1) {
                        resetDay();
                        if (Mi === MDate.length - 1) {
                            resetMonth();
                            continue goYear;
                        }
                        continue goMonth;
                    }
                    continue;
                }
                // Determine the legality of the date, if not legal, also jump out of the current loop
                if (checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true && dayRule.value !== 'workDay' && dayRule.value !== 'lastWeek' && dayRule.value !== 'lastDay') {
                    resetDay();
                    continue goMonth;
                }
                // If there is a value in the date rule
                if (dayRule.value === 'lastDay') {
                    // If it is not a legal date, adjust the date to the last day of the month
                    if (checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true) {
                        while (DD > 0 && checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true) {
                            DD--;
                            thisDD = DD < 10 ? '0' + DD : DD;
                        }
                    }
                } else if (dayRule.value === 'workDay') {
                    // Validate and adjust if a date like February 30th is passed in, adjust to the normal end of the month
                    if (checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true) {
                        while (DD > 0 && checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true) {
                            DD--;
                            thisDD = DD < 10 ? '0' + DD : DD;
                        }
                    }
                    // Get the day of the week that meets the conditions
                    let thisWeek = formatDate(new Date(YY + '-' + MM + '-' + thisDD + ' 00:00:00'), 'week');
                    // When it is Sunday
                    if (thisWeek === 1) {
                        // Find the next day first and determine if it is the end of the month
                        DD++;
                        thisDD = DD < 10 ? '0' + DD : DD;
                        // Determine that the next day is no longer a legal date
                        if (checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true) {
                            DD -= 3;
                        }
                    } else if (thisWeek === 7) {
                        // When it is Saturday, just judge that it is not the 1st to operate
                        if (dayRuleSup.value !== 1) {
                            DD--;
                        } else {
                            DD += 2;
                        }
                    }
                } else if (dayRule.value === 'weekDay') {
                    // If a specific day of the week is specified
                    // Get the day of the week for the current date
                    let thisWeek = formatDate(new Date(YY + '-' + MM + '-' + DD + ' 00:00:00'), 'week');
                    // Validate whether the current week is in the week pool (dayRuleSup)
                    if (dayRuleSup.value.indexOf(thisWeek) < 0) {
                        // If the maximum value is reached
                        if (Di === DDate.length - 1) {
                            resetDay();
                            if (Mi === MDate.length - 1) {
                                resetMonth();
                                continue goYear;
                            }
                            continue goMonth;
                        }
                        continue;
                    }
                } else if (dayRule.value === 'assWeek') {
                    // If a specific week of the month is specified
                    // Get the day of the week for the 1st of each month
                    let thisWeek = formatDate(new Date(YY + '-' + MM + '-' + DD + ' 00:00:00'), 'week');
                    if (dayRuleSup.value[1] >= thisWeek) {
                        DD = (dayRuleSup.value[0] - 1) * 7 + dayRuleSup.value[1] - thisWeek + 1;
                    } else {
                        DD = dayRuleSup.value[0] * 7 + dayRuleSup.value[1] - thisWeek + 1;
                    }
                } else if (dayRule.value === 'lastWeek') {
                    // If the last day of the week is specified
                    // Validate and adjust if a date like February 30th is passed in, adjust to the normal end of the month
                    if (checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true) {
                        while (DD > 0 && checkDate(YY + '-' + MM + '-' + thisDD + ' 00:00:00') !== true) {
                            DD--;
                            thisDD = DD < 10 ? '0' + DD : DD;
                        }
                    }
                    // Get the day of the week for the last day of the month
                    let thisWeek = formatDate(new Date(YY + '-' + MM + '-' + thisDD + ' 00:00:00'), 'week');
                   // Find the nearest day of the week in the requirements
                    if (dayRuleSup.value < thisWeek) {
                        DD -= thisWeek - dayRuleSup.value;
                    } else if (dayRuleSup.value > thisWeek) {
                        DD -= 7 - (dayRuleSup.value - thisWeek)
                    }
                }
                // Determine if the time value is less than 10 and replace it with '05' format
                DD = DD < 10 ? '0' + DD : DD;
                // Loop through the hour array
                goHour: for (let hi = hIdx; hi < hDate.length; hi++) {
                    let hh = hDate[hi] < 10 ? '0' + hDate[hi] : hDate[hi]
                    // If the maximum value is reached
                    if (nMin > mDate[mDate.length - 1]) {
                        resetMin();
                        if (hi === hDate.length - 1) {
                            resetHour();
                            if (Di === DDate.length - 1) {
                                resetDay();
                                if (Mi === MDate.length - 1) {
                                    resetMonth();
                                    continue goYear;
                                }
                                continue goMonth;
                            }
                            continue goDay;
                        }
                        continue;
                    }
                    // Loop through the minute array
                    goMin: for (let mi = mIdx; mi < mDate.length; mi++) {
                        let mm = mDate[mi] < 10 ? '0' + mDate[mi] : mDate[mi];
                        // If the maximum value is reached
                        if (nSecond > sDate[sDate.length - 1]) {
                            resetSecond();
                            if (mi === mDate.length - 1) {
                                resetMin();
                                if (hi === hDate.length - 1) {
                                    resetHour();
                                    if (Di === DDate.length - 1) {
                                        resetDay();
                                        if (Mi === MDate.length - 1) {
                                            resetMonth();
                                            continue goYear;
                                        }
                                        continue goMonth;
                                    }
                                    continue goDay;
                                }
                                continue goHour;
                            }
                            continue;
                        }
                        // Loop through the second array
                        goSecond: for (let si = sIdx; si <= sDate.length - 1; si++) {
                            let ss = sDate[si] < 10 ? '0' + sDate[si] : sDate[si];
                            // Add the current time (time legality has been judged in the date loop)
                            if (MM !== '00' && DD !== '00') {
                                resultArr.push(YY + '-' + MM + '-' + DD + ' ' + hh + ':' + mm + ':' + ss)
                                nums++;
                            }
                            // If the number of items is full, exit the loop
                            if (nums === 5) break goYear;
                            // If the maximum value is reached
                            if (si === sDate.length - 1) {
                                resetSecond();
                                if (mi === mDate.length - 1) {
                                    resetMin();
                                    if (hi === hDate.length - 1) {
                                        resetHour();
                                        if (Di === DDate.length - 1) {
                                            resetDay();
                                            if (Mi === MDate.length - 1) {
                                                resetMonth();
                                                continue goYear;
                                            }
                                            continue goMonth;
                                        }
                                        continue goDay;
                                    }
                                    continue goHour;
                                }
                                continue goMin;
                            }
                        } //goSecond
                    } //goMin
                }//goHour
            }//goDay
        }//goMonth
    }
    // Determine the number of results within 100 years
    if (resultArr.length === 0) {
        resultList.value = ['No results meeting the conditions!'];
    } else {
        resultList.value = resultArr;
        if (resultArr.length !== 5) {
            resultList.value.push('Only ' + resultArr.length + ' results within the last 100 years!')
        }
    }
    // Calculation complete - show result
    isShow.value = true;
}
// Used to calculate the index of a digit in the array
function getIndex(arr, value) {
    if (value <= arr[0] || value > arr[arr.length - 1]) {
        return 0;
    } else {
        for (let i = 0; i < arr.length - 1; i++) {
            if (value > arr[i] && value <= arr[i + 1]) {
                return i + 1;
            }
        }
    }
}
// Get the 'year' array
function getYearArr(rule, year) {
    dateArr.value[5] = getOrderArr(year, year + 100);
    if (rule !== undefined) {
        if (rule.indexOf('-') >= 0) {
            dateArr.value[5] = getCycleArr(rule, year + 100, false)
        } else if (rule.indexOf('/') >= 0) {
            dateArr.value[5] = getAverageArr(rule, year + 100)
        } else if (rule !== '*') {
            dateArr.value[5] = getAssignArr(rule)
        }
    }
}
// Get the 'month' array
function getMonthArr(rule) {
    dateArr.value[4] = getOrderArr(1, 12);
    if (rule.indexOf('-') >= 0) {
        dateArr.value[4] = getCycleArr(rule, 12, false)
    } else if (rule.indexOf('/') >= 0) {
        dateArr.value[4] = getAverageArr(rule, 12)
    } else if (rule !== '*') {
        dateArr.value[4] = getAssignArr(rule)
    }
}
// Get the 'day' array - mainly for date rules
function getWeekArr(rule) {
    // Only when both values of the date rule are '' does it mean that the date has options
    if (dayRule.value === '' && dayRuleSup.value === '') {
        if (rule.indexOf('-') >= 0) {
            dayRule.value = 'weekDay';
            dayRuleSup.value = getCycleArr(rule, 7, false)
        } else if (rule.indexOf('#') >= 0) {
            dayRule.value = 'assWeek';
            let matchRule = rule.match(/[0-9]{1}/g);
            dayRuleSup.value = [Number(matchRule[1]), Number(matchRule[0])];
            dateArr.value[3] = [1];
            if (dayRuleSup.value[1] === 7) {
                dayRuleSup.value[1] = 0;
            }
        } else if (rule.indexOf('L') >= 0) {
            dayRule.value = 'lastWeek';
            dayRuleSup.value = Number(rule.match(/[0-9]{1,2}/g)[0]);
            dateArr.value[3] = [31];
            if (dayRuleSup.value === 7) {
                dayRuleSup.value = 0;
            }
        } else if (rule !== '*' && rule !== '?') {
            dayRule.value = 'weekDay';
            dayRuleSup.value = getAssignArr(rule)
        }
    }
}
// Get the 'day' array - a small amount for date rules
function getDayArr(rule) {
    dateArr.value[3] = getOrderArr(1, 31);
    dayRule.value = '';
    dayRuleSup.value = '';
    if (rule.indexOf('-') >= 0) {
        dateArr.value[3] = getCycleArr(rule, 31, false)
        dayRuleSup.value = 'null';
    } else if (rule.indexOf('/') >= 0) {
        dateArr.value[3] = getAverageArr(rule, 31)
        dayRuleSup.value = 'null';
    } else if (rule.indexOf('W') >= 0) {
        dayRule.value = 'workDay';
        dayRuleSup.value = Number(rule.match(/[0-9]{1,2}/g)[0]);
        dateArr.value[3] = [dayRuleSup.value];
    } else if (rule.indexOf('L') >= 0) {
        dayRule.value = 'lastDay';
        dayRuleSup.value = 'null';
        dateArr.value[3] = [31];
    } else if (rule !== '*' && rule !== '?') {
        dateArr.value[3] = getAssignArr(rule)
        dayRuleSup.value = 'null';
    } else if (rule === '*') {
        dayRuleSup.value = 'null';
    }
}
// Get the 'hour' array
function getHourArr(rule) {
    dateArr.value[2] = getOrderArr(0, 23);
    if (rule.indexOf('-') >= 0) {
        dateArr.value[2] = getCycleArr(rule, 24, true)
    } else if (rule.indexOf('/') >= 0) {
        dateArr.value[2] = getAverageArr(rule, 23)
    } else if (rule !== '*') {
        dateArr.value[2] = getAssignArr(rule)
    }
}
// Get the 'minute' array
function getMinArr(rule) {
    dateArr.value[1] = getOrderArr(0, 59);
    if (rule.indexOf('-') >= 0) {
        dateArr.value[1] = getCycleArr(rule, 60, true)
    } else if (rule.indexOf('/') >= 0) {
        dateArr.value[1] = getAverageArr(rule, 59)
    } else if (rule !== '*') {
        dateArr.value[1] = getAssignArr(rule)
    }
}
// Get the 'second' array
function getSecondArr(rule) {
    dateArr.value[0] = getOrderArr(0, 59);
    if (rule.indexOf('-') >= 0) {
        dateArr.value[0] = getCycleArr(rule, 60, true)
    } else if (rule.indexOf('/') >= 0) {
        dateArr.value[0] = getAverageArr(rule, 59)
    } else if (rule !== '*') {
        dateArr.value[0] = getAssignArr(rule)
    }
}
// Return an ordered array based on the passed min-max
function getOrderArr(min, max) {
    let arr = [];
    for (let i = min; i <= max; i++) {
        arr.push(i);
    }
    return arr;
}
// Return an array based on the scattered values specified in the rule
function getAssignArr(rule) {
    let arr = [];
    let assiginArr = rule.split(',');
    for (let i = 0; i < assiginArr.length; i++) {
        arr[i] = Number(assiginArr[i])
    }
    arr.sort(compare)
    return arr;
}
// Calculate and return an array based on certain arithmetic rules
function getAverageArr(rule, limit) {
    let arr = [];
    let agArr = rule.split('/');
    let min = Number(agArr[0]);
    let step = Number(agArr[1]);
    while (min <= limit) {
        arr.push(min);
        min += step;
    }
    return arr;
}
// Return a periodic array based on the rule
function getCycleArr(rule, limit, status) {
    // status--indicates whether to start from 0 (then start from 1)
    let arr = [];
    let cycleArr = rule.split('-');
    let min = Number(cycleArr[0]);
    let max = Number(cycleArr[1]);
    if (min > max) {
        max += limit;
    }
    for (let i = min; i <= max; i++) {
        let add = 0;
        if (status === false && i % limit === 0) {
            add = limit;
        }
        arr.push(Math.round(i % limit + add))
    }
    arr.sort(compare)
    return arr;
}
// Compare numbers (used for Array.sort)
function compare(value1, value2) {
    if (value2 - value1 > 0) {
        return -1;
    } else {
        return 1;
    }
}
// Format date format such as: 2017-9-19 18:04:33
function formatDate(value, type) {
    // Calculate date-related values
    let time = typeof value == 'number' ? new Date(value) : value;
    let Y = time.getFullYear();
    let M = time.getMonth() + 1;
    let D = time.getDate();
    let h = time.getHours();
    let m = time.getMinutes();
    let s = time.getSeconds();
    let week = time.getDay();
    // If type is passed
    if (type === undefined) {
        return Y + '-' + (M < 10 ? '0' + M : M) + '-' + (D < 10 ? '0' + D : D) + ' ' + (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    } else if (type === 'week') {
        // In quartz, 1 is Sunday
        return week + 1;
    }
}
// Check if the date exists
function checkDate(value) {
    let time = new Date(value);
    let format = formatDate(time)
    return value === format;
}
onMounted(() => {
    expressionChange()
})
</script>
