/*
global
  activeEvents
  add_checkbox
  getWinrateClass
  hideLoadingBars
  ipc_send
  showLoadingBars
*/

const _ = require("lodash");
const db = require("../shared/database");
const pd = require("../shared/player-data");
const { queryElements: $$, createDivision } = require("../shared/dom-fns");
const { createSelect } = require("../shared/select");
const {
  getReadableEvent,
  timeSince,
  get_rank_index_16,
  removeDuplicates,
  compare_cards,
  getBoosterCountEstimate
} = require("../shared/util");

const { MANA, COLORS_BRIEF, DEFAULT_TILE } = require("../shared/constants.js");

let filterWCC = 0;
let filterWCU = 0;
let filterWCR = 0;
let filterWCM = 0;
let filterSkip = 0;
let filterEvent = "";
let filterSort = "";
let filterType = "";
let filterSortDir = "";
let onlyOwned = false;
let filteredMana = [];
let filteredranks = [];
let ownedWildcards = { c: 0, u: 0, r: 0, m: 0 };

let ranks_list = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Mythic"];

const openDeck = require("./deck-details").openDeck;

let raritySort = { c: "common", u: "uncommon", r: "rare", m: "mythic" };

function openExploreTab() {
  hideLoadingBars();
  var mainDiv = document.getElementById("ux_0");
  var dateNow, d;
  ownedWildcards = {
    c: pd.economy.wcCommon,
    u: pd.economy.wcUncommon,
    r: pd.economy.wcRare,
    m: pd.economy.wcMythic
  };

  mainDiv.classList.remove("flex_item");
  mainDiv.innerHTML = "";

  let divFill = document.createElement("div");
  divFill.classList.add("list_fill");
  mainDiv.appendChild(divFill);

  let exploreFiltersContainer = createDivision(["explore_buttons_container"]);
  let exploreFiltersSelects = createDivision([
    "explore_buttons_row",
    "explore_buttons_top"
  ]);
  let exploreFiltersButtons = createDivision([
    "explore_buttons_row",
    "explore_buttons_middle"
  ]);
  let exploreFiltersInputs = createDivision([
    "explore_buttons_row",
    "explore_buttons_bottom"
  ]);
  exploreFiltersContainer.appendChild(exploreFiltersSelects);
  exploreFiltersContainer.appendChild(exploreFiltersButtons);
  exploreFiltersContainer.appendChild(exploreFiltersInputs);

  mainDiv.appendChild(exploreFiltersContainer);

  let exploreList = createDivision(["explore_list"]);
  exploreList.id = "explore_list";
  mainDiv.appendChild(exploreList);

  let welcomeMessage = createDivision(
    ["text_centered", "white"],
    'Choose filter options and click "Search" to begin.'
  );
  exploreList.appendChild(welcomeMessage);

  drawFilters(exploreFiltersContainer);

  d = document.createElement("div");
  d.classList.add("list_fill");
  mainDiv.appendChild(d);
  d = document.createElement("div");
  d.classList.add("list_fill");
  mainDiv.appendChild(d);

  $(mainDiv).off();
  $(mainDiv).on("scroll", () => {
    if (
      Math.round(mainDiv.scrollTop + mainDiv.offsetHeight) >=
      mainDiv.scrollHeight
    ) {
      queryExplore(filterSkip);
    }
  });
}

function getEventPrettyName(event) {
  return db.events[event] || event;
}

