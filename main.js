// be warned - I am not a front end developer, and do not know what I am doing here

const form = document.getElementById("carCalculatorForm");
const stateSelector = document.getElementById("stateSelector");
const gridPower = document.getElementById("gridPower");
const solarPower = document.getElementById("solarPower");
const result = document.getElementById("result");
const resultContent = document.getElementById("resultContent");
const evSelector = document.getElementById("ev");
const KG_CO2_PER_KWHR_OF_BATTERY_LOWER_BOUND = 61;
const KG_CO2_PER_KWHR_OF_BATTERY_UPPER_BOUND = 106;


// formatting and data loading helpers

function formatEvName(field) {
    return field.Brand + " " + field.Model;
}

function formatYearsAndMonths(years) {
  const fullYears = Math.floor(years);
  const remainingMonths = Math.round((years - fullYears) * 12);

  let formattedResult = "";

  if (fullYears > 0) {
    formattedResult += `${fullYears} ${fullYears === 1 ? "year" : "years"}`;
  }

  if (remainingMonths > 0) {
    formattedResult += `${formattedResult.length > 0 ? " " : ""}${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
  }

  return formattedResult.length > 0 ? formattedResult : "0 months";
}

function setStateSelectorVisibility(visible) {
    stateSelector.style.display = visible ? "block" : "none";
}

function makeToken(value, tokenClass) {
    let variableValue = document.createElement("span");
    if (!!tokenClass) {
        variableValue.classList.add(tokenClass);
        variableValue.classList.add("variable");
    }
    variableValue.innerText = value;
    return variableValue;
}

function makeKilogramsToken(value) {
    return makeToken(value + " kilograms", "derivedVariableBad");
}

function makeSection(tokens) {
    const section = document.createElement("p");
    tokens.forEach((token) => section.appendChild(token));
    return section;
}

function makeRefence(number) {
    let superscript = document.createElement("sup");
    superscript.innerText = number;
    return superscript;
}

function loadData(file) {
    const path = w `https://ev.logannoel.com/data/${file}`;
    const xhr = new XMLHttpRequest();

    xhr.overrideMimeType("application/json");
    xhr.open("GET", path, false);
    xhr.send();
    return JSON.parse(xhr.responseText);
}


function loadStateCo2Data() {
    return loadData("2022_carbon_intensity_by_state.json")["kgs_carbon_per_kwhr"];
}

function loadEvEfficiencyData() {
    return Object.values(loadData("evs_efficiency.json")).sort((a, b) => formatEvName(a).localeCompare(formatEvName(b)));
}

const STATE_CO2_DATA = loadStateCo2Data();
const EV_EFFICIENCY_DATA = loadEvEfficiencyData();

EV_EFFICIENCY_DATA.forEach(field => {
      const optionElement = document.createElement("option");
        optionElement.data = field;
        optionElement.text = formatEvName(field);
        evSelector.appendChild(optionElement);
});

setStateSelectorVisibility(gridPower.checked);


// calculations


function calculateAnnualCO2EmissionsOfICE(milesDriven, gasMileage) {
    // CO2 emission factor for gasoline (in KGs per gallon)
    // https://www.eia.gov/environment/emissions/co2_vol_mass.php
    const CO2EmissionFactorGasoline = 8.78;

    // Calculate the annual CO2 emissions in KGs
    return (milesDriven / gasMileage) * CO2EmissionFactorGasoline;
}

function calculateAnnualCO2EmissionsOfEV(milesDriven, CO2PerKWHr, evEfficiency) {
    // Calculate the annual CO2 emissions in KGs
    return (milesDriven / evEfficiency) * CO2PerKWHr;

}

function co2PerKWHour(powerSource, state) {
    if (powerSource === "grid") {
        return  STATE_CO2_DATA[state];
    }
    return 0;
}

function breakevenPoint(evManufacturingCO2, evAnnualCO2, iceAnnualCo2) {
    return evManufacturingCO2 / (iceAnnualCo2 - evAnnualCO2);
}

function manufacturingCostOfEv(batterySize, CO2PerKWHr) {
    return batterySize * CO2PerKWHr;
}

function buildDisplayResult(iceAnnualCO2, powerSource, state, co2PerKwHrByState, evAnnualCO2, model, 
    evBatterySize, manufacturingLowerBound, manufacturingUpperBound, breakevenPointLowerBound, 
    breakevenPointUpperBound, breakevenPointLowerBoundMiles, breakevenPointUpperBoundMiles) {
    let displayResult = [];

    // ICE annual
    let iceAnnualSection = [];
    iceAnnualSection.push(makeToken("Your current internal combustion engine car is estimated to produce around"));
    iceAnnualSection.push(makeKilogramsToken(parseInt(iceAnnualCO2).toLocaleString()));
    iceAnnualSection.push(makeToken("of CO2 annually."));
    iceAnnualSection.push(makeRefence(1));
    displayResult.push(makeSection(iceAnnualSection));

    // EV annual
    let evAnnualSection = [];

    if (powerSource === "grid") {
        evAnnualSection.push(makeToken("Based on primarily charging on grid power in "));
        evAnnualSection.push(makeToken(state, "inputVariable"));
        evAnnualSection.push(makeToken(", (which emits an average of"));
        evAnnualSection.push(makeKilogramsToken(co2PerKwHrByState.toFixed(3)));
        evAnnualSection.push(makeToken("of CO2 per KWh), "));
        evAnnualSection.push(makeRefence(2));
    } else {
        evAnnualSection.push(makeToken("Based on primarily charging on solar power, "));
    }
    evAnnualSection.push(makeToken("your"));
    evAnnualSection.push(makeToken(model, "inputVariable"));
    evAnnualSection.push(makeToken("would produce around"));

    evAnnualSection.push(makeKilogramsToken(parseInt(evAnnualCO2).toLocaleString()));
    evAnnualSection.push(makeToken(" of CO2 annually."));
    evAnnualSection.push(makeRefence(3));
    evAnnualSection.push(makeRefence(4));
    displayResult.push(makeSection(evAnnualSection));


    // EV manufacturing
    let evManufacturingSection = [];

    evManufacturingSection.push(makeToken("Estimates of CO2 emitted by manufacturing EVs vary widely, but based on the"));
    evManufacturingSection.push(makeToken(model, "inputVariable"));
    evManufacturingSection.push(makeToken("'s approximately"));
    evManufacturingSection.push(makeToken(Math.round(evBatterySize) + " KWh", "derivedVariable"));
     evManufacturingSection.push(makeToken("battery, the manufacturing process could result in anywhere from"));
     evManufacturingSection.push(makeKilogramsToken(parseInt(manufacturingLowerBound).toLocaleString() + " to " + parseInt(manufacturingUpperBound).toLocaleString()));
     evManufacturingSection.push(makeToken("of CO2, depending on the energy source used."));
     evManufacturingSection.push(makeRefence(5));
     displayResult.push(makeSection(evManufacturingSection));


     // Time to breakeven
     let breakevenSection = [];
    if (iceAnnualCO2 > evAnnualCO2) {
        breakevenSection.push(makeToken("It would take"));
        breakevenSection.push(makeToken(formatYearsAndMonths(breakevenPointLowerBound) + " to " + formatYearsAndMonths(breakevenPointUpperBound), "derivedVariable"));
        breakevenSection.push(makeToken("(or"));
        breakevenSection.push(makeToken(breakevenPointLowerBoundMiles.toLocaleString() + " to " + breakevenPointUpperBoundMiles.toLocaleString() + " miles" ,"derivedVariable"));
        breakevenSection.push(makeToken(")"));
        breakevenSection.push(makeToken("for your EV purchase to lead to a net reduction in CO2 emissions."));
    } else {
        breakevenSection.push(makeToken("Your electric vehicle purchase will never lead to a net decrease in CO2 emissions."));
    }
     displayResult.push(makeSection(breakevenSection));


    return displayResult;
}

function recalculate() {

    const mileage = parseFloat(document.getElementById("mileage").value);
    const milesDriven = parseFloat(document.getElementById("milesDriven").value);
    const powerSource = document.querySelector('input[name="powerSource"]:checked').value;
    const selectedEv = document.getElementById("ev").options[document.getElementById("ev").selectedIndex].data;
    const evFormattedName = formatEvName(selectedEv);
    const evEfficiency = selectedEv["miles_per_kwhr"];
    const evBatterySize = selectedEv["battery_size_kwhr"];

    let selectedState;
    if (powerSource === "grid") {
        selectedState = document.getElementById("state").value;
    } 
    const co2PerKwHrByState = co2PerKWHour(powerSource, selectedState);
    const iceAnnualCO2 = calculateAnnualCO2EmissionsOfICE(milesDriven, mileage);
    const evAnnualCO2 = calculateAnnualCO2EmissionsOfEV(milesDriven, co2PerKwHrByState, evEfficiency);
    const manufacturingLowerBound = manufacturingCostOfEv(evBatterySize, KG_CO2_PER_KWHR_OF_BATTERY_LOWER_BOUND);
    const manufacturingUpperBound = manufacturingCostOfEv(evBatterySize, KG_CO2_PER_KWHR_OF_BATTERY_UPPER_BOUND);
    const breakevenPointLowerBound = breakevenPoint(manufacturingLowerBound, evAnnualCO2, iceAnnualCO2);
    const breakevenPointUpperBound = breakevenPoint(manufacturingUpperBound, evAnnualCO2, iceAnnualCO2);

    const breakevenPointLowerBoundMiles = parseInt(breakevenPointLowerBound * milesDriven);
    const breakevenPointUpperBoundMiles = parseInt(breakevenPointUpperBound * milesDriven);

    resultContent.innerHTML = "";
    const displayResult = buildDisplayResult(
        iceAnnualCO2, powerSource, selectedState, co2PerKwHrByState, evAnnualCO2, 
        evFormattedName, evBatterySize, manufacturingLowerBound, manufacturingUpperBound, 
        breakevenPointLowerBound, breakevenPointUpperBound, breakevenPointLowerBoundMiles, 
        breakevenPointUpperBoundMiles);
    displayResult.forEach(term => resultContent.appendChild(term));
    result.style.display = "block";

}

form.addEventListener("submit", function (e) {
    e.preventDefault();
    recalculate();
});

gridPower.addEventListener("change", () => {
    setStateSelectorVisibility(gridPower.checked);
});
solarPower.addEventListener("change", () => {
        setStateSelectorVisibility(gridPower.checked);
});