function drawFilters() {
  let buttonsTop = $$(".explore_buttons_top")[0];
  let buttonsMiddle = $$(".explore_buttons_middle")[0];
  let buttonsBottom = $$(".explore_buttons_bottom")[0];

  onlyOwned = document.getElementById("settings_owned")
    ? document.getElementById("settings_owned").checked
    : false;
  filterType = document.getElementById("explore_query_type")
    ? document.getElementById("explore_query_type").value
    : "Events";
  filterEvent = document.getElementById("explore_query_event")
    ? document.getElementById("explore_query_event").value
    : "Ladder";
  filterSort = document.getElementById("explore_query_sort")
    ? document.getElementById("explore_query_sort").value
    : "By Wins";
  filterSortDir = document.getElementById("explore_query_sortdirection")
    ? document.getElementById("explore_query_sortdirection").value
    : "Descending";
  filterWCC =
    document.getElementById("explore_query_wc_c") !== null
      ? document.getElementById("explore_query_wc_c").value
      : "";
  filterWCU =
    document.getElementById("explore_query_wc_u") !== null
      ? document.getElementById("explore_query_wc_u").value
      : "";
  filterWCR =
    document.getElementById("explore_query_wc_r") !== null
      ? document.getElementById("explore_query_wc_r").value
      : "";
  filterWCM =
    document.getElementById("explore_query_wc_m") !== null
      ? document.getElementById("explore_query_wc_m").value
      : "";

  buttonsTop.innerHTML = "";
  buttonsMiddle.innerHTML = "";
  buttonsBottom.innerHTML = "";

  /**
   *  Type filter
   **/
  let typeFilter = ["Events", "Ranked Constructed", "Ranked Draft"];
  let typeSelect = createSelect(
    buttonsTop,
    typeFilter,
    filterType,
    res => {
      filterType = res;
      drawFilters();
    },
    "explore_query_type"
  );
  typeSelect.style.width = "200px";

  /**
   *  Event filter
   **/
  let eventFilters = [];
  if (filterType == "Events") {
    eventFilters = db.eventIds
      .concat(activeEvents)
      .map(ev => getEventPrettyName(ev))
      .filter(
        item =>
          item != undefined &&
          item != "New Player Experience" &&
          item != "Direct Game" &&
          item != "Ranked" &&
          item != "Play" &&
          item != "Traditional Play" &&
          item != "Traditional Ranked" &&
          !db.ranked_events.map(ev => getEventPrettyName(ev)).includes(item)
      );

    eventFilters = [...new Set(eventFilters)];
  } else if (filterType == "Ranked Draft") {
    eventFilters = db.ranked_events.map(ev => getEventPrettyName(ev));
  } else if (filterType == "Ranked Constructed") {
    eventFilters.push("Ladder");
    eventFilters.push("Traditional Ladder");
  }
  eventFilters.sort(function(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  let mappedActive = activeEvents.map(ev => getEventPrettyName(ev));
  eventFilters.forEach(item => {
    if (mappedActive.includes(item)) {
      eventFilters.splice(eventFilters.indexOf(item), 1);
      eventFilters.unshift(item);
    }
  });

  filterEvent = eventFilters[0];

  createSelect(
    buttonsTop,
    eventFilters,
    filterEvent,
    res => (filterEvent = res),
    "explore_query_event"
  );

  /**
   *  Sort filter
   **/
  let sortLabel = document.createElement("label");
  sortLabel.innerHTML = "Sort";
  sortLabel.style.margin = "auto 4px auto 16px";
  buttonsTop.appendChild(sortLabel);

  let sortFilters = ["By Date", "By Wins", "By Winrate", "By Player"];
  let sortSelect = createSelect(
    buttonsTop,
    sortFilters,
    filterSort,
    res => (filterSort = res),
    "explore_query_sort"
  );
  sortSelect.style.width = "130px";

  /**
   *  Sort direction
   **/
  let sortDirection = ["Descending", "Ascending"];
  let sortDirSelect = createSelect(
    buttonsTop,
    sortDirection,
    filterSortDir,
    res => (filterSortDir = res),
    "explore_query_sortdirection"
  );
  sortDirSelect.style.width = "130px";

  /**
   *  Only owned filter
   **/
  let lab = add_checkbox(
    $(buttonsMiddle),
    "Only owned",
    "settings_owned",
    onlyOwned,
    updateExploreCheckbox
  );
  lab.css("align-self", "center");
  lab.css("margin-left", "0px");
  lab.css("margin-right", "32px");

  /**
   * Wildcards filters
   **/
  let commonsInput = wildcardsInput("wc_common", "explore_query_wc_c");
  let uncommonsInput = wildcardsInput("wc_uncommon", "explore_query_wc_u");
  let raresInput = wildcardsInput("wc_rare", "explore_query_wc_r");
  let mythicInput = wildcardsInput("wc_mythic", "explore_query_wc_m");

  commonsInput.addEventListener(
    "change",
    event => (filterWCC = event.target.value)
  );
  uncommonsInput.addEventListener(
    "change",
    event => (filterWCU = event.target.value)
  );
  raresInput.addEventListener(
    "change",
    event => (filterWCR = event.target.value)
  );
  mythicInput.addEventListener(
    "change",
    event => (filterWCM = event.target.value)
  );

  buttonsMiddle.appendChild(commonsInput);
  buttonsMiddle.appendChild(uncommonsInput);
  buttonsMiddle.appendChild(raresInput);
  buttonsMiddle.appendChild(mythicInput);

  /**
   *  Mana filter
   **/
  var manas = $('<div class="mana_filters_explore"></div>');
  COLORS_BRIEF.forEach(function(s, i) {
    var mi = [1, 2, 3, 4, 5];
    var mf = "";
    if (!filteredMana.includes(mi[i])) {
      mf = "mana_filter_on";
    }
    var manabutton = $(
      `<div class="mana_filter ${mf}" style="background-image: url(../images/${s}20.png)"></div>`
    );
    manabutton.appendTo(manas);
    manabutton.click(function() {
      if (manabutton.hasClass("mana_filter_on")) {
        manabutton.removeClass("mana_filter_on");
        filteredMana.push(mi[i]);
      } else {
        manabutton.addClass("mana_filter_on");
        let n = filteredMana.indexOf(mi[i]);
        if (n > -1) {
          filteredMana.splice(n, 1);
        }
      }
    });
  });
  manas.appendTo(buttonsBottom);

  /**
   *  Rank filter
   **/
  if (filterType !== "Events") {
    var ranks_filters = $('<div class="mana_filters_explore"></div>');
    ranks_list.forEach(function(rr, index) {
      var mf = "";
      if (!filteredranks.includes(rr)) {
        mf = "rank_filter_on";
      }
      var rankbutton = $(
        `<div title="${rr}" class="rank_filter ${mf}" style="background-position: ${(index +
          1) *
          -16}px 0px; background-image: url(../images/ranks_16.png)"></div>`
      );

      rankbutton.appendTo(ranks_filters);
      rankbutton.click(function() {
        if (rankbutton.hasClass("rank_filter_on")) {
          rankbutton.removeClass("rank_filter_on");
          filteredranks.push(rr);
        } else {
          rankbutton.addClass("rank_filter_on");
          let n = filteredranks.indexOf(rr);
          if (n > -1) {
            filteredranks.splice(n, 1);
          }
        }
      });
    });
    ranks_filters.appendTo(buttonsBottom);
  }

  /**
   * Search button.
   **/
  let searchButton = createDivision(["button_simple"], "Search");
  searchButton.margin = "0px !important;";
  buttonsBottom.appendChild(searchButton);
  searchButton.addEventListener("click", () => {
    queryExplore(0);
  });
}

function wildcardsInput(_class, _id, _default) {
  let inputContainer = createDivision([
    "input_container_explore",
    "auto_width"
  ]);

  let label = createDivision([_class, "wc_search_icon"]);
  label.style.display = "table";
  label.style.justifySelf = "center";
  label.style.marginRight = "0px";

  inputContainer.appendChild(label);

  let input = document.createElement("input");
  input.id = _id;
  input.type = "number";
  input.value = _default;
  input.autocomplete = "off";
  input.style.maxWidth = "40px";
  input.style.alignSelf = "center";

  inputContainer.appendChild(input);

  return inputContainer;
}

function updateExploreCheckbox() {
  onlyOwned = document.getElementById("settings_owned").checked;
}

function queryExplore(skip) {
  filterSkip = skip;
  let sortDir = filterSortDir == "Descending" ? -1 : 1;

  let filterEventId = db.eventIds.filter(
    key => db.events[key] === filterEvent
  )[0];
  filterEventId = !filterEventId ? filterEvent : filterEventId;

  if (filterEvent == "Ladder") filterEventId = "Ladder";
  if (filterEvent == "Traditional Ladder") filterEventId = "Traditional_Ladder";

  let query = {
    filterWCC: filterWCC,
    filterWCU: filterWCU,
    filterWCR: filterWCR,
    filterWCM: filterWCM,
    filterEvent: filterEventId,
    filterType: filterType,
    filterSort: filterSort,
    filterSortDir: sortDir,
    onlyOwned: onlyOwned,
    filteredMana: filteredMana,
    filteredranks: filteredranks,
    filterSkip: filterSkip
  };

  showLoadingBars();
  ipc_send("request_explore", query);
}

function setExploreDecks(data) {
  console.log(data);
  if (filterSkip == 0) {
    document.getElementById("explore_list").innerHTML = "";
  }
  filterSkip += data.results_number;
  data.result.forEach((deck, index) => {
    deckLoad(deck, filterSkip + index);
  });
}

function deckLoad(_deck, index) {
  var mainDiv = document.getElementById("explore_list");
  index = "result_" + index;

  var flcf = createDivision(["flex_item"]);
  flcf.style.width = "20%";
  flcf.style.justifyContent = "center";

  let wc;
  let n = 0;
  let boosterCost = getBoosterCountEstimate(_deck.wildcards);
  for (var key in raritySort) {
    if (_deck.wildcards.hasOwnProperty(key) && _deck.wildcards[key] > 0) {
      wc = createDivision(
        ["wc_explore_cost", "wc_" + raritySort[key]],
        _deck.wildcards[key]
      );
      wc.title = _.capitalize(raritySort[key]) + " wildcards needed.";
      flcf.appendChild(wc);
      n++;
    }
  }

  if (n == 0) {
    wc = createDivision(["wc_complete"]);
    flcf.appendChild(wc);
  } else {
    let bo = createDivision(["bo_explore_cost"], Math.round(boosterCost));
    bo.title = "Boosters needed (estimated)";
    flcf.appendChild(bo);
  }

  if (_deck.colors == undefined) {
    _deck.colors = [];
  }
  if (_deck.mw == undefined) {
    _deck.mw = 0;
    _deck.ml = 0;
  }

  var tileGrpid = _deck.tile;
  try {
    let a = db.card(tileGrpid).images["art_crop"];
  } catch (e) {
    tileGrpid = DEFAULT_TILE;
  }

  var tile = createDivision([index + "t", "deck_tile"]);
  tile.style.backgroundImage =
    "url(https://img.scryfall.com/cards" +
    db.card(tileGrpid).images["art_crop"] +
    ")";

  var div = createDivision([index, "list_deck"]);

  var fll = createDivision(["flex_item"]);

  var flc = createDivision(["flex_item"]);
  flc.style.flexDirection = "column";
  flc.style.width = "40%";

  var flr = createDivision(["flex_item"]);
  flr.style.flexDirection = "column";
  flr.style.justifyContent = "center";
  flr.style.overflow = "hidden";
  flr.style.width = "40%";

  var flt = createDivision(["flex_top"]);

  var flb = createDivision(["flex_bottom"]);

  let d;
  d = createDivision(["list_deck_name"], _deck.name);
  flt.appendChild(d);

  d = createDivision(["list_deck_name_it"], "by " + _deck.player);
  flt.appendChild(d);

  _deck.colors.forEach(function(color) {
    let manaIcon = createDivision(["mana_s20", "mana_" + MANA[color]]);
    flb.appendChild(manaIcon);
  });

  let colClass = getWinrateClass((1 / _deck.mt) * _deck.mw);
  d = createDivision(
    ["list_deck_record"],
    `${_deck.mw}:${_deck.ml} <span class="${colClass}_bright">(${Math.round(
      (100 / _deck.mt) * _deck.mw
    )}%)</span>`
  );

  flr.appendChild(d);

  let rcont = createDivision(["flex_item"]);
  rcont.style.marginLeft = "auto";

  let eventName = createDivision(["list_deck_name_it"], db.events[_deck.event]);

  var playerRank = createDivision(["ranks_16"]);
  playerRank.style.marginTop = "4px";
  playerRank.style.backgroundPosition =
    get_rank_index_16(_deck.rank) * -16 + "px 0px";
  playerRank.title = _deck.rank;

  rcont.appendChild(eventName);
  rcont.appendChild(playerRank);
  flr.appendChild(rcont);

  div.appendChild(fll);
  fll.appendChild(tile);
  div.appendChild(flc);
  div.appendChild(flcf);
  flc.appendChild(flt);
  flc.appendChild(flb);
  div.appendChild(flr);

  mainDiv.appendChild(div);

  $("." + index).on("mouseenter", function() {
    $("." + index + "t").css("opacity", 1);
    $("." + index + "t").css("width", "200px");
  });

  $("." + index).on("mouseleave", function() {
    $("." + index + "t").css("opacity", 0.66);
    $("." + index + "t").css("width", "128px");
  });

  $("." + index).on("click", function() {
    _deck.mainDeck = removeDuplicates(_deck.mainDeck).sort(compare_cards);
    _deck.sideboard = removeDuplicates(_deck.sideboard).sort(compare_cards);
    openDeck(_deck, null);
    $(".moving_ux").animate({ left: "-100%" }, 250, "easeInOutCubic");
  });
}

module.exports = {
  openExploreTab,
  setExploreDecks
};
